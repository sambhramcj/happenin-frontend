import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_email", session.user.email)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Return defaults if no preferences found
    if (!data) {
      return NextResponse.json({
        push_enabled: true,
        push_payment: true,
        push_reminders: true,
        push_updates: true,
        push_milestone_registrations: true,
        push_sponsorships: true,
        push_admin_alerts: false,
        in_app_enabled: true,
        in_app_history: true,
        quiet_hours_enabled: false,
        fest_mode_enabled: true,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Ensure user_email cannot be changed
    body.user_email = session.user.email;
    body.user_role = (session.user as any).role || "student";
    body.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert(body, { onConflict: "user_email" })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
