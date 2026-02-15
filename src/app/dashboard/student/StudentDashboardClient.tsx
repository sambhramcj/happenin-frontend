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
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NearbyEvents } from "@/components/NearbyEvents";
import { NearbyColleges } from "@/components/NearbyColleges";
import CertificateComponent from "@/components/CertificateComponent";
import { EventTimelineDisplay } from "@/components/EventTimelineDisplay";
import { HomeExploreSkeleton, TicketCardSkeleton, Skeleton } from "@/components/skeletons";
import { PaymentLoading } from "@/components/PaymentLoading";
import { LoadingButton } from "@/components/LoadingButton";

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
  date?: string; // Legacy single date field
  start_datetime?: string;
  end_datetime?: string;
  schedule_sessions?: Array<{ date: string; start_time: string; end_time: string; description: string }> | null;
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
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "my-events" | "profile" | "volunteer">("home");
  const [exploreSubTab, setExploreSubTab] = useState<"events" | "nearby" | "favorites">("events");
  const [myEventsTab, setMyEventsTab] = useState<"upcoming" | "registered" | "past">("upcoming");

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
  const [paymentStage, setPaymentStage] = useState<"creating" | "confirming" | "pending" | "success" | null>(null);
  const [whatsappStatusByEvent, setWhatsappStatusByEvent] = useState<Record<string, boolean>>({});
  const [whatsappStatusLoading, setWhatsappStatusLoading] = useState(false);
  const [lastRegisteredEventId, setLastRegisteredEventId] = useState<string | null>(null);
  const [lastRegistrationWhatsappEnabled, setLastRegistrationWhatsappEnabled] = useState(false);

  // Volunteer states
  const [volunteerApplications, setVolunteerApplications] = useState<any[]>([]);
  const [volunteerCertificates, setVolunteerCertificates] = useState<any[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);

  // Favorites states
  const [favoriteColleges, setFavoriteColleges] = useState<any[]>([]);
  const [favoriteEvents, setFavoriteEvents] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Explore tab filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterClub, setFilterClub] = useState("");
  const [filterPrice, setFilterPrice] = useState<"all" | "free" | "paid">("all");
  const [filterCategory, setFilterCategory] = useState<"all" | "today" | "week">("all");
  const [top10Events, setTop10Events] = useState<any[]>([]);
  const [searchPlaceholder, setSearchPlaceholder] = useState("Search fests...");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "student") {
      router.replace("/auth");
      return;
    }

    // Remove forced light mode from auth/landing pages
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light');
    }

    fetchMemberships();
    fetchProfile();
    fetchEvents();
    fetchRegistrations();
    fetchTickets();
    fetchVolunteerData();
    fetchFavorites();
    
    // Fetch top 10 events
    getTop10Events().then(setTop10Events);
  }, [session, status, router]);

  useEffect(() => {
    if (activeTab !== "my-events") return;
    const eventIds = tickets.map((ticket) => ticket.event_id).filter(Boolean);
    fetchWhatsappStatus(eventIds);
  }, [activeTab, tickets]);

  useEffect(() => {
    if (!lastRegisteredEventId || paymentStage !== "success") return;
    fetch(`/api/whatsapp/status?event_id=${lastRegisteredEventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setLastRegistrationWhatsappEnabled(Boolean(data?.enabled));
      })
      .catch(() => {
        setLastRegistrationWhatsappEnabled(false);
      });
  }, [lastRegisteredEventId, paymentStage]);

  // Animated search placeholder
  useEffect(() => {
    const placeholders = ["Search fests...", "Search workshops...", "Search competitions...", "Search hackathons..."];
    let currentIndex = 0;

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % placeholders.length;
      setSearchPlaceholder(placeholders[currentIndex]);
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  async function fetchVolunteerData() {
    if (!session?.user?.email) return;
    try {
      setVolunteersLoading(true);
      // Fetch volunteer applications
      const appsRes = await fetch("/api/student/volunteers/applications");
      if (appsRes.ok) {
        const data = await appsRes.json();
        setVolunteerApplications(data.applications || []);
      }

      // Fetch certificates
      const certsRes = await fetch("/api/student/certificates");
      if (certsRes.ok) {
        const data = await certsRes.json();
        setVolunteerCertificates(data.certificates || []);
      }
    } catch (err) {
      console.error("Error fetching volunteer data:", err);
    } finally {
      setVolunteersLoading(false);
    }
  }

  async function fetchFavorites() {
    if (!session?.user?.email) return;
    try {
      setFavoritesLoading(true);
      const { data: colleges, error: collegesError } = await supabase
        .from("favorite_colleges")
        .select("college_id, colleges(*)")
        .eq("student_email", session.user.email);

      if (collegesError) throw collegesError;
      setFavoriteColleges(colleges || []);

      const { data: events, error: eventsError } = await supabase
        .from("favorite_events")
        .select("event_id, events(*)")
        .eq("student_email", session.user.email);

      if (eventsError) throw eventsError;
      setFavoriteEvents(events || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setFavoritesLoading(false);
    }
  }

  async function removeFavoriteCollege(collegeId: string) {
    try {
      await supabase
        .from("favorite_colleges")
        .delete()
        .eq("student_email", session?.user?.email)
        .eq("college_id", collegeId);
      toast.success("Removed from favorites");
      fetchFavorites();
    } catch (err) {
      toast.error("Failed to remove favorite");
    }
  }

  async function removeFavoriteEvent(eventId: string) {
    try {
      await supabase
        .from("favorite_events")
        .delete()
        .eq("student_email", session?.user?.email)
        .eq("event_id", eventId);
      toast.success("Removed from favorites");
      fetchFavorites();
    } catch (err) {
      toast.error("Failed to remove favorite");
    }
  }

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
      setMemberships(data.map((m: any) => ({ club: m.club, memberId: m.member_id })));
    }
  }

  async function fetchEvents() {
    try {
      setEventsLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        const list = data.events || [];
        setEvents(list);
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
          data.map((r: any) => ({ eventId: r.event_id, finalPrice: r.final_price }))
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

  async function fetchWhatsappStatus(eventIds: string[]) {
    if (!eventIds.length) return;
    setWhatsappStatusLoading(true);
    try {
      const results = await Promise.all(
        eventIds.map(async (eventId) => {
          const res = await fetch(`/api/whatsapp/status?event_id=${eventId}`);
          if (!res.ok) return { eventId, enabled: false };
          const data = await res.json();
          return { eventId, enabled: Boolean(data.enabled) };
        })
      );

      setWhatsappStatusByEvent((prev) => {
        const next = { ...prev };
        results.forEach((item) => {
          next[item.eventId] = item.enabled;
        });
        return next;
      });
    } finally {
      setWhatsappStatusLoading(false);
    }
  }

  async function handleJoinWhatsapp(eventId: string) {
    try {
      const res = await fetch("/api/whatsapp/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Unable to open WhatsApp group");
        return;
      }

      const data = await res.json();
      if (data.link) {
        window.open(data.link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      toast.error("Unable to open WhatsApp group");
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
      setPaymentStage("creating");

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load");
        setLoadingEventId(null);
        setPaymentStage(null);
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
        setPaymentStage(null);
        return;
      }

      // Close creating stage, Razorpay opens
      setPaymentStage(null);

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount * 100,
        currency: "INR",
        name: "Happenin",
        description: "Event Registration",
        order_id: data.orderId,
        handler: async (response: any) => {
          setPaymentStage("confirming");
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
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const { data: regsData } = await supabase
                .from("registrations")
                .select("event_id, final_price")
                .eq("student_email", session?.user?.email);

              if (regsData) {
                setRegistrations(
                    regsData.map((r: any) => ({
                    eventId: r.event_id,
                    finalPrice: r.final_price,
                  }))
                );
              }
              
              await fetchTickets();
              setLoadingEventId(null);
              setLastRegisteredEventId(event.id);
              setPaymentStage("success");
              toast.success("Registration confirmed!");
            } else {
              console.error("Payment verification delayed:", verifyData);
              setLoadingEventId(null);
              setPaymentStage("pending");
            }
          } catch (err) {
            console.error("Payment verification error:", err);
            setLoadingEventId(null);
            setPaymentStage("pending");
          }
        },
        prefill: { email: session?.user?.email },
        theme: { color: "#7c3aed" },
      });

      razorpay.open();
    } catch {
      toast.error("Payment failed");
      setLoadingEventId(null);
      setPaymentStage(null);
    }
  }

  // Filter logic
  function getTodayEvents() {
    const today = new Date().toDateString();
    return events.filter(e => (e.date ? new Date(e.date).toDateString() === today : false));
  }

  function getThisWeekEvents() {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter(e => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= weekFromNow;
    });
  }

  function getFilteredEvents() {
    let filtered = [...events];

    // Hide past events (based on end_datetime or fallback to date)
    const now = new Date();
    filtered = filtered.filter(e => {
      const endTime = e.end_datetime ? new Date(e.end_datetime) : (e.date ? new Date(e.date) : new Date(0));
      return endTime >= now;
    });

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
      const startTime = (e: Event) => e.start_datetime ? new Date(e.start_datetime) : (e.date ? new Date(e.date) : new Date(0));
      filtered = filtered.filter(e => startTime(e).toDateString() === today);
    } else if (filterCategory === "week") {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(e => {
        const startTime = e.start_datetime ? new Date(e.start_datetime) : (e.date ? new Date(e.date) : new Date(0));
        return startTime >= now && startTime <= weekFromNow;
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
    return registered.filter(e => (e.date ? new Date(e.date) >= now : false));
  }

  function getPastEvents() {
    const registered = getRegisteredEvents();
    const now = new Date();
    return registered.filter(e => (e.date ? new Date(e.date) < now : false));
  }

  function getTicketsForTab() {
    if (myEventsTab === "registered") return tickets;
    const now = new Date();
    return tickets.filter((t) => {
      const eventDate = new Date(t.event_date);
      return myEventsTab === "upcoming" ? eventDate >= now : eventDate < now;
    });
  }

  // Get top 10 trending events (by registration count)
  async function getTop10Events() {
    try {
      const { data: regCounts } = await supabase
        .from("registrations")
        .select("event_id");
      
      if (!regCounts) return events.slice(0, 10);

      // Count registrations per event
      const countMap = new Map<string, number>();
      regCounts.forEach((reg: any) => {
        countMap.set(reg.event_id, (countMap.get(reg.event_id) || 0) + 1);
      });

      // Sort events by registration count
      const sortedEvents = events
        .map(event => ({
          ...event,
          registrationCount: countMap.get(event.id) || 0,
        }))
        .sort((a, b) => b.registrationCount - a.registrationCount)
        .slice(0, 10);

      return sortedEvents;
    } catch (error) {
      console.error("Error fetching top 10 events:", error);
      return events.slice(0, 10);
    }
  }


  const profileCompletion = profile ? 
    (Object.keys({ full_name: 1, dob: 1, college_name: 1, college_email: 1 })
      .filter(k => profile[k]).length / 4) * 100 : 0;

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-muted">
        <HomeExploreSkeleton />
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (status === "unauthenticated") {
    router.push("/auth");
    return (
      <div className="min-h-screen bg-bg-muted flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-muted pb-24">
      {paymentStage && (
        <PaymentLoading
          stage={paymentStage}
          onContinue={() => {
            setPaymentStage(null);
            setActiveTab("my-events");
          }}
          actionLabel={
            paymentStage === "success" && lastRegistrationWhatsappEnabled ? "Join WhatsApp Group" : undefined
          }
          onAction={
            paymentStage === "success" && lastRegistrationWhatsappEnabled && lastRegisteredEventId
              ? () => handleJoinWhatsapp(lastRegisteredEventId)
              : undefined
          }
        />
      )}
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-bg-card/95 backdrop-blur-md border-b border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Happenin
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => toast.info("Notifications coming soon!")}
              className="p-2 hover:bg-bg-muted rounded-lg transition-colors transition-all duration-fast ease-standard"
            >
              <Icons.Bell className="h-6 w-6 text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-t border-border-default overflow-x-auto hidden md:block">
          <div className="max-w-7xl mx-auto px-4 flex gap-1 text-sm font-medium">
            {[
              { id: "home", label: "Home", icon: Icons.Home },
              { id: "explore", label: "Explore", icon: Icons.Search },
              { id: "my-events", label: "My Events", icon: Icons.Calendar },
              { id: "volunteer", label: "Volunteer", icon: Icons.Handshake },
              { id: "profile", label: "Profile", icon: Icons.User },
            ].map(({ id, label, icon: Icon }: any) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <>
            {eventsLoading ? (
              <HomeExploreSkeleton />
            ) : (
              <div className="space-y-8">
                {/* Happening Today */}
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Icons.Flame className="h-5 w-5 text-primary" /> Happening Today
                  </h2>
              {getTodayEvents().length === 0 ? (
                <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <p className="text-text-muted">No events today</p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {getTodayEvents().map((event) => (
                    <div key={event.id} className="flex-shrink-0 w-80 snap-start">
                      <div className="bg-bg-card rounded-lg overflow-hidden border border-border-default hover:border-primary transition-all group transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                        {event.banner_image && (
                          <img src={event.banner_image} alt={event.title} className="w-full h-48 object-cover" />
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="bg-primarySoft text-primary text-xs px-2 py-1 rounded-full">Today</span>
                            <span className="text-text-secondary text-sm font-semibold">₹{event.price}</span>
                          </div>
                          <h3 className="font-bold text-text-primary mb-1">{event.title}</h3>
                          <p className="text-sm text-text-muted mb-3 line-clamp-2">{event.description}</p>
                          <LoadingButton
                            onClick={() => handlePay(event)}
                            disabled={!!getRegistration(event.id)}
                            loading={loadingEventId === event.id}
                            loadingText="Submitting…"
                            className="w-full bg-gradient-to-r from-primary to-primaryHover text-text-inverse py-2 rounded-lg font-semibold hover:from-primaryHover hover:to-primary transition-all disabled:opacity-50"
                          >
                            {getRegistration(event.id) ? "Registered ✓" : "Register Now"}
                          </LoadingButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Trending */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.TrendingUp className="h-5 w-5 text-primary" /> Trending in Your College
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getThisWeekEvents().slice(0, 6).map((event) => (
                  <div key={event.id} className="bg-bg-card rounded-lg overflow-hidden border border-border-default hover:border-primary transition-all transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                    {event.banner_image && (
                      <img src={event.banner_image} alt={event.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <h3 className="font-semibold text-text-primary text-sm mb-1 line-clamp-1">{event.title}</h3>
                      <p className="text-xs text-text-muted mb-2">
                        {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary font-semibold text-sm">₹{event.price}</span>
                        <LoadingButton
                          onClick={() => handlePay(event)}
                          disabled={!!getRegistration(event.id)}
                          loading={loadingEventId === event.id}
                          loadingText="Submitting…"
                          className="text-xs bg-primary text-text-inverse px-3 py-1 rounded-lg hover:bg-primaryHover disabled:opacity-50 transition-all duration-fast ease-standard active:scale-press hover:scale-hover"
                        >
                          {getRegistration(event.id) ? "✓" : "Register"}
                        </LoadingButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top 10 Events - Netflix Style */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Award className="h-5 w-5 text-primary" /> Top 10 Events
              </h2>
              {top10Events.length === 0 ? (
                <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
                  <p className="text-text-muted">Loading events…</p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                  {top10Events.map((event, index) => (
                    <div key={event.id} className="flex-shrink-0 w-64 snap-start relative">
                      {/* Netflix-style ranking number */}
                      <div className="absolute -left-6 top-0 z-10">
                        <svg
                          viewBox="0 0 100 150"
                          className="w-24 h-36 drop-shadow-2xl"
                        >
                          <text
                            x="50"
                            y="120"
                            fontSize="140"
                            fontWeight="900"
                            textAnchor="middle"
                            fill="#1a1a1a"
                            stroke="#9333ea"
                            strokeWidth="4"
                            style={{
                              fontFamily: 'Arial Black, sans-serif',
                              paintOrder: 'stroke',
                            }}
                          >
                            {index + 1}
                          </text>
                        </svg>
                      </div>

                      <div className="ml-8 bg-bg-card rounded-lg overflow-hidden border border-border-default hover:border-primary transition-all group hover:-translate-y-1 hover:shadow-xl">
                        {event.banner_image && (
                          <div className="relative">
                            <img 
                              src={event.banner_image} 
                              alt={event.title} 
                              className="w-full h-40 object-cover" 
                            />
                            {/* Top 10 badge overlay */}
                            <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold">
                              #{index + 1} Trending
                            </div>
                          </div>
                        )}
                        <div className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-text-secondary text-sm font-semibold">₹{event.price}</span>
                            {event.registrationCount > 0 && (
                              <span className="text-xs text-text-muted">
                                {event.registrationCount} registered
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-text-primary mb-1 text-sm line-clamp-2">{event.title}</h3>
                          <p className="text-xs text-text-muted mb-2">{new Date(event.date).toLocaleDateString()}</p>
                          <LoadingButton
                            onClick={() => handlePay(event)}
                            disabled={!!getRegistration(event.id)}
                            loading={loadingEventId === event.id}
                            loadingText="Submitting…"
                            className="w-full text-xs bg-primary text-text-inverse px-3 py-2 rounded-lg hover:bg-primaryHover disabled:opacity-50 transition-all duration-fast active:scale-95"
                          >
                            {getRegistration(event.id) ? "Registered ✓" : "Register Now"}
                          </LoadingButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
                </div>
              )}
            </>
        )}

        {/* EXPLORE TAB */}
        {activeTab === "explore" && (
          <div className="space-y-6 overflow-x-hidden">
            {/* Explore Subtabs */}
            <div className="flex gap-2 border-b border-border-default pb-2">
              <button
                type="button"
                onClick={() => setExploreSubTab("events")}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  exploreSubTab === "events"
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-secondary border-b-2 border-transparent"
                }`}
              >
                Events
              </button>
              <button
                type="button"
                onClick={() => setExploreSubTab("nearby")}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  exploreSubTab === "nearby"
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-secondary border-b-2 border-transparent"
                }`}
              >
                Nearby
              </button>
              <button
                type="button"
                onClick={() => setExploreSubTab("favorites")}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  exploreSubTab === "favorites"
                    ? "text-primary border-b-2 border-primary"
                    : "text-text-secondary border-b-2 border-transparent"
                }`}
              >
                Favorites
              </button>
            </div>

            {/* Events Subtab */}
            {exploreSubTab === "events" && (
              <div className="space-y-6">
                {/* Search */}
            <div className="sticky top-20 z-30 bg-bg-card/95 backdrop-blur-md p-4 rounded-xl border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-3 text-text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {["all", "today", "week"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    filterCategory === cat
                      ? "bg-primary text-text-inverse"
                      : "bg-bg-card text-text-secondary hover:bg-bg-muted"
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
                      ? "bg-primary text-text-inverse"
                      : "bg-bg-card text-text-secondary hover:bg-bg-muted"
                  }`}
                >
                  {price === "free" ? "Free" : "Paid"}
                </button>
              ))}
            </div>

            {/* Event List */}
            {eventsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-bg-card rounded-lg overflow-hidden border border-border-default">
                    <div className="flex gap-4 p-4">
                      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="w-2/3 h-5" variant="text" />
                        <Skeleton className="w-full h-4" variant="text" />
                        <Skeleton className="w-1/3 h-4" variant="text" />
                      </div>
                      <Skeleton className="w-24 h-10 rounded-lg self-center" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredEvents().map((event) => {
                  const reg = getRegistration(event.id);

                  return (
                    <div key={event.id} className="bg-bg-card rounded-lg overflow-hidden border border-border-default hover:border-primary transition-all">
                      <div className="flex gap-4 p-4">
                        {event.banner_image && (
                          <img src={event.banner_image} alt={event.title} className="w-24 h-24 object-cover rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text-primary mb-1">{event.title}</h3>
                          <p className="text-sm text-text-muted mb-2 line-clamp-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-text-secondary mb-2">
                            <span className="flex items-center gap-1"><Icons.Rupee className="h-4 w-4" /> ₹{event.price}</span>
                          </div>
                          <EventTimelineDisplay 
                            startDateTime={event.start_datetime || event.date || ''}
                            endDateTime={event.end_datetime || event.date || ''}
                            scheduleSessions={event.schedule_sessions ?? null}
                            eventTitle={event.title}
                          />
                        </div>
                        <LoadingButton
                          onClick={() => handlePay(event)}
                          disabled={!!reg || loadingEventId === event.id}
                          loading={loadingEventId === event.id}
                          loadingText="Submitting…"
                          className="px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover disabled:opacity-50 self-center whitespace-nowrap transition-all duration-fast ease-standard active:scale-press hover:scale-hover"
                        >
                          {reg ? "✓ Registered" : "Register"}
                        </LoadingButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </div>
            )}

            {/* Nearby Subtab */}
            {exploreSubTab === "nearby" && (
              <div className="space-y-6">
                <NearbyEvents />
                <NearbyColleges />
              </div>
            )}

            {/* Favorites Subtab */}
            {exploreSubTab === "favorites" && (
              <div className="space-y-6">
                {/* Favorite Colleges */}
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Icons.Heart className="h-5 w-5 text-error" /> Favorite Colleges
                  </h2>
                  {favoriteColleges.length === 0 ? (
                    <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
                      <p className="text-text-muted mb-3">No favorite colleges yet</p>
                      <button
                        onClick={() => setExploreSubTab("nearby")}
                        className="bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover"
                      >
                        Explore Nearby
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {favoriteColleges.map((fav: any) => {
                        const college = fav.colleges || fav;
                        return (
                          <div key={college.id} className="bg-bg-card rounded-lg p-4 border border-border-default hover:border-primary transition-all">
                            <h3 className="font-semibold text-text-primary mb-2">{college.name}</h3>
                            <p className="text-xs text-text-muted mb-3 line-clamp-2">{college.location}</p>
                            <button
                              onClick={() => removeFavoriteCollege(college.id)}
                              className="w-full bg-errorSoft text-error px-3 py-2 rounded-lg text-sm font-medium hover:bg-error hover:text-text-inverse transition-all"
                            >
                              Remove Favorite
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Favorite Events */}
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                    <Icons.Heart className="h-5 w-5 text-error" /> Favorite Events
                  </h2>
                  {favoriteEvents.length === 0 ? (
                    <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
                      <p className="text-text-muted">No favorite events yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {favoriteEvents.map((fav: any) => {
                        const event = fav.events || fav;
                        return (
                          <div key={event.id} className="bg-bg-card rounded-lg p-4 border border-border-default">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-text-primary">{event.title}</h3>
                                <p className="text-sm text-text-secondary">₹{event.price}</p>
                                <p className="text-xs text-text-muted mt-1">{new Date(event.date).toLocaleDateString()}</p>
                              </div>
                              <button
                                onClick={() => removeFavoriteEvent(event.id)}
                                className="bg-errorSoft text-error px-3 py-2 rounded-lg text-sm font-medium hover:bg-error hover:text-text-inverse"
                              >
                                <Icons.X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        )}

        {/* MY EVENTS TAB */}
        {activeTab === "my-events" && (
          <div className="space-y-6 overflow-x-hidden">
            <div className="flex gap-2 border-b border-border-default pb-2">
              <button
                type="button"
                onClick={() => setMyEventsTab("upcoming")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                  myEventsTab === "upcoming"
                    ? "text-primary border-primary"
                    : "text-text-secondary border-transparent"
                }`}
              >
                Upcoming ({getUpcomingEvents().length})
              </button>
              <button
                type="button"
                onClick={() => setMyEventsTab("registered")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                  myEventsTab === "registered"
                    ? "text-primary border-primary"
                    : "text-text-secondary border-transparent"
                }`}
              >
                Registered ({getRegisteredEvents().length})
              </button>
              <button
                type="button"
                onClick={() => setMyEventsTab("past")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
                  myEventsTab === "past"
                    ? "text-primary border-primary"
                    : "text-text-secondary border-transparent"
                }`}
              >
                Past ({getPastEvents().length})
              </button>
            </div>

              {ticketsLoading ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 text-center">Getting your tickets…</p>
                  {[1, 2, 3].map((i) => (
                    <TicketCardSkeleton key={i} />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
              <div className="bg-bg-card rounded-lg p-12 text-center border border-border-default">
                <div className="flex justify-center mb-4">
                  <Icons.Ticket className="h-16 w-16 text-text-secondary opacity-50" />
                </div>
                  <p className="text-text-secondary text-lg mb-2">No events yet</p>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="mt-4 bg-primary text-text-inverse px-6 py-2 rounded-lg hover:bg-primaryHover transition-all duration-fast ease-standard active:scale-press hover:scale-hover"
                >
                  Explore Events
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {getTicketsForTab().map((ticket) => (
                  <div key={ticket.id} className="bg-bg-card rounded-lg overflow-hidden border border-border-default">
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
                        eventId={ticket.event_id}
                      />
                      {whatsappStatusByEvent[ticket.event_id] && (
                        <button
                          onClick={() => handleJoinWhatsapp(ticket.event_id)}
                          className="mt-4 w-full bg-bg-muted border border-border-default text-text-secondary py-2 rounded-lg hover:text-text-primary hover:bg-bg-card transition-all flex items-center justify-center gap-2"
                        >
                          <Icons.WhatsApp className="h-4 w-4" />
                          Join WhatsApp Group
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6 overflow-x-hidden">
            {/* Profile Header */}
            <div className="bg-bg-card rounded-xl p-6 border border-border-default">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-bg-muted rounded-full overflow-hidden flex items-center justify-center border-2 border-border-default">
                  {profile?.profile_photo_url ? (
                    <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Icons.User className="h-10 w-10 text-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-text-primary">{profile?.full_name || "Complete your profile"}</h2>
                  <p className="text-sm text-text-muted">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="px-4 py-2 bg-primarySoft text-primary rounded-lg hover:bg-bg-muted transition-all transition-all duration-fast ease-standard"
                >
                  {editingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              {/* Completion Bar */}
              <div className="bg-bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-secondary">Profile Completion</span>
                  <span className="text-sm font-semibold text-text-primary">{Math.round(profileCompletion)}%</span>
                </div>
                <div className="w-full bg-border-default rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion < 100 && (
                  <p className="text-xs text-warning mt-2">Complete your profile to unlock registrations</p>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveProfile} className="bg-bg-card rounded-lg p-6 border border-border-default space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Full Name *</label>
                  <input
                    name="full_name"
                    defaultValue={profile?.full_name || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary disabled:opacity-60 transition-all duration-fast ease-standard"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Date of Birth *</label>
                  <input
                    name="dob"
                    type="date"
                    defaultValue={profile?.dob || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary disabled:opacity-60 transition-all duration-fast ease-standard"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">College Name *</label>
                  <input
                    name="college_name"
                    defaultValue={profile?.college_name || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary disabled:opacity-60 transition-all duration-fast ease-standard"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">College Email *</label>
                  <input
                    name="college_email"
                    type="email"
                    defaultValue={profile?.college_email || ""}
                    disabled={!editingProfile}
                    required
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary disabled:opacity-60 transition-all duration-fast ease-standard"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Phone Number</label>
                  <input
                    name="phone_number"
                    type="tel"
                    defaultValue={profile?.phone_number || ""}
                    disabled={!editingProfile}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary disabled:opacity-60 transition-all duration-fast ease-standard"
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Personal Email</label>
                  <input
                    name="personal_email"
                    type="email"
                    defaultValue={profile?.personal_email || ""}
                    disabled={!editingProfile}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary disabled:opacity-60 transition-all duration-fast ease-standard"
                  />
                </div>
              </div>

              {editingProfile && (
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primaryHover text-text-inverse py-3 rounded-lg hover:from-primaryHover hover:to-primary transition-all font-semibold"
                >
                  Save Profile
                </button>
              )}
            </form>

            {/* Memberships */}
            <div className="bg-bg-card rounded-xl p-6 border border-border-default">
              <h3 className="text-lg font-bold text-text-primary mb-4">Club Memberships</h3>
              <div className="flex gap-2 mb-4">
                <select
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  className="bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary flex-1"
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
                  className="bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary flex-1"
                />
                <button
                  onClick={addMembership}
                  className="px-6 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-all transition-all duration-fast ease-standard"
                >
                  Add
                </button>
              </div>
              {memberships.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {memberships.map((m, i) => (
                    <span key={i} className="bg-primarySoft px-3 py-1 rounded-full text-sm text-primary border border-border-default">
                      {m.club} • {m.memberId}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-center py-4 text-sm">No memberships yet</p>
              )}
            </div>

            {/* Settings */}
            <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-3">
              <button
                onClick={() => toast.info("Notifications settings coming soon")}
                className="w-full text-left px-4 py-3 bg-bg-muted rounded-lg text-text-primary hover:bg-bg-muted transition-all transition-all duration-fast ease-standard"
              >
                <span className="flex items-center gap-2">
                  <Icons.Bell className="h-4 w-4 text-text-secondary" />
                  Notifications
                </span>
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-4 py-3 bg-bg-muted rounded-lg text-error hover:bg-errorSoft transition-all transition-all duration-fast ease-standard"
              >
                <span className="flex items-center gap-2">
                  <Icons.LogOut className="h-4 w-4" />
                  Logout
                </span>
              </button>
            </div>
          </div>
        )}

        {/* VOLUNTEER TAB */}
        {activeTab === "volunteer" && (
          <div className="space-y-6 overflow-x-hidden">
            {/* My Applications */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Handshake className="h-5 w-5 text-primary" /> My Applications
              </h2>
              {volunteerApplications.length === 0 ? (
                <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
                  <p className="text-text-muted mb-3">No volunteer applications yet</p>
                  <button
                    onClick={() => setActiveTab("explore")}
                    className="bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover"
                  >
                    Browse Events
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {volunteerApplications.map((app: any) => (
                    <div key={app.id} className="bg-bg-card rounded-lg p-4 border border-border-default">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary">{app.event_name || "Event"}</h3>
                          <p className="text-sm text-text-secondary">Role: {app.role}</p>
                          <p className="text-xs text-text-muted mt-1">{app.message}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            app.status === "accepted"
                              ? "bg-successSoft text-success"
                              : app.status === "rejected"
                              ? "bg-errorSoft text-error"
                              : "bg-warningSoft text-warning"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Certificates */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Handshake className="h-5 w-5 text-primary" /> My Certificates
              </h2>
              {volunteerCertificates.length === 0 ? (
                <div className="bg-bg-card rounded-lg p-8 text-center border border-border-default">
                  <p className="text-text-muted">No certificates yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {volunteerCertificates.map((cert: any) => (
                    <div key={cert.id} className="bg-bg-card rounded-lg p-4 border border-border-default">
                      <CertificateComponent
                        id={cert.id || cert.certificate_id || ""}
                        certificateTitle={cert.certificate_title || cert.type || "Certificate"}
                        volunteerRole={cert.role || "Volunteer"}
                        eventName={cert.event_name || cert.eventName || ""}
                        issuedDate={cert.date || cert.created_at || ""}
                        issuedBy={cert.organization || cert.issued_by || "Organizer"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}



      </div>

      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 px-2 py-2">
          {[
            { id: "home", icon: <Icons.Home className="h-5 w-5" />, label: "Home" },
            { id: "explore", icon: <Icons.Search className="h-5 w-5" />, label: "Explore" },
            { id: "my-events", icon: <Icons.Ticket className="h-5 w-5" />, label: "My Events" },
            { id: "volunteer", icon: <Icons.Handshake className="h-5 w-5" />, label: "Volunteer" },
            { id: "profile", icon: <Icons.User className="h-5 w-5" />, label: "Profile" },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-1 min-w-0 flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "text-primary bg-primarySoft"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="text-[11px] font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

