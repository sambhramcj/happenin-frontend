/**
 * INTELLIGENT LOAD MANAGEMENT
 * 
 * Keeps app safe under 10k+ users without disabling features
 * Uses: automatic circuit breakers, smart caching, soft queues
 */

// ──────────────────────────────────────────────
// 1️⃣ CIRCUIT BREAKER: Auto-degrade when slow
// ──────────────────────────────────────────────

export interface CircuitBreakerConfig {
  thresholdMs: number; // Response time threshold (default 1500ms)
  failureCount: number; // Failures before opening (default 5)
  resetTimeMs: number; // Time before retry (default 30s)
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private responseTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeMs) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback
          ? fallback()
          : Promise.reject(new Error('Circuit breaker OPEN'));
      }
    }

    const startTime = Date.now();
    try {
      const result = await fn();
      this.responseTime = Date.now() - startTime;

      if (this.responseTime > this.config.thresholdMs) {
        this.failureCount++;
        if (this.failureCount >= this.config.failureCount) {
          this.state = 'OPEN';
          this.lastFailureTime = Date.now();
          console.warn(
            `⚠️ Circuit breaker OPENED (${this.responseTime}ms > ${this.config.thresholdMs}ms)`
          );
        }
      } else {
        this.failureCount = 0;
        this.state = 'CLOSED';
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.config.failureCount) {
        this.state = 'OPEN';
        console.error(
          `🔴 Circuit breaker OPENED after ${this.failureCount} failures`
        );
      }

      if (fallback && this.state === 'OPEN') {
        return fallback();
      }
      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      responseTime: this.responseTime,
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
  }
}

// Singleton instances per feature
export const breakers = {
  eventList: new CircuitBreaker({
    thresholdMs: 1500,
    failureCount: 5,
    resetTimeMs: 30000,
  }),
  payments: new CircuitBreaker({
    thresholdMs: 2000,
    failureCount: 3,
    resetTimeMs: 60000,
  }),
  analytics: new CircuitBreaker({
    thresholdMs: 3000,
    failureCount: 10,
    resetTimeMs: 45000,
  }),
};

// ──────────────────────────────────────────────
// 2️⃣ SMART CACHE MANAGER
// ──────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

export class SmartCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private staleThreshold = 0.8; // Serve stale after 80% of TTL

  set(key: string, data: T, ttlSeconds: number) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(key: string): { data: T | null; isStale: boolean } {
    const entry = this.cache.get(key);
    if (!entry) return { data: null, isStale: false };

    const age = Date.now() - entry.timestamp;
    const isExpired = age > entry.ttl;
    const isStale = age > entry.ttl * this.staleThreshold;

    if (isExpired) {
      this.cache.delete(key);
      return { data: null, isStale: false };
    }

    return { data: entry.data, isStale };
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  size() {
    return this.cache.size;
  }
}

export const caches = {
  events: new SmartCache<any>(),
  analytics: new SmartCache<any>(),
  schedules: new SmartCache<any>(),
  registrations: new SmartCache<any>(),
};

// ──────────────────────────────────────────────
// 3️⃣ SOFT PAYMENT QUEUE (Smooth spikes)
// ──────────────────────────────────────────────

export interface PaymentTask {
  id: string;
  userId: string;
  eventId: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retries: number;
}

export class PaymentQueue {
  private queue: PaymentTask[] = [];
  private processing = false;
  private maxConcurrent = 20; // Process 20 payments simultaneously
  private activeCount = 0;

  async enqueue(task: Omit<PaymentTask, 'timestamp' | 'status' | 'retries'>) {
    const paymentTask: PaymentTask = {
      ...task,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
    };

    this.queue.push(paymentTask);
    this.process();

    return {
      taskId: paymentTask.id,
      status: 'queued',
      message: 'Payment queued. Processing...',
    };
  }

  private async process() {
    if (this.processing || this.activeCount >= this.maxConcurrent) return;

    this.processing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const task = this.queue.shift();
      if (!task) break;

      this.activeCount++;
      this.processTask(task).finally(() => {
        this.activeCount--;
      });
    }

