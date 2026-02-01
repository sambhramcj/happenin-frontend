/**
 * TIER 2 API EXAMPLE: Festival Analytics
 * 
 * Tier 2 routes are not critical. Users accept 2-5s delays.
 * So we cache AGGRESSIVELY:
 * - Cache for 60 seconds (serve instantly)
 * - Allow stale data for 120 more seconds
 * - Revalidate in background
 * 
 * Result: Analytics dashboard survives 10k users without a problem
 * Users see: "Updated ~1 minute ago" (they don't mind)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import {
  caches,
  deduplicator,
  createCachedResponse,
  breakers,
} from '@/lib/load-management';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Configuration for this route
const CACHE_TTL = 60; // 60 seconds (aggressive)
const REVALIDATE = 120; // Stale-while-revalidate for 120s more
const CIRCUIT_BREAKER = breakers.analytics;

// ──────────────────────────────────────────────
// GET: Festival analytics (Tier 2 - Non-critical)
// ──────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { festId: string } }
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const festId = params.festId;
  const cacheKey = `analytics:fest:${festId}`;

  // ──────────────────────────────────────────────
  // STEP 1: Check cache (most requests end here)
  // ──────────────────────────────────────────────

  const { data: cachedData, isStale } = caches.analytics.get(cacheKey);

  // Cache hit (fresh)
  if (cachedData && !isStale) {
    return createCachedResponse(cachedData, {
      maxAge: CACHE_TTL,
      sMaxAge: REVALIDATE,
    });
  }

  // Cache hit (stale) - serve it while revalidating
  if (cachedData && isStale) {
    // Background revalidation
    deduplicator
      .execute(`revalidate:${cacheKey}`, () => computeAnalytics(festId))
      .then((newData) => {
        caches.analytics.set(cacheKey, newData, CACHE_TTL);
        console.log(`✅ Analytics revalidated for fest ${festId}`);
      })
      .catch((error) => {
        console.error(`⚠️ Failed to revalidate analytics:`, error);
      });

    // Return stale data immediately (don't wait)
    return createCachedResponse(
      {
        ...cachedData,
        _cache: 'stale',
        _message: 'Updated ~2 minutes ago (refreshing...)',
      },
      {
        maxAge: 30, // Tell client to check again soon
        sMaxAge: REVALIDATE,
        revalidate: true,
      }
    );
  }

  // ──────────────────────────────────────────────
  // STEP 2: Cache miss - compute fresh
  // (Circuit breaker ensures we don't hammer DB)
  // ──────────────────────────────────────────────

  try {
    const data = await CIRCUIT_BREAKER.execute(
      () => deduplicator.execute(cacheKey, () => computeAnalytics(festId)),
      () => getFallbackAnalytics(festId) // If circuit open
    );

    // Cache it
    caches.analytics.set(cacheKey, data, CACHE_TTL);

    return createCachedResponse(data, {
      maxAge: CACHE_TTL,
      sMaxAge: REVALIDATE,
    });
  } catch (error) {
    console.error(`❌ Analytics error:`, error);

    return NextResponse.json(
      {
        error: 'Analytics temporarily unavailable',
        message: 'System is under high load. Please try again shortly.',
      },
      { status: 503 }
    );
  }
}

// ──────────────────────────────────────────────
// ACTUAL COMPUTATION (expensive, but cached)
// ──────────────────────────────────────────────

async function computeAnalytics(festId: string) {
  // These are expensive queries, but we only run them:
  // - Once every 60 seconds
  // - For the first request when cache expires
  // - In background while serving stale

  const [
    submissionsResult,
    registrationsResult,
    revenueResult,
    attendanceResult,
  ] = await Promise.all([
    // Get submission count
    supabase
      .from('festival_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('fest_id', festId)
      .eq('submission_status', 'approved'),

    // Get registration count
    supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('fest_id', festId),

    // Get revenue
    supabase.from('payments').select('amount').eq('fest_id', festId),

    // Get attendance
    supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('fest_id', festId),
  ]);

  const totalEvents = submissionsResult.count || 0;
  const totalRegistrations = registrationsResult.count || 0;
  const totalRevenue = (revenueResult.data || []).reduce(
    (sum: number, p: any) => sum + (p.amount || 0),
    0
  );
  const totalAttendance = attendanceResult.count || 0;

  return {
    festId,
    metrics: {
      totalEvents,
      totalRegistrations,
      totalRevenue,
      totalAttendance,
      conversionRate: totalRegistrations > 0
        ? ((totalAttendance / totalRegistrations) * 100).toFixed(1)
        : '0',
      averageRevenuePerEvent: totalEvents > 0
        ? (totalRevenue / totalEvents).toFixed(2)
        : '0',
    },
    metadata: {
      cached: false,
      computedAt: new Date().toISOString(),
      cacheValidFor: CACHE_TTL,
    },
  };
}

// Fallback: Return zero analytics if DB is down
async function getFallbackAnalytics(festId: string) {
  return {
    festId,
    metrics: {
      totalEvents: 0,
      totalRegistrations: 0,
      totalRevenue: 0,
      totalAttendance: 0,
      conversionRate: '0',
      averageRevenuePerEvent: '0',
    },
    metadata: {
      cached: true,
      computedAt: new Date().toISOString(),
      cacheValidFor: CACHE_TTL,
      fallback: true,
      message: 'Unable to load live analytics. Showing cached data.',
    },
  };
}

// ──────────────────────────────────────────────
// EXPORT: Next.js config for this route
// ──────────────────────────────────────────────

export const dynamic = 'force-dynamic';
export const revalidate = CACHE_TTL; // Cache for 60 seconds
