import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PATCH /api/organizer/sponsorships/[dealId]/confirm
 * Organizer confirms they received sponsor payment (outside app)
 * This unlocks all sponsor deliverables and features
 * 
 * PAYMENT FLOW:
 * Stage 1: Sponsor → Organizer (UPI/bank/offline) → Organizer confirms → status='confirmed' → Features unlock
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ dealId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const role = (session?.user as any)?.role as string | undefined;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "organizer" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden - organizers only" }, { status: 403 });
    }

    const { dealId } = await context.params;
    const body = await req.json();
    const { payment_proof_url } = body;

    // Get the deal and verify organizer owns the event
    const { data: deal, error: dealError } = await serviceSupabase
      .from("sponsorship_deals")
      .select(`
        id,
        event_id,
        status,
        events!inner (
          id,
          organizer_email
        )
      `)
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // Verify ownership (unless admin)
    if (role !== "admin" && (deal.events as any).organizer_email !== email) {
      return NextResponse.json({ error: "Not your event" }, { status: 403 });
    }

    // Update to confirmed status
    const { error: updateError } = await serviceSupabase
      .from("sponsorship_deals")
      .update({
        status: "confirmed",
        confirmed_by: email,
        confirmed_at: new Date().toISOString(),
        payment_proof_url: payment_proof_url || null,
      })
      .eq("id", dealId);

    if (updateError) {
      console.error("Error confirming sponsorship:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Sponsorship confirmed. All features unlocked!"
    });
  } catch (err) {
    console.error("Confirm sponsorship error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
