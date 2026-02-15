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

  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Date range required" }, { status: 400 });
  }

  try {
    // Fetch sponsor's orders within date range
    const { data: orders, error: ordersError } = await serviceSupabase
      .from("sponsorship_orders")
      .select(`
        id,
        amount,
        status,
        pack_type,
        created_at,
        event_id,
        fest_id,
        events(title, date, location),
        fests(title, start_date, end_date)
      `)
      .eq("sponsor_email", email)
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch banner analytics for the sponsor's banners
    const { data: banners, error: bannersError } = await serviceSupabase
      .from("banners")
      .select("id")
      .eq("sponsor_email", email);

    if (bannersError) throw bannersError;

    const bannerIds = (banners || []).map((b: any) => b.id);

    let analytics: any[] = [];
    if (bannerIds.length > 0) {
      const { data: analyticsData, error: analyticsError } = await serviceSupabase
        .from("banner_analytics")
        .select("banner_id, event_type, created_at")
        .in("banner_id", bannerIds)
        .gte("created_at", from)
        .lte("created_at", to);

      if (analyticsError) throw analyticsError;
      analytics = analyticsData || [];
    }

    // Generate report data
    const reportData = {
      dateRange: { from, to },
      summary: {
        totalOrders: orders?.length || 0,
        totalSpent: orders?.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0) || 0,
        totalImpressions: analytics.filter(a => a.event_type === 'view').length,
        totalClicks: analytics.filter(a => a.event_type === 'click').length,
      },
      orders: orders || [],
      analytics: analytics,
    };

    // For now, return JSON. In a production app, you'd generate PDF/CSV here.
    // You can use libraries like pdfkit or csv-writer to generate files.
    return NextResponse.json(reportData);

  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
