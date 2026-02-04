// API: Bulk Ticket Management
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/bulk-tickets/packs - Create a bulk ticket pack
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      organizerEmail,
      name,
      description,
      quantity,
      basePrice,
      bulkPrice,
      offerTitle,
      offerDescription,
      offerExpiryDate,
    } = body;

    // Calculate discount percentage
    const discountPercentage = Math.round(
      ((basePrice - bulkPrice) / basePrice) * 100
    );
    const totalCost = bulkPrice * quantity;

    const { data, error } = await supabase
      .from("bulk_ticket_packs")
      .insert([
        {
          event_id: eventId,
          organizer_email: organizerEmail,
          name,
          description,
          quantity,
          base_price: basePrice,
          bulk_price: bulkPrice,
          discount_percentage: discountPercentage,
          total_cost: totalCost,
          offer_title: offerTitle,
          offer_description: offerDescription,
          offer_expiry_date: offerExpiryDate,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error: any) {
    console.error("Error creating bulk pack:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/bulk-tickets/packs?eventId=uuid - Get bulk packs for an event
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const organizerEmail = searchParams.get("organizerEmail");

    let query = supabase
      .from("bulk_ticket_packs")
      .select("*")
      .order("created_at", { ascending: false });

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    if (organizerEmail) {
      query = query.eq("organizer_email", organizerEmail);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching bulk packs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
