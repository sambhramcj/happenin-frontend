import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if sponsorship visibility is active for an event
 *
 * Returns TRUE if:
 * - Event has NO paid digital visibility packs
 * - Event/fest has at least one paid, admin-approved, visibility-active pack
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
      .from('digital_visibility_packs')
      .select('id, visibility_active, payment_status, admin_approved')
      .eq('visibility_active', true)
      .eq('payment_status', 'paid')
      .eq('admin_approved', true);

    if (event?.fest_id) {
      query = query.or(`event_id.eq.${eventId},fest_id.eq.${event.fest_id}`);
    } else {
      query = query.eq('event_id', eventId);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error checking sponsorship settlement:', error);
      return true;
    }

    if (!orders || orders.length === 0) {
      return true;
    }

    return orders.some((order) => order.visibility_active && order.payment_status === 'paid' && order.admin_approved === true);
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
