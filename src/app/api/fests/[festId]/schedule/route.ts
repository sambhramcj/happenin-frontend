import { NextRequest, NextResponse } from 'next/server';
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
    const { festId } = await params;

    // Get approved submissions with event details
    const { data: submissions, error: submissionsError } = await supabase
      .from('festival_submissions')
      .select(`
        event_id,
        events (
          id,
          title,
          event_date,
          event_time,
          duration_hours,
          venue,
          category
        )
      `)
      .eq('fest_id', festId)
      .eq('submission_status', 'approved');

    if (submissionsError) {
      console.error('Submissions fetch error:', submissionsError);
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }

    // Transform into schedule format
    const schedule = (submissions || []).map(sub => {
      const event = Array.isArray(sub.events) ? sub.events[0] : sub.events;
      return {
        eventId: event?.id,
        title: event?.title,
        date: event?.event_date,
        time: event?.event_time,
        duration: event?.duration_hours,
        venue: event?.venue,
        category: event?.category,
        startDateTime: event?.event_date && event?.event_time
          ? new Date(`${event.event_date}T${event.event_time}`).toISOString()
          : new Date(0).toISOString()
      };
    }).sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    // Group by date
    const scheduleByDate: { [key: string]: any[] } = {};
    schedule.forEach(event => {
      const date = event.date;
      if (!scheduleByDate[date]) {
        scheduleByDate[date] = [];
      }
      scheduleByDate[date].push(event);
    });

    return NextResponse.json({ 
      schedule: scheduleByDate,
      timeline: schedule,
      totalEvents: schedule.length
    });

  } catch (error) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
