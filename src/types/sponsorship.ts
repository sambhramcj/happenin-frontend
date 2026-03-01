export interface SponsorshipPackage {
  id: string;
  event_id: string | null;
  fest_id?: string | null;
  type: 'silver' | 'gold' | 'platinum';
  price: number;
  scope: 'per_event' | 'fest';
  is_active: boolean;
  created_at: string;
}

export interface SponsorshipDeliverable {
  id: string;
  package_id: string;
  type: 'platform_default' | 'organizer_defined';
  category: 'social' | 'on_ground' | 'stall';
  title: string;
  description?: string;
  created_at: string;
}

export interface SponsorshipDeal {
  id: string;
  sponsor_email: string;
  event_id: string | null;
  fest_id?: string | null;
  package_id?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  transaction_reference?: string;
  payment_method?: 'UPI' | 'Bank' | 'Cash';
  payment_date?: string;
  verified_by_admin?: boolean;
  visibility_active: boolean;
  admin_approved?: boolean;
  created_at: string;
}

export interface SponsorshipOrder {
  id: string;
  sponsor_email: string;
  event_id: string | null;
  fest_id?: string | null;
  pack_type: 'silver' | 'gold' | 'platinum';
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  visibility_active: boolean;
  organizer_payout_settled: boolean;
  organizer_payout_settled_at?: string | null;
  created_at: string;
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
  sponsorship_deal_id?: string | null;
  digital_pack_id?: string | null;
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
  type: 'silver' | 'gold' | 'platinum';
  price: number;
  scope: 'per_event' | 'fest';
}

export interface CreateDealRequest {
  event_id: string;
  package_id: string;
  transaction_reference: string;
  payment_method: 'UPI' | 'Bank' | 'Cash';
  payment_date: string;
}

export const SPONSORSHIP_PACKS = {
  silver: { price: 10000, scope: 'per_event' },
  gold: { price: 25000, scope: 'per_event' },
  platinum: { price: 100000, scope: 'fest' },
} as const;

export const SPONSORSHIP_VISIBILITY = {
  silver: [
    'Logo on event tickets',
    'Logo on event certificates',
    'Event page banner',
  ],
  gold: [
    'Logo on event tickets',
    'Logo on event certificates',
    'Premium event page banner placement',
    'Enhanced sponsor prominence on event pages',
  ],
  platinum: [
    'Logo on all fest event tickets',
    'Logo on all fest event certificates',
    'Homepage top and mid priority banners',
    'Fest-wide sponsor visibility',
    'Click and impression tracking',
  ],
} as const;
