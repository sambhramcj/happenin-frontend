import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { getServerFeatureFlags } from "@/lib/serverFeatureFlags";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizerEmail = session.user.email;

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

    const flags = await getServerFeatureFlags();
    if (!flags.REGISTRATION) {
      return NextResponse.json({ error: "Registration feature is disabled" }, { status: 503 });
    }

    // Fetch registrations for this event
    const { data: registrations, error: registrationsError } = await supabase
      .from("registrations")
      .select("id, student_email, final_price, created_at, status, screenshot_url, payment_status, qr_ticket_id")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (registrationsError) {
      console.error("Error fetching registrations:", registrationsError);
      return NextResponse.json(
        { error: "Failed to fetch registrations" },
        { status: 500 }
      );
    }

    const studentEmails = Array.from(
      new Set((registrations || []).map((row) => row.student_email).filter(Boolean))
    );

    let profileMap: Record<string, string> = {};
    if (studentEmails.length > 0) {
      const { data: profiles } = await supabase
        .from("student_profiles")
        .select("student_email, full_name")
        .in("student_email", studentEmails);

      profileMap = Object.fromEntries(
        (profiles || []).map((profile) => [profile.student_email, profile.full_name || ""])
      );
    }

    const enriched = (registrations || []).map((registration) => ({
      ...registration,
      student_name: profileMap[registration.student_email] || registration.student_email,
    }));

    return NextResponse.json({
      eventId,
      eventName: event.id,
      registrations: enriched,
      totalRegistrations: enriched.length,
    });
  } catch (error) {
    console.error("Error in GET /api/organizer/events/[eventId]/registrations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizerEmail = session.user.email;

    const flags = await getServerFeatureFlags();
    if (!flags.REGISTRATION) {
      return NextResponse.json({ error: "Registration feature is disabled" }, { status: 503 });
    }

    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_email, title, date, start_datetime, venue, location")
      .eq("id", eventId)
      .single();

    if (!event || event.organizer_email !== organizerEmail) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as {
      registrationId?: string;
      action?: "approve" | "reject";
      reason?: string;
    };

    if (!body.registrationId || !body.action) {
      return NextResponse.json({ error: "registrationId and action are required" }, { status: 400 });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("id, event_id, student_email, status, final_price")
      .eq("id", body.registrationId)
      .eq("event_id", eventId)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const nextStatus = body.action === "approve" ? "approved" : "rejected";
    const paymentStatus = body.action === "approve" ? "success" : "failed";

    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        status: nextStatus,
        payment_status: paymentStatus,
        review_notes: body.reason || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: organizerEmail,
      })
      .eq("id", registration.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let generatedTicketId: string | null = null;

    if (body.action === "approve") {
      const { data: existingTicket } = await supabase
        .from("tickets")
        .select("id, ticket_id")
        .eq("registration_id", registration.id)
        .maybeSingle();

      if (existingTicket?.ticket_id) {
        generatedTicketId = existingTicket.ticket_id;
      } else {
        const ticketId = `TKT-${registration.id.slice(0, 8)}-${Date.now()}`;
        const { data: createdTicket, error: ticketError } = await supabase
          .from("tickets")
          .insert({
            ticket_id: ticketId,
            event_id: eventId,
            registration_id: registration.id,
            student_email: registration.student_email,
            event_title: event.title || "",
            event_date: event.start_datetime || event.date || "",
            event_location: event.venue || event.location || "",
            qr_code_data: `${eventId}:${registration.id}:${Date.now()}`,
            design_template: "modern",
            status: "active",
          })
          .select("ticket_id")
          .single();

        if (ticketError) {
          return NextResponse.json({ error: ticketError.message }, { status: 500 });
        }

        generatedTicketId = createdTicket?.ticket_id || ticketId;
      }

      await supabase
        .from("registrations")
        .update({ qr_ticket_id: generatedTicketId })
        .eq("id", registration.id);
    }

    return NextResponse.json({
      success: true,
      status: nextStatus,
      registrationId: registration.id,
      ticketId: generatedTicketId,
    });
  } catch (error) {
    console.error("PATCH organizer registration review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
