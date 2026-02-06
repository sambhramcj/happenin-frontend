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

    let query = supabase.from("banners").select("*", { count: "exact" });

    if (type) query = query.eq("type", type);
    if (placement) query = query.eq("placement", placement);
    if (status) query = query.eq("status", status);

    // Only show approved, active banners to public OR pending banners to creator/admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      // Show only approved active banners to non-authenticated users
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

    return NextResponse.json({
      banners: data || [],
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
      sponsorEmail,
      imageUrl,
      placement,
      linkType,
      linkTargetId,
      startDate,
      endDate,
    } = body;

    // Validate required fields
    if (!title || !type || !imageUrl || !placement || !linkType || !linkTargetId) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Verify sponsor owns the sponsorship
    if (type === "sponsor" && sponsorEmail) {
      if (sponsorEmail !== session.user.email) {
        return NextResponse.json(
          { error: "Not authorized to create banner for this sponsor" },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabase
      .from("banners")
      .insert({
        title,
        type,
        event_id: eventId,
        sponsor_email: sponsorEmail,
        image_url: imageUrl,
        placement,
        link_type: linkType,
        link_target_id: linkTargetId,
        start_date: startDate,
        end_date: endDate,
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
