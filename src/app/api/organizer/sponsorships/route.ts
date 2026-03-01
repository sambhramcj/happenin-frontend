import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SessionUserWithRole = {
  email?: string;
  role?: string;
};

type OrganizerEventRow = {
  id: string;
  fest_id: string | null;
};

type OrganizerSponsorshipRow = {
  id: string;
  event_id: string | null;
  fest_id: string | null;
  sponsor_id: string;
  pack_type: string;
  amount: number;
  payment_status: string;
  visibility_active: boolean;
  admin_approved: boolean;
  created_at: string;
  sponsor_name?: string;
  sponsor_logo_url?: string | null;
  event_title?: string | null;
};

// GET /api/organizer/sponsorships
// Organizer-only: list sponsorships for organizer events (read-only)
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as SessionUserWithRole | undefined)?.role;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "organizer" && role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: events } = await serviceSupabase
    .from("events")
    .select("id, fest_id")
    .eq("organizer_email", email);

  const typedEvents = (events || []) as OrganizerEventRow[];
  const eventIds = typedEvents.map((event) => event.id);
  const festIds = Array.from(new Set(typedEvents.map((event) => event.fest_id).filter((id): id is string => Boolean(id))));
  if (eventIds.length === 0 && festIds.length === 0) {
    return NextResponse.json({ sponsorships: [] });
  }

  let query = serviceSupabase
    .from("digital_visibility_packs")
    .select(`
      id,
      event_id,
      fest_id,
      sponsor_id,
      pack_type,
      amount,
      payment_status,
      visibility_active,
      admin_approved,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (eventIds.length && festIds.length) {
    query = query.or(`event_id.in.(${eventIds.join(",")}),fest_id.in.(${festIds.join(",")})`);
  } else if (eventIds.length) {
    query = query.in("event_id", eventIds);
  } else {
    query = query.in("fest_id", festIds as string[]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Organizer sponsorships list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  const sponsorshipsRaw = (data || []) as OrganizerSponsorshipRow[];
  const sponsorIds = Array.from(new Set(sponsorshipsRaw.map((row) => row.sponsor_id).filter(Boolean)));
  const sponsorshipEventIds = Array.from(
    new Set(sponsorshipsRaw.map((row) => row.event_id).filter((id): id is string => Boolean(id)))
  );

  const { data: sponsorProfiles } = sponsorIds.length
    ? await serviceSupabase
        .from("sponsors_profile")
        .select("email, company_name, logo_url")
        .in("email", sponsorIds)
    : { data: [] };

  const { data: sponsorshipEvents } = sponsorshipEventIds.length
    ? await serviceSupabase
        .from("events")
        .select("id, title")
        .in("id", sponsorshipEventIds)
    : { data: [] };

  const sponsorMap = new Map(
    ((sponsorProfiles || []) as Array<{ email: string; company_name?: string; logo_url?: string | null }>).map(
      (profile) => [profile.email, profile]
    )
  );
  const eventMap = new Map(
    ((sponsorshipEvents || []) as Array<{ id: string; title?: string }>).map((event) => [event.id, event])
  );

  const sponsorships = sponsorshipsRaw.map((row) => ({
    ...row,
    sponsor_email: row.sponsor_id,
    sponsor_name: sponsorMap.get(row.sponsor_id)?.company_name || null,
    sponsor_logo_url: sponsorMap.get(row.sponsor_id)?.logo_url || null,
    event_title: row.event_id ? eventMap.get(row.event_id)?.title || null : null,
  }));

  return NextResponse.json({ sponsorships });
}
