"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { RevenueChart, UserGrowthChart } from "@/components/Charts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminTableSkeleton, AdminTimelineSkeleton } from "@/components/skeletons";
import { NotificationCenter } from "@/components/NotificationCenter";

interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  totalUsers: number;
  totalEvents: number;
  totalSponsorshipRevenue: number;
  totalPlatformEarnings: number;
  totalPaidToOrganizers: number;
  pendingPayoutsCount: number;
}

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  start_datetime?: string;
  location: string;
  venue?: string;
  price: string;
  max_registrations?: number;
  category?: string;
  status?: string;
  organizer_email: string;
  banner_image?: string;
  created_at: string;
};

type Registration = {
  id: string;
  student_email: string;
  user_email?: string;
  event_id: string;
  final_price: number;
  status?: string;
  created_at: string;
};

type User = {
  email: string;
  role: string;
  created_at: string;
};

type SponsorshipDeal = {
  id: string;
  sponsor_email: string;
  event_id?: string | null;
  fest_id?: string | null;
  pack_type?: string;
  amount?: number;
  status: string;
  visibility_active?: boolean;
  organizer_payout_settled?: boolean;
  organizer_payout_settled_at?: string | null;
  created_at: string;
  events?: { id: string; title: string; fest_id?: string | null } | null;
  fests?: { id: string; title: string } | null;
  sponsors_profile?: { company_name?: string; email?: string } | null;
  sponsor_analytics?: { clicks: number; impressions: number };
};

type SponsorshipPayout = {
  id: string;
  organizer_email: string;
  gross_amount: number;
  platform_fee: number;
  payout_amount: number;
  payout_method?: string | null;
  payout_status: string;
  paid_at?: string | null;
  created_at: string;
};

