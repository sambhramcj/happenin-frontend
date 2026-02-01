import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get event to check if user is organizer or participant
    const { data: eventData } = await supabase
      .from("events")
      .select("id, organizer_email")
      .eq("id", eventId)
      .single();

    if (!eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is organizer or registered
    const { data: registration } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("student_email", session.user.email)
      .single();

    const isOrganizer = eventData.organizer_email === session.user.email;
    const isParticipant = !!registration;

    if (!isOrganizer && !isParticipant) {
      return NextResponse.json(
        { error: "You don't have permission to view this gallery" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("event_photos")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching event photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is event organizer
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventData.organizer_email !== session.user.email) {
      return NextResponse.json(
        { error: "You must be the event organizer to upload photos" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { photoUrl, description } = body;

    const { data, error } = await supabase
      .from("event_photos")
      .insert({
        event_id: eventId,
        photo_url: photoUrl,
        uploaded_by: session.user.email,
        description,
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}
