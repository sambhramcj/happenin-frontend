import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request, context: { params: Promise<{ eventId: string }> }) {
  const { params } = context;
  const resolvedParams = await params;
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizerEmail = session.user.email;
    const eventId = resolvedParams.eventId;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // SECURITY: Verify the event belongs to this organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // SECURITY: Check authorization - only organizer can view their registrations
    if (event.organizer_email !== organizerEmail) {
      return NextResponse.json(
        { error: "Not authorized to view registrations for this event" },
        { status: 403 }
      );
    }

    // Fetch registrations for this event
    const { data: registrations, error: registrationsError } = await supabase
      .from("registrations")
      .select("student_email, final_price, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (registrationsError) {
      console.error("Error fetching registrations:", registrationsError);
      return NextResponse.json(
        { error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      eventId,
      eventName: event.id,
      registrations: registrations || [],
      totalRegistrations: registrations?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/organizer/events/[eventId]/registrations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
