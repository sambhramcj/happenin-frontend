import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

type SessionUser = {
  email?: string | null;
  role?: string;
};

export async function PATCH(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.email || user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const price = Number(body.price);

    if (!title || !description || !location || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "Title, description, location and valid price are required" },
        { status: 400 }
      );
    }

    const maxAttendeesRaw = body.max_attendees;
    const maxAttendees =
      maxAttendeesRaw === null || maxAttendeesRaw === undefined || maxAttendeesRaw === ""
        ? null
        : Number(maxAttendeesRaw);

    if (
      maxAttendees !== null &&
      (!Number.isFinite(maxAttendees) || !Number.isInteger(maxAttendees) || maxAttendees <= 0)
    ) {
      return NextResponse.json({ error: "Max attendees must be a positive whole number" }, { status: 400 });
    }

    const startDateTime = typeof body.start_datetime === "string" ? body.start_datetime : null;
    const endDateTime = typeof body.end_datetime === "string" ? body.end_datetime : null;
    const fallbackDate = startDateTime || endDateTime || new Date().toISOString();

    const updatePayload = {
      title,
      description,
      location,
      price,
      max_attendees: maxAttendees,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      date: fallbackDate,
      payment_qr: typeof body.payment_qr === "string" ? body.payment_qr : null,
      poster_url: typeof body.poster_url === "string" ? body.poster_url : null,
      registration_deadline:
        typeof body.registration_deadline === "string"
          ? new Date(body.registration_deadline).toISOString()
          : null,
      time: typeof body.time === "string" ? body.time : null,
      sponsorship_enabled: Boolean(body.sponsorship_enabled),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("events")
      .update(updatePayload)
      .eq("id", eventId)
      .eq("organizer_email", user.email)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch (error) {
    console.error("Organizer event update error:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}
