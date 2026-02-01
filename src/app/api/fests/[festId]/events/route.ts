import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

// GET /api/fests/[festId]/events - Get all events in fest
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending, approved, rejected

    let query = supabase
      .from("fest_events")
      .select("*, events(*)")
      .eq("fest_id", festId)
      .order("requested_at", { ascending: false });

    if (status) {
      query = query.eq("approval_status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ events: data });
  } catch (err) {
    console.error("Error fetching fest events:", err);
    return NextResponse.json(
      { error: "Failed to fetch fest events" },
      { status: 500 }
    );
  }
}

// POST /api/fests/[festId]/events - Submit event to fest
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Verify fest exists
    const { data: fest, error: festError } = await supabase
      .from("fests")
      .select("id")
      .eq("id", festId)
      .single();

    if (festError || !fest) {
      return NextResponse.json({ error: "Fest not found" }, { status: 404 });
    }

    // Create fest_event
    const { data: festEvent, error } = await supabase
      .from("fest_events")
      .insert({
        fest_id: festId,
        event_id: eventId,
        submitted_by_email: session.user.email,
        approval_status: "pending",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Event already submitted to this fest" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ festEvent }, { status: 201 });
  } catch (err) {
    console.error("Error submitting event to fest:", err);
    return NextResponse.json(
      { error: "Failed to submit event to fest" },
      { status: 500 }
    );
  }
}

// PATCH /api/fests/[festId]/events/[festEventId]/approve - Approve event
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { festEventId, action, rejectionReason } = await req.json();

    if (!festEventId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
        { error: "Only fest leader can approve events" },
        { status: 403 }
      );
    }

    const updateData: any = {
      approval_status: action, // 'approved' or 'rejected'
      approved_at: new Date(),
      approved_by_email: session.user.email,
    };

    if (action === "rejected") {
      updateData.rejection_reason = rejectionReason || "No reason provided";
    }

    const { data: updated, error } = await supabase
      .from("fest_events")
      .update(updateData)
      .eq("id", festEventId)
      .eq("fest_id", festId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ festEvent: updated });
  } catch (err) {
    console.error("Error approving/rejecting event:", err);
    return NextResponse.json(
      { error: "Failed to update event approval" },
      { status: 500 }
    );
  }
}

// DELETE /api/fests/[festId]/events/[festEventId] - Remove event from fest
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { festEventId } = await req.json();

    if (!festEventId) {
      return NextResponse.json(
        { error: "Fest event ID is required" },
        { status: 400 }
      );
    }

    // Check if user is fest leader or submitted the event
    const { data: fest } = await supabase
      .from("fests")
      .select("core_team_leader_email")
      .eq("id", festId)
      .single();

    const { data: festEvent } = await supabase
      .from("fest_events")
      .select("submitted_by_email")
      .eq("id", festEventId)
      .single();

    if (!fest || !festEvent) {
      return NextResponse.json(
        { error: "Fest or event not found" },
        { status: 404 }
      );
    }

    const canDelete =
      fest.core_team_leader_email === session.user.email ||
      festEvent.submitted_by_email === session.user.email;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this event" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("fest_events")
      .delete()
      .eq("id", festEventId)
      .eq("fest_id", festId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing event from fest:", err);
    return NextResponse.json(
      { error: "Failed to remove event from fest" },
      { status: 500 }
    );
  }
}
