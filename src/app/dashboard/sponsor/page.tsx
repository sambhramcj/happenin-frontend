"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { toast } from "sonner";
import { BannerUploadForm } from "@/components/BannerUploadForm";
import { Icons } from "@/components/icons";
import { SPONSORSHIP_VISIBILITY } from "@/types/sponsorship";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Eye, MousePointer, DollarSign } from "lucide-react";

export default function SponsorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Main tab state
  const [activeTab, setActiveTab] = useState<"discover" | "sponsorships" | "analytics" | "profile">("discover");
  
  // Analytics sub-tabs
  const [analyticsSubTab, setAnalyticsSubTab] = useState<"overview" | "events" | "reports">("overview");

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileForm, setProfileForm] = useState({
    company_name: "",
    logo_url: "",
    website_url: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
  });
  
  // Analytics states
  const [analytics, setAnalytics] = useState<any>({
    totalClicks: 0,
    totalImpressions: 0,
    totalSpent: 0,
    activeSponsorships: 0,
    performanceData: [],
    eventAnalytics: [],
  });

  // Filter states
  const [filters, setFilters] = useState({ 
    college: "", 
    budget_min: "", 
    budget_max: "",
    category: "all"
  });

  // Loading states
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Report generation
  const [reportDateRange, setReportDateRange] = useState({ from: "", to: "" });
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "sponsor") {
      router.replace("/auth");
      return;
    }

    // Remove forced light mode
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light');
    }

    fetchProfile();
    fetchDiscoverEvents();
    fetchDeals();
    fetchAnalytics();
  }, [session, status, router]);

  async function fetchProfile() {
    const res = await fetch("/api/sponsor/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile || null);
      if (data.profile) {
        setProfileForm({
          company_name: data.profile.company_name || "",
          logo_url: data.profile.logo_url || "",
          website_url: data.profile.website_url || "",
          contact_name: data.profile.contact_name || "",
          contact_phone: data.profile.contact_phone || "",
          contact_email: data.profile.contact_email || session?.user?.email || "",
        });
      }
    }
  }

  async function fetchDiscoverEvents() {
    setLoadingEvents(true);
    const params = new URLSearchParams();
    if (filters.college) params.set("college", filters.college);
    if (filters.budget_min) params.set("budget_min", filters.budget_min);
    if (filters.budget_max) params.set("budget_max", filters.budget_max);

    const res = await fetch(`/api/sponsor/discover?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events || []);
    }
    setLoadingEvents(false);
  }

  async function fetchDeals() {
    setLoadingDeals(true);
    const res = await fetch("/api/sponsorships/orders");
    if (res.ok) {
      const data = await res.json();
      setDeals(data.orders || []);
    }
    setLoadingDeals(false);
  }

  async function fetchAnalytics() {
    setLoadingAnalytics(true);
    const res = await fetch("/api/sponsor/analytics");
    if (res.ok) {
      const data = await res.json();
      setAnalytics({
        totalClicks: data.totalClicks || 0,
        totalImpressions: data.totalImpressions || 0,
        totalSpent: deals.filter(d => d.status === 'paid').reduce((sum, d) => sum + (d.amount || 0), 0),
        activeSponsorships: deals.filter(d => d.status === 'paid' && d.visibility_active).length,
        performanceData: data.performanceData || [],
        eventAnalytics: data.eventAnalytics || [],
      });
    }
    setLoadingAnalytics(false);
  }

  async function saveProfile() {
    if (!profileForm.company_name.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch("/api/sponsor/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save profile");
        return;
      }

      toast.success("Profile updated successfully");
      await fetchProfile();
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogoUpload(file: File) {
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/sponsor/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to upload logo");
        return;
      }

      setProfileForm((prev) => ({ ...prev, logo_url: data.url }));
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function generateReport() {
    if (!reportDateRange.from || !reportDateRange.to) {
      toast.error("Please select date range");
      return;
    }

    try {
      setGeneratingReport(true);
      const res = await fetch(`/api/sponsor/reports?from=${reportDateRange.from}&to=${reportDateRange.to}`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sponsorship-report-${reportDateRange.from}-to-${reportDateRange.to}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success("Report downloaded");
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      toast.error("Error generating report");
    } finally {
      setGeneratingReport(false);
    }
  }

  const tabs = [
    { id: "discover", label: "Discover", icon: <Icons.Search className="h-5 w-5" /> },
    { id: "sponsorships", label: "Sponsorships", icon: <Icons.Handshake className="h-5 w-5" /> },
    { id: "analytics", label: "Analytics", icon: <TrendingUp className="h-5 w-5" /> },
    { id: "profile", label: "Profile", icon: <Icons.User className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen bg-bg-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-text-primary">Happenin Sponsor</h1>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={() => toast.info("Notifications coming soon")}
                className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
              >
                <Icons.Bell className="h-6 w-6 text-text-secondary" />
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/auth" })}
                className="px-4 py-2 bg-bg-muted hover:bg-bg-muted/80 text-text-primary rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-border-default">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Warning */}
        {!profile && activeTab !== "profile" && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Icons.AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Profile Incomplete</h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Complete your sponsor profile to access all features.{" "}
                  <button
                    onClick={() => setActiveTab("profile")}
                    className="underline font-medium"
                  >
                    Go to Profile
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* DISCOVER TAB */}
        {activeTab === "discover" && profile && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Discover Events</h2>
              <p className="text-text-secondary">Find events to sponsor and grow your brand visibility</p>
            </div>

            {/* Filters */}
            <div className="bg-bg-card p-6 rounded-xl border border-border-default">
              <h3 className="font-semibold text-text-primary mb-4">Search Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  value={filters.college}
                  onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))}
                  placeholder="College name"
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="cultural">Cultural</option>
                  <option value="technical">Technical</option>
                  <option value="sports">Sports</option>
                  <option value="fest">Fest</option>
                </select>
                <input
                  value={filters.budget_min}
                  onChange={(e) => setFilters((f) => ({ ...f, budget_min: e.target.value }))}
                  placeholder="Min Budget (₹)"
                  type="number"
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
                <input
                  value={filters.budget_max}
                  onChange={(e) => setFilters((f) => ({ ...f, budget_max: e.target.value }))}
                  placeholder="Max Budget (₹)"
                  type="number"
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <button
                onClick={fetchDiscoverEvents}
                className="mt-4 px-6 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-colors"
              >
                Apply Filters
              </button>
            </div>

            {/* Events Grid */}
            {loadingEvents ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-bg-card rounded-xl border border-border-default p-6 animate-pulse">
                    <div className="h-40 bg-bg-muted rounded-lg mb-4"></div>
                    <div className="h-4 bg-bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-bg-muted rounded mb-4"></div>
                    <div className="h-10 bg-bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="bg-bg-card rounded-xl border border-border-default p-12 text-center">
                <Icons.Search className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No events found matching your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="bg-bg-card rounded-xl border border-border-default overflow-hidden hover:shadow-lg transition-shadow">
                    {event.banner_image && (
                      <img
                        src={event.banner_image}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-bold text-text-primary mb-2 line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">{event.description}</p>
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                        <Icons.MapPin className="h-4 w-4" />
                        <span>{event.location}</span>
                        <span>·</span>
                        <span>{event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}</span>
                      </div>
                      {event.expected_registrations && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary mb-4">
                          <Icons.Users className="h-4 w-4" />
                          <span>Expected: {event.expected_registrations} attendees</span>
                        </div>
                      )}
                      <button
                        onClick={() => router.push(`/sponsor/events/${event.id}`)}
                        className="w-full bg-primary text-text-inverse py-2.5 rounded-lg hover:bg-primaryHover transition-colors font-medium"
                      >
                        View Sponsorship Packs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SPONSORSHIPS TAB */}
        {activeTab === "sponsorships" && profile && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">My Sponsorships</h2>
              <p className="text-text-secondary">Manage your active and past sponsorships</p>
            </div>

            {/* Active Sponsorships */}
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-4">Active Sponsorships</h3>
              {loadingDeals ? (
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {deals.filter(d => d.status === 'paid' && d.visibility_active).map((deal) => (
                    <div key={deal.id} className="bg-bg-card border border-border-default rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-bold text-text-primary text-lg">
                            {deal.events?.title || deal.fests?.title || "Event Sponsorship"}
                          </h4>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                              Active
                            </span>
                            <span className="text-sm text-text-secondary">
                              {deal.pack_type} Pack · ₹{deal.amount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("sponsorships");
                            // Scroll to banner management section
                          }}
                          className="px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-colors text-sm"
                        >
                          Manage Banner
                        </button>
                      </div>

                      {deal.pack_type && (
                        <div className="mt-4 bg-bg-muted rounded-lg p-4">
                          <h5 className="text-sm font-semibold text-text-primary mb-2">Visibility Includes:</h5>
                          <ul className="space-y-1.5">
                            {SPONSORSHIP_VISIBILITY[deal.pack_type as keyof typeof SPONSORSHIP_VISIBILITY].map((item) => (
                              <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                                <Icons.Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Banner Management for Active Deal */}
                      <div className="mt-6 border-t border-border-default pt-6">
                        <h5 className="font-semibold text-text-primary mb-4">Banner Management</h5>
                        <BannerUploadForm
                          bannerType="sponsor"
                          sponsorEmail={session?.user?.email}
                          eventId={deal.event_id || undefined}
                          festId={deal.fest_id || undefined}
                          sponsorshipOrderId={deal.id}
                          allowedPlacements={
                            deal.pack_type === "digital" ? ["event_page"] :
                            deal.pack_type === "app" ? ["event_page", "home_top"] :
                            ["event_page", "home_top", "home_mid"]
                          }
                          linkUrl={profile?.website_url || ""}
                          onSuccess={() => toast.success("Banner submitted for approval")}
                        />
                      </div>
                    </div>
                  ))}

                  {deals.filter(d => d.status === 'paid' && d.visibility_active).length === 0 && (
                    <div className="bg-bg-card border border-border-default rounded-xl p-12 text-center">
                      <Icons.Handshake className="h-12 w-12 text-text-muted mx-auto mb-4" />
                      <p className="text-text-secondary mb-4">No active sponsorships yet</p>
                      <button
                        onClick={() => setActiveTab("discover")}
                        className="px-6 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-colors"
                      >
                        Discover Events
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Past Sponsorships */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Past Sponsorships</h3>
              <div className="space-y-3">
                {deals.filter(d => d.status === 'paid' && !d.visibility_active).map((deal) => (
                  <div key={deal.id} className="bg-bg-card border border-border-default rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {deal.events?.title || deal.fests?.title || "Event Sponsorship"}
                        </h4>
                        <div className="text-sm text-text-muted mt-1">
                          {deal.pack_type} Pack · ₹{deal.amount?.toLocaleString()} · Completed
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className="px-4 py-2 bg-bg-muted text-text-primary rounded-lg hover:bg-bg-muted/80 transition-colors text-sm"
                      >
                        View Analytics
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && profile && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Analytics & Reports</h2>
              <p className="text-text-secondary">Track your sponsorship performance and ROI</p>
            </div>

            {/* Analytics Sub-tabs */}
            <div className="flex gap-2 border-b border-border-default pb-2">
              {["overview", "events", "reports"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAnalyticsSubTab(tab as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                    analyticsSubTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Overview Sub-tab */}
            {analyticsSubTab === "overview" && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Eye className="h-8 w-8 opacity-80" />
                      <span className="text-2xl font-bold">{analytics.totalImpressions}</span>
                    </div>
                    <div className="text-sm opacity-90">Total Impressions</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <MousePointer className="h-8 w-8 opacity-80" />
                      <span className="text-2xl font-bold">{analytics.totalClicks}</span>
                    </div>
                    <div className="text-sm opacity-90">Total Clicks</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="h-8 w-8 opacity-80" />
                      <span className="text-2xl font-bold">₹{(analytics.totalSpent / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="text-sm opacity-90">Total Spent</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="h-8 w-8 opacity-80" />
                      <span className="text-2xl font-bold">{analytics.activeSponsorships}</span>
                    </div>
                    <div className="text-sm opacity-90">Active Sponsorships</div>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="bg-bg-card rounded-xl border border-border-default p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Performance Overview</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="impressions" stroke="#8884d8" name="Impressions" />
                        <Line type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sponsorship History Timeline */}
                <div className="bg-bg-card rounded-xl border border-border-default p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Sponsorship History</h3>
                  <div className="space-y-4">
                    {deals.map((deal, index) => (
                      <div key={deal.id} className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div className="flex-1">
                          <div className="font-medium text-text-primary">
                            {deal.events?.title || deal.fests?.title} - {deal.pack_type} Pack
                          </div>
                          <div className="text-sm text-text-secondary">
                            ₹{deal.amount?.toLocaleString()} · {new Date(deal.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          deal.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>
                          {deal.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Events Sub-tab */}
            {analyticsSubTab === "events" && (
              <div className="space-y-6">
                <div className="bg-bg-card rounded-xl border border-border-default p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Event-wise Analytics</h3>
                  {analytics.eventAnalytics.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      No analytics data available yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border-default">
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">Event</th>
                            <th className="text-left py-3 px-4 text-text-secondary font-medium">Pack Type</th>
                            <th className="text-right py-3 px-4 text-text-secondary font-medium">Impressions</th>
                            <th className="text-right py-3 px-4 text-text-secondary font-medium">Clicks</th>
                            <th className="text-right py-3 px-4 text-text-secondary font-medium">CTR</th>
                            <th className="text-right py-3 px-4 text-text-secondary font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.eventAnalytics.map((event: any, index: number) => (
                            <tr key={index} className="border-b border-border-default hover:bg-bg-muted">
                              <td className="py-3 px-4 text-text-primary">{event.eventName}</td>
                              <td className="py-3 px-4 text-text-secondary capitalize">{event.packType}</td>
                              <td className="py-3 px-4 text-right text-text-primary">{event.impressions}</td>
                              <td className="py-3 px-4 text-right text-text-primary">{event.clicks}</td>
                              <td className="py-3 px-4 text-right text-text-primary">
                                {event.impressions > 0 ? ((event.clicks / event.impressions) * 100).toFixed(2) : 0}%
                              </td>
                              <td className="py-3 px-4 text-right text-text-primary">₹{event.amount?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reports Sub-tab */}
            {analyticsSubTab === "reports" && (
              <div className="space-y-6">
                <div className="bg-bg-card rounded-xl border border-border-default p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Generate Custom Reports</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">From Date</label>
                        <input
                          type="date"
                          value={reportDateRange.from}
                          onChange={(e) => setReportDateRange(prev => ({ ...prev, from: e.target.value }))}
                          className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">To Date</label>
                        <input
                          type="date"
                          value={reportDateRange.to}
                          onChange={(e) => setReportDateRange(prev => ({ ...prev, to: e.target.value }))}
                          className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={generateReport}
                        disabled={generatingReport}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-colors disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {generatingReport ? "Generating..." : "Download PDF Report"}
                      </button>
                      <button
                        onClick={generateReport}
                        disabled={generatingReport}
                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                        {generatingReport ? "Generating..." : "Download CSV"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bg-card rounded-xl border border-border-default p-5">
                    <h4 className="font-semibold text-text-primary mb-2">Sponsorship Summary Report</h4>
                    <p className="text-sm text-text-secondary mb-4">All sponsorships with key metrics and status</p>
                    <button className="text-primary hover:underline text-sm font-medium">Generate →</button>
                  </div>

                  <div className="bg-bg-card rounded-xl border border-border-default p-5">
                    <h4 className="font-semibold text-text-primary mb-2">Performance Report</h4>
                    <p className="text-sm text-text-secondary mb-4">Detailed engagement metrics and ROI analysis</p>
                    <button className="text-primary hover:underline text-sm font-medium">Generate →</button>
                  </div>

                  <div className="bg-bg-card rounded-xl border border-border-default p-5">
                    <h4 className="font-semibold text-text-primary mb-2">Budget Report</h4>
                    <p className="text-sm text-text-secondary mb-4">Spending breakdown by event and pack type</p>
                    <button className="text-primary hover:underline text-sm font-medium">Generate →</button>
                  </div>

                  <div className="bg-bg-card rounded-xl border border-border-default p-5">
                    <h4 className="font-semibold text-text-primary mb-2">Event Comparison Report</h4>
                    <p className="text-sm text-text-secondary mb-4">Compare performance across multiple events</p>
                    <button className="text-primary hover:underline text-sm font-medium">Generate →</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Profile Settings</h2>
              <p className="text-text-secondary">Manage your company profile and account settings</p>
            </div>

            {/* Profile Form */}
            <div className="bg-bg-card rounded-xl border border-border-default p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-6">Company Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={profileForm.company_name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, company_name: e.target.value }))}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Your Company Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Website URL</label>
                  <input
                    value={profileForm.website_url}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, website_url: e.target.value }))}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://yourcompany.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Contact Name</label>
                  <input
                    value={profileForm.contact_name}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Contact Phone</label>
                  <input
                    value={profileForm.contact_phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Contact Email</label>
                  <input
                    value={profileForm.contact_email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Logo URL</label>
                  <input
                    value={profileForm.logo_url}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://cdn.example.com/logo.png"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">Upload Logo</label>
                <div className="flex items-center gap-4">
                  {profileForm.logo_url && (
                    <img
                      src={profileForm.logo_url}
                      alt="Company logo"
                      className="w-16 h-16 rounded-lg object-contain bg-bg-muted border border-border-default"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/png, image/svg+xml, image/jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    disabled={uploadingLogo}
                    className="flex-1 bg-bg-muted border border-border-default rounded-lg px-4 py-2.5 text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-text-inverse hover:file:bg-primaryHover"
                  />
                </div>
                {uploadingLogo && (
                  <div className="text-sm text-text-secondary mt-2">Uploading logo...</div>
                )}
              </div>

              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="mt-6 px-8 py-3 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-colors font-medium disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>

            {/* Settings Section */}
            <div className="bg-bg-card rounded-xl border border-border-default p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 text-primary bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all checked:bg-primary checked:border-primary cursor-pointer" defaultChecked />
                  <span className="text-text-primary group-hover:text-primary transition-colors">Email notifications for new events</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 text-primary bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all checked:bg-primary checked:border-primary cursor-pointer" defaultChecked />
                  <span className="text-text-primary group-hover:text-primary transition-colors">Payment confirmations</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 text-primary bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all checked:bg-primary checked:border-primary cursor-pointer" defaultChecked />
                  <span className="text-text-primary group-hover:text-primary transition-colors">Weekly analytics reports</span>
                </label>
              </div>
            </div>

            {/* Verification Status */}
            {profile && (
              <div className="bg-bg-card rounded-xl border border-border-default p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Account Status</h3>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-text-primary">Profile Complete & Verified</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
