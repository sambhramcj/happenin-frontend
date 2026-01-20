/**
 * Offline Analytics Queue
 * Track events even when offline, flush when back online
 * 
 * What must be tracked offline:
 * - Event view
 * - Register intent
 * - Payment initiated
 * - Payment verified (server only)
 * 
 * Rules:
 * - Flush in order when back online
 * - Deduplicate by timestamp + eventId
 * - Never block UI for analytics
 */

export type AnalyticsEvent = {
  type: string;
  payload: Record<string, any>;
  timestamp: number;
  eventId?: string;
};

const STORAGE_KEY = "happenin_analytics_queue";
let queue: AnalyticsEvent[] = [];

/**
 * Initialize queue from localStorage
 */
export function initializeAnalyticsQueue(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    queue = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load analytics queue:", error);
    queue = [];
  }
}

/**
 * Track an analytics event
 * Queues offline, sends immediately online
 */
export async function track(event: AnalyticsEvent): Promise<void> {
  if (!navigator.onLine) {
    // Add to offline queue
    queue.push(event);
    persistQueue();
    return;
  }

  // Send immediately if online
  try {
    await sendEvent(event);
  } catch (error) {
    // If send fails, add to queue as fallback
    queue.push(event);
    persistQueue();
  }
}

/**
 * Track event view
 */
export function trackEventView(eventId: string): void {
  track({
    type: "event_view",
    payload: { eventId },
    timestamp: Date.now(),
    eventId,
  }).catch(console.error);
}

/**
 * Track registration intent
 */
export function trackRegistrationIntent(
  eventId: string,
  ticketType: string
): void {
  track({
    type: "registration_intent",
    payload: { eventId, ticketType },
    timestamp: Date.now(),
    eventId,
  }).catch(console.error);
}

/**
 * Track payment initiated
 */
export function trackPaymentInitiated(eventId: string, amount: number): void {
  track({
    type: "payment_initiated",
    payload: { eventId, amount },
    timestamp: Date.now(),
    eventId,
  }).catch(console.error);
}

/**
 * Flush queue when back online
 */
export async function flushAnalyticsQueue(): Promise<void> {
  if (queue.length === 0) {
    return;
  }

  // Deduplicate by timestamp + eventId
  const deduplicated = deduplicateQueue();

  const failures: AnalyticsEvent[] = [];

  for (const event of deduplicated) {
    try {
      await sendEvent(event);
    } catch (error) {
      // Keep failed events for retry
      failures.push(event);
    }
  }

  // Update queue with failures only
  queue = failures;
  persistQueue();
}

/**
 * Deduplicate events by eventId + type + timestamp (within 1 second)
 */
function deduplicateQueue(): AnalyticsEvent[] {
  const seen = new Set<string>();
  return queue.filter((event) => {
    // Events with same eventId + type within 1 second are duplicates
    const key = `${event.eventId || "anonymous"}_${event.type}_${Math.floor(
      event.timestamp / 1000
    )}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Persist queue to localStorage
 */
function persistQueue(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to persist analytics queue:", error);
  }
}

/**
 * Send event to backend (non-blocking)
 */
async function sendEvent(event: AnalyticsEvent): Promise<void> {
  // Don't block on analytics - use fire-and-forget
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }).catch(() => {
    // Silently fail - analytics failures should never affect app
  });
}

/**
 * Get current queue length (for debugging)
 */
export function getQueueLength(): number {
  return queue.length;
}

/**
 * Clear queue (for testing)
 */
export function clearAnalyticsQueue(): void {
  queue = [];
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear analytics queue:", error);
  }
}
