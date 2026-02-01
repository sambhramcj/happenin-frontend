/**
 * TIER 1 API EXAMPLE: Payments with Soft Queue
 * 
 * This is how payments work during spikes:
 * - User clicks "Pay" → Immediately gets 202 Accepted
 * - Payment is queued → Processed at controlled rate (20 concurrent)
 * - User polls for status or gets webhook callback
 * 
 * Result: Zero failed payments, smooth experience for 10k users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createClient } from '@supabase/supabase-js';
import { paymentQueue, breakers } from '@/lib/load-management';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// ──────────────────────────────────────────────
// POST: Create payment order (returns 202 Accepted)
// ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, amount } = await req.json();

  // Validate
  if (!eventId || !amount) {
    return NextResponse.json(
      { error: 'Missing eventId or amount' },
      { status: 400 }
    );
  }

  // ──────────────────────────────────────────────
  // IMMEDIATE: Queue the payment (don't process here)
  // ──────────────────────────────────────────────

  const result = await paymentQueue.enqueue({
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    userId: session.user.email,
    eventId,
    amount,
  });

  // User gets 202 = "Accepted, processing"
  return NextResponse.json(
    {
      status: 'queued',
      taskId: result.taskId,
      message: 'Payment queued. Processing... (check status or wait for webhook)',
      estimatedWaitMs: paymentQueue.getQueueStats().queueLength * 500, // Rough estimate
    },
    { status: 202 } // 202 = Accepted
  );
}

// ──────────────────────────────────────────────
// GET: Check payment status
// ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const taskId = req.nextUrl.searchParams.get('taskId');
  if (!taskId) {
    return NextResponse.json(
      { error: 'Missing taskId parameter' },
      { status: 400 }
    );
  }

  const task = paymentQueue.getStatus(taskId);

  if (!task) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    taskId: task.id,
    status: task.status, // 'pending', 'processing', 'completed', 'failed'
    amount: task.amount,
    eventId: task.eventId,
    timestamp: task.timestamp,
    retries: task.retries,
    message: getStatusMessage(task.status),
  });
}

// ──────────────────────────────────────────────
// Helper: Queue status message
// ──────────────────────────────────────────────

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return '⏳ Waiting in queue...';
    case 'processing':
      return '🔄 Processing your payment...';
    case 'completed':
      return '✅ Payment successful!';
    case 'failed':
      return '❌ Payment failed. Please try again.';
    default:
      return 'Unknown status';
  }
}

// ──────────────────────────────────────────────
// INTERNAL: Actually process queued payment
// (Called by paymentQueue internals)
// ──────────────────────────────────────────────

export async function processPaymentTask(taskId: string, amount: number) {
  try {
    // Call Razorpay/Stripe API
    // const response = await stripe.paymentIntents.create({...})

    // For now, simulate processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Save to database
    await supabase.from('payments').insert({
      payment_id: taskId,
      amount,
      status: 'completed',
      processed_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    throw error;
  }
}

// ──────────────────────────────────────────────
// ADMIN: See queue stats
// ──────────────────────────────────────────────

export async function getQueueStats() {
  return paymentQueue.getQueueStats();
}

// ──────────────────────────────────────────────
// EXPORT: Next.js config
// ──────────────────────────────────────────────

export const dynamic = 'force-dynamic'; // Always fresh for payments
export const maxDuration = 60; // Allow up to 60s for payment processing
