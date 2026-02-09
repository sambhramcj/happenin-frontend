// frontend/src/types/organizer.ts
/**
 * Organizer Type Definitions
 * 
 * Supports both CLUB and FEST organizers with Razorpay Route payouts.
 */

export type OrganizerType = "CLUB" | "FEST";
export type KYCStatus = "pending" | "verified" | "rejected";

export interface Organizer {
  id: string;
  organizer_type: OrganizerType;
  user_email?: string | null; // CLUB organizer email
  fest_id?: string | null; // FEST ID
  display_name: string; // Club name or fest name
  legal_name: string; // PAN holder name
  pan_number: string;
  bank_account_number: string;
  ifsc_code: string;
  razorpay_account_id?: string | null;
  kyc_status: KYCStatus;
  kyc_rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  kyc_verified_at?: string | null;
}

export interface OnboardingFormData {
  organizer_type: OrganizerType;
  display_name: string;
  legal_name: string;
  pan_number: string;
  bank_account_number: string;
  ifsc_code: string;
  fest_id?: string; // Required if FEST
}

export interface OnboardingErrors {
  organizer_type?: string;
  display_name?: string;
  legal_name?: string;
  pan_number?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  fest_id?: string;
  [key: string]: string | undefined;
}

// Helper types for UI
export interface OrganizerStatus {
  isOnboarded: boolean;
  kyc_status: KYCStatus;
  can_receive_payouts: boolean; // true if kyc_status === 'verified'
  message: string; // User-friendly message
}

// API Response types
export interface OnboardOrganizerResponse {
  success: boolean;
  organizer_id?: string;
  razorpay_account_id?: string;
  kyc_status?: KYCStatus;
  error?: string;
  details?: {
    field?: string;
    message: string;
  };
}

export interface OrganizeStatusResponse {
  success: boolean;
  organizer?: Organizer;
  error?: string;
}
