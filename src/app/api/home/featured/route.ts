import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

type FeaturedRow = {
  events?: Record<string, unknown> | Array<Record<string, unknown>>;
};

export async function GET() {
  try {
    const now = new Date().toISOString();

    const { data: featuredRows, error } = await supabase
      .from("featured_events")
      .select(`
        id,
        start_date,
        end_date,
        events:event_id (
          id,
          title,
          description,
          banner_url,
          banner_image,
          start_date,
          date,
          ticket_price,
          price,
          organizer_email
        )
      `)
      .eq("active", true)
      .eq("payment_status", "paid")
      .gte("end_date", now)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching featured events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const events = ((featuredRows || []) as FeaturedRow[])
      .map((row) => ({
        ...(Array.isArray(row.events) ? row.events[0] : row.events),
      }))
      .filter(Boolean);

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error("Error in featured events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured events" },
      { status: 500 }
    );
  }
}
