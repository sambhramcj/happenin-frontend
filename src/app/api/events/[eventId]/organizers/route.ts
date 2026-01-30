import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("event_organizers")
      .select("*")
      .eq("event_id", params.eventId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching event organizers:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizers" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is event organizer
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", params.eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventData.organizer_email !== session.user.email) {
      return NextResponse.json(
        { error: "Only the primary organizer can add co-organizers" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { organizerEmail, role, permissions } = body;

    if (!organizerEmail) {
      return NextResponse.json(
        { error: "organizerEmail is required" },
        { status: 400 }
      );
    }

    // Check if organizer already exists
    const { data: existing } = await supabase
      .from("event_organizers")
      .select("id")
      .eq("event_id", params.eventId)
      .eq("organizer_email", organizerEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This organizer is already added to the event" },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("event_organizers")
      .insert({
        event_id: params.eventId,
        organizer_email: organizerEmail,
        role: role || "co-organizer",
        permissions: permissions ? JSON.stringify(permissions) : null,
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error adding event organizer:", error);
    return NextResponse.json(
      { error: "Failed to add organizer" },
      { status: 500 }
    );
  }
}
