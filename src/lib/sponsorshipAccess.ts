import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if sponsorship payment is confirmed for an event
 * 
 * Returns TRUE if:
 * - Event has NO sponsorship deals (no sponsorships required)
 * - Event has sponsorship deals AND at least one deal has status = 'confirmed' or 'active' or 'completed'
 * 
 * Returns FALSE if:
 * - Event has sponsorship deals AND all are in 'pending' status
 * 
 * PAYMENT FLOW:
 * Stage 1: Sponsor → Organizer (outside app) → Organizer marks as paid → status = 'confirmed' → Features unlock
 * Stage 2: Organizer → Platform commission (tracked separately via facilitation_fee_paid)
 * 
 * Used to gate: QR scanning, certificate generation, sponsor reports, sponsor logo rendering
 */
export async function isSponsorshipSettled(eventId: string): Promise<boolean> {
  try {
    // Get all sponsorship deals for this event
    const { data: deals, error } = await supabase
      .from('sponsorship_deals')
      .select('id, status')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error checking sponsorship settlement:', error);
      // On error, assume settled (fail-open to not block legitimate operations)
      return true;
    }

    // If no sponsorships exist, consider it settled
    if (!deals || deals.length === 0) {
      return true;
    }

    // If ANY deal has status = 'confirmed', 'active', or 'completed', sponsorship is settled
    return deals.some(deal => ['confirmed', 'active', 'completed'].includes(deal.status));
  } catch (err) {
    console.error('Unexpected error in isSponsorshipSettled:', err);
    // Fail-open on errors
    return true;
  }
}

/**
 * Check if sponsorship is settled and return appropriate error response
 * Used in API routes for quick error responses
 */
export function sponsorshipNotSettledError() {
  return {
    error: 'Sponsorship payment confirmation required',
    code: 'SPONSORSHIP_NOT_SETTLED',
    message: 'Features will unlock once organizer confirms sponsor payment receipt.',
  };
}
