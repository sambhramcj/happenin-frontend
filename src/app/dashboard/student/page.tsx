"use client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import DashboardHeader from "@/components/DashboardHeader";
import { SkeletonCardList } from "@/components/Skeleton";

type Membership = {
  club: string;
  memberId: string;
};

type EligibleMember = {
  name: string;
  memberId: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: string;
  banner_image?: string;

  discount_enabled?: boolean;
  discount_club?: string;
  discount_amount?: number;
  eligible_members?: EligibleMember[];
};

type Registration = {
  eventId: string;
  finalPrice: number;
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [club, setClub] = useState("");
  const [memberId, setMemberId] = useState("");

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Event filters
  const [filterClub, setFilterClub] = useState("");
  const [filterPrice, setFilterPrice] = useState<"all" | "free" | "paid">("all");
  const [filterDiscount, setFilterDiscount] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "student") {
      router.replace("/login");
      return;
    }

    fetchMemberships();
    fetchEvents();
    fetchRegistrations();
  }, [session, status, router]);

  /* 🔑 LOAD RAZORPAY SCRIPT */
  function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async function fetchMemberships() {
    const { data } = await supabase
      .from("memberships")
      .select("club, member_id")
      .eq("student_email", session?.user?.email);

    if (data) {
      setMemberships(
        data.map((m) => ({
          club: m.club,
          memberId: m.member_id,
        }))
      );
    }
  }

  async function fetchRegistrations() {
    const { data } = await supabase
      .from("registrations")
      .select("event_id, final_price")
      .eq("student_email", session?.user?.email);

    if (data) {
      setRegistrations(
        data.map((r) => ({
          eventId: r.event_id,
          finalPrice: r.final_price,
        }))
      );
    }
  }

  async function addMembership() {
    if (!club || !memberId) {
      toast.error("Please enter club and membership ID");
      return;
    }

    const { error } = await supabase.from("memberships").insert({
      student_email: session?.user?.email,
      club,
      member_id: memberId,
    });

    if (error) {
      toast.error("Membership already exists for this club");
      return;
    }

    toast.success("Membership added successfully!");
    setClub("");
    setMemberId("");
    fetchMemberships();
  }

  async function fetchEvents() {
    try {
      setEventsLoading(true);
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setEventsLoading(false);
    }
  }

  function isEligibleForDiscount(event: Event) {
    if (!event.discount_enabled || !event.discount_club || !event.eligible_members)
      return false;

    const membership = memberships.find(
      (m) => m.club === event.discount_club
    );

    if (!membership) return false;

    return event.eligible_members.some(
      (em) => em.memberId === membership.memberId
    );
  }

  function getFinalPrice(event: Event) {
    if (!isEligibleForDiscount(event)) return Number(event.price);
    return Number(event.price) - (event.discount_amount || 0);
  }

  function getRegistration(eventId: string) {
    return registrations.find((r) => r.eventId === eventId);
  }

  function getFilteredEvents() {
    return events.filter((event) => {
      // Filter by club
      if (filterClub && event.discount_club !== filterClub) {
        return false;
      }

      // Filter by price
      const price = Number(event.price);
      if (filterPrice === "free" && price > 0) return false;
      if (filterPrice === "paid" && price === 0) return false;

      // Filter by discount availability
      if (filterDiscount && !isEligibleForDiscount(event)) {
        return false;
      }

      return true;
    });
  }

  async function handlePay(event: Event) {
    try {
      setLoadingEventId(event.id);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load");
        setLoadingEventId(null);
        return;
      }

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          studentEmail: session?.user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create order");
        setLoadingEventId(null);
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount * 100,
        currency: "INR",
        name: "Happenin",
        description: "Event Registration",
        order_id: data.orderId,
        handler: async () => {
          toast.success("Payment successful!");
          fetchRegistrations();
          setLoadingEventId(null);
        },
        prefill: { email: session?.user?.email },
        theme: { color: "#000000" },
      });

      razorpay.open();
    } catch {
      toast.error("Payment failed");
      setLoadingEventId(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0f0519] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Strict role check - prevent unauthorized access
  if (!session?.user || (session.user as any).role !== "student") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#0f0519]">
      <DashboardHeader />
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent mb-3">
            Student Dashboard
          </h1>
          <p className="text-purple-300 text-lg">
            Welcome back, <span className="font-semibold text-purple-200">{session.user.email}</span>
          </p>
        </div>

        {/* MEMBERSHIPS */}
        <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-6 sm:p-8 mb-10 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
          <h2 className="text-2xl font-bold text-purple-200 mb-6 flex items-center gap-3">
            <span className="text-3xl">🎫</span>
            <span>My Club Memberships</span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              value={club}
              onChange={(e) => setClub(e.target.value)}
              aria-label="Select a club for membership"
              className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2.5 text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all outline-none"
            >
              <option value="" className="bg-[#1a0b2e]">Select Club</option>
              <option value="IEEE" className="bg-[#1a0b2e]">IEEE</option>
              <option value="ACM" className="bg-[#1a0b2e]">ACM</option>
              <option value="Rotaract" className="bg-[#1a0b2e]">Rotaract</option>
            </select>

            <input
              placeholder="Membership ID"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              aria-label="Enter your membership ID"
              className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2.5 flex-1 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all outline-none"
            />

            <button
              onClick={addMembership}
              aria-label="Add club membership"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-lg hover:from-purple-500 hover:to-pink-500 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#0f0519] focus:outline-none transition-all duration-200 font-medium shadow-lg hover:shadow-xl whitespace-nowrap"
            >
              Add Membership
            </button>
          </div>

          {memberships.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {memberships.map((m, i) => (
                <span 
                  key={i} 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-4 py-2.5 rounded-full text-sm font-medium text-purple-200 border border-purple-500/40 hover:border-purple-500/60 hover:from-purple-600/30 hover:to-pink-600/30 transition-all"
                >
                  <span className="text-lg">🏛️</span>
                  <span className="font-semibold">{m.club}</span>
                  <span className="text-purple-400">•</span>
                  <span className="text-purple-300">{m.memberId}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-purple-400 text-center py-4">No memberships added yet. Add a club membership above to unlock discounts! ✨</p>
          )}
        </div>

        {/* EVENTS */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-purple-200 mb-3 flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <span>Available Events</span>
          </h2>
          <p className="text-purple-300 text-base mb-6">Discover and register for upcoming events</p>

          {/* Event Filters */}
          <div className="bg-[#2d1b4e] rounded-lg p-5 border border-purple-500/20 mb-8 hover:border-purple-500/30 transition-colors">
            <p className="text-purple-300 font-semibold mb-4 flex items-center gap-2">
              <span>🔍</span>
              Filter Events
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Club Filter */}
              <select
                value={filterClub}
                onChange={(e) => setFilterClub(e.target.value)}
                aria-label="Filter events by club"
                className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all outline-none"
              >
                <option value="">All Clubs</option>
                {Array.from(new Set(events.map(e => e.discount_club).filter(Boolean))).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Price Filter */}
              <select
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value as "all" | "free" | "paid")}
                aria-label="Filter events by price"
                className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all outline-none"
              >
                <option value="all">All Prices</option>
                <option value="free">Free Events</option>
                <option value="paid">Paid Events</option>
              </select>

              {/* Discount Filter */}
              <label className="flex items-center gap-2 bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-3 py-2 cursor-pointer hover:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
                <input
                  type="checkbox"
                  checked={filterDiscount}
                  onChange={(e) => setFilterDiscount(e.target.checked)}
                  aria-label="Show only events with available discounts"
                  className="w-4 h-4 accent-purple-500 focus:outline-none"
                />
                <span className="text-sm text-purple-100">Discounts Only</span>
              </label>

              {/* Clear Filters */}
              {(filterClub || filterPrice !== "all" || filterDiscount) && (
                <button
                  onClick={() => {
                    setFilterClub("");
                    setFilterPrice("all");
                    setFilterDiscount(false);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 underline whitespace-nowrap self-center sm:self-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          eventsLoading ? (
            <SkeletonCardList count={3} />
          ) : (
            <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-12 text-center border border-purple-500/20">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-purple-300 text-lg">No events available at the moment.</p>
              <p className="text-purple-500 text-sm mt-2">Check back later for new events!</p>
            </div>
          )
        ) : getFilteredEvents().length === 0 ? (
          <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-12 text-center border border-purple-500/20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-purple-300 text-lg">No events match your filters.</p>
            <button
              onClick={() => {
                setFilterClub("");
                setFilterPrice("all");
                setFilterDiscount(false);
              }}
              className="text-purple-400 hover:text-purple-300 underline mt-3 text-sm"
            >
              Clear filters to see all events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredEvents().map((event) => {
              const eligible = isEligibleForDiscount(event);
              const finalPrice = getFinalPrice(event);
              const reg = getRegistration(event.id);

              return (
                <div 
                  key={event.id} 
                  className="bg-[#2d1b4e] border border-purple-500/20 rounded-xl overflow-hidden shadow-md hover:border-purple-500/60 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
                >
                  {event.banner_image && (
                    <div className="w-full h-48 overflow-hidden">
                      <img 
                        src={event.banner_image} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-purple-100 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-pink-300 group-hover:bg-clip-text transition-all">{event.title}</h3>
                        <p className="text-purple-300 mb-5 leading-relaxed">{event.description}</p>

                        <div className="space-y-3 mb-5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-500">📆</span>
                            <span className="text-purple-300">{new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-purple-500">📍</span>
                            <span className="text-purple-300">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <span className="text-purple-200 font-semibold">₹{event.price}</span>
                          </div>
                        </div>

                        {eligible && (
                          <div className="mb-6 p-4 bg-green-900/20 border border-green-500/40 rounded-lg hover:bg-green-900/30 transition-colors">
                            <p className="text-green-300 font-semibold flex items-center gap-2 mb-1">
                              <span className="text-lg">🎉</span>
                              Discount Applied!
                            </p>
                            <p className="text-green-400 text-sm">Final Price: <span className="font-bold">₹{finalPrice}</span> • Save ₹{Number(event.price) - finalPrice}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center sm:items-start gap-3">
                        {reg ? (
                          <div className="flex flex-col items-center sm:items-start gap-2">
                            <span className="inline-flex items-center gap-2 bg-purple-600/40 text-purple-200 px-5 py-2.5 rounded-lg text-sm font-semibold border border-purple-500/50 hover:bg-purple-600/50 transition-colors">
                              <span className="text-lg">✓</span>
                              Registered
                            </span>
                            <p className="text-xs text-purple-400">Paid: <span className="font-semibold">₹{reg.finalPrice}</span></p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePay(event)}
                            disabled={loadingEventId === event.id}
                            aria-label={`Pay and register for ${event.title} event`}
                            aria-busy={loadingEventId === event.id}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-7 py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#0f0519] focus:outline-none transition-all duration-200 font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:focus:ring-0 whitespace-nowrap group-hover:scale-105"
                          >
                            {loadingEventId === event.id ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </span>
                            ) : (
                              "Pay & Register"
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
