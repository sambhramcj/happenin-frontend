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

    // Get user profile with college (schema-compatible fallback)
    let collegeId: string | null = null;

    const { data: studentProfileV2 } = await supabase
      .from("students_profile")
      .select("college_id")
      .eq("email", userEmail)
      .single();

    if (studentProfileV2?.college_id) {
      collegeId = studentProfileV2.college_id;
    } else {
      const { data: studentProfileLegacy } = await supabase
        .from("student_profiles")
        .select("college_name")
        .eq("student_email", userEmail)
        .single();

      if (studentProfileLegacy?.college_name) {
        const { data: college } = await supabase
          .from("colleges")
          .select("id")
          .eq("name", studentProfileLegacy.college_name)
          .maybeSingle();

        collegeId = college?.id || null;
      }
    }

    // Get user's club memberships
    const { data: memberships } = await supabase
      .from("club_members")
      .select("club_id")
      .eq("student_email", userEmail)
      .eq("status", "approved");

    const clubIds = (memberships || []).map((m) => m.club_id);

    // Get user's past event registrations for category preferences (schema-compatible fallback)
    let categoryHistory: string[] = [];

    const { data: registrationsV2 } = await supabase
      .from("event_registrations")
      .select(`
        events!event_registrations_event_id_fkey (
          category
        )
      `)
      .eq("student_email", userEmail);

    if (registrationsV2 && registrationsV2.length > 0) {
      categoryHistory = registrationsV2
        .map((r: any) => r.events?.category)
        .filter(Boolean);
    } else {
      let registrationRows: any[] = [];

      const { data: regsByStudentEmail } = await supabase
        .from("registrations")
        .select("event_id")
        .eq("student_email", userEmail)
        .limit(200);

      if (regsByStudentEmail && regsByStudentEmail.length > 0) {
        registrationRows = regsByStudentEmail;
      } else {
        const { data: regsByUserEmail } = await supabase
          .from("registrations")
          .select("event_id")
          .eq("user_email", userEmail)
          .limit(200);

        registrationRows = regsByUserEmail || [];
      }

      const eventIds = Array.from(new Set(registrationRows.map((row: any) => row.event_id).filter(Boolean)));
      if (eventIds.length > 0) {
        const { data: registrationEvents } = await supabase
          .from("events")
          .select("id,category")
          .in("id", eventIds);

        categoryHistory = (registrationEvents || [])
          .map((event: any) => event.category)
          .filter(Boolean);
      }
    }

    // Extract preferred categories from registration history
    const categoryCounts = categoryHistory.reduce((acc: any, cat: string) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    
    const preferredCategories = Object.entries(categoryCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const nowIso = new Date().toISOString();

    const eventSelect = `
      *,
      organizers_profile:organizers!events_organizer_email_fkey (
        first_name,
        last_name,
        logo_url
      )
    `;

    // Recommendation algorithm:
    // 1. Events from user's clubs
    // 2. Events from user's college matching preferred categories
    // 3. Events from user's college
    // 4. Popular events matching preferred categories
    // 5. If club signals are missing, use category-weighted fallback ranking

    const recommendedEvents: any[] = [];

    // 1. Club events
    if (clubIds.length > 0) {
      const { data: clubEvents } = await supabase
        .from("events")
        .select(eventSelect)
        .in("club_id", clubIds)
        .order("created_at", { ascending: false })
        .limit(20);

      recommendedEvents.push(...(clubEvents || []));
    }

    // 2. College events with preferred categories
    if (collegeId && preferredCategories.length > 0) {
      const { data: categoryEvents } = await supabase
        .from("events")
        .select(eventSelect)
        .eq("college_id", collegeId)
        .in("category", preferredCategories)
        .order("created_at", { ascending: false })
        .limit(20);

      recommendedEvents.push(...(categoryEvents || []));
    }

    // 3. General college events
    if (collegeId) {
      const { data: collegeEvents } = await supabase
        .from("events")
        .select(eventSelect)
        .eq("college_id", collegeId)
        .order("created_at", { ascending: false })
        .limit(20);

      recommendedEvents.push(...(collegeEvents || []));
    }

    // 4. Popular events by category
    if (preferredCategories.length > 0) {
      const { data: popularEvents } = await supabase
        .from("events")
        .select(eventSelect)
        .in("category", preferredCategories)
        .order("created_at", { ascending: false })
        .limit(20);

      recommendedEvents.push(...(popularEvents || []));
    }

    // 5. Category-weighted fallback when club signal is unavailable
    if (clubIds.length === 0) {
      const { data: fallbackPool } = await supabase
        .from("events")
        .select(eventSelect)
        .order("created_at", { ascending: false })
        .limit(120);

      const weighted = (fallbackPool || [])
        .map((event: any) => {
          const category = String(event.category || "").toLowerCase();
          const categoryWeight = Number(categoryCounts[category] || categoryCounts[event.category] || 0);
          const isPreferredCategory = preferredCategories.includes(event.category) ? 1 : 0;
          const isSameCollege = collegeId && event.college_id === collegeId ? 1 : 0;
          const score = categoryWeight * 5 + isPreferredCategory * 3 + isSameCollege * 2;

          return {
            ...event,
            __score: score,
          };
        })
        .sort((a: any, b: any) => {
          if (b.__score !== a.__score) return b.__score - a.__score;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        })
        .slice(0, 30)
        .map(({ __score, ...event }: any) => event);

      recommendedEvents.push(...weighted);
    }

    // Remove duplicates and limit to 10
    const now = new Date(nowIso);
    const getEventStartTime = (event: any) =>
      new Date(event.start_date || event.start_datetime || event.date || "");

    const uniqueEvents = Array.from(
      new Map(recommendedEvents.map((e) => [e.id, e])).values()
    )
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
      .slice(0, 10);

    return NextResponse.json({ events: uniqueEvents });
  } catch (error: any) {
    console.error("Error in recommended events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommended events" },
      { status: 500 }
    );
  }
}
