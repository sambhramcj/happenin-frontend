import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organizer/sponsorships
// Organizer-only: list sponsorships for organizer events (read-only)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "organizer" && role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: events } = await serviceSupabase
    .from("events")
    .select("id")
    .eq("organizer_email", email);

  const eventIds = (events || []).map((e: any) => e.id);
  if (eventIds.length === 0) {
    return NextResponse.json({ sponsorships: [] });
  }

  const { data, error } = await serviceSupabase
    .from("sponsorship_deals")
    .select(`
      id,
      event_id,
      fest_id,
      payment_status,
      visibility_active,
      created_at,
      sponsor_email,
      sponsorship_packages (type, price, scope),
      sponsors_profile (company_name, logo_url),
      events (id, title)
    `)
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Organizer sponsorships list error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ sponsorships: data || [] });
}
