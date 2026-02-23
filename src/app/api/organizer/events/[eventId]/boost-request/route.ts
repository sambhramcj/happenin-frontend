import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

type SessionUser = {
  email?: string | null;
  role?: string;
};

export async function POST(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.email || user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await context.params;
    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const body = await req.json();
    const durationDays = Number(body.durationDays || 7);

    if (!Number.isFinite(durationDays) || durationDays <= 0 || durationDays > 60) {
      return NextResponse.json({ error: "Duration must be between 1 and 60 days" }, { status: 400 });
    }

    const boostEndDate = new Date();
    boostEndDate.setDate(boostEndDate.getDate() + durationDays);

    const { data, error } = await supabase
      .from("events")
      .update({
        boost_payment_status: "pending",
        boost_visibility: false,
        boost_priority: 1,
        boost_end_date: boostEndDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId)
      .eq("organizer_email", user.email)
      .select("id, title, boost_payment_status, boost_visibility, boost_end_date")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: "Boost request submitted. Complete payment with Happenin support for activation.",
    });
  } catch (error) {
    console.error("Boost request error:", error);
    return NextResponse.json({ error: "Failed to submit boost request" }, { status: 500 });
  }
}
