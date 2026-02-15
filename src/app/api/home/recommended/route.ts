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

    if (!userEmail) {
      // Return empty for non-authenticated users
      return NextResponse.json({ events: [] });
    }

    // Get user profile with college and club memberships
    const { data: profile } = await supabase
      .from("students_profile")
      .select("college_id")
      .eq("email", userEmail)
      .single();

    const collegeId = profile?.college_id;

    // Get user's club memberships
    const { data: memberships } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("student_email", userEmail)
      .eq("status", "approved");

    const clubIds = (memberships || []).map((m) => m.club_id);

    // Get user's past event registrations for category preferences
    const { data: registrations } = await supabase
      .from("event_registrations")
      .select(`
        events!event_registrations_event_id_fkey (
          category
        )
      `)
      .eq("student_email", userEmail);

    // Extract preferred categories from registration history
    const categoryHistory = registrations
      ?.map((r: any) => r.events?.category)
      .filter(Boolean) || [];
    
    const categoryCounts = categoryHistory.reduce((acc: any, cat: string) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    const preferredCategories = Object.entries(categoryCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const now = new Date().toISOString();

    // Recommendation algorithm:
    // 1. Events from user's clubs
    // 2. Events from user's college matching preferred categories
    // 3. Events from user's college
    // 4. Popular events matching preferred categories

    let recommendedEvents: any[] = [];

    // 1. Club events
    if (clubIds.length > 0) {
      const { data: clubEvents } = await supabase
        .from("events")
        .select(`
          *,
          organizers_profile!events_organizer_email_fkey (
            first_name,
            last_name,
            logo_url
          )
        `)
        .in("club_id", clubIds)
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(5);

      recommendedEvents.push(...(clubEvents || []));
    }

    // 2. College events with preferred categories
    if (collegeId && preferredCategories.length > 0) {
      const { data: categoryEvents } = await supabase
        .from("events")
        .select(`
          *,
          organizers_profile!events_organizer_email_fkey (
            first_name,
            last_name,
            logo_url
          )
        `)
        .eq("college_id", collegeId)
        .in("category", preferredCategories)
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(5);

      recommendedEvents.push(...(categoryEvents || []));
    }

    // 3. General college events
    if (collegeId) {
      const { data: collegeEvents } = await supabase
        .from("events")
        .select(`
          *,
          organizers_profile!events_organizer_email_fkey (
            first_name,
            last_name,
            logo_url
          )
        `)
        .eq("college_id", collegeId)
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(5);

      recommendedEvents.push(...(collegeEvents || []));
    }

    // 4. Popular events by category
    if (preferredCategories.length > 0) {
      const { data: popularEvents } = await supabase
        .from("events")
        .select(`
          *,
          organizers_profile!events_organizer_email_fkey (
            first_name,
            last_name,
            logo_url
          )
        `)
        .in("category", preferredCategories)
        .gte("start_date", now)
        .order("start_date", { ascending: true })
        .limit(5);

      recommendedEvents.push(...(popularEvents || []));
    }

    // Remove duplicates and limit to 10
    const uniqueEvents = Array.from(
      new Map(recommendedEvents.map((e) => [e.id, e])).values()
    ).slice(0, 10);

    return NextResponse.json({ events: uniqueEvents });
  } catch (error: any) {
    console.error("Error in recommended events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended events" },
      { status: 500 }
    );
  }
}
