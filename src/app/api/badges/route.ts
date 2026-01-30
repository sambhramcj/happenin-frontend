import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's badges
    const { data, error } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at, achievement_badges(*)")
      .eq("user_email", session.user.email)
      .order("earned_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      data.map((ub: any) => ({
        id: ub.badge_id,
        name: ub.achievement_badges?.[0]?.badge_name,
        description: ub.achievement_badges?.[0]?.description,
        iconUrl: ub.achievement_badges?.[0]?.icon_url,
        earnedAt: ub.earned_at,
      }))
    );
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

// Function to award badge (called internally)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { badgeId } = body;

    // Check if user already has this badge
    const { data: existing } = await supabase
      .from("user_badges")
      .select("id")
      .eq("user_email", session.user.email)
      .eq("badge_id", badgeId)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "Badge already earned" },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from("user_badges")
      .insert({
        user_email: session.user.email,
        badge_id: badgeId,
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error awarding badge:", error);
    return NextResponse.json(
      { error: "Failed to award badge" },
      { status: 500 }
    );
  }
}
