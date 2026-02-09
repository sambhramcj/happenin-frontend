// frontend/src/lib/organizer-helpers.ts
/**
 * Organizer Utilities & Helpers
 * 
 * Validation, formatting, and common operations for organizer payout setup.
 */

import type { OrganizerType, OnboardingFormData, OnboardingErrors } from "@/types/organizer";
import {
  validatePANFormat,
  validateIFSCFormat,
  validateBankAccountFormat,
} from "@/lib/razorpay-route";

/**
 * Validate organizer onboarding form data
 */
export function validateOrganizerForm(
  data: OnboardingFormData
): { valid: boolean; errors: OnboardingErrors } {
  const errors: OnboardingErrors = {};

  // Organizer Type
  if (!data.organizer_type || !["CLUB", "FEST"].includes(data.organizer_type)) {
    errors.organizer_type = "Must select CLUB or FEST";
  }

  // Display Name
  if (!data.display_name || data.display_name.trim().length < 3) {
    errors.display_name = "Display name must be at least 3 characters";
  }

  // Legal Name (PAN Holder)
  if (!data.legal_name || data.legal_name.trim().length < 3) {
    errors.legal_name = "Legal name must be at least 3 characters";
  }

  // PAN
  if (!data.pan_number) {
    errors.pan_number = "PAN number is required";
  } else if (!validatePANFormat(data.pan_number)) {
    errors.pan_number = "Invalid PAN format (e.g., AAAPA5055K)";
  }

  // Bank Account
  if (!data.bank_account_number) {
    errors.bank_account_number = "Bank account number is required";
  } else if (!validateBankAccountFormat(data.bank_account_number)) {
    errors.bank_account_number = "Account number must be 9-18 digits";
  }

  // IFSC Code
  if (!data.ifsc_code) {
    errors.ifsc_code = "IFSC code is required";
  } else if (!validateIFSCFormat(data.ifsc_code)) {
    errors.ifsc_code = "Invalid IFSC format (e.g., SBIN0001234)";
  }

  // FEST ID (if FEST type)
  if (data.organizer_type === "FEST" && !data.fest_id) {
    errors.fest_id = "Fest selection is required for FEST organizers";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Get user-friendly helper text based on organizer type
 */
export function getOrganizerTypeHelperText(type: OrganizerType): string {
  if (type === "CLUB") {
    return "Student treasurer PAN and bank account are acceptable for club events. The PAN holder name must match your bank account holder name.";
  }
  if (type === "FEST") {
    return "For fest events, please provide college or faculty PAN and bank details. The PAN must be registered in the college/organization name that matches your bank account.";
  }
  return "";
}

/**
 * Get KYC status message for UI
 */
export function getKYCStatusMessage(
  kyc_status: "pending" | "verified" | "rejected",
  rejection_reason?: string
): string {
  switch (kyc_status) {
    case "pending":
      return "KYC verification is in progress. This typically takes 24-48 hours.";
    case "verified":
      return "KYC verified! You can now receive payouts from events and sponsorships.";
    case "rejected":
      return `KYC verification failed: ${rejection_reason || "Please contact support for details."}`;
    default:
      return "";
  }
}

/**
 * Format PAN for display (e.g., AAAPA5055K)
 */
export function formatPAN(pan: string): string {
  return pan.toUpperCase().slice(0, 10);
}

/**
 * Format IFSC for display (e.g., SBIN0001234)
 */
export function formatIFSC(ifsc: string): string {
  return ifsc.toUpperCase();
}

/**
 * Mask bank account for display (e.g., ****5678)
 */
export function maskBankAccount(account: string): string {
  if (!account || account.length < 4) return account;
  return "*".repeat(account.length - 4) + account.slice(-4);
}

/**
 * Check if organizer can receive payouts
 */
export function canReceivePayouts(kyc_status: string): boolean {
  return kyc_status === "verified";
}

/**
 * Build help text for bank account validation
 */
export function getBankAccountHelperText(): string {
  return "Enter your bank account number as registered in your PAN records. The account holder name must match your PAN holder name.";
}

/**
 * Generate form submission payload
 */
export function buildOnboardingPayload(
  formData: OnboardingFormData
): Record<string, any> {
  return {
    organizer_type: formData.organizer_type,
    display_name: formData.display_name.trim(),
    legal_name: formData.legal_name.trim(),
    pan_number: formData.pan_number.toUpperCase(),
    bank_account_number: formData.bank_account_number.replace(/\s/g, ""),
    ifsc_code: formData.ifsc_code.toUpperCase(),
    ...(formData.fest_id && { fest_id: formData.fest_id }),
  };
}
