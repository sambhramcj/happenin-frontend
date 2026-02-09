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
    .from("sponsorship_orders")
    .select(`
      id,
      sponsor_email,
      event_id,
      fest_id,
      pack_type,
      amount,
      status,
      visibility_active,
      organizer_payout_settled,
      organizer_payout_settled_at,
      created_at,
      events (id, title, fest_id),
      fests (id, title, start_date, end_date),
      sponsors_profile (company_name, email, website_url, is_active)
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

  // Calculate total revenue from paid sponsorships
  const totalRevenue = (deals || []).reduce((sum: number, d: any) => {
    if (d.status !== "paid") return sum;
    return sum + (d.amount || 0);
  }, 0);
  const dealsCount = deals?.length || 0;

  const sponsorEmails = Array.from(
    new Set((deals || []).map((d: any) => d.sponsor_email).filter(Boolean))
  );

  let analyticsBySponsor: Record<string, { clicks: number; impressions: number }> = {};
  if (sponsorEmails.length > 0) {
    const { data: banners } = await serviceSupabase
      .from("banners")
      .select("id, sponsor_email")
      .in("sponsor_email", sponsorEmails);

    const bannerIds = (banners || []).map((b: any) => b.id);
    if (bannerIds.length > 0) {
      const { data: analyticsRows } = await serviceSupabase
        .from("banner_analytics")
        .select("banner_id, event_type")
        .in("banner_id", bannerIds);

      const bannerToSponsor = (banners || []).reduce((acc: Record<string, string>, b: any) => {
        acc[b.id] = b.sponsor_email;
        return acc;
      }, {} as Record<string, string>);

      analyticsBySponsor = (analyticsRows || []).reduce(
        (acc: Record<string, { clicks: number; impressions: number }>, row: any) => {
          const sponsorEmail = bannerToSponsor[row.banner_id];
          if (!sponsorEmail) return acc;
          if (!acc[sponsorEmail]) acc[sponsorEmail] = { clicks: 0, impressions: 0 };
          if (row.event_type === "click") acc[sponsorEmail].clicks += 1;
          if (row.event_type === "view") acc[sponsorEmail].impressions += 1;
          return acc;
        },
        {} as Record<string, { clicks: number; impressions: number }>
      );
    }
  }

  const enrichedDeals = (deals || []).map((deal: any) => ({
    ...deal,
    sponsor_analytics: analyticsBySponsor[deal.sponsor_email] || { clicks: 0, impressions: 0 },
  }));

  return NextResponse.json({
    deals: enrichedDeals,
    analytics: {
      totalRevenue,
      dealsCount,
    },
  });
}

// PATCH /api/admin/sponsorships
// Admin-only: disable/enable sponsors or packages, update deal status, or mark facilitation fee as paid
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, target_type, target_id, value, deal_id } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing action field" }, { status: 400 });
  }

  // For sponsorship_orders, automatically verified when payment is completed.
  // This action now toggles visibility for already-paid orders.
  if (action === "verify_payment") {
    if (!deal_id) {
      return NextResponse.json({ error: "Missing deal_id" }, { status: 400 });
    }

    // For new sponsorship_orders, status='paid' is automatic from Razorpay verification.
    // Admin can toggle visibility_active instead.
    const { error } = await serviceSupabase
      .from("sponsorship_orders")
      .update({
        visibility_active: true,
      })
      .eq("id", deal_id);

    if (error) {
      console.error("Error updating sponsorship visibility:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Reject/disable a paid sponsorship order
  if (action === "reject_payment") {
    if (!deal_id) {
      return NextResponse.json({ error: "Missing deal_id" }, { status: 400 });
    }

    const { error } = await serviceSupabase
      .from("sponsorship_orders")
      .update({
        visibility_active: false,
      })
      .eq("id", deal_id);

    if (error) {
      console.error("Error disabling sponsorship:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Toggle visibility for sponsorship orders
  if (action === "toggle_visibility") {
    if (!deal_id || typeof value !== "boolean") {
      return NextResponse.json({ error: "Missing deal_id or value" }, { status: 400 });
    }

    const { error } = await serviceSupabase
      .from("sponsorship_orders")
      .update({ visibility_active: value })
      .eq("id", deal_id);

    if (error) {
      console.error("Error toggling visibility:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Toggle organizer payout settlement status
  if (action === "toggle_payout_settled") {
    if (!deal_id || typeof value !== "boolean") {
      return NextResponse.json({ error: "Missing deal_id or value" }, { status: 400 });
    }

    const { error } = await serviceSupabase
      .from("sponsorship_orders")
      .update({
        organizer_payout_settled: value,
        organizer_payout_settled_at: value ? new Date().toISOString() : null,
      })
      .eq("id", deal_id);

    if (error) {
      console.error("Error updating payout status:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (!target_type || !target_id) {
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
  } else if (target_type === "order") {
    // Update sponsorship order visibility
    const { error } = await serviceSupabase
      .from("sponsorship_orders")
      .update({ visibility_active: value ?? true })
      .eq("id", target_id);

    if (error) {
      console.error("Error updating order:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
