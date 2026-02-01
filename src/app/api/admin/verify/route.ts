import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Admin emails (in production, this should be in database)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, verificationType, verified, reason } = await request.json();

    if (!userId || !verificationType) {
      return NextResponse.json({ 
        error: 'userId and verificationType are required' 
      }, { status: 400 });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, verification_status')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (verificationType) {
      case 'email':
        // Verify email domain
        const emailDomain = user.email.split('@')[1];
        const isEducationalDomain = emailDomain.endsWith('.edu') || 
                                   emailDomain.endsWith('.ac.in') ||
                                   emailDomain.includes('college') ||
                                   emailDomain.includes('university');
        
        if (verified && !isEducationalDomain) {
          return NextResponse.json({ 
            error: 'Email domain is not recognized as educational institution' 
          }, { status: 400 });
        }

        updateData.email_verified = verified;
        break;

      case 'organizer':
        // Verify organizer credentials
        updateData.verification_status = verified ? 'verified' : 'rejected';
        updateData.verified_at = verified ? new Date().toISOString() : null;
        updateData.verified_by = session.user.email;
        break;

      case 'college':
        // Verify college affiliation
        updateData.college_verified = verified;
        break;

      default:
        return NextResponse.json({ error: 'Invalid verification type' }, { status: 400 });
    }

    if (reason) {
      updateData.verification_notes = reason;
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user: updated,
      message: `User ${verified ? 'verified' : 'rejected'} successfully`
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // Get users pending verification
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, verification_status, created_at, college_id')
      .eq('verification_status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });

  } catch (error) {
    console.error('Fetch verification queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
