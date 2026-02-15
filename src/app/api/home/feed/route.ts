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
    const cursor = searchParams.get("cursor"); // timestamp for cursor-based pagination
    const category = searchParams.get("category");

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

    // Build query for infinite feed
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
      .order("start_date", { ascending: true })
      .limit(PAGE_SIZE);

    // Apply cursor pagination
    if (cursor) {
      query = query.gt("start_date", cursor);
    } else {
      // First page: start from now
      const now = new Date().toISOString();
      query = query.gte("start_date", now);
    }

    // Filter by category if provided
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    // Prioritize college events if user is authenticated
    if (collegeId) {
      // Get college events
      const collegeQuery = query.eq("college_id", collegeId);
      const { data: collegeEvents } = await collegeQuery;

      // Get other events
      const otherQuery = supabase
        .from("events")
        .select(`
          *,
          organizers_profile!events_organizer_email_fkey (
            first_name,
            last_name,
            logo_url
          )
        `)
        .order("start_date", { ascending: true })
        .limit(PAGE_SIZE)
        .neq("college_id", collegeId);

      if (cursor) {
        otherQuery.gt("start_date", cursor);
      } else {
        const now = new Date().toISOString();
        otherQuery.gte("start_date", now);
      }

      if (category && category !== "all") {
        otherQuery.eq("category", category);
      }

      const { data: otherEvents } = await otherQuery;

      // Mix college events (70%) and other events (30%)
      const mixedEvents = [
        ...(collegeEvents || []).slice(0, Math.ceil(PAGE_SIZE * 0.7)),
        ...(otherEvents || []).slice(0, Math.floor(PAGE_SIZE * 0.3)),
      ]
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        )
        .slice(0, PAGE_SIZE);

      const nextCursor =
        mixedEvents.length === PAGE_SIZE
          ? mixedEvents[mixedEvents.length - 1].start_date
          : null;

      return NextResponse.json({
        events: mixedEvents,
        nextCursor,
        hasMore: mixedEvents.length === PAGE_SIZE,
      });
    }

    // For non-authenticated users, just return all events
    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching feed events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const nextCursor =
      (events || []).length === PAGE_SIZE
        ? events![events!.length - 1].start_date
        : null;

    return NextResponse.json({
      events: events || [],
      nextCursor,
      hasMore: (events || []).length === PAGE_SIZE,
    });
  } catch (error: any) {
    console.error("Error in feed API:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed events" },
      { status: 500 }
    );
  }
}
