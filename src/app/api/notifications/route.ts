/**
 * Notifications API
 * Handles fetching, marking as read, and deleting in-app notifications
 * Works for all user roles: Student, Organizer, Admin, Sponsor
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/notifications
 * Fetch all in-app notifications for the logged-in user
 * Query params:
 *  - unread=true: Only fetch unread notifications
 *  - limit=50: Maximum notifications to return (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const searchParams = req.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Fetch in-app notifications (not push notifications)
    let query = supabase
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_email", userEmail)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: (notifications || []).map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        isRead: n.is_read,
        createdAt: n.created_at,
        actionUrl: n.action_url,
        notificationType: n.notification_type,
        iconType: n.icon_type,
        eventId: n.event_id,
        data: n.data,
      })),
      count: notifications?.length || 0,
      unreadOnly,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 * Body: { notificationId?: string } (single) or { notificationIds?: string[] } (bulk)
 * Or just call with notificationId to mark one as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = (await req.json()) as {
      notificationId?: string;
      notificationIds?: string[];
    };

    const ids = body.notificationIds || (body.notificationId ? [body.notificationId] : []);

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing notificationId(s)" },
        { status: 400 }
      );
    }

    // Verify all notifications belong to user
    const { data: notifications, error: fetchError } = await supabase
      .from("in_app_notifications")
      .select("id, recipient_email")
      .in("id", ids);

    if (fetchError || !notifications) {
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    const unauthorizedIds = notifications.filter(
      (n) => n.recipient_email !== userEmail
    );
    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: "Unauthorized to modify some notifications" },
        { status: 403 }
      );
    }

    // Mark as read
    const { error: updateError } = await supabase
      .from("in_app_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (updateError) {
      console.error("Error updating notifications:", updateError);
      return NextResponse.json(
        { error: "Failed to update notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: ids.length,
    });
  } catch (err) {
    console.error("PATCH /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Delete notification(s)
 * Body: { notificationId?: string } (single) or { notificationIds?: string[] } (bulk)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const body = (await req.json()) as {
      notificationId?: string;
      notificationIds?: string[];
    };

    const ids = body.notificationIds || (body.notificationId ? [body.notificationId] : []);

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing notificationId(s)" },
        { status: 400 }
      );
    }

    // Verify all notifications belong to user
    const { data: notifications, error: fetchError } = await supabase
      .from("in_app_notifications")
      .select("id, recipient_email")
      .in("id", ids);

    if (fetchError || !notifications) {
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    const unauthorizedIds = notifications.filter(
      (n) => n.recipient_email !== userEmail
    );
    if (unauthorizedIds.length > 0) {
      return NextResponse.json(
        { error: "Unauthorized to delete some notifications" },
        { status: 403 }
      );
    }

    // Delete notifications
    const { error: deleteError } = await supabase
      .from("in_app_notifications")
      .delete()
      .in("id", ids);

    if (deleteError) {
      console.error("Error deleting notifications:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (err) {
    console.error("DELETE /api/notifications error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
