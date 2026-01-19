import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// POST: Record attendance from QR scan
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    // 1. Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizerEmail = session.user.email as string;

    // 2. Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_email")
      .eq("id", eventId)
      .single();

    if (!event || event.organizer_email !== organizerEmail) {
      return NextResponse.json(
        { error: "Unauthorized - not event organizer" },
        { status: 403 }
      );
    }

    // 3. Get QR code data from request
    const { qrCodeData } = await req.json();
    if (!qrCodeData) {
      return NextResponse.json(
        { error: "Missing QR code data" },
        { status: 400 }
      );
    }

    // 4. Parse QR data (format: eventId:registrationId:timestamp)
    const [scannedEventId, registrationId] = qrCodeData.split(":");
    if (scannedEventId !== eventId) {
      return NextResponse.json(
        { error: "QR code is for different event" },
        { status: 400 }
      );
    }

    // 5. Get registration and student info
    const { data: registration } = await supabase
      .from("registrations")
      .select("id, student_email")
      .eq("id", registrationId)
      .single();

    if (!registration) {
      return NextResponse.json(
        { error: "Invalid registration" },
        { status: 404 }
      );
    }

    // 6. Create attendance record
    const { data: attendance, error: insertError } = await supabase
      .from("attendance")
      .insert({
        event_id: eventId,
        registration_id: registrationId,
        student_email: registration.student_email,
        organizer_email: organizerEmail,
        scanned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Attendance insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record attendance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (err) {
    console.error("POST attendance error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch all attendance records for event
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;

    // 1. Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizerEmail = session.user.email as string;

    // 2. Verify organizer owns this event
    const { data: event } = await supabase
      .from("events")
      .select("id, organizer_email")
      .eq("id", eventId)
      .single();

    if (!event || event.organizer_email !== organizerEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Fetch attendance records
    const { data: attendance, error } = await supabase
      .from("attendance")
      .select(
        `id,
        event_id,
        ticket_id,
        registration_id,
        student_email,
        organizer_email,
        scanned_at`
      )
      .eq("event_id", eventId)
      .order("scanned_at", { ascending: false });

    if (error) {
      console.error("Fetch attendance error:", error);
      return NextResponse.json(
        { error: "Failed to fetch attendance" },
        { status: 500 }
      );
    }

    return NextResponse.json({ attendance: attendance || [] }, { status: 200 });
  } catch (err) {
    console.error("GET attendance error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
