/**
 * LOAD MANAGEMENT MIDDLEWARE
 * 
 * Integrates circuit breakers, caching, and queuing into API routes
 * Enables zero-feature-removal scaling to 10k+ users
 */

import { NextRequest, NextResponse } from 'next/server';
import { breakers, caches, paymentQueue, createCachedResponse, deduplicator } from './load-management';

// ──────────────────────────────────────────────
// TIER 1: CRITICAL PATHS (never fail)
// ──────────────────────────────────────────────

export const TIER_1_ROUTES = [
  '/api/events',
  '/api/events/[eventId]',
  '/api/fests/[festId]/schedule',
  '/api/registrations',
  '/api/student/tickets',
  '/api/qr/scan',
  '/api/payments',
];

// ──────────────────────────────────────────────
// TIER 2: NON-CRITICAL (okay if 2-5s slower)
// ──────────────────────────────────────────────

export const TIER_2_ROUTES = [
  '/api/fests/[festId]/analytics',
  '/api/admin',
  '/api/volunteer',
  '/api/certificates',
  '/api/sponsorships/track',
  '/api/organizer/dashboard',
];

// ──────────────────────────────────────────────
// NO-CACHE ROUTES (security/consistency)
// ──────────────────────────────────────────────

export const NO_CACHE_PREFIXES = [
  '/api/auth', // Login / session
  '/api/payments', // Payments & verification
  '/api/student/profile', // Profile updates
  '/api/organizer/attendance', // Attendance scans
  '/api/attendance', // Attendance scans (alternate path)
  '/api/qr/scan', // QR scans
];

// ──────────────────────────────────────────────
// ROUTE CONFIGURATION
// ──────────────────────────────────────────────

export interface RouteConfig {
  tier: 1 | 2;
  cache?: {
    ttl: number; // seconds
    revalidate?: number; // seconds for stale-while-revalidate
  };
  circuitBreaker?: boolean;
  queue?: boolean; // Use soft queue
}

export const routeConfigs: Record<string, RouteConfig> = {
  // TIER 1: Critical paths
  'GET /api/events': {
    tier: 1,
    cache: { ttl: 10, revalidate: 30 }, // Serve cached, revalidate in bg
    circuitBreaker: true,
  },
  'GET /api/events/[eventId]': {
    tier: 1,
    cache: { ttl: 15, revalidate: 45 },
    circuitBreaker: true,
  },
  'GET /api/fests/[festId]/schedule': {
    tier: 1,
    cache: { ttl: 20, revalidate: 60 },
    circuitBreaker: true,
  },
  'GET /api/registrations': {
    tier: 1,
    cache: { ttl: 5 }, // Very fresh
    circuitBreaker: true,
  },
  'GET /api/student/tickets': {
    tier: 1,
    cache: { ttl: 10, revalidate: 30 },
    circuitBreaker: true,
  },
  'POST /api/qr/scan': {
    tier: 1, // Real-time, no cache
    circuitBreaker: true,
  },
  'POST /api/payments': {
    tier: 1,
    queue: true, // Soft queue payments
    circuitBreaker: true,
  },
  'POST /api/payments/verify': {
    tier: 1,
    circuitBreaker: true,
  },

  // TIER 2: Non-critical paths
  'GET /api/fests/[festId]/analytics': {
    tier: 2,
    cache: { ttl: 60, revalidate: 120 }, // Cache aggressively
    circuitBreaker: true,
  },
  'GET /api/organizer/dashboard': {
    tier: 2,
    cache: { ttl: 60, revalidate: 120 },
    circuitBreaker: true,
  },
  'GET /api/admin/dashboard': {
    tier: 2,
    cache: { ttl: 60, revalidate: 120 },
    circuitBreaker: true,
  },
  'GET /api/volunteer': {
    tier: 2,
    cache: { ttl: 30, revalidate: 90 },
    circuitBreaker: true,
  },
  'GET /api/certificates': {
    tier: 2,
    cache: { ttl: 60, revalidate: 180 },
    circuitBreaker: true,
  },
  'GET /api/sponsorships/track': {
    tier: 2,
    cache: { ttl: 60, revalidate: 120 },
    circuitBreaker: true,
  },
  'GET /api/sponsorships': {
    tier: 2,
    cache: { ttl: 60, revalidate: 120 },
    circuitBreaker: true,
  },
  'GET /api/sponsorships/assets': {
    tier: 2,
    cache: { ttl: 60, revalidate: 120 },
    circuitBreaker: true,
  },
};

// ──────────────────────────────────────────────
// MAIN HANDLER WRAPPER
// ──────────────────────────────────────────────

