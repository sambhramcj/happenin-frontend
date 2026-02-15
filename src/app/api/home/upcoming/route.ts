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

    const now = new Date().toISOString();

    // Build query to get upcoming events
    let query = supabase
      .from("events")
      .select(`
        *,
        organizers_profile!events_organizer_email_fkey (
          first_name,
          last_name,
          logo_url
        )
      `)
      .gte("start_date", now)
      .order("start_date", { ascending: true })
      .limit(20);

    // Prioritize college events if user is authenticated
    if (collegeId) {
      query = query.or(`college_id.eq.${collegeId},college_id.is.null`);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching upcoming events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error("Error in upcoming events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch upcoming events" },
      { status: 500 }
    );
  }
}
