import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Retry failed payment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "paymentId required" },
        { status: 400 }
      );
    }

    // Get failed payment record (from orders or payments table if you track them)
    const { data: failedPayment, error: fetchError } = await supabase
      .from("payment_attempts")
      .select("*")
      .eq("id", paymentId)
      .eq("student_email", session.user.email)
      .eq("status", "failed")
      .single();

    if (fetchError || !failedPayment) {
      return NextResponse.json(
        { error: "Payment not found or already processed" },
        { status: 404 }
      );
    }

    // Check retry attempts (max 3)
    if ((failedPayment.retry_count || 0) >= 3) {
      return NextResponse.json(
        { error: "Maximum retry attempts exceeded. Please contact support." },
        { status: 400 }
      );
    }

    // Update retry count and reset status to 'pending'
    const { data: updated, error: updateError } = await supabase
      .from("payment_attempts")
      .update({
        status: "pending",
        retry_count: (failedPayment.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
      })
      .eq("id", paymentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to retry payment" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Payment retry initiated", payment: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Retry payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List failed payments for retry
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: failedPayments, error } = await supabase
      .from("payment_attempts")
      .select("*, events(title, date)")
      .eq("student_email", session.user.email)
      .eq("status", "failed")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch failed payments" },
        { status: 500 }
      );
    }

    return NextResponse.json({ failedPayments }, { status: 200 });
  } catch (error) {
    console.error("Fetch failed payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
