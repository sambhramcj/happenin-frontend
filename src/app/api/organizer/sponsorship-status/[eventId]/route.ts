import { NextRequest, NextResponse } from "next/server";
import { isSponsorshipSettled } from "@/lib/sponsorshipAccess";

export const dynamic = "force-dynamic";

/**
 * GET /api/organizer/sponsorship-status/[eventId]
 * Check if sponsorship payment is confirmed for an event
 * Returns: { settled: boolean }
 * 
 * PAYMENT FLOW:
 * Admin verifies payment → visibility_active=true
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    const settled = await isSponsorshipSettled(eventId);

    return NextResponse.json({ settled }, { status: 200 });
  } catch (err) {
    console.error("Sponsorship settlement check error:", err);
    return NextResponse.json(
      { error: "Failed to check sponsorship status" },
      { status: 500 }
    );
  }
}
