import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "sponsor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: banners, error } = await serviceSupabase
    .from("banners")
    .select("id")
    .eq("sponsor_email", email);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
  }

  const bannerIds = (banners || []).map((b: any) => b.id);
  if (bannerIds.length === 0) {
    return NextResponse.json({ totalClicks: 0, totalImpressions: 0 });
  }

  const { data: analytics, error: analyticsError } = await serviceSupabase
    .from("banner_analytics")
    .select("event_type")
    .in("banner_id", bannerIds);

  if (analyticsError) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }

  const totals = (analytics || []).reduce(
    (acc: { totalClicks: number; totalImpressions: number }, row: any) => {
      if (row.event_type === "click") acc.totalClicks += 1;
      if (row.event_type === "view") acc.totalImpressions += 1;
      return acc;
    },
    { totalClicks: 0, totalImpressions: 0 }
  );

  return NextResponse.json(totals);
}
