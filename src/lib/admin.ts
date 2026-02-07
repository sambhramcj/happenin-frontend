import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AdminAction {
  action: string
  resourceType: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress: string
}

// Log admin action (immutable)
export async function logAdminAction(
  adminEmail: string,
  action: AdminAction
) {
  return supabase.from('admin_logs').insert({
    admin_email: adminEmail,
    action: action.action,
    resource_type: action.resourceType,
    resource_id: action.resourceId,
    details: action.details,
    ip_address: action.ipAddress,
  })
}

// Get dashboard metrics
export async function getDashboardMetrics() {
  const [revenueData, transactionData, userData, eventData, payoutData, pendingPayouts] =
    await Promise.all([
      supabase
        .from('payments')
        .select('amount')
        .eq('status', 'success'),
      supabase
        .from('payments')
        .select('id', { count: 'exact' })
        .eq('status', 'success'),
      supabase
        .from('users')
        .select('id', { count: 'exact' }),
      supabase
        .from('events')
        .select('id', { count: 'exact' }),
      supabase
        .from('sponsorship_payouts')
        .select('gross_amount, platform_fee, payout_amount, payout_status'),
      supabase
        .from('sponsorship_payouts')
        .select('id', { count: 'exact', head: true })
        .eq('payout_status', 'pending'),
    ])

  const totalRevenue = revenueData.data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
  const totalSponsorshipRevenue = payoutData.data?.reduce((sum: number, p: any) => sum + (p.gross_amount || 0), 0) || 0
  const totalPlatformEarnings = payoutData.data?.reduce((sum: number, p: any) => sum + (p.platform_fee || 0), 0) || 0
  const totalPaidToOrganizers = payoutData.data?.reduce(
    (sum: number, p: any) => sum + (p.payout_status === 'paid' ? p.payout_amount || 0 : 0),
    0
  ) || 0

  return {
    totalRevenue,
    totalTransactions: transactionData.count || 0,
    totalUsers: userData.count || 0,
    totalEvents: eventData.count || 0,
    totalSponsorshipRevenue,
    totalPlatformEarnings,
    totalPaidToOrganizers,
    pendingPayoutsCount: pendingPayouts.count || 0,
  }
}

// Get user growth analytics
export async function getUserGrowthAnalytics(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at')

  if (error) throw error

  // Group by date
  const grouped = data.reduce((acc: Record<string, number>, user) => {
    const date = new Date(user.created_at).toLocaleDateString()
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count,
  }))
}

// Get event performance metrics
export async function getEventPerformanceMetrics() {
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      max_registrations,
      registration_fee,
      created_at
    `)

  if (error) throw error

  // Get registrations and revenue for each event
  const eventMetrics = await Promise.all(
    events.map(async (event) => {
      const [registrations, payments] = await Promise.all([
        supabase
          .from('registrations')
          .select('id', { count: 'exact' })
          .eq('event_id', event.id),
        supabase
          .from('payments')
          .select('amount')
          .eq('event_id', event.id)
          .eq('status', 'success'),
      ])

      const registrationCount = registrations.count || 0
      const revenue = payments.data?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0
      const registrationRate = event.max_registrations > 0
        ? (registrationCount / event.max_registrations) * 100
        : 0

      return {
        eventId: event.id,
        eventTitle: event.title,
        registrations: registrationCount,
        maxRegistrations: event.max_registrations,
        registrationRate: Math.round(registrationRate),
        revenue,
        avgRevenuePerRegistration: registrationCount > 0 ? revenue / registrationCount : 0,
      }
    })
  )

  return eventMetrics.sort((a, b) => b.revenue - a.revenue)
}

// Get admin action logs
export async function getAdminLogs(limit: number = 50, offset: number = 0) {
  const { data, error, count } = await supabase
    .from('admin_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  return { logs: data, total: count || 0 }
}

// Get revenue analytics (date range)
export async function getRevenueAnalytics(
  startDate: Date,
  endDate: Date
) {
  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'success')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at')

  if (error) throw error

  return data
}

// Get pending reports
export async function getPendingReports() {
  const [userReports, eventReports] = await Promise.all([
    supabase
      .from('user_reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('event_reports')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  return {
    userReports: userReports.data,
    eventReports: eventReports.data,
  }
}
