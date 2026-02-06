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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type");

    let query = supabase
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_email", session.user.email)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("notification_type", type);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("in_app_notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_email", session.user.email)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: data || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error("Error fetching in-app notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      body: notificationBody,
      actionUrl,
      notificationType = "general",
      eventId,
      iconType,
      data,
      expiresAt,
    } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from("in_app_notifications")
      .insert({
        recipient_email: session.user.email,
        recipient_role: (session.user as any).role || "student",
        title,
        body: notificationBody,
        action_url: actionUrl,
        notification_type: notificationType,
        event_id: eventId,
        icon_type: iconType,
        data: data || {},
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Error creating in-app notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}
