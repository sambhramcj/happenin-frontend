import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getDashboardMetrics } from '@/lib/admin'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const metrics = await getDashboardMetrics()

    return NextResponse.json({ data: metrics })
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}
