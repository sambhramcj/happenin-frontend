import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { supabase as publicSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/sponsorships
// Organizer/Admin creates a sponsorship (status = pending)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const role = (session?.user as any)?.role as string | undefined;

    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!role || (role !== "organizer" && role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      sponsorId,
      sponsorName,
      sponsorLogoUrl,
      sponsorWebsiteUrl,
      sponsorContactEmail,
      eventId,
      tier,
      amount,
      assets, // optional: [{ asset_type: 'logo'|'banner'|'cta', asset_url, placement }]
    } = body || {};

    if (!eventId || !tier) {
      return NextResponse.json({ error: "eventId and tier are required" }, { status: 400 });
    }

    // 1) Ensure sponsor exists (create if sponsorId not provided)
    let finalSponsorId: string | null = sponsorId || null;

    if (!finalSponsorId) {
      if (!sponsorName) {
        return NextResponse.json({ error: "Either sponsorId or sponsorName is required" }, { status: 400 });
      }

      const { data: sponsor, error: sponsorErr } = await serviceSupabase
        .from("sponsors")
        .insert({
          name: sponsorName,
          logo_url: sponsorLogoUrl || null,
          website_url: sponsorWebsiteUrl || null,
          contact_email: sponsorContactEmail || null,
        })
        .select("id")
        .single();

      if (sponsorErr) {
        console.error("Create sponsor error:", sponsorErr);
        return NextResponse.json({ error: "Failed to create sponsor" }, { status: 500 });
      }

      finalSponsorId = sponsor.id;
    }

    // 2) Create sponsorship (pending)
    const { data: created, error: sErr } = await serviceSupabase
      .from("sponsorships")
      .insert({
        sponsor_id: finalSponsorId,
        event_id: eventId,
        tier,
        amount: amount ?? null,
        status: "pending",
        created_by: email,
      })
      .select("*")
      .single();

    if (sErr) {
      console.error("Create sponsorship error:", sErr);
      return NextResponse.json({ error: "Failed to create sponsorship" }, { status: 500 });
    }

    // 3) Optional: add assets
    if (Array.isArray(assets) && assets.length > 0) {
      const prepared = assets.map((a: any) => ({
        sponsorship_id: created.id,
        asset_type: a.asset_type,
        asset_url: a.asset_url,
        placement: a.placement || null,
      }));

      const { error: aErr } = await serviceSupabase
        .from("sponsorship_assets")
        .insert(prepared);

      if (aErr) {
        console.error("Insert assets error:", aErr);
        // not fatal; continue
      }
    }

    return NextResponse.json({ success: true, sponsorship: created });
  } catch (e) {
    console.error("Sponsorship POST error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// GET /api/sponsorships?eventId=...
// Public endpoint: returns only approved sponsorships with sponsor + assets
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

    // Using anon client with RLS: only approved rows will be returned
    const { data, error } = await publicSupabase
      .from("sponsorships")
      .select("*, sponsors:sponsor_id(*), assets:sponsorship_assets(*)")
      .eq("event_id", eventId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch sponsorships error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ sponsorships: data || [] });
  } catch (e) {
    console.error("Sponsorship GET error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
