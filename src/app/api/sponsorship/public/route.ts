import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  const placement = searchParams.get("placement");

  if (!event_id && !placement) {
    return NextResponse.json({ error: "Missing event_id or placement" }, { status: 400 });
  }

  let query = supabase
    .from("sponsorship_deals")
    .select(`
      id,
      event_id,
      status,
      amount_paid,
      sponsorship_packages (tier),
      sponsors_profile (company_name, logo_url, website_url, is_active)
    `)
    .in("status", ["confirmed", "active", "completed"]);

  if (event_id) {
    query = query.eq("event_id", event_id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let deals = (data || []).filter((d: any) => d.sponsors_profile?.is_active !== false);

  if (placement === "homepage") {
    deals = deals.filter((d: any) => ["gold", "platinum"].includes(d.sponsorship_packages?.tier));
  }

  return NextResponse.json({ deals });
}
