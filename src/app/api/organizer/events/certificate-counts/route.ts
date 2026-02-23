import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SessionUser = {
  email?: string | null;
  role?: string;
};

type EventIdRow = {
  id: string;
};

type CertificateEventRow = {
  event_id: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.email || user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizerEmail = user.email;
    const { searchParams } = new URL(req.url);
    const eventIdsParam = searchParams.get("eventIds") || "";
    const eventIds = eventIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (eventIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    const { data: events, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_email", organizerEmail)
      .in("id", eventIds);

    if (eventError) {
      return NextResponse.json({ error: eventError.message }, { status: 500 });
    }

    const allowedEventIds = ((events || []) as EventIdRow[]).map((event) => event.id);
    if (allowedEventIds.length === 0) {
      return NextResponse.json({ counts: {} });
    }

    const { data: certs, error: certError } = await supabase
      .from("student_certificates")
      .select("event_id")
      .in("event_id", allowedEventIds);

    if (certError) {
      return NextResponse.json({ counts: {} });
    }

    const counts: Record<string, number> = {};
    for (const eventId of allowedEventIds) {
      counts[eventId] = 0;
    }

    for (const cert of (certs || []) as CertificateEventRow[]) {
      const eventId = cert?.event_id;
      if (!eventId) continue;
      counts[eventId] = (counts[eventId] || 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (error: unknown) {
    console.error("Error fetching certificate counts:", error);
    return NextResponse.json({ counts: {} });
  }
}
