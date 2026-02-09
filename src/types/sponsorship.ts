export interface SponsorshipPackage {
  id: string;
  event_id: string | null;
  fest_id?: string | null;
  type: 'digital' | 'app' | 'fest';
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
  package_id: string;
  payment_status: 'pending' | 'verified' | 'rejected';
  transaction_reference?: string;
  payment_method?: 'UPI' | 'Bank' | 'Cash';
  payment_date?: string;
  verified_by_admin: boolean;
  visibility_active: boolean;
  created_at: string;
}

export interface SponsorshipOrder {
  id: string;
  sponsor_email: string;
  event_id: string | null;
  fest_id?: string | null;
  pack_type: 'digital' | 'app' | 'fest';
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string | null;
  status: 'created' | 'paid' | 'failed';
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
  type: 'digital' | 'app' | 'fest';
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
  digital: { price: 10000, scope: 'per_event' },
  app: { price: 25000, scope: 'per_event' },
  fest: { price: 50000, scope: 'fest' },
} as const;

export const SPONSORSHIP_VISIBILITY = {
  digital: [
    'Logo on event tickets',
    'Logo on event certificates',
    'Event page banner',
  ],
  app: [
    'Logo on event tickets',
    'Logo on event certificates',
    'Event page banner',
    'Homepage rotating banner (fest days)',
    'Click and impression tracking',
  ],
  fest: [
    'Logo on all fest event tickets',
    'Logo on all fest event certificates',
    'Event page banners',
    'Homepage rotating banners',
    'Additional homepage placements',
    'Click and impression tracking',
  ],
} as const;
