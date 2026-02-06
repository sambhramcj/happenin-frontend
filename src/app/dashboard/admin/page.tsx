"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { RevenueChart, UserGrowthChart } from "@/components/Charts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminTableSkeleton, AdminTimelineSkeleton } from "@/components/skeletons";
import AdminSponsorshipsPage from "@/app/dashboard/admin/sponsorships/page";

interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  totalUsers: number;
  totalEvents: number;
}

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: string;
  organizer_email: string;
  banner_image?: string;
  created_at: string;
};

type Registration = {
  id: string;
  student_email: string;
  event_id: string;
  final_price: number;
  created_at: string;
};

type User = {
  email: string;
  role: string;
  created_at: string;
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "colleges" | "events" | "payments" | "users" | "sponsorships">("overview");
  const [usersSubTab, setUsersSubTab] = useState<"students" | "organizers">("students");
  const [analyticsTab, setAnalyticsTab] = useState<"overview" | "revenue" | "users" | "events" | "logs" | "reports" | "disputes">("overview");

  // Data states
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [tierOverrides, setTierOverrides] = useState<Record<string, 'title' | 'gold' | 'silver' | 'partner'>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Analytics states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [eventPerformance, setEventPerformance] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [reports, setReports] = useState<{ userReports: any[], eventReports: any[] }>({ userReports: [], eventReports: [] });
  const [disputes, setDisputes] = useState<any[]>([]);
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [updatingDisputeId, setUpdatingDisputeId] = useState<string | null>(null);

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
        setSponsorships(json.sponsorships || []);
      }
    } catch (e) {
      // noop
    }
  }

  async function reviewSponsorship(id: string, action: 'approve' | 'reject') {
    try {
      setReviewingId(id);
      const tier = tierOverrides[id];
      const res = await fetch('/api/admin/sponsorships/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorshipId: id, action, ...(tier ? { tier } : {}) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || 'Failed to update sponsorship');
        return;
      }
      toast.success(action === 'approve' ? 'Sponsorship approved' : 'Sponsorship rejected');
      await fetchSponsorships();
    } catch (e) {
      toast.error('Request failed');
    } finally {
      setReviewingId(null);
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
    return events.filter(e => new Date(e.date).toDateString() === today);
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
    let filtered = users.filter(u => u.role === usersSubTab.slice(0, -1)); // Remove 's' from end

    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }

  function getUserRegistrations(email: string) {
    return registrations.filter(r => r.student_email === email);
  }

  function getUserEvents(email: string) {
    return events.filter(e => e.organizer_email === email);
  }

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
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Admin Control</h1>
              <p className="text-xs text-text-muted">Platform Management</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Nav */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-border-default">
          {[
            { id: "overview", label: "Overview", icon: <Icons.Gauge className="h-4 w-4" /> },
            { id: "analytics", label: "Analytics", icon: <Icons.TrendingUp className="h-4 w-4" /> },
            { id: "events", label: "Events", icon: <Icons.Calendar className="h-4 w-4" /> },
            { id: "payments", label: "Payments", icon: <Icons.Wallet className="h-4 w-4" /> },
            { id: "users", label: "Users", icon: <Icons.Users className="h-4 w-4" /> },
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
                {activeTab === "sponsorships" && (
                  <div className="space-y-6">
                    <AdminSponsorshipsPage />
                  </div>
                )}
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Analytics Metrics */}
            {metrics && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Icons.TrendingUp className="h-5 w-5 text-primary" /> Analytics Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <Icons.Wallet className="h-6 w-6 mb-2 text-green-500" />
                    <div className="text-3xl font-bold text-text-primary">₹{metrics.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-text-muted">Total Revenue</div>
                  </div>
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <Icons.Ticket className="h-6 w-6 mb-2 text-blue-500" />
                    <div className="text-3xl font-bold text-text-primary">{metrics.totalTransactions}</div>
                    <div className="text-sm text-text-muted">Transactions</div>
                  </div>
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <Icons.Users className="h-6 w-6 mb-2 text-purple-500" />
                    <div className="text-3xl font-bold text-text-primary">{metrics.totalUsers}</div>
                    <div className="text-sm text-text-muted">Total Users</div>
                  </div>
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <Icons.Calendar className="h-6 w-6 mb-2 text-orange-500" />
                    <div className="text-3xl font-bold text-text-primary">{metrics.totalEvents}</div>
                    <div className="text-sm text-text-muted">Total Events</div>
                  </div>
                </div>
              </section>
            )}

            {/* Global Snapshot */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Gauge className="h-5 w-5 text-primary" /> Global Snapshot
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <Icons.Building2 className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{getTotalColleges()}</div>
                  <div className="text-sm text-text-muted">Colleges Live</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <Icons.Calendar className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{getEventsToday().length}</div>
                  <div className="text-sm text-text-muted">Events Today</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <Icons.Ticket className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{getRegistrationsToday().length}</div>
                  <div className="text-sm text-text-muted">Regs Today</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <Icons.Wallet className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">₹{getRevenueToday()}</div>
                  <div className="text-sm text-text-muted">Revenue Today</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <Icons.AlertTriangle className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-error">{getFailedPayments()}</div>
                  <div className="text-sm text-text-muted">Failed Payments</div>
                </div>
              </div>
            </section>

            {/* Activity Timeline */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.TrendingUp className="h-5 w-5 text-primary" /> Recent Activity (24h)
              </h2>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-bg-muted rounded-lg">
                      <span className="text-2xl">✨</span>
                      <div className="flex-1">
                        <p className="text-text-primary font-medium">{event.title}</p>
                        <p className="text-xs text-text-muted">Created by {event.organizer_email}</p>
                      </div>
                      <span className="text-xs text-text-muted">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className="text-text-muted text-center py-8">No recent activity</p>
                  )}
                </div>
              </div>
            </section>

            {/* Alerts */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.AlertTriangle className="h-5 w-5 text-primary" /> Critical Alerts
              </h2>
              <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
                <div className="text-5xl mb-3">✔️</div>
                <p className="text-text-secondary">All systems operational</p>
                <p className="text-sm text-text-muted mt-2">No critical alerts at this time</p>
              </div>
            </section>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Icons.TrendingUp className="h-5 w-5" /> Advanced Analytics
            </h2>

            {/* Analytics Sub-tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'revenue', label: 'Revenue' },
                { id: 'users', label: 'User Growth' },
                { id: 'events', label: 'Event Performance' },
                { id: 'logs', label: 'Admin Logs' },
                { id: 'reports', label: 'Reports' },
                { id: 'disputes', label: 'Disputes' },
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setAnalyticsTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    analyticsTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-bg-muted text-text-secondary hover:bg-bg-elevated'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview Sub-tab */}
            {analyticsTab === 'overview' && metrics && (
              <div className="space-y-6">
                {/* Revenue Overview */}
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-bg-muted rounded-lg">
                      <div className="text-sm text-text-muted mb-1">Total Revenue</div>
                      <div className="text-2xl font-bold text-text-primary">₹{metrics.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div className="p-4 bg-bg-muted rounded-lg">
                      <div className="text-sm text-text-muted mb-1">Total Transactions</div>
                      <div className="text-2xl font-bold text-text-primary">{metrics.totalTransactions}</div>
                    </div>
                    <div className="p-4 bg-bg-muted rounded-lg">
                      <div className="text-sm text-text-muted mb-1">Avg Transaction Value</div>
                      <div className="text-2xl font-bold text-text-primary">
                        ₹{metrics.totalTransactions > 0 ? Math.round(metrics.totalRevenue / metrics.totalTransactions).toLocaleString() : 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Stats */}
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Platform Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-muted rounded-lg flex items-center gap-4">
                      <Icons.Users className="h-8 w-8 text-purple-500" />
                      <div>
                        <div className="text-sm text-text-muted">Total Users</div>
                        <div className="text-xl font-bold text-text-primary">{metrics.totalUsers}</div>
                      </div>
                    </div>
                    <div className="p-4 bg-bg-muted rounded-lg flex items-center gap-4">
                      <Icons.Calendar className="h-8 w-8 text-orange-500" />
                      <div>
                        <div className="text-sm text-text-muted">Total Events</div>
                        <div className="text-xl font-bold text-text-primary">{metrics.totalEvents}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <div className="text-sm text-text-muted mb-2">Pending Reports</div>
                    <div className="text-3xl font-bold text-orange-500">
                      {reports.userReports?.length + reports.eventReports?.length || 0}
                    </div>
                  </div>
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <div className="text-sm text-text-muted mb-2">Pending Disputes</div>
                    <div className="text-3xl font-bold text-red-500">{disputes.length}</div>
                  </div>
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <div className="text-sm text-text-muted mb-2">Recent Admin Actions</div>
                    <div className="text-3xl font-bold text-blue-500">{adminLogs.length}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Sub-tab */}
            {analyticsTab === 'revenue' && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Trend (Last 30 Days)</h3>
                {revenueData.length > 0 ? (
                  <RevenueChart data={revenueData} type="bar" />
                ) : (
                  <div className="text-center py-8 text-text-muted">No revenue data available</div>
                )}
              </div>
            )}

            {/* User Growth Sub-tab */}
            {analyticsTab === 'users' && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">User Growth (Last 30 Days)</h3>
                {userGrowthData.length > 0 ? (
                  <UserGrowthChart data={userGrowthData} />
                ) : (
                  <div className="text-center py-8 text-text-muted">No user growth data available</div>
                )}
              </div>
            )}

            {/* Event Performance Sub-tab */}
            {analyticsTab === 'events' && (
              <div className="space-y-6">
                {/* Event Performance Table */}
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Top Performing Events</h3>
                  {eventPerformance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="border-b border-border-default">
                          <tr className="text-left text-text-secondary">
                            <th className="px-4 py-3">Event</th>
                            <th className="px-4 py-3">Registrations</th>
                            <th className="px-4 py-3">Fill Rate</th>
                            <th className="px-4 py-3">Revenue</th>
                            <th className="px-4 py-3">Avg/Reg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventPerformance.slice(0, 10).map((event: any) => (
                            <tr key={event.eventId} className="border-b border-border-default">
                              <td className="px-4 py-3 text-text-primary">{event.eventTitle}</td>
                              <td className="px-4 py-3">{event.registrations}/{event.maxRegistrations}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-2 bg-bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary" 
                                      style={{ width: `${event.registrationRate}%` }}
                                    />
                                  </div>
                                  <span className="text-text-secondary">{event.registrationRate}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium">₹{event.revenue.toLocaleString()}</td>
                              <td className="px-4 py-3 text-text-secondary">₹{Math.round(event.avgRevenuePerRegistration)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">No event performance data available</div>
                  )}
                </div>

              </div>
            )}

            {/* Admin Logs Sub-tab */}
            {analyticsTab === 'logs' && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Admin Actions</h3>
                {adminLogs.length > 0 ? (
                  <div className="space-y-3">
                    {adminLogs.map((log: any) => (
                      <div key={log.id} className="p-4 bg-bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium text-text-primary">{log.action}</div>
                            <div className="text-sm text-text-muted mt-1">
                              By {log.admin_email} • {new Date(log.created_at).toLocaleString()}
                            </div>
                            {log.details && (
                              <div className="text-xs text-text-secondary mt-2 font-mono">
                                {JSON.stringify(log.details, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">No admin logs available</div>
                )}
              </div>
            )}

            {/* Reports Sub-tab */}
            {analyticsTab === 'reports' && (
              <div className="space-y-6">
                {/* User Reports */}
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">User Reports</h3>
                  {reports.userReports?.length > 0 ? (
                    <div className="space-y-3">
                      {reports.userReports.map((report: any) => (
                        <div key={report.id} className="p-4 bg-bg-muted rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-text-primary">Reported User: {report.reported_user_email}</div>
                              <div className="text-sm text-text-secondary mt-1">Reason: {report.reason}</div>
                              <div className="text-xs text-text-muted mt-2">
                                Reported by {report.reported_by_email} • {new Date(report.created_at).toLocaleString()}
                              </div>
                              {report.status !== 'pending' && (
                                <div className="text-xs text-text-secondary mt-2 font-mono">
                                  Status: {report.status} | Action: {report.action_taken || 'N/A'}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <select 
                                value={report.status}
                                onChange={async (e) => {
                                  setUpdatingReportId(report.id);
                                  try {
                                    await fetch('/api/admin/reports', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        reportId: report.id,
                                        type: 'user',
                                        status: e.target.value,
                                        actionTaken: reportNotes[report.id] || null
                                      })
                                    });
                                    toast.success('Report updated');
                                    fetchAnalyticsData();
                                  } catch (error) {
                                    toast.error('Failed to update report');
                                  } finally {
                                    setUpdatingReportId(null);
                                  }
                                }}
                                disabled={updatingReportId === report.id}
                                className="px-3 py-1 bg-bg-muted border border-border-default rounded-lg text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="dismissed">Dismissed</option>
                                <option value="action_taken">Action Taken</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">No pending user reports</div>
                  )}
                </div>

                {/* Event Reports */}
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Event Reports</h3>
                  {reports.eventReports?.length > 0 ? (
                    <div className="space-y-3">
                      {reports.eventReports.map((report: any) => (
                        <div key={report.id} className="p-4 bg-bg-muted rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-text-primary">Event ID: {report.event_id}</div>
                              <div className="text-sm text-text-secondary mt-1">Reason: {report.reason}</div>
                              <div className="text-xs text-text-muted mt-2">
                                Reported by {report.reported_by_email} • {new Date(report.created_at).toLocaleString()}
                              </div>
                              {report.status !== 'pending' && (
                                <div className="text-xs text-text-secondary mt-2 font-mono">
                                  Status: {report.status} | Action: {report.action_taken || 'N/A'}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <select 
                                value={report.status}
                                onChange={async (e) => {
                                  setUpdatingReportId(report.id);
                                  try {
                                    await fetch('/api/admin/reports', {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        reportId: report.id,
                                        type: 'event',
                                        status: e.target.value,
                                        actionTaken: reportNotes[report.id] || null
                                      })
                                    });
                                    toast.success('Report updated');
                                    fetchAnalyticsData();
                                  } catch (error) {
                                    toast.error('Failed to update report');
                                  } finally {
                                    setUpdatingReportId(null);
                                  }
                                }}
                                disabled={updatingReportId === report.id}
                                className="px-3 py-1 bg-bg-muted border border-border-default rounded-lg text-xs"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="dismissed">Dismissed</option>
                                <option value="action_taken">Action Taken</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-text-muted">No pending event reports</div>
                  )}
                </div>
              </div>
            )}

            {/* Disputes Sub-tab */}
            {analyticsTab === 'disputes' && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Payment Disputes</h3>
                {disputes.length > 0 ? (
                  <div className="space-y-3">
                    {disputes.map((dispute: any) => (
                      <div key={dispute.id} className="p-4 bg-bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-text-primary">Payment ID: {dispute.payment_id}</div>
                            <div className="text-sm text-text-secondary mt-1">Reason: {dispute.reason}</div>
                            <div className="text-sm text-text-secondary">Amount: ₹{dispute.amount}</div>
                            <div className="text-xs text-text-muted mt-2">
                              By {dispute.student_email} • {new Date(dispute.created_at).toLocaleString()}
                            </div>
                            <div className="mt-2 flex gap-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                                dispute.status === 'open' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700/50' :
                                dispute.status === 'investigating' ? 'bg-blue-900/20 text-blue-400 border-blue-700/50' :
                                dispute.status === 'resolved' ? 'bg-green-900/20 text-green-400 border-green-700/50' :
                                dispute.status === 'refunded' ? 'bg-green-900/30 text-green-300 border-green-700/50' :
                                'bg-gray-800 text-gray-300 border-gray-700'
                              }`}>
                                {dispute.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <select 
                              value={dispute.status}
                              onChange={async (e) => {
                                setUpdatingDisputeId(dispute.id);
                                try {
                                  await fetch('/api/admin/disputes', {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      disputeId: dispute.id,
                                      status: e.target.value,
                                      adminNotes: disputeNotes[dispute.id] || null
                                    })
                                  });
                                  toast.success(`Dispute updated to ${e.target.value}`);
                                  fetchAnalyticsData();
                                } catch (error) {
                                  toast.error('Failed to update dispute');
                                }
                              }}
                              disabled={updatingDisputeId === dispute.id}
                              className="px-3 py-1 bg-bg-muted border border-border-default rounded-lg text-xs"
                            >
                              <option value="open">Open</option>
                              <option value="investigating">Investigating</option>
                              <option value="resolved">Resolved</option>
                              <option value="refunded">Refunded</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text-muted">No pending disputes</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* COLLEGES TAB */}
        {activeTab === "colleges" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <span>🏫</span> Colleges ({getTotalColleges()})
            </h2>

            <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
              <div className="text-5xl mb-3">🏭</div>
              <p className="text-text-secondary">College management coming soon</p>
              <p className="text-sm text-text-muted mt-2">View and manage registered colleges</p>
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <span>�</span> All Events ({events.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["all", "today", "week"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setEventFilter(filter as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    eventFilter === filter
                      ? "bg-primary text-text-inverse"
                      : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  {filter === "all" ? "All Events" : filter === "today" ? "Today" : "This Week"}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="space-y-4">
              {getFilteredEvents().map((event) => {
                const regCount = getEventRegistrationCount(event.id);
                const revenue = getEventRevenue(event.id);

                return (
                  <div key={event.id} className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-text-primary mb-2">{event.title}</h3>
                        <p className="text-sm text-text-muted mb-3 line-clamp-2">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                          <span>� {event.organizer_email}</span>
                          <span>📋 {new Date(event.date).toLocaleDateString()}</span>
                          <span>📍 {event.location}</span>
                          <span>💵 ₹{event.price}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-900/30 text-success rounded-full text-xs font-semibold border border-success">
                        🟢 Active
                      </span>
                    </div>
                    <div className="flex items-center gap-6 pt-4 border-t border-border-default">
                      <div>
                        <div className="text-2xl font-bold text-text-primary">{regCount}</div>
                        <div className="text-xs text-text-muted">Registrations</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-text-primary">₹{revenue}</div>
                        <div className="text-xs text-text-muted">Revenue</div>
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
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <span>💰</span> Payments
            </h2>

            {/* Payment Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Total Revenue</div>
                <div className="text-2xl font-bold text-text-primary">₹{getTotalRevenue()}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Transactions</div>
                <div className="text-2xl font-bold text-text-primary">{registrations.length}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Today</div>
                <div className="text-2xl font-bold text-text-primary">₹{getRevenueToday()}</div>
              </div>
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="text-sm text-text-muted mb-2">Failed</div>
                <div className="text-2xl font-bold text-error">{getFailedPayments()}</div>
              </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-bg-card rounded-xl overflow-hidden border border-border-default">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registrations.slice(0, 10).map((reg) => {
                      const event = events.find(e => e.id === reg.event_id);
                      return (
                        <tr key={reg.id} className="hover:bg-bg-muted transition-all duration-fast ease-standard">
                          <td className="px-6 py-4 text-sm text-text-primary">{reg.student_email}</td>
                          <td className="px-6 py-4 text-sm text-text-secondary">{event?.title || 'Unknown'}</td>
                          <td className="px-6 py-4 text-sm text-text-primary font-semibold">₹{reg.final_price}</td>
                          <td className="px-6 py-4 text-sm text-text-muted">
                            {new Date(reg.created_at).toLocaleDateString()}
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

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <span>👥</span> Users
            </h2>

            {/* Sub-tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setUsersSubTab("students")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  usersSubTab === "students"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Students ({users.filter(u => u.role === "student").length})
              </button>
              <button
                onClick={() => setUsersSubTab("organizers")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  usersSubTab === "organizers"
                    ? "bg-primary text-text-inverse"
                    : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                }`}
              >
                Organizers ({users.filter(u => u.role === "organizer").length})
              </button>
            </div>

            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-3 text-text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* User List */}
            <div className="space-y-3">
              {getFilteredUsers().map((user) => {
                const userRegs = getUserRegistrations(user.email);
                const userEvents = getUserEvents(user.email);

                return (
                  <div
                    key={user.email}
                    onClick={() => setSelectedUser(user)}
                    className="bg-bg-card rounded-xl p-6 border border-border-default hover:border-violet-700 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-text-primary mb-2">{user.email}</h3>
                        <div className="flex gap-4 text-sm text-text-muted">
                          <span>📅 Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          {usersSubTab === "students" && (
                            <span>🎟 {userRegs.length} registrations</span>
                          )}
                          {usersSubTab === "organizers" && (
                            <span>📅 {userEvents.length} events</span>
                          )}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-primarySoft text-primary rounded-full text-xs font-semibold border border-border-default">
                        {user.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 px-2 py-2">
          {[
            { id: "overview", icon: "📊", label: "Overview" },
            { id: "colleges", icon: "🏫", label: "Colleges" },
            { id: "events", icon: "📅", label: "Events" },
            { id: "payments", icon: "💰", label: "Payments" },
            { id: "users", icon: "👥", label: "Users" },
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
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-[11px] font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
