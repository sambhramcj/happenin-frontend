import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.email || role !== "admin") return null;
  return session.user.email;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { eventId } = await context.params;
  if (!eventId) {
    return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
  }

  const body = (await req.json()) as { status?: string };
  const nextStatus = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";

  if (!nextStatus) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  if (!["active", "pending", "hidden", "rejected", "cancelled"].includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid moderation status" }, { status: 400 });
  }

  const db = getDbClient();
  const { data, error } = await db
    .from("events")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, event: data, updatedBy: adminEmail });
}