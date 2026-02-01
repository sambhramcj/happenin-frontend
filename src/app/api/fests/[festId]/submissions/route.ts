import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { festId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId } = await request.json();
    const festId = params.festId;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Verify event exists and user is the organizer
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, organizer_email, title')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: 'Only event organizer can submit' }, { status: 403 });
    }

    // Verify festival exists
    const { data: fest, error: festError } = await supabase
      .from('fests')
      .select('id, name, start_date, end_date')
      .eq('id', festId)
      .single();

    if (festError || !fest) {
      return NextResponse.json({ error: 'Festival not found' }, { status: 404 });
    }

    // Check if already submitted
    const { data: existing } = await supabase
      .from('festival_submissions')
      .select('id, submission_status')
      .eq('fest_id', festId)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: 'Event already submitted', 
        submission: existing 
      }, { status: 409 });
    }

    // Create submission
    const { data: submission, error: submitError } = await supabase
      .from('festival_submissions')
      .insert({
        fest_id: festId,
        event_id: eventId,
        submitted_by_email: session.user.email,
        submission_status: 'pending'
      })
      .select()
      .single();

    if (submitError) {
      console.error('Submission error:', submitError);
      return NextResponse.json({ error: 'Failed to submit event' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      submission,
      message: 'Event submitted successfully. Awaiting festival team review.' 
    });

  } catch (error) {
    console.error('Festival submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { festId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const festId = params.festId;

    // Check if user is festival member
    const { data: member } = await supabase
      .from('fest_members')
      .select('role')
      .eq('fest_id', festId)
      .eq('member_email', session.user.email)
      .single();

    const isFestMember = !!member;

    // Get submissions with event details
    let query = supabase
      .from('festival_submissions')
      .select(`
        id,
        submission_status,
        rejection_reason,
        submitted_at,
        reviewed_at,
        submitted_by_email,
        reviewed_by_email,
        events (
          id,
          title,
          description,
          event_date,
          event_time,
          category,
          price,
          max_participants,
          banner_url,
          organizer_email
        )
      `)
      .eq('fest_id', festId);

    // Non-members can only see approved submissions
    if (!isFestMember) {
      query = query.eq('submission_status', 'approved');
    }

    const { data: submissions, error } = await query.order('submitted_at', { ascending: false });

    if (error) {
      console.error('Fetch submissions error:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }

    return NextResponse.json({ 
      submissions: submissions || [],
      isFestMember 
    });

  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
