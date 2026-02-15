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

  // Fetch orders for event-wise analytics
  const { data: orders, error: ordersError } = await serviceSupabase
    .from("sponsorship_orders")
    .select(`
      id,
      amount,
      pack_type,
      event_id,
      fest_id,
      events(title),
      fests(title)
    `)
    .eq("sponsor_email", email)
    .eq("status", "paid");

  let eventAnalytics: any[] = [];
  if (orders && orders.length > 0) {
    // Group analytics by event/fest
    for (const order of orders) {
      const eventName = 
        (Array.isArray(order.events) ? order.events[0]?.title : (order.events as any)?.title) ||
        (Array.isArray(order.fests) ? order.fests[0]?.title : (order.fests as any)?.title) ||
        "Unknown Event";
      
      // Get banners for this order
      const { data: orderBanners } = await serviceSupabase
        .from("banners")
        .select("id")
        .eq("sponsor_email", email)
        .eq(order.event_id ? "event_id" : "fest_id", order.event_id || order.fest_id);

      const orderBannerIds = (orderBanners || []).map((b: any) => b.id);
      
      let eventClicks = 0;
      let eventImpressions = 0;
      
      if (orderBannerIds.length > 0) {
        const { data: eventAnalyticsData } = await serviceSupabase
          .from("banner_analytics")
          .select("event_type")
          .in("banner_id", orderBannerIds);

        eventClicks = (eventAnalyticsData || []).filter((a: any) => a.event_type === "click").length;
        eventImpressions = (eventAnalyticsData || []).filter((a: any) => a.event_type === "view").length;
      }

      eventAnalytics.push({
        eventName,
        packType: order.pack_type,
        amount: order.amount,
        impressions: eventImpressions,
        clicks: eventClicks,
      });
    }
  }

  // Generate performance data (last 7 days)
  const performanceData = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    performanceData.push({
      date: dateStr,
      impressions: 0, // TODO: Group analytics by date
      clicks: 0,
    });
  }

  return NextResponse.json({
    totalClicks: totals.totalClicks,
    totalImpressions: totals.totalImpressions,
    performanceData,
    eventAnalytics,
  });
}
