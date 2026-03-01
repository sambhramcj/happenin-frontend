// API: Bulk Ticket Purchases
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/bulk-tickets/purchase
// Deprecated: purchase is now completed only through Razorpay verify route
// (/api/bulk-tickets/verify) after successful payment.
export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json(
    {
      error:
        "Direct purchase is disabled. Use /api/bulk-tickets/create-order and /api/bulk-tickets/verify.",
    },
    { status: 410 }
  );
}

// GET /api/bulk-tickets/purchase - Get purchases for the authenticated buyer
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email;
    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const bulkPackId = searchParams.get("bulkPackId");

    let query = supabase
      .from("bulk_ticket_purchases")
      .select(
        `
        *,
        bulk_ticket_packs (
          id, event_id, name, quantity, bulk_price, offer_title
        )
      `
      )
      .order("purchase_date", { ascending: false });

    query = query.eq("buyer_email", sessionEmail);

    if (bulkPackId) {
      query = query.eq("bulk_pack_id", bulkPackId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error fetching bulk purchases:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch bulk purchases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
