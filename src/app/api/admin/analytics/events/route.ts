import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getEventPerformanceMetrics } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const data = await getEventPerformanceMetrics();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Event performance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event performance metrics' },
      { status: 500 }
    );
  }
}
