import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

// GET /api/fests - List all fests
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId");
    const status = searchParams.get("status");

    let query = supabase
      .from("fests")
      .select("*, fest_members(count)")
      .order("start_date", { ascending: false });

    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ fests: data });
  } catch (err) {
    console.error("Error fetching fests:", err);
    return NextResponse.json(
      { error: "Failed to fetch fests" },
      { status: 500 }
    );
  }
}

// POST /api/fests - Create new fest
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, bannerImage, startDate, endDate, location, collegeId } =
      await req.json();

    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create fest
    const { data: fest, error: festError } = await supabase
      .from("fests")
      .insert({
        title,
        description,
        banner_image: bannerImage,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        location,
        college_id: collegeId,
        core_team_leader_email: session.user.email,
        status: "active",
      })
      .select()
      .single();

    if (festError) throw festError;

    // Add creator as leader
    await supabase.from("fest_members").insert({
      fest_id: fest.id,
      member_email: session.user.email,
      role: "leader",
    });

    return NextResponse.json({ fest }, { status: 201 });
  } catch (err) {
    console.error("Error creating fest:", err);
    return NextResponse.json(
      { error: "Failed to create fest" },
      { status: 500 }
    );
  }
}

// PATCH /api/fests/[festId] - Update fest
export async function PATCH(
  req: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { festId, title, description, bannerImage, startDate, endDate, location, status } =
      await req.json();

    if (!festId) {
      return NextResponse.json(
        { error: "Fest ID is required" },
        { status: 400 }
      );
    }

    // Check if user is fest leader
    const { data: fest } = await supabase
      .from("fests")
      .select("core_team_leader_email")
      .eq("id", festId)
      .single();

    if (!fest || fest.core_team_leader_email !== session.user.email) {
      return NextResponse.json(
        { error: "Only fest leader can update" },
        { status: 403 }
      );
    }

    const updateData: any = { updated_at: new Date() };
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (bannerImage) updateData.banner_image = bannerImage;
    if (startDate) updateData.start_date = new Date(startDate);
    if (endDate) updateData.end_date = new Date(endDate);
    if (location) updateData.location = location;
    if (status) updateData.status = status;

    const { data: updated, error } = await supabase
      .from("fests")
      .update(updateData)
      .eq("id", festId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ fest: updated });
  } catch (err) {
    console.error("Error updating fest:", err);
    return NextResponse.json(
      { error: "Failed to update fest" },
      { status: 500 }
    );
  }
}
