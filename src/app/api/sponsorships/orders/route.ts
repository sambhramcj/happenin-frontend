import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type OrderRow = {
  sponsor_id: string;
  payment_status: string;
  [key: string]: unknown;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      organizer_email,
      admin_approved,
      created_at,
      events (id, title, date, location, banner_image, fest_id),
      fests (id, title, start_date, end_date),
      sponsors_profile!digital_visibility_packs_sponsor_id_fkey (company_name, logo_url, website_url, is_active)
    `
    )
    .order("created_at", { ascending: false });

  if (role === "sponsor") {
    query = query.eq("sponsor_id", email);
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

  const normalized = ((orders || []) as OrderRow[]).map((order) => ({
    ...order,
    sponsor_email: order.sponsor_id,
    status: order.payment_status,
    organizer_payout_settled: false,
    organizer_payout_settled_at: null,
  }));

  return NextResponse.json({ orders: normalized });
}
