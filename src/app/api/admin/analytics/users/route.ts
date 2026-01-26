import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserGrowthAnalytics } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    const data = await getUserGrowthAnalytics(days);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('User growth analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user growth analytics' },
      { status: 500 }
    );
  }
}
