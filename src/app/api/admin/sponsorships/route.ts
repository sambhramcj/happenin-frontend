import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/admin/sponsorships
// Admin-only: list all sponsorship deals with analytics
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = serviceSupabase
    .from("sponsorship_deals")
    .select(`
      id,
      event_id,
      package_id,
      amount_paid,
      platform_fee,
      organizer_amount,
      status,
      created_at,
      sponsor_id,
      events (id, title),
      sponsorship_packages (id, tier),
      sponsors_profile (company_name, email, is_active)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: deals, error } = await query;

  if (error) {
    console.error("Admin sponsorships list error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalRevenue = (deals || []).reduce((sum: number, d: any) => sum + (d.platform_fee || 0), 0);
  const dealsCount = deals?.length || 0;

  return NextResponse.json({ 
    deals: deals || [], 
    analytics: {
      totalRevenue,
      dealsCount,
    }
  });
}

// PATCH /api/admin/sponsorships
// Admin-only: disable/enable sponsors or packages, or update deal status
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, target_type, target_id, value } = body;

  if (!action || !target_type || !target_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (target_type === "sponsor") {
    const { error } = await serviceSupabase
      .from("sponsors_profile")
      .update({ is_active: value ?? true })
      .eq("email", target_id);

    if (error) {
      console.error("Error updating sponsor:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (target_type === "package") {
    const { error } = await serviceSupabase
      .from("sponsorship_packages")
      .update({ is_active: value ?? true })
      .eq("id", target_id);

    if (error) {
      console.error("Error updating package:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (target_type === "deal") {
    const { error } = await serviceSupabase
      .from("sponsorship_deals")
      .update({ status: value || "completed" })
      .eq("id", target_id);

    if (error) {
      console.error("Error updating deal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
