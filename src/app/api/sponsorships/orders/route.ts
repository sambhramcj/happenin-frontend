import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("sponsorship_orders")
    .select(
      `
      id,
      sponsor_email,
      event_id,
      fest_id,
      pack_type,
      amount,
      status,
      visibility_active,
      organizer_payout_settled,
      organizer_payout_settled_at,
      created_at,
      events (id, title, date, location, banner_image, fest_id),
      fests (id, title, start_date, end_date),
      sponsors_profile (company_name, logo_url, website_url, is_active)
    `
    )
    .order("created_at", { ascending: false });

  if (role === "sponsor") {
    query = query.eq("sponsor_email", email);
  } else if (role === "organizer") {
    const { data: events } = await supabase
      .from("events")
      .select("id, fest_id")
      .eq("organizer_email", email);

    if (!events || events.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const eventIds = events.map((e) => e.id);
    const festIds = Array.from(
      new Set(events.map((e) => e.fest_id).filter(Boolean))
    );

    if (festIds.length > 0) {
      query = query.or(
        `event_id.in.(${eventIds.join(",")}),fest_id.in.(${festIds.join(",")})`
      );
    } else {
      query = query.in("event_id", eventIds);
    }
  } else if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ orders: orders || [] });
}
