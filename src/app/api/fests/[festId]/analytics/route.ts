import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { festId } = await params;

    // Verify user is festival member
    const { data: member } = await supabase
      .from('fest_members')
      .select('role')
      .eq('fest_id', festId)
      .eq('member_email', session.user.email)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Only festival members can view analytics' }, { status: 403 });
    }

    // Get approved events
    const { data: approvedEvents, error: eventsError } = await supabase
      .from('festival_submissions')
      .select(`
        event_id,
        events (
          id,
          price,
          max_participants,
          category
        )
      `)
      .eq('fest_id', festId)
      .eq('submission_status', 'approved');

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const eventIds = (approvedEvents || []).map(ae => ae.event_id);

    if (eventIds.length === 0) {
      return NextResponse.json({ 
        analytics: {
          totalEvents: 0,
          totalRegistrations: 0,
          totalRevenue: 0,
          totalAttendance: 0,
          uniqueParticipants: 0,
          categoryBreakdown: {},
          dailyStats: []
        }
      });
    }

    // Get registrations
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, event_id, payment_status, user_email')
      .in('event_id', eventIds);

    if (regError) {
      console.error('Registrations fetch error:', regError);
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    // Get attendance records
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('id, event_id, user_email')
      .in('event_id', eventIds);

    if (attError) {
      console.error('Attendance fetch error:', attError);
    }

    // Calculate metrics
    const totalRegistrations = registrations?.length || 0;
    const paidRegistrations = registrations?.filter(r => r.payment_status === 'completed') || [];
    
    let totalRevenue = 0;
    paidRegistrations.forEach(reg => {
      const event = approvedEvents?.find(ae => ae.event_id === reg.event_id);
      const eventDetails = Array.isArray(event?.events) ? event?.events[0] : event?.events;
      if (eventDetails?.price) {
        totalRevenue += parseFloat(eventDetails.price.toString());
      }
    });

    const uniqueParticipants = new Set(registrations?.map(r => r.user_email) || []).size;
    const totalAttendance = attendance?.length || 0;

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    approvedEvents?.forEach(ae => {
      const eventDetails = Array.isArray(ae.events) ? ae.events[0] : ae.events;
      const category = eventDetails?.category || 'Other';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });

    // Save to analytics table
    const { error: saveError } = await supabase
      .from('festival_analytics')
      .upsert({
        fest_id: festId,
        total_events: approvedEvents?.length || 0,
        total_registrations: totalRegistrations,
        total_revenue: totalRevenue,
        total_attendance: totalAttendance,
        unique_participants: uniqueParticipants,
        calculated_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Analytics save error:', saveError);
    }

    return NextResponse.json({ 
      analytics: {
        totalEvents: approvedEvents?.length || 0,
        totalRegistrations,
        totalRevenue,
        totalAttendance,
        uniqueParticipants,
        categoryBreakdown,
        averageRevenuePerEvent: totalRevenue / (approvedEvents?.length || 1),
        conversionRate: totalRegistrations > 0 ? (totalAttendance / totalRegistrations) * 100 : 0
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
