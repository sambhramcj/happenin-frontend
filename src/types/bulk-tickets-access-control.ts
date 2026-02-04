// Types for Bulk Tickets and Access Control Features

export interface BulkTicketPack {
  id: string;
  event_id: string;
  organizer_email: string;
  name: string;
  description?: string;
  quantity: number;
  base_price: number;
  bulk_price: number;
  discount_percentage: number;
  total_cost: number;
  offer_title?: string;
  offer_description?: string;
  offer_expiry_date?: string;
  status: 'active' | 'sold_out' | 'expired' | 'inactive';
  sold_count: number;
  available_count: number;
  created_at: string;
  updated_at: string;
}

export interface BulkTicketPurchase {
  id: string;
  bulk_pack_id: string;
  buyer_email: string;
  quantity_purchased: number;
  price_per_ticket: number;
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_id?: string;
  purchase_date: string;
  bulk_ticket_packs?: BulkTicketPack;
}

export interface BulkTicket {
  id: string;
  bulk_purchase_id: string;
  event_id: string;
  ticket_number: string;
  qr_code_data?: string;
  assigned_to_email?: string;
  checked_in: boolean;
  checked_in_at?: string;
  check_in_by_email?: string;
  status: 'available' | 'assigned' | 'used' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface EventAccessControl {
  id: string;
  event_id: string;
  organizer_email: string;
  access_type: 'open' | 'restricted';
  restrictions: {
    college?: string[];
    year_of_study?: number[];
    branch?: string[];
    club_membership?: string[];
    require_all_criteria?: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccessControlRestriction {
  id: string;
  access_control_id: string;
  restriction_type: 'college' | 'year_of_study' | 'branch' | 'club_membership';
  restriction_value: string;
  created_at: string;
}

export interface AccessCheckLog {
  id: string;
  event_id: string;
  user_email: string;
  access_eligible: boolean;
  check_reason?: string;
  checked_at: string;
}

// API Request/Response Types
export interface CreateBulkPackRequest {
  eventId: string;
  organizerEmail: string;
  name: string;
  description?: string;
  quantity: number;
  basePrice: number;
  bulkPrice: number;
  offerTitle?: string;
  offerDescription?: string;
  offerExpiryDate?: string;
}

export interface CreateBulkPurchaseRequest {
  bulkPackId: string;
  buyerEmail: string;
  quantityPurchased: number;
  totalAmount: number;
}

export interface SetAccessControlRequest {
  eventId: string;
  organizerEmail: string;
  accessType: 'open' | 'restricted';
  restrictions?: {
    college?: string[];
    year_of_study?: number[];
    branch?: string[];
    club_membership?: string[];
    require_all_criteria?: boolean;
  };
}

export interface CheckAccessRequest {
  eventId: string;
  userEmail: string;
  userCollege?: string;
  userYear?: number;
  userBranch?: string;
  userClubs?: string[];
}

export interface CheckAccessResponse {
  eligible: boolean;
}
