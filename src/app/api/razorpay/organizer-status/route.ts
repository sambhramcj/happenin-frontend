// frontend/src/app/api/razorpay/organizer-status/route.ts
/**
 * GET /api/razorpay/organizer-status?organizer_id=uuid
 * 
 * Fetch organizer payout setup status and KYC verification status.
 * Used after onboarding to check if KYC is approved by Razorpay.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { getRazorpaySubMerchantStatus } from "@/lib/razorpay-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface StatusResponse {
  success: boolean;
  organizer?: {
    id: string;
    organizer_type: "CLUB" | "FEST";
    display_name: string;
    legal_name: string;
    kyc_status: "pending" | "verified" | "rejected";
    kyc_rejection_reason?: string;
    razorpay_account_id: string;
    created_at: string;
  };
  error?: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<StatusResponse>> {
  try {
    // 0️⃣ AUTHENTICATION
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email as string | undefined;
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1️⃣ GET organizer_id FROM QUERY PARAMS
    const { searchParams } = new URL(req.url);
    const organizerId = searchParams.get("organizer_id");

    if (!organizerId) {
      // If no organizer_id, try to find the user's organizer (CLUB type)
      if (userRole === "organizer") {
        const { data: clubOrg, error } = await db
          .from("organizers")
          .select("*")
          .eq("organizer_type", "CLUB")
          .eq("user_email", userEmail)
          .single();

        if (error || !clubOrg) {
          return NextResponse.json(
            { success: false, error: "No organizer profile found for this account" },
            { status: 404 }
          );
        }

        return buildSuccessResponse(clubOrg);
      } else {
        return NextResponse.json(
          { success: false, error: "organizer_id is required" },
          { status: 400 }
        );
      }
    }

    // 2️⃣ FETCH ORGANIZER FROM DATABASE
    const { data: organizer, error: fetchError } = await db
      .from("organizers")
      .select("*")
      .eq("id", organizerId)
      .single();

    if (fetchError || !organizer) {
      return NextResponse.json(
        { success: false, error: "Organizer not found" },
        { status: 404 }
      );
    }

    // 3️⃣ AUTHORIZATION CHECK
    // User can view their own organizer profile, or admin can view any
    const isOwner =
      (organizer.organizer_type === "CLUB" && organizer.user_email === userEmail) ||
      (organizer.organizer_type === "FEST" &&
        userRole === "organizer" &&
        (await isUserFestMember(organizer.fest_id, userEmail)));

    if (userRole !== "admin" && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // 4️⃣ SYNC KYC STATUS FROM RAZORPAY (if pending)
    if (organizer.kyc_status === "pending" && organizer.razorpay_account_id) {
      try {
        const { status, kyc_status } = await getRazorpaySubMerchantStatus(
          organizer.razorpay_account_id
        );

        // Map Razorpay status to our KYC status
        let newKycStatus: "pending" | "verified" | "rejected" = "pending";
        if (kyc_status === "verified") {
          newKycStatus = "verified";
        } else if (kyc_status === "rejected") {
          newKycStatus = "rejected";
        }

        // Update in database if status changed
        if (newKycStatus !== organizer.kyc_status) {
          await db
            .from("organizers")
            .update({
              kyc_status: newKycStatus,
              ...(newKycStatus === "verified" && {
                kyc_verified_at: new Date().toISOString(),
              }),
            })
            .eq("id", organizerId);

          organizer.kyc_status = newKycStatus;
        }
      } catch (statusError) {
        // If we can't fetch from Razorpay, continue with cached status
        console.error("Error syncing KYC status from Razorpay:", statusError);
      }
    }

    return buildSuccessResponse(organizer);
  } catch (error) {
    console.error("Organizer status check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Helper: Build success response with organizer data
 */
function buildSuccessResponse(organizer: any): NextResponse<StatusResponse> {
  return NextResponse.json({
    success: true,
    organizer: {
      id: organizer.id,
      organizer_type: organizer.organizer_type,
      display_name: organizer.display_name,
      legal_name: organizer.legal_name,
      kyc_status: organizer.kyc_status,
      kyc_rejection_reason: organizer.kyc_rejection_reason,
      razorpay_account_id: organizer.razorpay_account_id,
      created_at: organizer.created_at,
    },
  });
}

/**
 * Helper: Check if user is a fest member
 */
async function isUserFestMember(
  festId: string,
  userEmail: string
): Promise<boolean> {
  if (!festId) return false;

  const { data: member } = await db
    .from("fest_members")
    .select("id")
    .eq("fest_id", festId)
    .eq("member_email", userEmail)
    .single();

  return !!member;
}
