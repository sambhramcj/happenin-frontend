import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getRevenueAnalytics } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.user || (session.user as any).role !== 'admin') {
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
    const grouped = payments.reduce((acc: Record<string, number>, payment: any) => {
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
