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
    if (!flags.QR_PAYMENTS) {
      return NextResponse.json({ error: "QR payment registrations are currently disabled" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session?.user?.email || role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;
    const body = (await req.json()) as {
      eventId?: string;
      mode?: "individual" | "team";
      members?: TeamMember[];
      screenshotUrl?: string;
    };

    if (!body.eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const mode = body.mode || "individual";

    const { data: event, error: eventError } = await db
      .from("events")
      .select("id,title,price,max_attendees,payment_qr,registration_deadline")
      .eq("id", body.eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
    }

    const eventPrice = Number(event.price || 0);
    const participants =
      mode === "team"
        ? Array.from(
            new Set(
              [studentEmail, ...(body.members || []).map((member) => String(member.email || "").trim().toLowerCase())]
                .filter(Boolean)
            )
          )
        : [studentEmail];

    if (mode === "team" && participants.length < 2) {
      return NextResponse.json({ error: "Team registration needs at least 2 members" }, { status: 400 });
    }

    if (event.max_attendees) {
      const { count } = await db
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", body.eventId)
        .in("status", ["pending", "approved", "confirmed", "checked_in", "registered"]);

      if ((count || 0) + participants.length > Number(event.max_attendees)) {
        return NextResponse.json({ error: "Not enough remaining capacity" }, { status: 409 });
      }
    }

    if (eventPrice > 0) {
      if (!event.payment_qr) {
        return NextResponse.json(
          { error: "Organizer payment QR is not configured for this event" },
          { status: 400 }
        );
      }
      if (!body.screenshotUrl) {
        return NextResponse.json(
          { error: "Payment screenshot is required for paid events" },
          { status: 400 }
        );
      }
    }

    const createdIds: string[] = [];
    const skippedEmails: string[] = [];
    const targetStatus = eventPrice > 0 ? "pending" : "approved";

    for (const email of participants) {
      const { data: existing } = await db
        .from("registrations")
        .select("id")
        .eq("event_id", body.eventId)
        .eq("student_email", email)
        .in("status", ["pending", "approved", "confirmed", "checked_in", "registered"])
        .maybeSingle();

      if (existing) {
        skippedEmails.push(email);
        continue;
      }

      const { data: inserted, error: insertError } = await db
        .from("registrations")
        .insert({
          event_id: body.eventId,
          student_email: email,
          registration_date: new Date().toISOString(),
          status: targetStatus,
          payment_status: eventPrice > 0 ? "pending_verification" : "success",
          final_price: eventPrice,
          organizer_share: 0,
          platform_share: 0,
          screenshot_url: body.screenshotUrl || null,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        return NextResponse.json(
          { error: insertError?.message || "Failed to create registration" },
          { status: 500 }
        );
      }

      createdIds.push(inserted.id);
    }

    if (createdIds.length === 0) {
      return NextResponse.json(
        { error: "All selected participants are already registered", skippedEmails },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      mode,
      eventId: body.eventId,
      status: targetStatus,
      created: createdIds.length,
      skippedEmails,
      registrations: createdIds,
      message:
        eventPrice > 0
          ? "Registration submitted and pending organizer verification"
          : "Registration approved",
    });
  } catch (error: unknown) {
    console.error("Registration submit error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit registration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
