import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET event cancellation/rescheduling history
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;

    // Get event to verify organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only organizer can view this
    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get cancellations
    const { data: cancellations, error: cancelError } = await supabase
      .from("event_cancellations")
      .select("*")
      .eq("event_id", eventId)
      .order("cancelled_at", { ascending: false });

    if (cancelError) throw cancelError;

    // Get reschedules
    const { data: reschedules, error: rescheduleError } = await supabase
      .from("event_reschedules")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (rescheduleError) throw rescheduleError;

    // Get changelog
    const { data: changelog, error: changelogError } = await supabase
      .from("event_changelog")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (changelogError) throw changelogError;

    return NextResponse.json({
      cancellations,
      reschedules,
      changelog,
    });
  } catch (error) {
    console.error("Error fetching event changes:", error);
    return NextResponse.json(
      { error: "Failed to fetch event changes" },
      { status: 500 }
    );
  }
}

// PATCH: Reschedule event
export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;
    const body = await req.json();
    const { newDate, newTime, newVenue, reason } = body;

    if (!newDate || !reason) {
      return NextResponse.json(
        { error: "newDate and reason are required" },
        { status: 400 }
      );
    }

    // Get event to verify organizer and get current details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_email, event_date, event_time, venue, title")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only organizer can reschedule
    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert reschedule record
    const { data: reschedule, error: rescheduleError } = await supabase
      .from("event_reschedules")
      .insert({
        event_id: eventId,
        original_date: event.event_date,
        new_date: newDate,
        original_time: event.event_time,
        new_time: newTime || event.event_time,
        original_venue: event.venue,
        new_venue: newVenue || event.venue,
        rescheduled_by: session.user.email,
        reason: reason,
      })
      .select()
      .single();

    if (rescheduleError) throw rescheduleError;

    // Update event with new date/time
    const { error: updateError } = await supabase
      .from("events")
      .update({
        event_date: newDate,
        event_time: newTime || event.event_time,
        venue: newVenue || event.venue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (updateError) throw updateError;

    // Add to changelog
    const { error: changelogError } = await supabase
      .from("event_changelog")
      .insert({
        event_id: eventId,
        status: "rescheduled",
        previous_status: "active",
        changed_by: session.user.email,
        reason: reason,
        details: {
          oldDate: event.event_date,
          newDate: newDate,
          oldVenue: event.venue,
          newVenue: newVenue || event.venue,
        },
      });

    if (changelogError) throw changelogError;

    // Get all registered participants
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("student_email")
      .eq("event_id", eventId);

    if (!regError && registrations && registrations.length > 0) {
      // Send notifications to all registered participants
      const notificationPromises = registrations.map((reg: any) =>
        supabase.from("push_notifications").insert({
          recipient_email: reg.student_email,
          title: `Event Rescheduled: ${event.title || "Your Event"}`,
          body: `The event has been rescheduled to ${newDate}${newTime ? ` at ${newTime}` : ""}. ${reason ? `Reason: ${reason}` : ""}`,
          event_id: eventId,
          sent_by: session.user.email,
          notification_type: "reschedule",
          action_url: `/events/${eventId}`,
        })
      );

      await Promise.all(notificationPromises);

      // Update reschedule notification_sent flag
      await supabase
        .from("event_reschedules")
        .update({ notification_sent: true })
        .eq("id", reschedule.id);
    }

    return NextResponse.json({
      message: "Event rescheduled successfully",
      reschedule,
      notificationsSent: registrations?.length || 0,
    });
  } catch (error) {
    console.error("Error rescheduling event:", error);
    return NextResponse.json(
      { error: "Failed to reschedule event" },
      { status: 500 }
    );
  }
}

// DELETE: Cancel event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventId = params.eventId;
    const body = await req.json();
    const { cancellationReason, refundProcessing } = body;

    if (!cancellationReason) {
      return NextResponse.json(
        { error: "cancellationReason is required" },
        { status: 400 }
      );
    }

    // Get event to verify organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_email, title")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Only organizer can cancel
    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Insert cancellation record
    const { data: cancellation, error: cancelError } = await supabase
      .from("event_cancellations")
      .insert({
        event_id: eventId,
        cancelled_by: session.user.email,
        cancellation_reason: cancellationReason,
        refund_status: refundProcessing ? "processing" : "pending",
      })
      .select()
      .single();

    if (cancelError) throw cancelError;

    // Update event status to cancelled
    const { error: updateError } = await supabase
      .from("events")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (updateError) throw updateError;

    // Add to changelog
    const { error: changelogError } = await supabase
      .from("event_changelog")
      .insert({
        event_id: eventId,
        status: "cancelled",
        previous_status: "active",
        changed_by: session.user.email,
        reason: cancellationReason,
        details: {
          refundProcessing: refundProcessing || false,
        },
      });

    if (changelogError) throw changelogError;

    // Get all registered participants
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("student_email")
      .eq("event_id", eventId);

    if (!regError && registrations && registrations.length > 0) {
      // Send cancellation notifications to all participants
      const notificationPromises = registrations.map((reg: any) =>
        supabase.from("push_notifications").insert({
          recipient_email: reg.student_email,
          title: `Event Cancelled: ${event.title || "Your Event"}`,
          body: `This event has been cancelled. Reason: ${cancellationReason}${refundProcessing ? " Refunds will be processed within 5-7 business days." : ""}`,
          event_id: eventId,
          sent_by: session.user.email,
          notification_type: "cancellation",
          action_url: `/my-registrations`,
        })
      );

      await Promise.all(notificationPromises);

      // Update cancellation notification_sent flag
      await supabase
        .from("event_cancellations")
        .update({ notification_sent: true })
        .eq("id", cancellation.id);
    }

    return NextResponse.json({
      message: "Event cancelled successfully",
      cancellation,
      notificationsSent: registrations?.length || 0,
    });
  } catch (error) {
    console.error("Error cancelling event:", error);
    return NextResponse.json(
      { error: "Failed to cancel event" },
      { status: 500 }
    );
  }
}
