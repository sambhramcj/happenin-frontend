import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ clubs: ["IEEE", "ACM", "Rotaract"] });
    }

    const adminDb = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const [{ data: memberships }, { data: discountClubs }] = await Promise.all([
      adminDb.from("memberships").select("club"),
      adminDb.from("events").select("discount_club").not("discount_club", "is", null),
    ]);

    const clubSet = new Set<string>();
    for (const row of memberships || []) {
      const club = String((row as any)?.club || "").trim();
      if (club) clubSet.add(club);
    }
    for (const row of discountClubs || []) {
      const club = String((row as any)?.discount_club || "").trim();
      if (club) clubSet.add(club);
    }

    const clubs = Array.from(clubSet).sort((a, b) => a.localeCompare(b));
    if (clubs.length === 0) {
      clubs.push("IEEE", "ACM", "Rotaract");
    }

    return NextResponse.json({ clubs });
  } catch (error: any) {
    console.error("GET /api/clubs error:", error);
    return NextResponse.json({ clubs: ["IEEE", "ACM", "Rotaract"] });
  }
}