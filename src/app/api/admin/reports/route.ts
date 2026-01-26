import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getPendingReports } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await getPendingReports();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { reportId, type, status, actionTaken } = body;

    const table = type === 'user' ? 'user_reports' : 'event_reports';
    const allowedStatuses = ['pending', 'reviewed', 'dismissed', 'action_taken'];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from(table)
      .update({
        status,
        action_taken: actionTaken ?? null,
        resolved_at: status === 'pending' ? null : new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
