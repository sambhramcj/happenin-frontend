// API: Event Access Control Management
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/access-control/set - Set access control for an event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      organizerEmail,
      accessType,
      restrictions,
    } = body;

    // Check if access control already exists
    const { data: existing } = await supabase
      .from("event_access_control")
      .select("id")
      .eq("event_id", eventId)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("event_access_control")
        .update({
          access_type: accessType,
          restrictions,
          updated_at: new Date().toISOString(),
        })
        .eq("event_id", eventId)
        .select();

      if (error) throw error;
      result = data[0];
    } else {
      // Create new
      const { data, error } = await supabase
        .from("event_access_control")
        .insert([
          {
            event_id: eventId,
            organizer_email: organizerEmail,
            access_type: accessType,
            restrictions,
          },
        ])
        .select();

      if (error) throw error;
      result = data[0];
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error setting access control:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/access-control/check - Check if user is eligible
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const userEmail = searchParams.get("userEmail");
    const userCollege = searchParams.get("userCollege");
    const userYear = searchParams.get("userYear");
    const userBranch = searchParams.get("userBranch");
    const userClubs = searchParams.getAll("userClubs");

    if (!eventId || !userEmail) {
      return NextResponse.json(
        { error: "eventId and userEmail are required" },
        { status: 400 }
      );
    }

    // Call the database function to check eligibility
    const { data, error } = await supabase
      .rpc("is_user_eligible_for_event", {
        p_event_id: eventId,
        p_user_email: userEmail,
        p_user_college: userCollege,
        p_user_year_of_study: userYear ? parseInt(userYear) : null,
        p_user_branch: userBranch,
        p_user_club_memberships: userClubs.length > 0 ? userClubs : null,
      });

    if (error) throw error;

    // Log the access check
    await supabase
      .from("access_check_logs")
      .insert([
        {
          event_id: eventId,
          user_email: userEmail,
          access_eligible: data,
          checked_at: new Date().toISOString(),
        },
      ]);

    return NextResponse.json({ eligible: data });
  } catch (error: any) {
    console.error("Error checking access:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
