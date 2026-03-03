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

    const nowIso = new Date().toISOString();

    // Build query to get upcoming events
    let query = supabase
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
      .limit(120);

    // Prioritize college events if user is authenticated
    if (collegeId) {
      query = query.or(`college_id.eq.${collegeId},college_id.is.null`);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching upcoming events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date(nowIso);
    const getEventStartTime = (event: any) =>
      new Date(event.start_date || event.start_datetime || event.date || "");

    const normalized = (events || [])
      .map((event: any) => ({
        ...event,
        start_date: event.start_date || event.start_datetime || event.date || null,
      }))
      .filter((event: any) => {
        const eventDate = getEventStartTime(event);
        return !Number.isNaN(eventDate.getTime()) && eventDate >= now;
      })
      .sort((a: any, b: any) => {
        const aTime = getEventStartTime(a).getTime();
        const bTime = getEventStartTime(b).getTime();
        return aTime - bTime;
      })
      .slice(0, 20);

    return NextResponse.json({ events: normalized });
  } catch (error: any) {
    console.error("Error in upcoming events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming events" },
      { status: 500 }
    );
  }
}
