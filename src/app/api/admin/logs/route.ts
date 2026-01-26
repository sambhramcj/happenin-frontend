import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAdminLogs } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { logs, total } = await getAdminLogs(limit, offset);

    return NextResponse.json({ 
      data: logs,
      pagination: {
        limit,
        offset,
        total,
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin logs' },
      { status: 500 }
    );
  }
}