type OrganizerProfile = {
  id: string;
  organizer_email?: string;
  email?: string;
  organizer_type?: string;
  kyc_status?: "pending" | "verified" | "rejected";
  created_at?: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "users" | "payments" | "sponsorships">("overview");
  const [usersSubTab, setUsersSubTab] = useState<"students" | "organizers" | "sponsors">("students");
  const [reportsSubTab, setReportsSubTab] = useState<"reports" | "disputes">("reports");

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipDeal[]>([]);
  const [payouts, setPayouts] = useState<SponsorshipPayout[]>([]);
  const [organizerProfiles, setOrganizerProfiles] = useState<OrganizerProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Analytics states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [eventPerformance, setEventPerformance] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<{ userReports: any[]; eventReports: any[] }>({ userReports: [], eventReports: [] });
  const [disputes, setDisputes] = useState<any[]>([]);

  // Filters
  const [eventFilter, setEventFilter] = useState<"all" | "today" | "week" | "flagged">("all");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "admin") {
      router.replace("/auth");
      return;
    }

    fetchAllData();
    fetchDashboardMetrics();
    fetchAnalyticsData();
  }, [session, status, router]);

  async function fetchDashboardMetrics() {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      if (data.data) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      toast.error('Failed to load dashboard metrics');
    }
  }

  async function fetchAnalyticsData() {
    try {
      const [revenue, userGrowth, eventPerf, logs, reportsData, disputesData] = await Promise.all([
        fetch('/api/admin/analytics/revenue?days=30').then(r => r.json()),
        fetch('/api/admin/analytics/users?days=30').then(r => r.json()),
        fetch('/api/admin/analytics/events').then(r => r.json()),
        fetch('/api/admin/logs?limit=20').then(r => r.json()),
        fetch('/api/admin/reports').then(r => r.json()),
        fetch('/api/admin/disputes?status=open').then(r => r.json()),
      ]);

      setRevenueData(revenue.data || []);
      setUserGrowthData(userGrowth.data || []);
      setEventPerformance(eventPerf.data || []);
      setAdminLogs(logs.data || []);
      setReports(reportsData.data || { userReports: [], eventReports: [] });
      setDisputes(disputesData.data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  }

  async function fetchAllData() {
    await Promise.all([
      fetchEvents(),
      fetchRegistrations(),
      fetchUsers(),
      fetchSponsorships(),
      fetchPayouts(),
      fetchOrganizerProfiles(),
    ]);
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    setEvents(data || []);
  }

  async function fetchRegistrations() {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    setRegistrations(data || []);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from("users")
      .select("email, role, created_at")
      .order("created_at", { ascending: false });

    setUsers(data || []);
  }

  async function fetchSponsorships() {
    try {
      const res = await fetch("/api/admin/sponsorships");
      if (res.ok) {
        const json = await res.json();
        setSponsorships(json.deals || json.sponsorships || []);
      }
    } catch {
      setSponsorships([]);
    }
  }

  async function fetchPayouts() {
    try {
      const res = await fetch("/api/admin/sponsorship-payouts");
      if (!res.ok) return;
      const json = await res.json();
      setPayouts(json.payouts || []);
    } catch {
      setPayouts([]);
    }
  }

  async function fetchOrganizerProfiles() {
    try {
      const res = await fetch("/api/admin/organizers");
      if (!res.ok) return;
      const json = await res.json();
      setOrganizerProfiles(json.organizers || []);
    } catch {
      setOrganizerProfiles([]);
    }
  }

  // Analytics
  function getTotalColleges() {
    // Unique colleges from events (assuming organizer_email domain is college)
    const colleges = new Set(
      events.map(e => e.organizer_email?.split('@')[1]).filter(Boolean)
    );
    return colleges.size;
  }

  function getEventsToday() {
    const today = new Date().toDateString();
    return events.filter((e) => {
      const eventDate = e.start_datetime || e.date;
      return eventDate && new Date(eventDate).toDateString() === today;
    });
  }

  function getRegistrationsToday() {
    const today = new Date().toDateString();
    return registrations.filter(r => 
      new Date(r.created_at).toDateString() === today
    );
  }

  function getRevenueToday() {
    return getRegistrationsToday().reduce((sum, r) => sum + r.final_price, 0);
  }

  function getTotalRevenue() {
    return registrations.reduce((sum, r) => sum + r.final_price, 0);
  }

  function formatCurrency(value: number) {
    return `₹${Math.round(value || 0).toLocaleString()}`;
  }

  function formatPercent(value: number) {
    return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
  }

  function formatDate(value?: string | null) {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  }

  function getFailedPayments() {
    // Placeholder - would need actual payment failure tracking
    return 0;
  }

  function getFilteredEvents() {
    let filtered = [...events];

    if (eventFilter === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(e => new Date(e.date).toDateString() === today);
    } else if (eventFilter === "week") {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= weekFromNow;
      });
    }

    return filtered;
  }

  function getEventRegistrationCount(eventId: string) {
    return registrations.filter(r => r.event_id === eventId).length;
  }

  function getEventRevenue(eventId: string) {
    return registrations
      .filter(r => r.event_id === eventId)
      .reduce((sum, r) => sum + r.final_price, 0);
  }

  function getFilteredUsers() {
    let filtered = users.filter((u) => {
      if (usersSubTab === "students") return u.role === "student";
      if (usersSubTab === "organizers") return u.role === "organizer";
      return u.role === "sponsor";
    });

    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }

  function getUserRegistrations(email: string) {
    return registrations.filter(r => (r.student_email || r.user_email) === email);
  }

  function getUserEvents(email: string) {
    return events.filter(e => e.organizer_email === email);
  }

  const sponsorshipPaidDeals = sponsorships.filter((s) => s.status === "paid");
  const sponsorshipPendingDeals = sponsorships.filter((s) => s.status !== "paid");
  const sponsorshipRevenueFromDeals = sponsorshipPaidDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
  const totalRevenueCombined = getTotalRevenue() + (metrics?.totalSponsorshipRevenue || sponsorshipRevenueFromDeals);
  const averageTicketValue = registrations.length ? getTotalRevenue() / registrations.length : 0;
  const averageSponsorshipValue = sponsorshipPaidDeals.length
    ? sponsorshipRevenueFromDeals / sponsorshipPaidDeals.length
    : 0;

  const students = users.filter((u) => u.role === "student");
  const organizerUsers = users.filter((u) => u.role === "organizer");
  const sponsors = users.filter((u) => u.role === "sponsor");

  const checkedInCount = registrations.filter((r) => r.status === "checked_in").length;
  const attendanceRate = registrations.length ? (checkedInCount / registrations.length) * 100 : 0;

  const pendingDisputes = disputes.filter((d) => d.status === "open" || d.status === "investigating").length;
  const unresolvedReports = (reports.userReports?.length || 0) + (reports.eventReports?.length || 0);

  const payoutsPending = payouts.filter((p) => p.payout_status === "pending");
  const payoutsPaid = payouts.filter((p) => p.payout_status === "paid");

  const organizerKycPending = organizerProfiles.filter((o) => o.kyc_status === "pending").length;
  const organizerKycVerified = organizerProfiles.filter((o) => o.kyc_status === "verified").length;

  const organizerPerformanceRows = organizerUsers.map((organizer) => {
    const organizerEvents = events.filter((e) => e.organizer_email === organizer.email);
    const organizerEventIds = new Set(organizerEvents.map((e) => e.id));
    const organizerRegistrations = registrations.filter((r) => organizerEventIds.has(r.event_id));
    const ticketRevenue = organizerRegistrations.reduce((sum, r) => sum + r.final_price, 0);
    const sponsorshipRevenue = sponsorshipPaidDeals
      .filter((deal) => deal.event_id && organizerEventIds.has(deal.event_id))
      .reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const profile = organizerProfiles.find(
      (o) => (o.organizer_email || o.email) === organizer.email
    );

    return {
      email: organizer.email,
      events: organizerEvents.length,
      registrations: organizerRegistrations.length,
      ticketRevenue,
      sponsorshipRevenue,
      kycStatus: profile?.kyc_status || "pending",
      organizerType: profile?.organizer_type || "club",
      joinedAt: organizer.created_at,
    };
  });

  const topEventsByRevenue = [...eventPerformance]
    .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
    .slice(0, 8);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-muted p-6 space-y-6">
        <AdminTableSkeleton />
        <AdminTimelineSkeleton />
      </div>
    );
  }

  if (!session?.user || (session.user as any).role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-muted pb-24">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center border border-red-200 dark:border-red-800">
              <Icons.Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Admin Control</h1>
              <p className="text-xs text-text-muted">Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Nav */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-border-default">
          {[
            { id: "overview", label: "Overview", icon: <Icons.Gauge className="h-4 w-4" /> },
            { id: "events", label: "Events", icon: <Icons.Calendar className="h-4 w-4" /> },
            { id: "users", label: "Users", icon: <Icons.Users className="h-4 w-4" /> },
            { id: "payments", label: "Payments", icon: <Icons.Wallet className="h-4 w-4" /> },
            { id: "sponsorships", label: "Sponsorships", icon: <Icons.Handshake className="h-4 w-4" /> },
          ].map((t: any) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === t.id
                  ? "bg-primary text-text-inverse"
                  : "bg-bg-card text-text-secondary hover:bg-bg-muted"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.TrendingUp className="h-5 w-5 text-primary" /> Platform Dashboard Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Total Revenue (Tickets)</div>
                  <div className="text-3xl font-bold text-text-primary">{formatCurrency(metrics?.totalRevenue || getTotalRevenue())}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Total Sponsorship Revenue</div>
                  <div className="text-3xl font-bold text-text-primary">{formatCurrency(metrics?.totalSponsorshipRevenue || sponsorshipRevenueFromDeals)}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Total Platform Earnings</div>
                  <div className="text-3xl font-bold text-text-primary">{formatCurrency(metrics?.totalPlatformEarnings || 0)}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Total Paid to Organizers</div>
                  <div className="text-3xl font-bold text-text-primary">{formatCurrency(metrics?.totalPaidToOrganizers || 0)}</div>
                </div>
              </div>
            </section>

            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Total Users</div>
                  <div className="text-2xl font-bold text-text-primary">{users.length || metrics?.totalUsers || 0}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Total Events</div>
                  <div className="text-2xl font-bold text-text-primary">{events.length || metrics?.totalEvents || 0}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">ADU (Estimated)</div>
                  <div className="text-2xl font-bold text-text-primary">{Math.round((metrics?.totalUsers || users.length) * 0.15)}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">MAU (Estimated)</div>
                  <div className="text-2xl font-bold text-text-primary">{Math.round((metrics?.totalUsers || users.length) * 0.35)}</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <div className="text-sm text-text-muted">Pending Payouts</div>
                  <div className="text-2xl font-bold text-text-primary">{metrics?.pendingPayoutsCount || payoutsPending.length}</div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Trend (30 Days)</h3>
                <RevenueChart data={revenueData} />
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">User Growth (30 Days)</h3>
                <UserGrowthChart data={userGrowthData} />
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Mix</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-text-secondary">Ticket Revenue Share</span>
                      <span className="text-text-primary">{formatPercent(totalRevenueCombined ? (getTotalRevenue() / totalRevenueCombined) * 100 : 0)}</span>
                    </div>
                    <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${totalRevenueCombined ? (getTotalRevenue() / totalRevenueCombined) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-text-secondary">Sponsorship Revenue Share</span>
                      <span className="text-text-primary">{formatPercent(totalRevenueCombined ? ((metrics?.totalSponsorshipRevenue || sponsorshipRevenueFromDeals) / totalRevenueCombined) * 100 : 0)}</span>
                    </div>
                    <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success"
                        style={{ width: `${totalRevenueCombined ? ((metrics?.totalSponsorshipRevenue || sponsorshipRevenueFromDeals) / totalRevenueCombined) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Pending Actions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Open Disputes</span>
                    <span className="font-semibold text-text-primary">{pendingDisputes}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Pending Reports</span>
                    <span className="font-semibold text-text-primary">{unresolvedReports}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Pending Sponsorship Payouts</span>
                    <span className="font-semibold text-text-primary">{payoutsPending.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Organizer KYC Pending</span>
                    <span className="font-semibold text-text-primary">{organizerKycPending}</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity Timeline</h3>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-3">
                {events.slice(0, 6).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <div>
                      <p className="text-text-primary font-medium">{event.title}</p>
                      <p className="text-xs text-text-muted">Organizer: {event.organizer_email}</p>
                    </div>
                    <span className="text-xs text-text-muted">{formatDate(event.created_at)}</span>
                  </div>
                ))}
                {events.length === 0 && <p className="text-text-muted text-center py-8">No recent activity</p>}
              </div>
            </section>
          </div>
        )}

        {/* REPORTS SECTION (within payments context) */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Reports and Disputes</h2>

            <div className="flex gap-2">
              <button
                onClick={() => setReportsSubTab("reports")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  reportsSubTab === "reports"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Reports ({(reports.userReports?.length || 0) + (reports.eventReports?.length || 0)})
              </button>
              <button
                onClick={() => setReportsSubTab("disputes")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  reportsSubTab === "disputes"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Disputes ({disputes.length})
              </button>
            </div>

            {reportsSubTab === "reports" && (
              <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Reason</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {[...(reports.userReports || []).map((r: any) => ({ ...r, _kind: "user" })), ...(reports.eventReports || []).map((r: any) => ({ ...r, _kind: "event" }))]
                        .slice(0, 20)
                        .map((report: any) => (
                          <tr key={`${report._kind}-${report.id}`} className="hover:bg-bg-muted">
                            <td className="px-6 py-4 text-sm text-text-primary capitalize">{report._kind} report</td>
                            <td className="px-6 py-4 text-sm text-text-secondary">{report.reason || report.message || "-"}</td>
                            <td className="px-6 py-4 text-sm text-text-secondary">{report.status || "pending"}</td>
                            <td className="px-6 py-4 text-sm text-text-muted">{formatDate(report.created_at)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportsSubTab === "disputes" && (
              <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Dispute ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {disputes.slice(0, 20).map((dispute: any) => (
                        <tr key={dispute.id} className="hover:bg-bg-muted">
                          <td className="px-6 py-4 text-sm text-text-primary">{dispute.id}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{dispute.payment_id || "-"}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{dispute.status}</td>
                          <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(dispute.amount || 0)}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{formatDate(dispute.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Event Performance Metrics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Total Events</div>
                <div className="text-2xl font-bold text-text-primary">{events.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Events Today</div>
                <div className="text-2xl font-bold text-text-primary">{getEventsToday().length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Avg Registration Rate</div>
                <div className="text-2xl font-bold text-text-primary">
                  {formatPercent(
                    eventPerformance.length
                      ? eventPerformance.reduce((sum, row) => sum + (row.registrationRate || 0), 0) / eventPerformance.length
                      : 0
                  )}
                </div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Attendance Rate</div>
                <div className="text-2xl font-bold text-text-primary">{formatPercent(attendanceRate)}</div>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-lg font-semibold text-text-primary">Top Performing Events</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Registrations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Fill Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Avg / Registration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {topEventsByRevenue.map((row: any) => (
                      <tr key={row.eventId} className="hover:bg-bg-muted">
                        <td className="px-6 py-4 text-sm text-text-primary">{row.eventTitle}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{row.registrations}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{row.maxRegistrations || "-"}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{formatPercent(row.registrationRate || 0)}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(row.revenue || 0)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{formatCurrency(row.avgRevenuePerRegistration || 0)}</td>
                      </tr>
                    ))}
                    {topEventsByRevenue.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-text-muted" colSpan={6}>No event performance data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {["all", "today", "week"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                    eventFilter === filter
                      ? "bg-primary text-text-inverse"
                      : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  {filter === "all" ? "All Events" : filter === "today" ? "Today" : "This Week"}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {getFilteredEvents().map((event) => {
                const regCount = getEventRegistrationCount(event.id);
                const revenue = getEventRevenue(event.id);
                const capacity = Number(event.max_registrations || 0);
                const fillRate = capacity > 0 ? (regCount / capacity) * 100 : 0;

                return (
                  <div key={event.id} className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">{event.title}</h3>
                        <p className="text-sm text-text-muted mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                          <span>{event.organizer_email}</span>
                          <span>{formatDate(event.start_datetime || event.date)}</span>
                          <span>{event.location || event.venue || "TBA"}</span>
                          <span>{formatCurrency(Number(event.price || 0))}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primarySoft text-primary rounded-full text-xs font-semibold border border-border-default">
                        {event.status || "active"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border-default">
                      <div>
                        <div className="text-2xl font-bold text-text-primary">{regCount}</div>
                        <div className="text-xs text-text-muted">Registrations</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-text-primary">{formatCurrency(revenue)}</div>
                        <div className="text-xs text-text-muted">Revenue</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-text-primary">{capacity || "-"}</div>
                        <div className="text-xs text-text-muted">Capacity</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-text-primary">{formatPercent(fillRate)}</div>
                        <div className="text-xs text-text-muted">Fill Rate</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Payments and Sponsorships</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Ticket Revenue</div>
                <div className="text-2xl font-bold text-text-primary">{formatCurrency(getTotalRevenue())}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Sponsorship Revenue</div>
                <div className="text-2xl font-bold text-text-primary">{formatCurrency(metrics?.totalSponsorshipRevenue || sponsorshipRevenueFromDeals)}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Total Transactions</div>
                <div className="text-2xl font-bold text-text-primary">{registrations.length + sponsorshipPaidDeals.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Average Transaction Value</div>
                <div className="text-2xl font-bold text-text-primary">{formatCurrency((averageTicketValue + averageSponsorshipValue) / (averageSponsorshipValue > 0 ? 2 : 1))}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Settlement Tracking</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Paid Payouts</span>
                    <span className="font-semibold text-text-primary">{payoutsPaid.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Pending Payouts</span>
                    <span className="font-semibold text-text-primary">{payoutsPending.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Platform Earnings</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(metrics?.totalPlatformEarnings || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Paid to Organizers</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(metrics?.totalPaidToOrganizers || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Risk Snapshot</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Open Disputes</span>
                    <span className="font-semibold text-text-primary">{pendingDisputes}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Failed Payments</span>
                    <span className="font-semibold text-text-primary">{getFailedPayments()}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Pending Sponsorship Orders</span>
                    <span className="font-semibold text-text-primary">{sponsorshipPendingDeals.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                    <span className="text-text-secondary">Revenue Today</span>
                    <span className="font-semibold text-text-primary">{formatCurrency(getRevenueToday())}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-lg font-semibold text-text-primary">Ticket Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {registrations.slice(0, 12).map((reg) => {
                      const event = events.find((e) => e.id === reg.event_id);
                      return (
                        <tr key={reg.id} className="hover:bg-bg-muted">
                          <td className="px-6 py-4 text-sm text-text-primary">{reg.student_email || reg.user_email || "-"}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{event?.title || "Unknown"}</td>
                          <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(reg.final_price)}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{reg.status || "registered"}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{formatDate(reg.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-lg font-semibold text-text-primary">Sponsorship Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Sponsor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Pack</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {sponsorships.slice(0, 12).map((deal) => (
                      <tr key={deal.id} className="hover:bg-bg-muted">
                        <td className="px-6 py-4 text-sm text-text-primary">{deal.sponsor_email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{deal.events?.title || deal.fests?.title || "Platform"}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary uppercase">{deal.pack_type || "-"}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(deal.amount || 0)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{deal.status}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{formatDate(deal.created_at)}</td>
                      </tr>
                    ))}
                    {sponsorships.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-text-muted" colSpan={6}>No sponsorship transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SPONSORSHIPS TAB */}
        {activeTab === "sponsorships" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Sponsorship Operations</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Paid Deals</div>
                <div className="text-2xl font-bold text-text-primary">{sponsorshipPaidDeals.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Pending Deals</div>
                <div className="text-2xl font-bold text-text-primary">{sponsorshipPendingDeals.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Total Sponsorship Revenue</div>
                <div className="text-2xl font-bold text-text-primary">{formatCurrency(metrics?.totalSponsorshipRevenue || sponsorshipRevenueFromDeals)}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Pending Payouts</div>
                <div className="text-2xl font-bold text-text-primary">{payoutsPending.length}</div>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-lg font-semibold text-text-primary">Sponsorship Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Sponsor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Pack</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {sponsorships.slice(0, 20).map((deal) => (
                      <tr key={deal.id} className="hover:bg-bg-muted">
                        <td className="px-6 py-4 text-sm text-text-primary">{deal.sponsor_email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{deal.events?.title || deal.fests?.title || "Platform"}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary uppercase">{deal.pack_type || "-"}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(deal.amount || 0)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{deal.status}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{formatDate(deal.created_at)}</td>
                      </tr>
                    ))}
                    {sponsorships.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-text-muted" colSpan={6}>No sponsorship transactions found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-lg font-semibold text-text-primary">Payout Tracking</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Organizer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Gross</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Platform Fee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Payout</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {payouts.slice(0, 20).map((payout) => (
                      <tr key={payout.id} className="hover:bg-bg-muted">
                        <td className="px-6 py-4 text-sm text-text-primary">{payout.organizer_email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{formatCurrency(payout.gross_amount)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{formatCurrency(payout.platform_fee)}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(payout.payout_amount)}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary capitalize">{payout.payout_status}</td>
                        <td className="px-6 py-4 text-sm text-text-muted">{formatDate(payout.created_at)}</td>
                      </tr>
                    ))}
                    {payouts.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-text-muted" colSpan={6}>No payout data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">User Analytics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Students</div>
                <div className="text-2xl font-bold text-text-primary">{students.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Organizers</div>
                <div className="text-2xl font-bold text-text-primary">{organizerUsers.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Sponsors</div>
                <div className="text-2xl font-bold text-text-primary">{sponsors.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Attendance Rate</div>
                <div className="text-2xl font-bold text-text-primary">{formatPercent(attendanceRate)}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setUsersSubTab("students")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  usersSubTab === "students"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Students ({students.length})
              </button>
              <button
                onClick={() => setUsersSubTab("organizers")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  usersSubTab === "organizers"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Organizers ({organizerUsers.length})
              </button>
              <button
                onClick={() => setUsersSubTab("sponsors")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  usersSubTab === "sponsors"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Sponsors ({sponsors.length})
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-3 text-text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Registrations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Events Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Financial Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {getFilteredUsers().map((user) => {
                      const userRegs = getUserRegistrations(user.email);
                      const userEvents = getUserEvents(user.email);
                      const userSpend = userRegs.reduce((sum, reg) => sum + (reg.final_price || 0), 0);
                      const sponsorshipSpend = sponsorships
                        .filter((deal) => deal.sponsor_email === user.email)
                        .reduce((sum, deal) => sum + (deal.amount || 0), 0);

                      return (
                        <tr key={user.email} className="hover:bg-bg-muted">
                          <td className="px-6 py-4 text-sm text-text-primary">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary capitalize">{user.role}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">{formatDate(user.created_at)}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{userRegs.length}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{userEvents.length}</td>
                          <td className="px-6 py-4 text-sm text-text-primary font-semibold">
                            {usersSubTab === "students"
                              ? formatCurrency(userSpend)
                              : usersSubTab === "organizers"
                              ? formatCurrency(userEvents.reduce((sum, evt) => sum + getEventRevenue(evt.id), 0))
                              : formatCurrency(sponsorshipSpend)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORGANIZER MANAGEMENT (within users) */}
        {activeTab === "users" && usersSubTab === "organizers" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">Organizers Management</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">Total Organizers</div>
                <div className="text-2xl font-bold text-text-primary">{organizerUsers.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">KYC Verified</div>
                <div className="text-2xl font-bold text-text-primary">{organizerKycVerified}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">KYC Pending</div>
                <div className="text-2xl font-bold text-text-primary">{organizerKycPending}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted">College Partners</div>
                <div className="text-2xl font-bold text-text-primary">{getTotalColleges()}</div>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="px-6 py-4 border-b border-border-default">
                <h3 className="text-lg font-semibold text-text-primary">Organizer Performance Table</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Organizer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">KYC Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Events</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Registrations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Ticket Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase">Sponsorship Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {organizerPerformanceRows.map((row) => (
                      <tr key={row.email} className="hover:bg-bg-muted">
                        <td className="px-6 py-4 text-sm text-text-primary">{row.email}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary capitalize">{row.organizerType}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary capitalize">{row.kycStatus}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{row.events}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{row.registrations}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(row.ticketRevenue)}</td>
                        <td className="px-6 py-4 text-sm text-text-primary font-semibold">{formatCurrency(row.sponsorshipRevenue)}</td>
                      </tr>
                    ))}
                    {organizerPerformanceRows.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-text-muted" colSpan={7}>No organizer data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 px-2 py-2">
          {[
            { id: "overview", icon: <Icons.Gauge className="h-5 w-5" />, label: "Overview" },
            { id: "events", icon: <Icons.Calendar className="h-5 w-5" />, label: "Events" },
            { id: "users", icon: <Icons.Users className="h-5 w-5" />, label: "Users" },
            { id: "payments", icon: <Icons.Wallet className="h-5 w-5" />, label: "Payments" },
            { id: "sponsorships", icon: <Icons.Handshake className="h-5 w-5" />, label: "Sponsor" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-1 min-w-0 flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "text-primary bg-primarySoft"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="text-text-primary">{tab.icon}</span>
              <span className="text-[11px] font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
