import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interaction weights for recommendation scoring
const INTERACTION_WEIGHTS = {
  view: 1,
  like: 3,
  share: 4,
  register: 10,
  skip: -2
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { eventId, interactionType } = await request.json();

    if (!eventId || !interactionType) {
      return NextResponse.json({ 
        error: 'Event ID and interaction type are required' 
      }, { status: 400 });
    }

    if (!Object.keys(INTERACTION_WEIGHTS).includes(interactionType)) {
      return NextResponse.json({ 
        error: 'Invalid interaction type' 
      }, { status: 400 });
    }

    // Verify event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Record interaction (upsert to handle duplicates)
    const { error: interactionError } = await supabase
      .from('user_event_interactions')
      .upsert({
        user_email: session.user.email,
        event_id: eventId,
        interaction_type: interactionType,
        interaction_weight: INTERACTION_WEIGHTS[interactionType as keyof typeof INTERACTION_WEIGHTS],
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_email,event_id,interaction_type'
      });

    if (interactionError) {
      console.error('Interaction recording error:', interactionError);
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Interaction recorded successfully'
    });

  } catch (error) {
    console.error('Interaction API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    let query = supabase
      .from('user_event_interactions')
      .select('*')
      .eq('user_email', session.user.email);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: interactions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch interactions error:', error);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }

    return NextResponse.json({ interactions: interactions || [] });

  } catch (error) {
    console.error('Interactions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
