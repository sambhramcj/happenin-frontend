import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { getServerFeatureFlags } from "@/lib/serverFeatureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(
  _request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const flags = await getServerFeatureFlags();
    if (!flags.CERTIFICATES) {
      return NextResponse.json({ error: "Certificate feature is currently disabled" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session?.user?.email || role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;

    const { data: event, error: eventError } = await db
      .from("events")
      .select("id,title,organizer_email,date,end_datetime")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const eventEnd = new Date(event.end_datetime || event.date || 0);
    if (Number.isNaN(eventEnd.getTime()) || eventEnd > new Date()) {
      return NextResponse.json(
        { error: "Certificates can be sent only after the event has ended" },
        { status: 400 }
      );
    }

    const { data: attendanceRows, error: attendanceError } = await db
      .from("attendance")
      .select("student_email")
      .eq("event_id", eventId);

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 500 });
    }

    const attendedEmails = Array.from(
      new Set((attendanceRows || []).map((row) => String(row.student_email || "").trim().toLowerCase()).filter(Boolean))
    );

    if (attendedEmails.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        skipped: 0,
        message: "No attended participants found",
      });
    }

    const { data: existingCertificates } = await db
      .from("student_certificates")
      .select("student_email")
      .eq("event_id", eventId)
      .eq("recipient_type", "participant");

    const alreadyIssued = new Set(
      (existingCertificates || [])
        .map((row) => String(row.student_email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const rowsToInsert = attendedEmails
      .filter((email) => !alreadyIssued.has(email))
      .map((email) => ({
        student_email: email,
        certificate_url: `https://happenin.app/certificates/${eventId}/${encodeURIComponent(email)}`,
        event_name: event.title || "Event",
        event_id: eventId,
        certificate_type: "participant",
        certificate_title: "Certificate of Participation",
        issued_by: session.user.email,
        recipient_type: "participant",
        sent_date: new Date().toISOString(),
      }));

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await db.from("student_certificates").insert(rowsToInsert);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      sent: rowsToInsert.length,
      skipped: attendedEmails.length - rowsToInsert.length,
      totalAttended: attendedEmails.length,
    });
  } catch (error: unknown) {
    console.error("Participant certificate send error:", error);
    const message = error instanceof Error ? error.message : "Failed to send certificates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
