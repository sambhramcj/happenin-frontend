import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "sponsor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { event_id, package_id, transaction_reference, payment_method, payment_date } = body;

  if (!event_id || !package_id || !transaction_reference || !payment_method || !payment_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: pkg } = await supabase
    .from("sponsorship_packages")
    .select("id, event_id, fest_id, type, scope, price, is_active")
    .eq("id", package_id)
    .eq("is_active", true)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 });
  }

  if (pkg.scope === "per_event" && pkg.event_id !== event_id) {
    return NextResponse.json({ error: "Package does not match event" }, { status: 400 });
  }

  if (pkg.scope === "fest" && !pkg.fest_id) {
    return NextResponse.json({ error: "Fest package missing fest reference" }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, sponsorship_enabled")
    .eq("id", event_id)
    .single();

  if (!event || !event.sponsorship_enabled) {
    return NextResponse.json({ error: "Sponsorship visibility not enabled for this event" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("sponsors_profile")
    .select("email")
    .eq("email", session.user.email)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Sponsor profile required" }, { status: 400 });
  }

  const { data: deal, error } = await supabase
    .from("sponsorship_deals")
    .insert({
      sponsor_email: session.user.email,
      event_id: pkg.scope === "per_event" ? pkg.event_id : null,
      fest_id: pkg.scope === "fest" ? pkg.fest_id : null,
      package_id,
      payment_status: "pending",
      transaction_reference,
      payment_method,
      payment_date,
      verified_by_admin: false,
      visibility_active: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deal });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = (session.user as any).role;

  let query = supabase
    .from("sponsorship_deals")
    .select(`
      id,
      sponsor_email,
      event_id,
      fest_id,
      package_id,
      payment_status,
      transaction_reference,
      payment_method,
      payment_date,
      verified_by_admin,
      visibility_active,
      created_at,
      events (id, title, date, location, banner_image, fest_id),
      fests (id, title, start_date, end_date),
      sponsorship_packages (type, price, scope),
      sponsors_profile (company_name, logo_url, website_url)
    `);

  if (role === "sponsor") {
    query = query.eq("sponsor_email", session.user.email);
  } else if (role === "organizer") {
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_email", session.user.email);
    
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      query = query.in("event_id", eventIds);
    } else {
      return NextResponse.json({ deals: [] });
    }
  } else if (role === "admin") {
    // Admin sees all
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event_id = searchParams.get("event_id");
  if (event_id) {
    query = query.eq("event_id", event_id);
  }

  const { data: deals, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deals: deals || [] });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "sponsor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { deal_id, transaction_reference, payment_method, payment_date } = body;

  if (!deal_id || !transaction_reference || !payment_method || !payment_date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: deal, error } = await supabase
    .from("sponsorship_deals")
    .update({
      transaction_reference,
      payment_method,
      payment_date,
    })
    .eq("id", deal_id)
    .eq("sponsor_email", session.user.email)
    .eq("payment_status", "pending")
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deal });
}
