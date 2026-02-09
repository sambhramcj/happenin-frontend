// frontend/src/app/api/admin/organizers/route.ts
/**
 * GET /api/admin/organizers
 * 
 * Admin endpoint to view all organizer payout setups and KYC status.
 * Can also update KYC status (mark as verified/rejected).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface AdminOrganizerResponse {
  success: boolean;
  organizers?: any[];
  total?: number;
  error?: string;
}

// GET: List all organizers (admin only)
export async function GET(req: NextRequest): Promise<NextResponse<AdminOrganizerResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;

    if (!session?.user?.email || role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const kyc_status = searchParams.get("kyc_status");
    const organizer_type = searchParams.get("organizer_type");

    let query = db.from("organizers").select("*");

    if (kyc_status) {
      query = query.eq("kyc_status", kyc_status);
    }

    if (organizer_type) {
      query = query.eq("organizer_type", organizer_type);
    }

    const { data: organizers, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch organizers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organizers: organizers || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Admin organizers list error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update organizer KYC status (admin only)
export async function PATCH(req: NextRequest): Promise<NextResponse<AdminOrganizerResponse>> {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;

    if (!session?.user?.email || role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { organizer_id, kyc_status, kyc_rejection_reason } = body;

    if (!organizer_id || !kyc_status) {
      return NextResponse.json(
        { success: false, error: "Missing organizer_id or kyc_status" },
        { status: 400 }
      );
    }

    if (!["pending", "verified", "rejected"].includes(kyc_status)) {
      return NextResponse.json(
        { success: false, error: "Invalid kyc_status" },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      kyc_status,
      ...(kyc_status === "verified" && {
        kyc_verified_at: new Date().toISOString(),
      }),
      ...(kyc_status === "rejected" && {
        kyc_rejection_reason: kyc_rejection_reason || null,
      }),
    };

    const { error: updateError } = await db
      .from("organizers")
      .update(updatePayload)
      .eq("id", organizer_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to update organizer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin organizer update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