export async function withLoadManagement(
  handler: (req: NextRequest) => Promise<Response>,
  config: RouteConfig,
  cacheKey: string
) {
  return async (req: NextRequest) => {
    const method = req.method;
    const pathname = new URL(req.url).pathname;
    const routeKey = `${method} ${pathname}`;
    const isNoCacheRoute = NO_CACHE_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );

    // ──────────────────────────────────────────────
    // STEP 1: Try cache first (Tier 2 + GET requests)
    // ──────────────────────────────────────────────

    if (method === 'GET' && config.cache && !isNoCacheRoute) {
      const { data, isStale } = caches.events.get(cacheKey);

      if (data && !isStale) {
        return createCachedResponse(data, {
          maxAge: config.cache.ttl,
          sMaxAge: config.cache.revalidate,
        });
      }

      // If stale but we have it, serve stale while revalidating
      if (data && isStale) {
        // Revalidate in background (don't block user)
        deduplicator
          .execute(`revalidate:${cacheKey}`, () => handler(req))
          .then((res) => res.json())
          .then((newData) => {
            caches.events.set(cacheKey, newData, config.cache!.ttl);
          })
          .catch(() => {}); // Silently fail, user got stale data

        return createCachedResponse(data, {
          maxAge: config.cache.ttl,
          sMaxAge: config.cache.revalidate,
        });
      }
    }

    // ──────────────────────────────────────────────
    // STEP 2: Queue payments (soft queue)
    // ──────────────────────────────────────────────

    if (config.queue && method === 'POST') {
      const body = await req.json();
      const result = await paymentQueue.enqueue({
        id: `${Date.now()}-${Math.random()}`,
        userId: body.userId,
        eventId: body.eventId,
        amount: body.amount,
      });

      return NextResponse.json(result, { status: 202 }); // 202 = Accepted
    }

    // ──────────────────────────────────────────────
    // STEP 3: Deduplicate in-flight requests
    // ──────────────────────────────────────────────

    try {
      const response = await deduplicator.execute(cacheKey, () => handler(req));

      // Cache successful GET responses
      if (method === 'GET' && config.cache && response.status === 200 && !isNoCacheRoute) {
        const data = await response.clone().json();
        caches.events.set(cacheKey, data, config.cache.ttl);
      }

      return response;
    } catch (error) {
      // ──────────────────────────────────────────────
      // STEP 4: Circuit breaker fallback
      // ──────────────────────────────────────────────

      if (config.circuitBreaker && method === 'GET' && !isNoCacheRoute) {
        const breaker =
          config.tier === 1 ? breakers.eventList : breakers.analytics;

        // Try fallback (stale cache)
        const { data } = caches.events.get(cacheKey);
        if (data) {
          return NextResponse.json(data, {
            status: 200,
            headers: {
              'X-Cache-Status': 'stale',
              'Cache-Control': 'public, max-age=5',
            },
          });
        }
      }

      // If no fallback, return error
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          code: 'SERVICE_OVERLOADED',
          message:
            'The system is experiencing high load. Please try again in a moment.',
        },
        { status: 503 }
      );
    }
  };
}

// ──────────────────────────────────────────────
// HELPER: Deduplicator wrapper for API routes
// ──────────────────────────────────────────────

export function withDeduplication<T>(
  fn: () => Promise<T>,
  key: string
): Promise<T> {
  return deduplicator.execute(key, fn);
}

// ──────────────────────────────────────────────
// HELPER: Async cache update (background revalidation)
// ──────────────────────────────────────────────

export async function revalidateCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number
) {
  const result = await fn();
  caches.events.set(key, result, ttl);
  return result;
}

// ──────────────────────────────────────────────
// HELPER: Get cache status for admin
// ──────────────────────────────────────────────

export function getCacheStatus(key?: string) {
  if (key) {
    const { data, isStale } = caches.events.get(key);
    return { cached: data !== null, stale: isStale };
  }
  return {
    events: caches.events.size(),
    analytics: caches.analytics.size(),
    schedules: caches.schedules.size(),
    registrations: caches.registrations.size(),
  };
}

// ──────────────────────────────────────────────
// CONSTANTS FOR ROUTE CONFIGURATION
// ──────────────────────────────────────────────

export const TIER_1_CONFIG: RouteConfig = {
  tier: 1,
  circuitBreaker: true,
};

export const TIER_2_CONFIG: RouteConfig = {
  tier: 2,
  cache: { ttl: 60, revalidate: 120 },
  circuitBreaker: true,
};
