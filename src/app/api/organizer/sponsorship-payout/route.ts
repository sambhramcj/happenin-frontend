import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const queryEmail = searchParams.get("email");

  // Ensure organizer can only access their own payout data
  if (queryEmail !== email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch all events for this organizer
    const { data: events, error: eventsError } = await serviceSupabase
      .from("events")
      .select("id")
      .eq("organizer_email", email);

    if (eventsError) throw eventsError;

    if (!events || events.length === 0) {
      return NextResponse.json({
        totalEarnings: 0,
        activeDeals: 0,
        deals: [],
      });
    }

    const eventIds = events.map((e) => e.id);

    // Fetch sponsorship deals for these events
    const { data: deals, error: dealsError } = await serviceSupabase
      .from("sponsorship_deals")
      .select(
        `
        id,
        event_id,
        amount_paid,
        platform_fee,
        organizer_amount,
        status,
        created_at,
        events (id, title),
        sponsors_profile (company_name, email)
      `
      )
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (dealsError) throw dealsError;

    const typedDeals = deals || [];
    const totalEarnings = typedDeals.reduce(
      (sum: number, d: any) => sum + (d.organizer_amount || 0),
      0
    );
    const activeDeals = typedDeals.filter((d: any) =>
      ["pending", "confirmed", "active"].includes(d.status)
    ).length;

    return NextResponse.json({
      totalEarnings,
      activeDeals,
      deals: typedDeals,
    });
  } catch (error) {
    console.error("Error fetching payout:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout data" },
      { status: 500 }
    );
  }
}
