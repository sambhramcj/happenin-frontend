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
import { uploadProfilePhoto } from "@/lib/profileStorage";
import TicketComponent from "@/components/TicketComponent";

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

type Ticket = {
  id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  event_location: string;
  qr_code_data: string;
  created_at: string;
};

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "my-events" | "profile" | "more">("home");

  // Data states
  const [club, setClub] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Explore tab filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClub, setFilterClub] = useState("");
  const [filterPrice, setFilterPrice] = useState<"all" | "free" | "paid">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "today" | "week">("all");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "student") {
      router.replace("/login");
      return;
    }

    fetchMemberships();
    fetchProfile();
    fetchEvents();
    fetchRegistrations();
    fetchTickets();
  }, [session, status, router]);

  async function fetchProfile() {
    try {
      setIsProfileLoading(true);
      const res = await fetch("/api/student/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsProfileLoading(false);
    }
  }

  async function fetchMemberships() {
    const { data } = await supabase
      .from("memberships")
      .select("club, member_id")
      .eq("student_email", session?.user?.email);

    if (data) {
      setMemberships(data.map((m) => ({ club: m.club, memberId: m.member_id })));
    }
  }

  async function fetchEvents() {
    try {
      setEventsLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
    } finally {
      setEventsLoading(false);
    }
  }

  async function fetchRegistrations() {
    const { data } = await supabase
      .from("registrations")
      .select("event_id, final_price")
      .eq("student_email", session?.user?.email);

    if (data) {
      setRegistrations(
        data.map((r) => ({ eventId: r.event_id, finalPrice: r.final_price }))
      );
    }
  }

  async function fetchTickets() {
    try {
      setTicketsLoading(true);
      const res = await fetch("/api/student/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  }

  async function addMembership() {
    if (!club || !memberId) {
      toast.error("Please select a club and enter your membership ID");
      return;
    }

    const { error } = await supabase.from("memberships").insert({
      student_email: session?.user?.email,
      club,
      member_id: memberId,
    });

    if (error) {
      toast.error("Failed to add membership");
    } else {
      toast.success("Membership added successfully!");
      setClub("");
      setMemberId("");
      fetchMemberships();
    }
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      full_name: formData.get("full_name"),
      dob: formData.get("dob"),
      college_name: formData.get("college_name"),
      college_email: formData.get("college_email"),
      phone_number: formData.get("phone_number"),
      personal_email: formData.get("personal_email"),
    };

    const res = await fetch("/api/student/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success("Profile saved successfully!");
      setEditingProfile(false);
      fetchProfile();
    } else {
      toast.error("Failed to save profile");
    }
  }

  async function handlePhotoChange(file: File) {
    if (!session?.user?.email) return;
    setUploadingPhoto(true);

    try {
      const url = await uploadProfilePhoto(file, session.user.email);
      const res = await fetch("/api/student/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_photo_url: url }),
      });

      if (res.ok) {
        toast.success("Profile photo updated!");
        fetchProfile();
      }
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  }

  function isProfileComplete(p: any) {
    if (!p) return false;
    return !!(p.full_name && p.dob && p.college_name && p.college_email);
  }

  function isEligibleForDiscount(event: Event) {
    if (!event.discount_enabled || !event.discount_club) return false;
    const m = memberships.find((mem) => mem.club === event.discount_club);
    if (!m) return false;
    return (
      Array.isArray(event.eligible_members) &&
      event.eligible_members.some((em) => em.memberId === m.memberId)
    );
  }

  function getFinalPrice(event: Event) {
    const base = Number(event.price);
    if (isEligibleForDiscount(event)) {
      return Math.max(0, base - Number(event.discount_amount || 0));
    }
    return base;
  }

  function getRegistration(eventId: string) {
    return registrations.find((r) => r.eventId === eventId);
  }

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

  async function handlePay(event: Event) {
    if (!isProfileComplete(profile)) {
      toast.error("Please complete your profile before registering");
      setActiveTab("profile");
      return;
    }

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
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId: event.id,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok) {
              toast.success("Payment successful!");
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              const { data: regsData } = await supabase
                .from("registrations")
                .select("event_id, final_price")
                .eq("student_email", session?.user?.email);

              if (regsData) {
                setRegistrations(
                  regsData.map((r) => ({
                    eventId: r.event_id,
                    finalPrice: r.final_price,
                  }))
                );
              }
              
              await fetchTickets();
              setLoadingEventId(null);
              toast.success("✓ Registration confirmed!");
              setActiveTab("my-events");
            } else {
              toast.error(verifyData.error || "Payment verification failed");
              setLoadingEventId(null);
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            toast.error("Payment verification failed");
            setLoadingEventId(null);
          }
        },
        prefill: { email: session?.user?.email },
        theme: { color: "#7c3aed" },
      });

      razorpay.open();
    } catch {
      toast.error("Payment failed");
      setLoadingEventId(null);
    }
  }

  // Filter logic
  function getTodayEvents() {
    const today = new Date().toDateString();
    return events.filter(e => new Date(e.date).toDateString() === today);
  }

  function getThisWeekEvents() {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= weekFromNow;
    });
  }

  function getFilteredEvents() {
    let filtered = [...events];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (filterCategory === "today") {
      const today = new Date().toDateString();
      filtered = filtered.filter(e => new Date(e.date).toDateString() === today);
    } else if (filterCategory === "week") {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= weekFromNow;
      });
    }

    // Price filter
    if (filterPrice === "free") {
      filtered = filtered.filter(e => Number(e.price) === 0);
    } else if (filterPrice === "paid") {
      filtered = filtered.filter(e => Number(e.price) > 0);
    }

    // Club filter
    if (filterClub) {
      filtered = filtered.filter(e => e.discount_club === filterClub);
    }

    return filtered;
  }

  function getRegisteredEvents() {
    const regIds = new Set(registrations.map(r => r.eventId));
    return events.filter(e => regIds.has(e.id));
  }

  function getUpcomingEvents() {
    const registered = getRegisteredEvents();
    const now = new Date();
    return registered.filter(e => new Date(e.date) >= now);
  }

  function getPastEvents() {
    const registered = getRegisteredEvents();
    const now = new Date();
    return registered.filter(e => new Date(e.date) < now);
  }

  const profileCompletion = profile ? 
    (Object.keys({ full_name: 1, dob: 1, college_name: 1, college_email: 1 })
      .filter(k => profile[k]).length / 4) * 100 : 0;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0519] via-[#1a0b2e] to-[#0f0519] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0519] via-[#1a0b2e] to-[#0f0519] pb-24">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-[#1a0b2e]/95 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Happenin
            </h1>
          </div>
          <button
            onClick={() => toast.info("Notifications coming soon!")}
            className="p-2 hover:bg-purple-500/10 rounded-lg transition-colors"
          >
            <span className="text-2xl">🔔</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="space-y-8">
            {/* Happening Today */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>🔥</span> Happening Today
              </h2>
              {getTodayEvents().length === 0 ? (
                <div className="bg-[#2d1b4e]/50 rounded-xl p-8 text-center border border-purple-500/20">
                  <p className="text-purple-400">No events today</p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {getTodayEvents().map((event) => (
                    <div key={event.id} className="flex-shrink-0 w-80 snap-start">
                      <div className="bg-[#2d1b4e] rounded-xl overflow-hidden border border-purple-500/30 hover:border-purple-500/60 transition-all group">
                        {event.banner_image && (
                          <img src={event.banner_image} alt={event.title} className="w-full h-48 object-cover" />
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-600/30 text-purple-200 text-xs px-2 py-1 rounded-full">Today</span>
                            <span className="text-purple-300 text-sm font-semibold">₹{event.price}</span>
                          </div>
                          <h3 className="font-bold text-purple-100 mb-2">{event.title}</h3>
                          <p className="text-sm text-purple-400 mb-3 line-clamp-2">{event.description}</p>
                          <button
                            onClick={() => handlePay(event)}
                            disabled={!!getRegistration(event.id)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50"
                          >
                            {getRegistration(event.id) ? "Registered ✓" : "Register Now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Trending */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>⚡</span> Trending in Your College
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getThisWeekEvents().slice(0, 6).map((event) => (
                  <div key={event.id} className="bg-[#2d1b4e] rounded-xl overflow-hidden border border-purple-500/30 hover:border-purple-500/60 transition-all">
                    {event.banner_image && (
                      <img src={event.banner_image} alt={event.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-purple-100 text-sm mb-1 line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-purple-400 mb-2">{new Date(event.date).toLocaleDateString()}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-purple-300 font-semibold text-sm">₹{event.price}</span>
                        <button
                          onClick={() => handlePay(event)}
                          disabled={!!getRegistration(event.id)}
                          className="text-xs bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50"
                        >
                          {getRegistration(event.id) ? "✓" : "Register"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* EXPLORE TAB */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="sticky top-20 z-30 bg-[#1a0b2e]/95 backdrop-blur-md p-4 rounded-xl border border-purple-500/20">
              <input
                type="text"
                placeholder="Search events, clubs, or fests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f0519] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {["all", "today", "week"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filterCategory === cat
                      ? "bg-purple-600 text-white"
                      : "bg-[#2d1b4e] text-purple-300 hover:bg-purple-600/30"
                  }`}
                >
                  {cat === "all" ? "All" : cat === "today" ? "Today" : "This Week"}
                </button>
              ))}
              {["free", "paid"].map((price) => (
                <button
                  key={price}
                  onClick={() => setFilterPrice(filterPrice === price ? "all" : price as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filterPrice === price
                      ? "bg-purple-600 text-white"
                      : "bg-[#2d1b4e] text-purple-300 hover:bg-purple-600/30"
                  }`}
                >
                  {price === "free" ? "Free" : "Paid"}
                </button>
              ))}
            </div>

            {/* Event List */}
            <div className="space-y-4">
              {getFilteredEvents().map((event) => {
                const reg = getRegistration(event.id);
                const finalPrice = getFinalPrice(event);

                return (
                  <div key={event.id} className="bg-[#2d1b4e] rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/60 transition-all">
                    <div className="flex gap-4 p-4">
                      {event.banner_image && (
                        <img src={event.banner_image} alt={event.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-purple-100 mb-1">{event.title}</h3>
                        <p className="text-sm text-purple-400 mb-2 line-clamp-2">{event.description}</p>
                        <div className="flex items-center gap-4 text-xs text-purple-300">
                          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                          <span>💰 ₹{event.price}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePay(event)}
                        disabled={!!reg || loadingEventId === event.id}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all disabled:opacity-50 self-center whitespace-nowrap"
                      >
                        {reg ? "✓ Registered" : "Register"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MY EVENTS TAB */}
        {activeTab === "my-events" && (
          <div className="space-y-6">
            <div className="flex gap-2 border-b border-purple-500/20 pb-2">
              <button className="px-4 py-2 text-sm font-medium text-purple-100 border-b-2 border-purple-500">
                Upcoming ({getUpcomingEvents().length})
              </button>
              <button className="px-4 py-2 text-sm font-medium text-purple-400">
                Registered ({getRegisteredEvents().length})
              </button>
              <button className="px-4 py-2 text-sm font-medium text-purple-400">
                Past ({getPastEvents().length})
              </button>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-[#2d1b4e]/50 rounded-xl p-12 text-center border border-purple-500/20">
                <div className="text-6xl mb-4">🎟️</div>
                <p className="text-purple-300 text-lg mb-2">No tickets yet</p>
                <p className="text-purple-500 text-sm">Register for events to get your tickets!</p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-all"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-[#2d1b4e] rounded-xl overflow-hidden border border-purple-500/30">
                    <div className="p-6">
                      <TicketComponent
                        ticketId={ticket.id}
                        eventTitle={ticket.event_title}
                        eventDate={new Date(ticket.event_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        eventLocation={ticket.event_location}
                        studentName={profile?.full_name || session?.user?.email || "Guest"}
                        studentEmail={session?.user?.email || ""}
                        qrCodeData={ticket.qr_code_data}
                        design="modern"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-[#1a0b2e] rounded-full overflow-hidden flex items-center justify-center border-2 border-purple-500/50">
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-purple-100">{profile?.full_name || "Complete your profile"}</h2>
                  <p className="text-sm text-purple-400">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="px-4 py-2 bg-purple-600/30 text-purple-200 rounded-lg hover:bg-purple-600/50 transition-all"
                >
                  {editingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              {/* Completion Bar */}
              <div className="bg-[#1a0b2e] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-purple-300">Profile Completion</span>
                  <span className="text-sm font-semibold text-purple-200">{Math.round(profileCompletion)}%</span>
                </div>
                <div className="w-full bg-purple-900/30 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="text-xs text-yellow-400 mt-2">Complete your profile to unlock registrations</p>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Full Name *</label>
                  <input
                    name="full_name"
                    defaultValue={profile?.full_name || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Date of Birth *</label>
                  <input
                    name="dob"
                    type="date"
                    defaultValue={profile?.dob || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">College Name *</label>
                  <input
                    name="college_name"
                    defaultValue={profile?.college_name || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">College Email *</label>
                  <input
                    name="college_email"
                    type="email"
                    defaultValue={profile?.college_email || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Phone Number</label>
                  <input
                    name="phone_number"
                    type="tel"
                    defaultValue={profile?.phone_number || ""}
                    disabled={!editingProfile}
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Personal Email</label>
                  <input
                    name="personal_email"
                    type="email"
                    defaultValue={profile?.personal_email || ""}
                    disabled={!editingProfile}
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 disabled:opacity-60"
                  />
                </div>
              </div>

              {editingProfile && (
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all font-semibold"
                >
                  Save Profile
                </button>
              )}
            </form>

            {/* Memberships */}
            <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20">
              <h3 className="text-lg font-bold text-purple-200 mb-4">Club Memberships</h3>
              <div className="flex gap-2 mb-4">
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 flex-1"
                >
                  <option value="">Select Club</option>
                  <option value="IEEE">IEEE</option>
                  <option value="ACM">ACM</option>
                  <option value="Rotaract">Rotaract</option>
                </select>
                <input
                  placeholder="Member ID"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 flex-1"
                />
                <button
                  onClick={addMembership}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-all"
                >
                  Add
                </button>
              </div>
              {memberships.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {memberships.map((m, i) => (
                    <span key={i} className="bg-purple-600/20 px-3 py-1 rounded-full text-sm text-purple-200 border border-purple-500/30">
                      {m.club} • {m.memberId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-purple-400 text-center py-4 text-sm">No memberships yet</p>
              )}
            </div>

            {/* Settings */}
            <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20 space-y-3">
              <button
                onClick={() => toast.info("Notifications settings coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                🔔 Notifications
              </button>
              <button
                onClick={() => signOut()}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-red-400 hover:bg-red-600/10 transition-all"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}

        {/* MORE TAB */}
        {activeTab === "more" && (
          <div className="space-y-4">
            <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20 space-y-3">
              <button
                onClick={() => toast.info("About page coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                ℹ️ About Happenin
              </button>
              <button
                onClick={() => toast.info("FAQs coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                ❓ FAQs
              </button>
              <button
                onClick={() => toast.info("Support coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                💬 Contact Support
              </button>
              <button
                onClick={() => toast.info("Report coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                🚨 Report an Issue
              </button>
              <button
                onClick={() => router.push("/login")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                🎯 Become an Organizer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0b2e]/95 backdrop-blur-md border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto flex justify-around items-center py-3">
          {[
            { id: "home", icon: "🏠", label: "Home" },
            { id: "explore", icon: "🔍", label: "Explore" },
            { id: "my-events", icon: "🎫", label: "My Events" },
            { id: "profile", icon: "👤", label: "Profile" },
            { id: "more", icon: "☰", label: "More" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "text-purple-300 bg-purple-600/20"
                  : "text-purple-500 hover:text-purple-300"
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
