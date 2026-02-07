export interface SponsorshipPackage {
  id: string;
  event_id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  min_amount: number;
  max_amount: number;
  organizer_notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface SponsorshipDeliverable {
  id: string;
  package_id: string;
  type: 'platform_default' | 'organizer_defined';
  category: 'certificate' | 'ticket' | 'app_banner' | 'social' | 'on_ground' | 'stall' | 'digital';
  title: string;
  description?: string;
  created_at: string;
}

export interface SponsorshipDeal {
  id: string;
  sponsor_id: string;
  event_id: string;
  package_id: string;
  amount_paid: number;
  platform_fee: number;
  organizer_amount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface SponsorProfile {
  email: string;
  company_name: string;
  logo_url?: string;
  website_url?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at: string;
}

export interface OrganizerBankAccount {
  id: string;
  organizer_email: string;
  account_holder_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface SponsorshipPayout {
  id: string;
  sponsorship_deal_id: string;
  organizer_email: string;
  gross_amount: number;
  platform_fee: number;
  payout_amount: number;
  payout_method?: 'UPI' | 'IMPS' | null;
  payout_status: 'pending' | 'paid';
  paid_at?: string | null;
  admin_email?: string | null;
  created_at: string;
}

export interface CreatePackageRequest {
  event_id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  min_amount: number;
  max_amount: number;
  organizer_notes?: string;
  deliverables: Array<{
    category: 'social' | 'on_ground' | 'stall' | 'digital';
    title: string;
    description: string;
  }>;
}

export interface CreateDealRequest {
  event_id: string;
  package_id: string;
  amount: number;
}

export const TIER_BOUNDS = {
  bronze: { min: 5000, max: 15000 },
  silver: { min: 15000, max: 35000 },
  gold: { min: 35000, max: 100000 },
  platinum: { min: 100000, max: 10000000 },
} as const;

export const DELIVERABLE_CATEGORIES = [
  { value: 'social', label: 'Social Media Promotion' },
  { value: 'on_ground', label: 'On-ground Branding' },
  { value: 'stall', label: 'Stall / Booth Space' },
  { value: 'digital', label: 'Digital Promotion' },
] as const;
