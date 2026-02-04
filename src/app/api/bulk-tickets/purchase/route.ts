// API: Bulk Ticket Purchases
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/bulk-tickets/purchase - Purchase a bulk ticket pack
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bulkPackId, buyerEmail, quantityPurchased, totalAmount } = body;

    // Get bulk pack details
    const { data: packData, error: packError } = await supabase
      .from("bulk_ticket_packs")
      .select("*")
      .eq("id", bulkPackId)
      .single();

    if (packError || !packData) {
      return NextResponse.json(
        { error: "Bulk pack not found" },
        { status: 404 }
      );
    }

    // Check availability
    if (packData.available_count < quantityPurchased) {
      return NextResponse.json(
        { error: "Not enough tickets available in this pack" },
        { status: 400 }
      );
    }

    // Create purchase record
    const { data: purchaseData, error: purchaseError } = await supabase
      .from("bulk_ticket_purchases")
      .insert([
        {
          bulk_pack_id: bulkPackId,
          buyer_email: buyerEmail,
          quantity_purchased: quantityPurchased,
          price_per_ticket: packData.bulk_price,
          total_amount: totalAmount,
          payment_status: "pending",
        },
      ])
      .select();

    if (purchaseError) throw purchaseError;

    return NextResponse.json(purchaseData[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating bulk purchase:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/bulk-tickets/purchase?buyerEmail=xxx - Get purchases for a buyer
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerEmail = searchParams.get("buyerEmail");
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

    if (buyerEmail) {
      query = query.eq("buyer_email", buyerEmail);
    }

    if (bulkPackId) {
      query = query.eq("bulk_pack_id", bulkPackId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching bulk purchases:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