    this.processing = false;
  }

  private async processTask(task: PaymentTask) {
    try {
      task.status = 'processing';

      // Simulate payment processing
      // In real scenario: call Razorpay/Stripe API
      await new Promise((resolve) => setTimeout(resolve, 500));

      task.status = 'completed';
      console.log(`✅ Payment processed: ${task.id}`);
    } catch (error) {
      task.retries++;
      if (task.retries < 3) {
        task.status = 'pending';
        this.queue.push(task); // Re-queue
        console.warn(`⚠️ Payment retry: ${task.id} (attempt ${task.retries})`);
      } else {
        task.status = 'failed';
        console.error(`❌ Payment failed: ${task.id}`);
      }
    }
  }

  getStatus(taskId: string): PaymentTask | undefined {
    return this.queue.find((t) => t.id === taskId);
  }

  getQueueStats() {
    return {
      queueLength: this.queue.length,
      activeCount: this.activeCount,
      pending: this.queue.filter((t) => t.status === 'pending').length,
      processing: this.queue.filter((t) => t.status === 'processing').length,
    };
  }
}

export const paymentQueue = new PaymentQueue();

// ──────────────────────────────────────────────
// 4️⃣ RESPONSE BUILDER (Attach cache headers)
// ──────────────────────────────────────────────

export function createCachedResponse<T>(
  data: T,
  options: {
    maxAge: number; // seconds
    sMaxAge?: number; // stale-while-revalidate
    revalidate?: boolean;
  }
) {
  const headers = new Headers({
    'Cache-Control': [
      `public`,
      `max-age=${options.maxAge}`,
      options.sMaxAge ? `s-maxage=${options.sMaxAge}` : null,
      options.revalidate ? `stale-while-revalidate` : null,
    ]
      .filter(Boolean)
      .join(', '),
    'Content-Type': 'application/json',
  });

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}

// ──────────────────────────────────────────────
// 5️⃣ ANALYTICS BATCH QUEUE (Never block users)
// ──────────────────────────────────────────────

export interface AnalyticsEvent {
  type: string;
  userId: string;
  eventId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export class AnalyticsBatcher {
  private batch: AnalyticsEvent[] = [];
  private flushInterval = 5000; // Flush every 5 seconds
  private timer: NodeJS.Timeout | null = null;
  private maxBatchSize = 100;

  track(event: Omit<AnalyticsEvent, 'timestamp'>) {
    this.batch.push({
      ...event,
      timestamp: Date.now(),
    });

    if (this.batch.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Fire and forget - don't block user request
    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
      });
      console.log(`📊 Flushed ${events.length} analytics events`);
    } catch (error) {
      console.error('Failed to flush analytics:', error);
      // Silently fail - never block users
    }
  }

  getBatchSize() {
    return this.batch.length;
  }
}

export const analyticsBatcher = new AnalyticsBatcher();

// ──────────────────────────────────────────────
// 6️⃣ REQUEST DEDUPLICATOR (Prevent duplicate work)
// ──────────────────────────────────────────────

export class RequestDeduplicator {
  private inFlight = new Map<string, Promise<any>>();

  async execute<T>(
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // If already in flight, return existing promise
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)!;
    }

    const promise = fn()
      .then((result) => {
        this.inFlight.delete(key);
        return result;
      })
      .catch((error) => {
        this.inFlight.delete(key);
        throw error;
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.inFlight.delete(key);
    } else {
      this.inFlight.clear();
    }
  }

  getActiveRequests() {
    return this.inFlight.size;
  }
}

export const deduplicator = new RequestDeduplicator();

// ──────────────────────────────────────────────
// 7️⃣ LOAD STATUS MONITOR
// ──────────────────────────────────────────────

export interface LoadStatus {
  timestamp: number;
  circuitStates: Record<string, { state: string; failureCount: number }>;
  cacheStats: Record<string, number>;
  queueStats: {
    payment: ReturnType<PaymentQueue['getQueueStats']>;
    analytics: number;
  };
  activeRequests: number;
  memoryUsage: NodeJS.MemoryUsage;
}

export function getLoadStatus(): LoadStatus {
  return {
    timestamp: Date.now(),
    circuitStates: {
      eventList: breakers.eventList.getState() as any,
      payments: breakers.payments.getState() as any,
      analytics: breakers.analytics.getState() as any,
    },
    cacheStats: {
      events: caches.events.size(),
      analytics: caches.analytics.size(),
      schedules: caches.schedules.size(),
      registrations: caches.registrations.size(),
    },
    queueStats: {
      payment: paymentQueue.getQueueStats(),
      analytics: analyticsBatcher.getBatchSize(),
    },
    activeRequests: deduplicator.getActiveRequests(),
    memoryUsage: process.memoryUsage(),
  };
}
