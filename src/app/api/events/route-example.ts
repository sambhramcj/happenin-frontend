/**
 * TIER 1 API EXAMPLE: Event List
 * 
 * This is how to apply load management to Tier 1 routes.
 * Auto-adapts to load spikes without disabling features.
 * 
 * export const dynamic = 'force-dynamic'; // Tier 1: Always fresh
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { breakers, caches, deduplicator, createCachedResponse } from '@/lib/load-management';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Configuration for this route
const CACHE_TTL = 10; // 10 seconds
const REVALIDATE = 30; // Stale-while-revalidate for 30s more

// ──────────────────────────────────────────────
// GET: Fetch events (Tier 1 - Critical)
// ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  const userEmail = session?.user?.email ?? undefined;
  const cacheKey = `events:${userEmail}:${req.nextUrl.search}`;

  // STEP 1: Try cache first (very fast)
  const { data: cachedData, isStale } = caches.events.get(cacheKey);

  if (cachedData && !isStale) {
    return createCachedResponse(cachedData, {
      maxAge: CACHE_TTL,
      sMaxAge: REVALIDATE,
    });
  }

  // STEP 2: If stale, serve stale while revalidating in background
  if (cachedData && isStale) {
    // Background revalidation (don't block)
    deduplicator
      .execute(`revalidate:${cacheKey}`, () => fetchEvents(userEmail))
      .then((newData) => {
        caches.events.set(cacheKey, newData, CACHE_TTL);
      })
      .catch(() => {}); // Silently fail

    return createCachedResponse(cachedData, {
      maxAge: CACHE_TTL,
      sMaxAge: REVALIDATE,
      revalidate: true, // Tell client this is fresh enough
    });
  }

  // STEP 3: Fetch fresh (with circuit breaker)
  try {
    const data = await breakers.eventList.execute(
      () => fetchEvents(userEmail),
      () => getStaleEvents(userEmail) // Fallback to stale cache
    );

    // Cache the result
    caches.events.set(cacheKey, data, CACHE_TTL);

    return createCachedResponse(data, {
      maxAge: CACHE_TTL,
      sMaxAge: REVALIDATE,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch events',
        message:
          'System is experiencing high load. Showing cached results if available.',
      },
      { status: 503 }
    );
  }
}

// ──────────────────────────────────────────────
// ACTUAL FETCH LOGIC (what runs when not cached)
// ──────────────────────────────────────────────

async function fetchEvents(userEmail?: string) {
  // Dedup identical requests
  return deduplicator.execute(`fetch:events:${userEmail}`, async () => {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'active')
      .order('event_date', { ascending: true })
      .limit(100);

    if (error) throw error;

    return {
      events: events || [],
      total: events?.length || 0,
      cached: false,
      timestamp: new Date().toISOString(),
    };
  });
}

// Fallback: Get any cached version
async function getStaleEvents(userEmail?: string) {
  const { data } = caches.events.get(`events:${userEmail}:`);
  return data || { events: [], total: 0, cached: true, stale: true };
}

// ──────────────────────────────────────────────
// EXPORT: Next.js config for this route
// ──────────────────────────────────────────────

export const dynamic = 'force-dynamic'; // Always check for fresh data
export const revalidate = CACHE_TTL; // But cache for 10 seconds
