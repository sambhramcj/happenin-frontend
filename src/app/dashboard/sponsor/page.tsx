"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

export default function SponsorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"discover" | "my">("discover");
  const [events, setEvents] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [filters, setFilters] = useState({ college: "", budget_min: "", budget_max: "" });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingDeals, setLoadingDeals] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "sponsor") {
      router.replace("/auth");
      return;
    }

    fetchDiscoverEvents();
    fetchDeals();
  }, [session, status, router]);

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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "discover" && (
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
                        View Packages
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my" && (
          <div className="space-y-4">
            {loadingDeals ? (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">Loading sponsorships...</div>
            ) : (
              <div className="space-y-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="bg-bg-card border border-border-default rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-text-primary">{deal.events?.title}</div>
                        <div className="text-xs text-text-muted">{deal.sponsorship_packages?.tier} · ₹{deal.amount_paid}</div>
                      </div>
                      <div className="text-xs text-text-secondary capitalize">{deal.status}</div>
                    </div>
                  </div>
                ))}
                {deals.length === 0 && (
                  <div className="text-text-muted">No sponsorships yet</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
