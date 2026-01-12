import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
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
    const eventId = params.eventId;

    if (!eventId) {
      return Response.json(
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
      return Response.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // SECURITY: Check authorization - only organizer can view their registrations
    if (event.organizer_email !== organizerEmail) {
      return Response.json(
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
      return Response.json(
        { error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    return Response.json({
      eventId,
      eventName: event.id,
      registrations: registrations || [],
      totalRegistrations: registrations?.length || 0,
    });
  } catch (error) {
    console.error("Error in GET /api/organizer/events/[eventId]/registrations:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
