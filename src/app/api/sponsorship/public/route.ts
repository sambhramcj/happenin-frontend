import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    .from("sponsorship_orders")
    .select(
      `
      id,
      event_id,
      fest_id,
      pack_type,
      amount,
      status,
      visibility_active,
      sponsors_profile (company_name, logo_url, website_url, is_active),
      events (id, title, fest_id),
      fests (id, title, start_date, end_date)
    `
    )
    .eq("visibility_active", true)
    .eq("status", "paid");

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

  let deals = (data || []).filter((d: any) => d.sponsors_profile?.is_active !== false);

  if (placement === "homepage") {
    const now = new Date();
    deals = deals.filter((d: any) => {
      const packType = d.pack_type;
      if (!['app', 'fest'].includes(packType)) return false;

      const festStart = d.fests?.start_date ? new Date(d.fests.start_date) : null;
      const festEnd = d.fests?.end_date ? new Date(d.fests.end_date) : null;

      if (festStart && festEnd) {
        return now >= festStart && now <= festEnd;
      }

      return true;
    });
  }

  const mapped = deals.map((deal: any) => ({
    ...deal,
    sponsorship_packages: {
      type: deal.pack_type,
      price: deal.amount,
    },
  }));

  return NextResponse.json({ deals: mapped });
}
