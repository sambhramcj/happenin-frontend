import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if sponsorship visibility is active for an event
 *
 * Returns TRUE if:
 * - Event has NO sponsorship deals
 * - Event has at least one deal with visibility_active = true and payment_status = 'verified'
 *
 * Used for rendering sponsor visibility and status indicators.
 */
export async function isSponsorshipSettled(eventId: string): Promise<boolean> {
  try {
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('fest_id')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Error fetching event for sponsorship visibility:', eventError);
      return true;
    }

    let query = supabase
      .from('sponsorship_deals')
      .select('id, visibility_active, payment_status')
      .eq('visibility_active', true)
      .eq('payment_status', 'verified');

    if (event?.fest_id) {
      query = query.or(`event_id.eq.${eventId},fest_id.eq.${event.fest_id}`);
    } else {
      query = query.eq('event_id', eventId);
    }

    const { data: deals, error } = await query;

    if (error) {
      console.error('Error checking sponsorship settlement:', error);
      return true;
    }

    if (!deals || deals.length === 0) {
      return true;
    }

    return deals.some(deal => deal.visibility_active && deal.payment_status === 'verified');
  } catch (err) {
    console.error('Unexpected error in isSponsorshipSettled:', err);
    return true;
  }
}

/**
 * Check if sponsorship is settled and return appropriate error response
 * Used in API routes for quick error responses
 */
export function sponsorshipNotSettledError() {
  return {
    error: 'Sponsorship visibility not active',
    code: 'SPONSORSHIP_VISIBILITY_INACTIVE',
    message: 'Visibility activates after admin verifies payment.',
  };
}
