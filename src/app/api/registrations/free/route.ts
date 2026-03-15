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

type TeamMember = {
  email: string;
  full_name?: string;
};

export async function POST(req: Request) {
  try {
    const flags = await getServerFeatureFlags();
    if (!flags.REGISTRATION) {
      return NextResponse.json({ error: "Registrations are currently disabled" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;
    const body = (await req.json()) as {
      eventId?: string;
      mode?: "individual" | "team";
      members?: TeamMember[];
      teamSize?: number;
    };

    const eventId = body.eventId;
    const mode = body.mode || "individual";

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const { data: event, error: eventError } = await db
      .from("events")
      .select("id,title,price,max_attendees,date,start_datetime,venue,location")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventPrice = Number(event.price || 0);
    if (!Number.isFinite(eventPrice) || eventPrice > 0) {
      return NextResponse.json(
        { error: "This endpoint only supports free events" },
        { status: 400 }
      );
    }

    const requestedMembers = mode === "team" ? body.members || [] : [];
    const teamEmails = Array.from(
      new Set(
        [studentEmail, ...requestedMembers.map((member) => String(member.email || "").trim().toLowerCase())]
          .filter(Boolean)
      )
    );

    if (mode === "team" && teamEmails.length < 2) {
      return NextResponse.json(
        { error: "Team registration requires at least 2 unique members including team lead" },
        { status: 400 }
      );
    }

    const participants = mode === "team" ? teamEmails : [studentEmail];

    if (event.max_attendees) {
      const { count, error: countError } = await db
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "confirmed", "checked_in"]);

      if (countError) {
        return NextResponse.json(
          { error: "Failed to validate event capacity" },
          { status: 500 }
        );
      }

      if ((count || 0) + participants.length > Number(event.max_attendees)) {
        return NextResponse.json(
          { error: "Not enough remaining capacity for this registration" },
          { status: 409 }
        );
      }
    }

    const createdRegistrations: string[] = [];
    const skippedEmails: string[] = [];

    for (const email of participants) {
      const { data: existingRegistration } = await db
        .from("registrations")
        .select("id")
        .eq("student_email", email)
        .eq("event_id", eventId)
        .in("status", ["pending", "registered", "confirmed", "checked_in"])
        .maybeSingle();

      if (existingRegistration) {
        skippedEmails.push(email);
        continue;
      }

      const { data: registration, error: insertError } = await db
        .from("registrations")
        .insert({
          event_id: eventId,
          student_email: email,
          registration_date: new Date().toISOString(),
          status: "confirmed",
          payment_status: "success",
          final_price: 0,
          organizer_share: 0,
          platform_share: 0,
        })
        .select("id")
        .single();

      if (insertError || !registration) {
        return NextResponse.json(
          { error: insertError?.message || "Failed to create registration" },
          { status: 500 }
        );
      }

      createdRegistrations.push(registration.id);

      const { data: existingTicket } = await db
        .from("tickets")
        .select("id")
        .eq("registration_id", registration.id)
        .maybeSingle();

      if (!existingTicket) {
        await db.from("tickets").insert({
          ticket_id: `TKT-${registration.id.slice(0, 8)}-${Date.now()}`,
          event_id: eventId,
          registration_id: registration.id,
          student_email: email,
          event_title: event.title || "",
          event_date: event.start_datetime || event.date || "",
          event_location: event.venue || event.location || "",
          qr_code_data: `${eventId}:${registration.id}:${Date.now()}`,
          design_template: "modern",
          status: "active",
        });
      }
    }

    if (createdRegistrations.length === 0) {
      return NextResponse.json(
        { error: "All selected participants are already registered", skippedEmails },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      mode,
      eventId,
      registeredCount: createdRegistrations.length,
      skippedEmails,
      registrations: createdRegistrations,
    });
  } catch (error: unknown) {
    console.error("Free registration error:", error);
    const message = error instanceof Error ? error.message : "Failed to register for free event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
