import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, teamName, teamMembers } = body;

    if (!eventId || !teamMembers || teamMembers.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!teamName || teamName.trim() === "") {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // Get event price
    const { data: event } = await supabase
      .from("events")
      .select("price")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventPrice = parseFloat(event.price) || 0;

    // Create team registration
    // ONLY TEAM LEADER PAYS - total_price = event_price (only leader's fee)
    const { data: teamData, error: teamError } = await supabase
      .from("team_registrations")
      .insert({
        event_id: eventId,
        team_lead_email: session.user.email,
        team_name: teamName,
        team_size: teamMembers.length + 1, // +1 for team lead
        total_price: eventPrice, // Only leader pays
        payment_status: "pending",
      })
      .select();

    if (teamError) throw teamError;
    if (!teamData || teamData.length === 0) {
      throw new Error("Failed to create team registration");
    }

    const teamId = teamData[0].id;

    // Add team members (no payment required)
    const memberInserts = teamMembers.map((email: string) => ({
      team_id: teamId,
      member_email: email,
      has_paid: false, // Teammates don't pay
    }));

    const { error: membersError } = await supabase
      .from("team_members")
      .insert(memberInserts);

    if (membersError) throw membersError;

    // Send notifications to team members
    for (const memberEmail of teamMembers) {
      await supabase.from("notifications").insert({
        user_email: memberEmail,
        title: "Team Registration",
        body: `You have been added to team "${teamName}" for event. No payment required.`,
        type: "team_registration",
        action_url: `/events/${eventId}`,
      });
    }

    return NextResponse.json(
      {
        id: teamId,
        message: "Team registration created. Only leader needs to pay.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team registration:", error);
    return NextResponse.json(
      { error: "Failed to create team registration" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("team_registrations")
      .select("*, team_members(*)")
      .eq("event_id", eventId)
      .or(
        `team_lead_email.eq.${session.user.email},team_members.member_email.eq.${session.user.email}`
      );

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching team registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch team registrations" },
      { status: 500 }
    );
  }
}
