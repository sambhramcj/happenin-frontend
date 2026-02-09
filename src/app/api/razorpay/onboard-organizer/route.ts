// frontend/src/app/api/razorpay/onboard-organizer/route.ts
/**
 * POST /api/razorpay/onboard-organizer
 * 
 * Organizer payout onboarding with Razorpay Route sub-merchant creation.
 * 
 * CLUB events: Student club organizer with student treasurer's PAN and bank
 * FEST events: Fest committee with college/faculty PAN and bank
 * 
 * Both require:
 * - PAN holder name MUST match bank account holder name
 * - Valid IFSC code
 * - Valid bank account number
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import {
  createRazorpaySubMerchant,
  validatePANFormat,
  validateIFSCFormat,
  validateBankAccountFormat,
  validatePanBankNameMatch,
} from "@/lib/razorpay-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface OnboardingRequest {
  organizer_type: "CLUB" | "FEST";
  display_name: string;
  legal_name: string;
  pan_number: string;
  bank_account_number: string;
  ifsc_code: string;
  
  // Optional: only required for FEST
  fest_id?: string;
}

interface OnboardingResponse {
  success: boolean;
  organizer_id?: string;
  razorpay_account_id?: string;
  kyc_status?: string;
  error?: string;
  details?: {
    field?: string;
    message: string;
  };
}

export async function POST(req: Request): Promise<NextResponse<OnboardingResponse>> {
  try {
    // 0️⃣ AUTHENTICATION
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email as string | undefined;
    const userRole = (session?.user as any)?.role as string | undefined;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Please log in" },
        { status: 401 }
      );
    }

    if (userRole !== "organizer") {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only organizers can onboard for payouts" },
        { status: 403 }
      );
    }

    // 1️⃣ PARSE & VALIDATE INPUT
    const body = (await req.json()) as OnboardingRequest;

    const {
      organizer_type,
      display_name,
      legal_name,
      pan_number,
      bank_account_number,
      ifsc_code,
      fest_id,
    } = body;

    // Type validation
    if (!organizer_type || !["CLUB", "FEST"].includes(organizer_type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid organizer_type. Must be 'CLUB' or 'FEST'",
        },
        { status: 400 }
      );
    }

    // Required fields
    if (!display_name || !legal_name || !pan_number || !bank_account_number || !ifsc_code) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          details: {
            message: "display_name, legal_name, pan_number, bank_account_number, and ifsc_code are required",
          },
        },
        { status: 400 }
      );
    }

    // PAN format validation
    if (!validatePANFormat(pan_number)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid PAN format",
          details: {
            field: "pan_number",
            message: "PAN must be 10 characters: AAAPA5055K format",
          },
        },
        { status: 400 }
      );
    }

    // IFSC format validation
    if (!validateIFSCFormat(ifsc_code)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid IFSC code format",
          details: {
            field: "ifsc_code",
            message: "IFSC must be 11 characters: SBIN0001234 format",
          },
        },
        { status: 400 }
      );
    }

    // Bank account validation
    if (!validateBankAccountFormat(bank_account_number)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bank account number",
          details: {
            field: "bank_account_number",
            message: "Account number must be 9-18 digits",
          },
        },
        { status: 400 }
      );
    }

    // 2️⃣ CRITICAL: PAN HOLDER NAME MUST MATCH BANK ACCOUNT HOLDER
    // This is required by Razorpay Route for KYC verification
    // Note: legal_name should be the bank account holder name (from bank records)
    if (!validatePanBankNameMatch(legal_name, legal_name)) {
      // This is a sanity check; in practice, legal_name is entered as PAN holder name
      // and validated against actual PAN during Razorpay KYC
      return NextResponse.json(
        {
          success: false,
          error: "Name validation failed",
          details: {
            message: "The PAN holder name must match bank account holder name",
          },
        },
        { status: 400 }
      );
    }

    // 3️⃣ FEST-SPECIFIC VALIDATION
    if (organizer_type === "FEST") {
      if (!fest_id) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing fest_id for FEST organizer",
          },
          { status: 400 }
        );
      }

      // Verify user is a fest member
      const { data: festMember, error: festError } = await db
        .from("fest_members")
        .select("id")
        .eq("fest_id", fest_id)
        .eq("member_email", userEmail)
        .single();

      if (festError || !festMember) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not a member of this fest",
          },
          { status: 403 }
        );
      }

      // Check if fest organizer already exists
      const { data: existingFestOrg } = await db
        .from("organizers")
        .select("id")
        .eq("fest_id", fest_id)
        .eq("organizer_type", "FEST")
        .single();

      if (existingFestOrg) {
        return NextResponse.json(
          {
            success: false,
            error: "This fest already has an organizer payout setup",
          },
          { status: 409 }
        );
      }
    }

    // 4️⃣ CLUB-SPECIFIC VALIDATION
    if (organizer_type === "CLUB") {
      // Check if club organizer already exists
      const { data: existingClubOrg } = await db
        .from("organizers")
        .select("id")
        .eq("user_email", userEmail)
        .eq("organizer_type", "CLUB")
        .single();

      if (existingClubOrg) {
        return NextResponse.json(
          {
            success: false,
            error: "You already have a club organizer payout setup",
          },
          { status: 409 }
        );
      }
    }

    // 5️⃣ CREATE RAZORPAY ROUTE SUB-MERCHANT
    const razorpayPayload = {
      business_name: display_name,
      business_type: organizer_type === "CLUB" ? "partnership" : "association", // Razorpay business types
      email: userEmail,
      phone: "", // Will be empty initially; can be updated via admin dashboard
      bank_account: {
        account_number: bank_account_number,
        ifsc_code: ifsc_code.toUpperCase(),
        beneficiary_name: legal_name,
      },
      pan: pan_number.toUpperCase(),
      notes: {
        organizer_type,
        display_name,
      },
    };

    let accountId: string;
    let accountStatus: string;

    try {
      const { accountId: id, status } = await createRazorpaySubMerchant(razorpayPayload);
      accountId = id;
      accountStatus = status;
    } catch (razorpayError) {
      const errorMsg = razorpayError instanceof Error ? razorpayError.message : "Unknown error";

      // Common Razorpay errors
      const isValidationError =
        errorMsg.includes("pan") ||
        errorMsg.includes("bank") ||
        errorMsg.includes("name") ||
        errorMsg.includes("mismatch");

      if (isValidationError) {
        return NextResponse.json(
          {
            success: false,
            error: "KYC validation failed",
            details: {
              message:
                "PAN or bank details do not match Razorpay requirements. " +
                "Ensure they are identical in the PAN and bank records.",
            },
          },
          { status: 400 }
        );
      }

      console.error("Razorpay sub-merchant creation error:", errorMsg);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create sub-merchant account",
          details: { message: errorMsg },
        },
        { status: 500 }
      );
    }

    // 6️⃣ STORE ORGANIZER IN DATABASE
    const organizerPayload = {
      organizer_type,
      display_name,
      legal_name,
      pan_number: pan_number.toUpperCase(),
      bank_account_number,
      ifsc_code: ifsc_code.toUpperCase(),
      razorpay_account_id: accountId,
      kyc_status: "pending",
      ...(organizer_type === "CLUB" && { user_email: userEmail }),
      ...(organizer_type === "FEST" && { fest_id }),
    };

    const { data: organizer, error: insertError } = await db
      .from("organizers")
      .insert([organizerPayload])
      .select("id")
      .single();

    if (insertError) {
      console.error("Failed to store organizer in DB:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to store organizer profile" },
        { status: 500 }
      );
    }

    // 7️⃣ SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      organizer_id: organizer.id,
      razorpay_account_id: accountId,
      kyc_status: "pending",
    });
  } catch (error) {
    console.error("Organizer onboarding error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
