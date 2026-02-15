import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString();

    // Get events with active boost visibility
    const { data: events, error } = await supabase
      .from("events")
      .select(`
        *,
        organizers_profile!events_organizer_email_fkey (
          first_name,
          last_name,
          logo_url
        )
      `)
      .eq("boost_visibility", true)
      .eq("boost_payment_status", "verified")
      .gte("boost_end_date", now)
      .order("boost_priority", { ascending: true })
      .order("start_date", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Error fetching featured events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error("Error in featured events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured events" },
      { status: 500 }
    );
  }
}
