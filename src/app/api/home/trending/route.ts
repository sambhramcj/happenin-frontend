import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    // Get user's college_id if authenticated
    let collegeId: string | null = null;
    if (userEmail) {
      const { data: profile } = await supabase
        .from("students_profile")
        .select("college_id")
        .eq("email", userEmail)
        .single();
      
      collegeId = profile?.college_id || null;
    }

    // Call the SQL function to get top events by registrations
    const { data: events, error } = await supabase.rpc(
      "get_top_events_by_registrations",
      {
        p_college_id: collegeId,
        p_limit: 5,
      }
    );

    if (error) {
      console.error("Error fetching trending events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let outputEvents = events || [];

    if (!outputEvents.length) {
      const now = new Date();
      const { data: fallbackEvents, error: fallbackError } = await supabase
        .from("events")
        .select(`
          *,
          organizers_profile:organizers!events_organizer_email_fkey (
            first_name,
            last_name,
            logo_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(25);

      if (!fallbackError) {
        outputEvents = (fallbackEvents || [])
          .map((event: any) => ({
            ...event,
            start_date: event.start_date || event.start_datetime || event.date || null,
          }))
          .filter((event: any) => {
            const eventDate = new Date(event.start_date || "");
            return !Number.isNaN(eventDate.getTime()) && eventDate >= now;
          })
          .slice(0, 5);
      }
    }

    return NextResponse.json({ events: outputEvents });
  } catch (error: any) {
    console.error("Error in trending events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending events" },
      { status: 500 }
    );
  }
}
