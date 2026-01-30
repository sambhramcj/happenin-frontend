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

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || "50";

    const { data, error } = await supabase
      .from("event_history")
      .select("*")
      .eq("user_email", session.user.email)
      .order("viewed_at", { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching event history:", error);
    return NextResponse.json(
      { error: "Failed to fetch event history" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { eventId, eventTitle, eventDate, actionType } = body;

    // Check if history entry exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from("event_history")
      .select("id")
      .eq("user_email", session.user.email)
      .eq("event_id", eventId)
      .gte("viewed_at", today.toISOString())
      .single();

    if (existing) {
      // Update existing entry
      const { data, error } = await supabase
        .from("event_history")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select();

      if (error) throw error;
      return NextResponse.json(data[0]);
    }

    // Create new history entry
    const { data, error } = await supabase
      .from("event_history")
      .insert({
        user_email: session.user.email,
        event_id: eventId,
        event_title: eventTitle,
        event_date: eventDate,
        action_type: actionType || "view",
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating event history:", error);
    return NextResponse.json(
      { error: "Failed to record event history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("event_history")
      .delete()
      .eq("user_email", session.user.email);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing event history:", error);
    return NextResponse.json(
      { error: "Failed to clear event history" },
      { status: 500 }
    );
  }
}
