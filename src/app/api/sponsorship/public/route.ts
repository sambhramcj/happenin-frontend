import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type PublicDeal = {
  pack_type: string;
  sponsors_profile?: { is_active?: boolean };
  [key: string]: unknown;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  const placement = searchParams.get("placement");

  if (!event_id && !placement) {
    return NextResponse.json({ error: "Missing event_id or placement" }, { status: 400 });
  }

  let festId: string | null = null;
  if (event_id) {
    const { data: event } = await supabase
      .from("events")
      .select("fest_id")
      .eq("id", event_id)
      .single();

    festId = event?.fest_id || null;
  }

  let query = supabase
    .from("digital_visibility_packs")
    .select(
      `
      id,
      sponsor_id,
      event_id,
      fest_id,
      pack_type,
      amount,
      payment_status,
      visibility_active,
      admin_approved,
      sponsors_profile!digital_visibility_packs_sponsor_id_fkey (company_name, logo_url, website_url, is_active),
      events (id, title, fest_id),
      fests (id, title, start_date, end_date)
    `
    )
    .eq("visibility_active", true)
    .eq("admin_approved", true)
    .eq("payment_status", "paid");

  if (event_id) {
    if (festId) {
      query = query.or(`event_id.eq.${event_id},fest_id.eq.${festId}`);
    } else {
      query = query.eq("event_id", event_id);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let deals = ((data || []) as PublicDeal[]).filter((d) => d.sponsors_profile?.is_active !== false);

  if (placement === "homepage") {
    deals = deals.filter((d) => {
      const packType = d.pack_type;
      return packType === "platinum";
    });
  }

  const mapped = deals.map((deal) => ({
    ...deal,
    status: String((deal as Record<string, unknown>).payment_status || "pending"),
    sponsorship_packages: {
      type: deal.pack_type,
      price: Number((deal as Record<string, unknown>).amount || 0),
    },
  }));

  return NextResponse.json({ deals: mapped });
}
