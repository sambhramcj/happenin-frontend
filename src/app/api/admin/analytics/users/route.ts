import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getUserGrowthAnalytics } from '@/lib/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type SessionUserWithRole = {
  role?: string;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUserWithRole | undefined)?.role;

  if (!session?.user || role !== 'admin') {
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
