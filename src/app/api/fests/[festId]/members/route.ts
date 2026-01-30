import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

// GET /api/fests/[festId]/members - List fest members
export async function GET(
  req: NextRequest,
  { params }: { params: { festId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("fest_members")
      .select("*")
      .eq("fest_id", params.festId)
      .order("role", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ members: data });
  } catch (err) {
    console.error("Error fetching fest members:", err);
    return NextResponse.json(
      { error: "Failed to fetch fest members" },
      { status: 500 }
    );
  }
}

// POST /api/fests/[festId]/members - Add member to fest
export async function POST(
  req: NextRequest,
  { params }: { params: { festId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberEmail, role = "member" } = await req.json();

    if (!memberEmail) {
      return NextResponse.json(
        { error: "Member email is required" },
        { status: 400 }
      );
    }

    // Check if user is fest leader
    const { data: fest } = await supabase
      .from("fests")
      .select("core_team_leader_email")
      .eq("id", params.festId)
      .single();

    if (!fest || fest.core_team_leader_email !== session.user.email) {
      return NextResponse.json(
        { error: "Only fest leader can add members" },
        { status: 403 }
      );
    }

    const { data: member, error } = await supabase
      .from("fest_members")
      .insert({
        fest_id: params.festId,
        member_email: memberEmail,
        role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Member already in fest" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error("Error adding fest member:", err);
    return NextResponse.json(
      { error: "Failed to add fest member" },
      { status: 500 }
    );
  }
}

// DELETE /api/fests/[festId]/members/[memberEmail] - Remove member from fest
export async function DELETE(
  req: NextRequest,
  { params }: { params: { festId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberEmail } = await req.json();

    if (!memberEmail) {
      return NextResponse.json(
        { error: "Member email is required" },
        { status: 400 }
      );
    }

    // Check if user is fest leader
    const { data: fest } = await supabase
      .from("fests")
      .select("core_team_leader_email")
      .eq("id", params.festId)
      .single();

    if (!fest || fest.core_team_leader_email !== session.user.email) {
      return NextResponse.json(
        { error: "Only fest leader can remove members" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("fest_members")
      .delete()
      .eq("fest_id", params.festId)
      .eq("member_email", memberEmail);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing fest member:", err);
    return NextResponse.json(
      { error: "Failed to remove fest member" },
      { status: 500 }
    );
  }
}
