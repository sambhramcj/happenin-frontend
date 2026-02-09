import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const placement = searchParams.get("placement");
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("banners")
      .select(
        `
        *,
        events (id, title),
        fests (id, title),
        sponsorship_deals (id, visibility_active, payment_status)
      `,
        { count: "exact" }
      );

    if (type) query = query.eq("type", type);
    if (placement) query = query.eq("placement", placement);
    if (status) query = query.eq("status", status);

    // Only show approved, active banners to public OR pending banners to creator/admin
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;
    if (!session?.user?.email || role !== "admin") {
      query = query
        .eq("status", "approved")
        .lte("start_date", "now()")
        .gte("end_date", "now()");
    }

    const { data, error, count } = await query
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    let banners = data || [];
    if (!session?.user?.email || (session?.user as any)?.role !== "admin") {
      banners = banners.filter((banner: any) => {
        if (banner.type !== "sponsor") return true;
        return banner.sponsorship_deals?.visibility_active && banner.sponsorship_deals?.payment_status === "verified";
      });
    }

    return NextResponse.json({
      banners,
      total: count || 0,
    });
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      type,
      eventId,
      festId,
      sponsorEmail,
      sponsorshipDealId,
      imageUrl,
      placement,
      linkType,
      linkTargetId,
      linkUrl,
      startDate,
      endDate,
    } = body;

    // Validate required fields
    if (!title || !type || !imageUrl || !placement || !linkType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (linkType === "internal_event" && !linkTargetId) {
      return NextResponse.json(
        { error: "Missing link target for internal event banner" },
        { status: 400 }
      );
    }

    if (linkType === "external_url" && !linkUrl) {
      return NextResponse.json(
        { error: "Missing link URL for external banner" },
        { status: 400 }
      );
    }

    // Validate banner type and permissions
    if (type === "event" && !eventId) {
      return NextResponse.json(
        { error: "Event ID required for event banners" },
        { status: 400 }
      );
    }

    if (type === "sponsor" && !sponsorEmail) {
      return NextResponse.json(
        { error: "Sponsor email required for sponsor banners" },
        { status: 400 }
      );
    }

    // Verify organizer owns the event
    if (type === "event" && eventId) {
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id, organizer_email")
        .eq("id", eventId)
        .single();

      if (eventError || event?.organizer_email !== session.user.email) {
        return NextResponse.json(
          { error: "Not authorized to create banner for this event" },
          { status: 403 }
        );
      }
    }

    // Verify sponsor owns the sponsorship and link to a deal
    if (type === "sponsor" && sponsorEmail) {
      if (sponsorEmail !== session.user.email) {
        return NextResponse.json(
          { error: "Not authorized to create banner for this sponsor" },
          { status: 403 }
        );
      }

      if (!sponsorshipDealId) {
        return NextResponse.json(
          { error: "Sponsorship deal is required for sponsor banners" },
          { status: 400 }
        );
      }

      const { data: deal, error: dealError } = await supabase
        .from("sponsorship_deals")
        .select("id, sponsor_email, event_id, fest_id, sponsorship_packages (type, scope)")
        .eq("id", sponsorshipDealId)
        .single();

      if (dealError || !deal || deal.sponsor_email !== sponsorEmail) {
        return NextResponse.json(
          { error: "Invalid sponsorship deal" },
          { status: 403 }
        );
      }

      const packType = (deal as any).sponsorship_packages?.type;
      if (deal.event_id && eventId && deal.event_id !== eventId) {
        return NextResponse.json(
          { error: "Event does not match sponsorship deal" },
          { status: 400 }
        );
      }

      if (deal.fest_id && festId && deal.fest_id !== festId) {
        return NextResponse.json(
          { error: "Fest does not match sponsorship deal" },
          { status: 400 }
        );
      }

      if (placement === "event_page" && !eventId) {
        return NextResponse.json(
          { error: "Event ID required for event page banner" },
          { status: 400 }
        );
      }

      if ((placement === "home_top" || placement === "home_mid") && !festId) {
        return NextResponse.json(
          { error: "Fest ID required for homepage banner" },
          { status: 400 }
        );
      }

      const allowedPlacements = new Set<string>();

      if (packType === "digital") {
        allowedPlacements.add("event_page");
      }

      if (packType === "app") {
        allowedPlacements.add("event_page");
        allowedPlacements.add("home_top");
      }

      if (packType === "fest") {
        allowedPlacements.add("home_top");
        allowedPlacements.add("home_mid");
      }

      if (!allowedPlacements.has(placement)) {
        return NextResponse.json(
          { error: "Banner placement not allowed for this pack" },
          { status: 400 }
        );
      }
    }

    let bannerStartDate = startDate;
    let bannerEndDate = endDate;

    if (type === "sponsor" && festId && (placement === "home_top" || placement === "home_mid")) {
      const { data: fest } = await supabase
        .from("fests")
        .select("start_date, end_date")
        .eq("id", festId)
        .single();

      if (fest?.start_date) bannerStartDate = fest.start_date;
      if (fest?.end_date) bannerEndDate = fest.end_date;
    }

    const { data, error } = await supabase
      .from("banners")
      .insert({
        title,
        type,
        event_id: eventId,
        fest_id: festId,
        sponsor_email: sponsorEmail,
        sponsorship_deal_id: sponsorshipDealId,
        image_url: imageUrl,
        placement,
        link_type: linkType,
        link_target_id: linkTargetId,
        link_url: linkUrl,
        start_date: bannerStartDate,
        end_date: bannerEndDate,
        created_by: session.user.email,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create banner:", error);
    return NextResponse.json(
      { error: "Failed to create banner" },
      { status: 500 }
    );
  }
}
