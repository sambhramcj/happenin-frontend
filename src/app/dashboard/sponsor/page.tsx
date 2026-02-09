"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { BannerUploadForm } from "@/components/BannerUploadForm";
import { Icons } from "@/components/icons";
import { SPONSORSHIP_VISIBILITY } from "@/types/sponsorship";

export default function SponsorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"discover" | "my" | "banners">("discover");
  const [events, setEvents] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [profileForm, setProfileForm] = useState({
    company_name: "",
    logo_url: "",
    website_url: "",
    contact_name: "",
    contact_phone: "",
  });
  const [analytics, setAnalytics] = useState<{ totalClicks: number; totalImpressions: number }>({
    totalClicks: 0,
    totalImpressions: 0,
  });
  const [filters, setFilters] = useState({ college: "", budget_min: "", budget_max: "" });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "sponsor") {
      router.replace("/auth");
      return;
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
    const res = await fetch("/api/sponsorship/deals");
    if (res.ok) {
      const data = await res.json();
      setDeals(data.deals || []);
    }
    setLoadingDeals(false);
  }

  async function fetchAnalytics() {
    const res = await fetch("/api/sponsor/analytics");
    if (res.ok) {
      const data = await res.json();
      setAnalytics({
        totalClicks: data.totalClicks || 0,
        totalImpressions: data.totalImpressions || 0,
      });
    }
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

      toast.success("Sponsor profile saved");
      await fetchProfile();
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-muted pb-24">
      <div className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-default">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Happenin</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.info("Notifications coming soon")}
              className="p-2 hover:bg-bg-muted rounded-lg"
            >
              <Icons.Bell className="h-6 w-6 text-text-secondary" />
            </button>
          </div>
        </div>
          <div className="border-t border-border-default">
          <div className="max-w-7xl mx-auto px-4 flex gap-2">
            <button
              onClick={() => setActiveTab("discover")}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === "discover" ? "border-primary text-primary" : "border-transparent text-text-secondary"
              }`}
            >
              Discover Events
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === "my" ? "border-primary text-primary" : "border-transparent text-text-secondary"
              }`}
            >
              My Sponsorships
            </button>
            <button
              onClick={() => setActiveTab("banners")}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === "banners" ? "border-primary text-primary" : "border-transparent text-text-secondary"
              }`}
            >
              Banners
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!profile && (
          <div className="bg-bg-card rounded-xl border border-border-default p-6 mb-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">Create Sponsor Profile</h2>
            <p className="text-sm text-text-secondary mb-4">
              Complete your sponsor profile before submitting sponsorships.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Company Name</label>
                <input
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, company_name: e.target.value }))}
                  className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Website URL</label>
                <input
                  value={profileForm.website_url}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, website_url: e.target.value }))}
                  className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Logo URL</label>
                <input
                  value={profileForm.logo_url}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, logo_url: e.target.value }))}
                  className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Contact Name</label>
                <input
                  value={profileForm.contact_name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-2">Contact Phone</label>
                <input
                  value={profileForm.contact_phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
            </div>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-4 px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover disabled:opacity-50"
            >
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        )}

        {profile && (
          <div className="bg-bg-card rounded-xl border border-border-default p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Sponsor Analytics</h2>
                <p className="text-sm text-text-secondary">Banner impressions and clicks</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-bg-muted border border-border-default rounded-lg px-4 py-3">
                  <div className="text-sm text-text-secondary">Impressions</div>
                  <div className="text-xl font-bold text-text-primary">{analytics.totalImpressions}</div>
                </div>
                <div className="bg-bg-muted border border-border-default rounded-lg px-4 py-3">
                  <div className="text-sm text-text-secondary">Clicks</div>
                  <div className="text-xl font-bold text-text-primary">{analytics.totalClicks}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        {profile && activeTab === "discover" && (
          <div className="space-y-6">
            <div className="bg-bg-card p-4 rounded-xl border border-border-default">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={filters.college}
                  onChange={(e) => setFilters((f) => ({ ...f, college: e.target.value }))}
                  placeholder="College"
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
                <input
                  value={filters.budget_min}
                  onChange={(e) => setFilters((f) => ({ ...f, budget_min: e.target.value }))}
                  placeholder="Min Budget"
                  type="number"
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
                <input
                  value={filters.budget_max}
                  onChange={(e) => setFilters((f) => ({ ...f, budget_max: e.target.value }))}
                  placeholder="Max Budget"
                  type="number"
                  className="bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <button
                onClick={fetchDiscoverEvents}
                className="mt-3 px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover"
              >
                Apply Filters
              </button>
            </div>

            {loadingEvents ? (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">Loading events...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
                    {event.banner_image && (
                      <img src={event.banner_image} alt={event.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-text-primary mb-1 line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-text-secondary mb-2 line-clamp-2">{event.description}</p>
                      <div className="text-xs text-text-muted mb-3">
                        {event.location} · {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}
                      </div>
                      <button
                        onClick={() => router.push(`/sponsor/events/${event.id}`)}
                        className="w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover"
                      >
                        View Packs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {profile && activeTab === "my" && (
          <div className="space-y-4">
            {loadingDeals ? (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">Loading sponsorships...</div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="bg-bg-card border border-border-default rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text-primary">
                          {deal.events?.title || deal.fests?.title || "Fest Sponsorship"}
                        </div>
                        <div className="text-xs text-text-muted">{deal.sponsorship_packages?.type} · ₹{deal.sponsorship_packages?.price}</div>
                        <div className="text-xs text-text-muted">Status: {deal.payment_status}</div>
                      </div>
                      <div className="text-xs text-text-secondary">
                        {deal.visibility_active ? "Visibility Active" : "Visibility Pending"}
                      </div>
                    </div>
                    {deal.sponsorship_packages?.type && (
                      <div className="mt-3">
                        <div className="text-xs text-text-secondary mb-2">Visibility includes</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {SPONSORSHIP_VISIBILITY[deal.sponsorship_packages.type as keyof typeof SPONSORSHIP_VISIBILITY].map(
                            (item) => (
                              <li key={item} className="text-xs text-text-secondary">
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                {deals.length === 0 && (
                  <div className="text-text-muted">No sponsorships yet</div>
                )}
              </div>
            )}
          </div>
        )}

        {profile && activeTab === "banners" && (
          <div className="space-y-6">
            {deals
              .filter((deal) => deal.payment_status === "verified")
              .map((deal) => {
                const packType = deal.sponsorship_packages?.type;
                const placements: Array<"home_top" | "home_mid" | "event_page"> = [];

                if (packType === "digital") placements.push("event_page");
                if (packType === "app") placements.push("event_page", "home_top");
                if (packType === "fest") placements.push("home_top", "home_mid");

                return (
                  <div key={deal.id} className="bg-bg-card rounded-xl border border-border-default p-6 space-y-3">
                    <div>
                      <div className="text-lg font-semibold text-text-primary">
                        {deal.events?.title || deal.fests?.title || "Fest Sponsorship"}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {packType} visibility pack
                      </div>
                    </div>
                    <BannerUploadForm
                      bannerType="sponsor"
                      sponsorEmail={session?.user?.email}
                      eventId={deal.event_id || undefined}
                      festId={deal.fest_id || undefined}
                      sponsorshipDealId={deal.id}
                      allowedPlacements={placements}
                      linkUrl={profile?.website_url || ""}
                      onSuccess={() => toast.success("Banner submitted for approval")}
                    />
                  </div>
                );
              })}
            {deals.filter((deal) => deal.payment_status === "verified").length === 0 && (
              <div className="bg-bg-card border border-border-default rounded-xl p-6 text-text-muted">
                Banners are available after payment verification.
              </div>
            )}
          </div>
        )}

        {!profile && (
          <div className="bg-bg-card border border-border-default rounded-xl p-6 text-text-secondary">
            Complete your sponsor profile to access sponsorships and banners.
          </div>
        )}
      </div>
    </div>
  );
}
