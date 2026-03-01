import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getRevenueAnalytics } from '@/lib/admin';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

type SessionUserWithRole = {
  role?: string;
};

type RevenuePayment = {
  created_at: string;
  amount: number;
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
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await getRevenueAnalytics(startDate, endDate);

    // Group by date
    const grouped = (payments as RevenuePayment[]).reduce((acc: Record<string, number>, payment) => {
      const date = new Date(payment.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + payment.amount;
      return acc;
    }, {});

    const data = Object.entries(grouped).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
