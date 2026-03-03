import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor"); // created_at cursor for pagination
    const category = searchParams.get("category");
    const scope = searchParams.get("scope");

    const session = await getServerSession();
    const userEmail = session?.user?.email;
    const eventSelect = `
        *,
        organizers_profile:organizers!events_organizer_email_fkey (
          first_name,
          last_name,
          logo_url
        )
      `;

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

    // Build query for infinite feed
    let query = supabase
      .from("events")
      .select(eventSelect)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    // Apply cursor pagination
    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    // Filter by category if provided
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Prioritize college events if user is authenticated
    if (collegeId && scope !== "all") {
      // Get college events
      const collegeQuery = query.eq("college_id", collegeId);
      let { data: collegeEvents, error: collegeError } = await collegeQuery;

      if (collegeError) {
        console.warn("⚠️ /api/home/feed college relation query failed, using fallback select('*'):", collegeError.message);
        let fallbackCollegeQuery = supabase
          .from("events")
          .select("*")
          .eq("college_id", collegeId)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);

        if (cursor) {
          fallbackCollegeQuery = fallbackCollegeQuery.lt("created_at", cursor);
        }

        if (category && category !== "all") {
          fallbackCollegeQuery = fallbackCollegeQuery.eq("category", category);
        }

        const fallbackCollege = await fallbackCollegeQuery;
        collegeEvents = fallbackCollege.data || [];
      }

      // Get other events
      const otherQuery = supabase
        .from("events")
        .select(eventSelect)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .neq("college_id", collegeId);

      if (cursor) {
        otherQuery.lt("created_at", cursor);
      }

      if (category && category !== "all") {
        otherQuery.eq("category", category);
      }

      let { data: otherEvents, error: otherError } = await otherQuery;

      if (otherError) {
        console.warn("⚠️ /api/home/feed other relation query failed, using fallback select('*'):", otherError.message);
        let fallbackOtherQuery = supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE)
          .neq("college_id", collegeId);

        if (cursor) {
          fallbackOtherQuery = fallbackOtherQuery.lt("created_at", cursor);
        }

        if (category && category !== "all") {
          fallbackOtherQuery = fallbackOtherQuery.eq("category", category);
        }

        const fallbackOther = await fallbackOtherQuery;
        otherEvents = fallbackOther.data || [];
      }

      // Mix college events (70%) and other events (30%)
      const mixedEvents = [
        ...(collegeEvents || []).slice(0, Math.ceil(PAGE_SIZE * 0.7)),
        ...(otherEvents || []).slice(0, Math.floor(PAGE_SIZE * 0.3)),
      ]
        .map((event: any) => ({
          ...event,
          start_date: event.start_date || event.start_datetime || event.date || null,
        }))
        .sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, PAGE_SIZE);

      const nextCursor =
        mixedEvents.length === PAGE_SIZE
          ? mixedEvents[mixedEvents.length - 1].created_at
          : null;

      return NextResponse.json({
        events: mixedEvents,
        nextCursor,
        hasMore: mixedEvents.length === PAGE_SIZE,
      });
    }

    // For non-authenticated users, just return all events
    let { data: events, error } = await query;

    if (error) {
      console.warn("⚠️ /api/home/feed relation query failed, using fallback select('*'):", error.message);
      let fallbackQuery = supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) {
        fallbackQuery = fallbackQuery.lt("created_at", cursor);
      }

      if (category && category !== "all") {
        fallbackQuery = fallbackQuery.eq("category", category);
      }

      const fallbackResult = await fallbackQuery;
      if (fallbackResult.error) {
        console.error("Error fetching feed events:", fallbackResult.error);
        return NextResponse.json({ error: fallbackResult.error.message }, { status: 500 });
      }

      events = fallbackResult.data || [];
    }

    const normalizedEvents = (events || []).map((event: any) => ({
      ...event,
      start_date: event.start_date || event.start_datetime || event.date || null,
    }));

    const nextCursor =
      normalizedEvents.length === PAGE_SIZE
        ? normalizedEvents[normalizedEvents.length - 1].created_at
        : null;

    return NextResponse.json({
      events: normalizedEvents,
      nextCursor,
      hasMore: normalizedEvents.length === PAGE_SIZE,
    });
  } catch (error: any) {
    console.error("Error in feed API:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed events" },
      { status: 500 }
    );
  }
}
