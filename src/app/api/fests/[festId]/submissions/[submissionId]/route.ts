import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ festId: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { festId, submissionId } = await params;
    const { action, rejectionReason } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify user is festival member
    const { data: member } = await supabase
      .from('fest_members')
      .select('role')
      .eq('fest_id', festId)
      .eq('member_email', session.user.email)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'Only festival members can review' }, { status: 403 });
    }

    // Get submission
    const { data: submission, error: fetchError } = await supabase
      .from('festival_submissions')
      .select('id, submission_status')
      .eq('id', submissionId)
      .eq('fest_id', festId)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    if (submission.submission_status !== 'pending') {
      return NextResponse.json({ 
        error: `Submission already ${submission.submission_status}` 
      }, { status: 409 });
    }

    // Update submission
    const updateData: any = {
      submission_status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by_email: session.user.email,
      reviewed_at: new Date().toISOString()
    };

    if (action === 'reject' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    const { data: updated, error: updateError } = await supabase
      .from('festival_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      submission: updated,
      message: `Submission ${action}d successfully` 
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
