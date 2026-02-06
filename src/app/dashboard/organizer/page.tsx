"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { RegistrationsModal } from "@/components/RegistrationsModal";
import { useEventSchedule } from "@/hooks/useEventSchedule";
import { EventScheduleBuilder } from "@/components/EventScheduleBuilder";
import SponsorshipPackagesManager from "@/components/SponsorshipPackagesManager";
import { SponsorshipPayout } from "@/components/SponsorshipPayout";
import AttendanceModal from "@/components/AttendanceModal";
import EventSubmitToFest from "@/components/EventSubmitToFest";
import { BannerUploadForm } from "@/components/BannerUploadForm";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardEventListSkeleton, DashboardStatsSkeleton } from "@/components/skeletons";
import { LoadingButton } from "@/components/LoadingButton";

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
  organizer_email: string;
  banner_image?: string;
  discount_enabled?: boolean;
  sponsorship_enabled?: boolean;
  discount_club?: string;
  discount_amount?: number;
  eligible_members?: EligibleMember[];
};

type Registration = {
  id: string;
  student_email: string;
  event_id: string;
  final_price: number;
  created_at: string;
};

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "events" | "analytics" | "profile" | "sponsorships">("dashboard");

  // Event detail view state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetailView, setEventDetailView] = useState<"overview" | "volunteers" | "certificates" | "banners">("overview");

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [selectedEventForRegs, setSelectedEventForRegs] = useState<string>("");
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Event form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountClub, setDiscountClub] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([]);
  const eventSchedule = useEventSchedule();
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);

  // Certificate states
  const [approvedVolunteers, setApprovedVolunteers] = useState<any[]>([]);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [certApplicationId, setCertApplicationId] = useState("");
  const [certTitle, setCertTitle] = useState("Certificate of Appreciation");

  // Volunteer states for tab
  const [volunteerApplications, setVolunteerApplications] = useState<any[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [selectedEventForVolunteers, setSelectedEventForVolunteers] = useState<string>("");
  const [volunteerFilterStatus, setVolunteerFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [processingVolunteerId, setProcessingVolunteerId] = useState<string | null>(null);

  // Modal states
  const [registrationsModal, setRegistrationsModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });

  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });

  const [festSubmissionModal, setFestSubmissionModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "organizer") {
      router.replace("/auth");
      return;
    }

    // Remove forced light mode from auth/landing pages
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light');
    }

    const loadDashboard = async () => {
      setDashboardLoading(true);
      await Promise.all([
        fetchEvents(),
        fetchAllRegistrations(),
        fetchApprovedVolunteers(),
      ]);
      setDashboardLoading(false);
    };

    loadDashboard();
  }, [session, status, router]);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();

    setEvents(
      data.events ? data.events.filter((event: Event) => event.organizer_email === session?.user?.email) : []
    );
  }

  async function fetchVolunteersForEvent(eventId: string) {
    if (!eventId) return;
    try {
      setVolunteersLoading(true);
      const res = await fetch(`/api/organizer/volunteers/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setVolunteerApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Error fetching volunteers:", err);
      toast.error("Failed to fetch volunteer applications");
    } finally {
      setVolunteersLoading(false);
    }
  }

  async function handleVolunteerResponse(applicationId: string, status: "accepted" | "rejected") {
    try {
      setProcessingVolunteerId(applicationId);
      const res = await fetch(`/api/organizer/volunteers/application/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Application ${status === "accepted" ? "approved! ✓" : "rejected"}`);
        // Reload volunteers
        if (selectedEventForVolunteers) {
          fetchVolunteersForEvent(selectedEventForVolunteers);
        }
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.error || "Failed to update application");
      }
    } catch (err) {
      console.error("Error updating application:", err);
      toast.error("Error updating application");
    } finally {
      setProcessingVolunteerId(null);
    }
  }

  function getFilteredVolunteers() {
    if (volunteerFilterStatus === "all") {
      return volunteerApplications;
    }
    return volunteerApplications.filter(app => app.status === volunteerFilterStatus);
  }

  function getVolunteerStats() {
    return {
      total: volunteerApplications.length,
      pending: volunteerApplications.filter(app => app.status === "pending").length,
      accepted: volunteerApplications.filter(app => app.status === "accepted").length,
      rejected: volunteerApplications.filter(app => app.status === "rejected").length,
    };
  }

  async function fetchApprovedVolunteers() {
    try {
      const res = await fetch("/api/organizer/volunteers");
      if (res.ok) {
        const data = await res.json();
        // Filter for approved volunteers
        const approved = (data.volunteers || []).filter((v: any) => v.status === "approved");
        setApprovedVolunteers(approved);
      }
    } catch (err) {
      console.error("Error fetching approved volunteers:", err);
    }
  }

  async function handleIssueCertificate() {
    if (!certApplicationId || !certTitle) {
      toast.error("Please select volunteer and enter certificate title");
      return;
    }
    try {
      setIssuingCertificate(true);
      const res = await fetch("/api/organizer/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: certApplicationId,
          certificateTitle: certTitle,
          issuedDate: new Date().toISOString().split("T")[0],
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to issue certificate");
      }
      toast.success("Certificate issued successfully!");
      setCertApplicationId("");
      setCertTitle("Certificate of Appreciation");
      fetchApprovedVolunteers();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setIssuingCertificate(false);
    }
  }

  async function fetchAllRegistrations() {
    try {
      const myEvents = events.filter(e => e.organizer_email === session?.user?.email);
      const eventIds = myEvents.map(e => e.id);
      
      // For simplicity, we'll fetch per event
      // In production, you'd have a single API endpoint
      const allRegs: Registration[] = [];
      for (const eventId of eventIds) {
        const res = await fetch(`/api/organizer/events/${eventId}/registrations`);
        if (res.ok) {
          const data = await res.json();
          allRegs.push(...(data.registrations || []));
        }
      }
      setAllRegistrations(allRegs);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const isCSV = file.name.endsWith(".csv");

    if (!isExcel && !isCSV) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        let parsed: EligibleMember[] = [];

        if (isExcel) {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          parsed = rows
            .slice(1)
            .map((row) => {
              const [name, memberId] = row;
              if (!name || !memberId) return null;
              return { name: String(name).trim(), memberId: String(memberId).trim() };
            })
            .filter(Boolean) as EligibleMember[];
        } else {
          const text = reader.result as string;
          const lines = text.split("\n").slice(1);

          parsed = lines
            .map((line) => {
              const [name, memberId] = line.split(",");
              if (!name || !memberId) return null;
              return { name: name.trim(), memberId: memberId.trim() };
            })
            .filter(Boolean) as EligibleMember[];
        }

        if (parsed.length === 0) {
          toast.error("No valid members found in file");
          return;
        }

        setEligibleMembers(parsed);
        toast.success(`Uploaded ${parsed.length} eligible members`);
      } catch (error) {
        toast.error("Failed to parse file");
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  }

  function handleBannerImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setBannerImage(file);

    const reader = new FileReader();
    reader.onload = () => {
      setBannerImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadBannerImage(): Promise<string | null> {
    if (!bannerImage) return null;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', bannerImage);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      return data.imageUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleCreateEvent() {
    if (!title || !description || !location || !price) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!eventSchedule.startDateTime || !eventSchedule.endDateTime) {
      toast.error("Please set event date and time");
      return;
    }

    let bannerImageUrl: string | null = null;
    if (bannerImage) {
      bannerImageUrl = await uploadBannerImage();
      if (!bannerImageUrl) {
        return;
      }
    }

    const scheduleData = eventSchedule.getEventScheduleData();

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        location,
        price,
        bannerImage: bannerImageUrl,
        start_datetime: scheduleData.start_datetime,
        end_datetime: scheduleData.end_datetime,
        schedule_sessions: scheduleData.schedule_sessions,
        discountEnabled,
        discountClub,
        discountAmount,
        eligibleMembers,
        sponsorshipEnabled,
        organizerEmail: session?.user?.email,
      }),
    });

    if (res.ok) {
      const createdEvent = await res.json();
      const eventLink = `${window.location.origin}/events/${createdEvent.id}`;
      
      toast.success(
        <div>
          <p className="font-semibold mb-2">Event created successfully!</p>
          <p className="text-sm mb-2">Share this link:</p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={eventLink} 
              readOnly 
              className="flex-1 px-2 py-1 bg-bg-muted border border-border-default rounded text-xs"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(eventLink);
                toast.success("Link copied!");
              }}
              className="px-2 py-1 bg-primary text-white rounded text-xs"
            >
              Copy
            </button>
          </div>
        </div>,
        { duration: 8000 }
      );
      
      setTitle("");
      setDescription("");
      setLocation("");
      setPrice("");
      setDiscountEnabled(false);
      setDiscountClub("");
      setDiscountAmount(0);
      setEligibleMembers([]);
      setSponsorshipEnabled(false);
      setBannerImage(null);
      setBannerImagePreview(null);
      eventSchedule.setEventType('single-day');
      setShowCreateForm(false);
      fetchEvents();
      fetchAllRegistrations();
    } else {
      toast.error("Failed to create event");
    }
  }

  // Analytics
  function getTodayEvents() {
    const today = new Date().toDateString();
    return events.filter(e => new Date(e.date).toDateString() === today);
  }

  function getLiveEvents() {
    const now = new Date();
    return events.filter(e => {
      const eventDate = new Date(e.date);
      const isToday = eventDate.toDateString() === now.toDateString();
      return isToday;
    });
  }

  function getTotalRegistrationsToday() {
    const today = new Date().toDateString();
    return allRegistrations.filter(r => 
      new Date(r.created_at).toDateString() === today
    ).length;
  }

  function getTotalRevenue() {
    return allRegistrations.reduce((sum, r) => sum + r.final_price, 0);
  }

  function getEventRegistrations(eventId: string) {
    return allRegistrations.filter(r => r.event_id === eventId);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg-muted p-6 space-y-6">
        <DashboardStatsSkeleton />
        <DashboardEventListSkeleton />
      </div>
    );
  }

  // Redirect unauthenticated users
  if (status === "unauthenticated") {
    router.push("/auth");
    return (
      <div className="min-h-screen bg-bg-muted flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Redirecting to login...</div>
      </div>
    );
  }

  // Redirect non-organizers
  if (!session?.user || (session.user as any).role !== "organizer") {
    router.push("/dashboard/student");
    return (
      <div className="min-h-screen bg-bg-muted flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-muted pb-24">
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
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          dashboardLoading ? (
            <div className="space-y-6">
              <DashboardStatsSkeleton />
              <DashboardEventListSkeleton />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Live Snapshot */}
              <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Gauge className="h-5 w-5 text-primary" /> Live Snapshot
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Calendar className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{getLiveEvents().length}</div>
                  <div className="text-sm text-text-muted">Live Events</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Ticket className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{getTotalRegistrationsToday()}</div>
                  <div className="text-sm text-text-muted">Today</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Rupee className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">₹{getTotalRevenue()}</div>
                  <div className="text-sm text-text-muted">Collected</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Calendar className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{events.length}</div>
                  <div className="text-sm text-text-muted">Total Events</div>
                </div>
              </div>
            </section>

            {/* Today's Events */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Flame className="h-5 w-5 text-primary" /> Today's Events
              </h2>
              {getTodayEvents().length === 0 ? (
                <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
                  <p className="text-text-muted">No events today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTodayEvents().map((event) => {
                    const regs = getEventRegistrations(event.id);
                    const isLive = new Date().toDateString() === new Date(event.date).toDateString();
                    
                    return (
                      <div key={event.id} className="bg-bg-card rounded-xl p-6 border border-border-default">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-text-primary mb-2">{event.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-text-muted">
                              <span className="flex items-center gap-1"><Icons.MapPin className="h-4 w-4" /> {event.location}</span>
                              <span className="flex items-center gap-1"><Icons.Rupee className="h-4 w-4" /> ₹{event.price}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isLive ? "bg-green-900/30 text-success border border-success" : "bg-yellow-900/30 text-yellow-300 border border-yellow-500/30"
                          }`}>
                            {isLive ? "Live" : "Upcoming"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="text-2xl font-bold text-text-primary">{regs.length}</div>
                          <div className="text-sm text-text-muted">registrations</div>
                        </div>
                        <button
                          onClick={() =>
                            setRegistrationsModal({
                              isOpen: true,
                              eventId: event.id,
                              eventTitle: event.title,
                            })
                          }
                          className="w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover transition-all font-medium transition-all duration-fast ease-standard"
                        >
                          View Registrations
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              </section>
            </div>
          )
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && !selectedEventId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <Icons.Calendar className="h-5 w-5 text-primary" />
                My Events ({events.length})
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all font-medium shadow-md"
              >
                {showCreateForm ? "Cancel" : "+ Create Event"}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                <h3 className="text-lg font-bold text-text-primary mb-4">Create New Event</h3>
                
                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Event Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary resize-none"
                    rows={3}
                    placeholder="Describe your event"
                  />
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    placeholder="Event location"
                  />
                </div>

                <EventScheduleBuilder
                  eventType={eventSchedule.eventType}
                  onEventTypeChange={eventSchedule.setEventType}
                  startDateTime={eventSchedule.startDateTime}
                  endDateTime={eventSchedule.endDateTime}
                  onStartDateTimeChange={eventSchedule.setStartDateTime}
                  onEndDateTimeChange={eventSchedule.setEndDateTime}
                  scheduleSessions={eventSchedule.scheduleSessions}
                  onAddSession={eventSchedule.addScheduleSession}
                  onUpdateSession={eventSchedule.updateScheduleSession}
                  onRemoveSession={eventSchedule.removeScheduleSession}
                />

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    placeholder="Enter price"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={discountEnabled}
                      onChange={(e) => setDiscountEnabled(e.target.checked)}
                      className="w-4 h-4 accent-brand"
                    />
                    <span className="text-sm text-text-secondary">Enable Club Discount</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sponsorshipEnabled}
                      onChange={(e) => setSponsorshipEnabled(e.target.checked)}
                      className="w-4 h-4 accent-brand"
                    />
                    <span className="text-sm text-text-secondary">Enable Sponsorships</span>
                  </label>
                </div>

                {sponsorshipEnabled && (
                  <div className="bg-bg-card rounded-lg p-4 border border-border-default">
                    <p className="text-sm text-text-muted">
                      Save the event to configure sponsorship packages.
                    </p>
                  </div>
                )}

                {discountEnabled && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Club Name</label>
                      <input
                        value={discountClub}
                        onChange={(e) => setDiscountClub(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="e.g., IEEE, ACM"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Discount Amount (₹)</label>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Eligible Members (CSV/Excel)</label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleCSVUpload}
                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-text-inverse hover:file:bg-violet-800 transition-all duration-fast ease-standard"
                      />
                      {eligibleMembers.length > 0 && (
                        <p className="text-xs text-success mt-2">✓ {eligibleMembers.length} members uploaded</p>
                      )}
                    </div>
                  </div>
                )}

                <LoadingButton
                  onClick={handleCreateEvent}
                  disabled={uploadingImage}
                  loading={uploadingImage}
                  loadingText="Uploading image…"
                  className="w-full bg-gradient-to-r from-brand to-pink-600 text-text-inverse py-3 rounded-lg hover:from-violet-800 hover:to-pink-500 transition-all font-semibold disabled:opacity-50"
                >
                  Create Event
                </LoadingButton>
              </div>
            )}

            {/* Event List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
                const regs = getEventRegistrations(event.id);
                return (
                  <div key={event.id} className="bg-bg-card rounded-xl overflow-hidden border border-border-default hover:shadow-lg transition-shadow">
                    {event.banner_image && (
                      <img src={event.banner_image} alt={event.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-text-primary mb-2 line-clamp-1">{event.title}</h3>
                      <p className="text-sm text-text-muted mb-3 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                        <span className="flex items-center gap-1"><Icons.Calendar className="h-4 w-4" /> {new Date(event.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Icons.Rupee className="h-4 w-4" /> ₹{event.price}</span>
                      </div>
                      <div className="text-sm text-text-primary mb-3">
                        <span className="font-semibold">{regs.length}</span> registrations
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setEventDetailView("overview");
                          }}
                          className="w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover transition-all text-sm font-medium"
                        >
                          Manage Event
                        </button>
                        <button
                          onClick={() =>
                            setFestSubmissionModal({
                              isOpen: true,
                              eventId: event.id,
                              eventTitle: event.title,
                            })
                          }
                          className="w-full bg-purple-600/20 text-purple-400 border border-purple-700/50 py-2 rounded-lg hover:bg-purple-600/30 transition-all text-sm font-medium"
                        >
                          Submit to Fest
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* EVENT DETAIL VIEW */}
        {activeTab === "events" && selectedEventId && (() => {
          const event = events.find(e => e.id === selectedEventId);
          if (!event) return null;
          const regs = getEventRegistrations(event.id);
          
          return (
            <div className="space-y-6">
              {/* Back Button & Event Header */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedEventId(null)}
                  className="p-2 hover:bg-bg-muted rounded-lg transition-all"
                >
                  <Icons.ChevronLeft className="h-5 w-5 text-text-primary" />
                </button>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-text-primary">{event.title}</h2>
                  <p className="text-sm text-text-muted">{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                </div>
              </div>

              {/* Sub Navigation */}
              <div className="flex gap-2 border-b border-border-default overflow-x-auto">
                {[
                  { id: "overview", icon: Icons.Gauge, label: "Overview" },
                  { id: "banners", icon: Icons.Image, label: "Banners" },
                  { id: "volunteers", icon: Icons.Award, label: "Volunteers" },
                  { id: "certificates", icon: Icons.Award, label: "Certificates" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setEventDetailView(tab.id as any)}
                    className={`px-4 py-3 font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                      eventDetailView === tab.id
                        ? "border-b-2 border-primary text-primary"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {eventDetailView === "overview" && (
                <div className="space-y-6">
                  {event.sponsorship_enabled && (
                    <SponsorshipPackagesManager eventId={event.id} />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                      <Icons.Users className="h-6 w-6 mb-2 text-text-secondary" />
                      <div className="text-3xl font-bold text-text-primary">{regs.length}</div>
                      <div className="text-sm text-text-muted">Registrations</div>
                    </div>
                    <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                      <Icons.Rupee className="h-6 w-6 mb-2 text-text-secondary" />
                      <div className="text-3xl font-bold text-text-primary">₹{regs.reduce((sum, r) => sum + r.final_price, 0)}</div>
                      <div className="text-sm text-text-muted">Revenue</div>
                    </div>
                    <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                      <Icons.Rupee className="h-6 w-6 mb-2 text-text-secondary" />
                      <div className="text-3xl font-bold text-text-primary">₹{event.price}</div>
                      <div className="text-sm text-text-muted">Ticket Price</div>
                    </div>
                  </div>

                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    {event.banner_image && (
                      <img src={event.banner_image} alt={event.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                    )}
                    <h3 className="text-lg font-bold text-text-primary mb-2">Description</h3>
                    <p className="text-text-secondary mb-4">{event.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-muted">Date:</span>
                        <span className="text-text-primary ml-2">{new Date(event.date).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Location:</span>
                        <span className="text-text-primary ml-2">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        setRegistrationsModal({
                          isOpen: true,
                          eventId: event.id,
                          eventTitle: event.title,
                        })
                      }
                      className="bg-purple-600 text-text-inverse py-3 rounded-lg hover:bg-purple-500 transition-all font-medium"
                    >
                      View All Registrations
                    </button>
                    <button
                      onClick={() =>
                        setAttendanceModal({
                          isOpen: true,
                          eventId: event.id,
                          eventTitle: event.title,
                        })
                      }
                      className="bg-blue-600 text-text-inverse py-3 rounded-lg hover:bg-blue-500 transition-all font-medium"
                    >
                      Scan Attendance
                    </button>
                  </div>
                </div>
              )}

              {/* Volunteers Tab */}
              {eventDetailView === "volunteers" && (
                <div className="space-y-6">
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Icons.Award className="h-5 w-5 text-primary" />
                      Volunteer Applications for {event.title}
                    </h3>
                    
                    {/* Load volunteers when this tab opens */}
                    {(() => {
                      // Auto-load volunteers for this event
                      if (selectedEventForVolunteers !== event.id) {
                        setSelectedEventForVolunteers(event.id);
                        fetchVolunteersForEvent(event.id);
                      }
                      return null;
                    })()}

                    {/* Stats Cards */}
                    {volunteerApplications.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                          <div className="text-xs text-text-muted mb-1">Total</div>
                          <div className="text-2xl font-bold text-text-primary">{getVolunteerStats().total}</div>
                        </div>
                        <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                          <div className="text-xs text-text-muted mb-1">Pending</div>
                          <div className="text-2xl font-bold text-yellow-500">{getVolunteerStats().pending}</div>
                        </div>
                        <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                          <div className="text-xs text-text-muted mb-1">Approved</div>
                          <div className="text-2xl font-bold text-green-500">{getVolunteerStats().accepted}</div>
                        </div>
                        <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                          <div className="text-xs text-text-muted mb-1">Rejected</div>
                          <div className="text-2xl font-bold text-red-500">{getVolunteerStats().rejected}</div>
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {volunteersLoading && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                        <p className="text-text-secondary">Loading volunteer applications...</p>
                      </div>
                    )}

                    {/* Empty State */}
                    {!volunteersLoading && volunteerApplications.length === 0 && (
                      <div className="bg-gradient-to-br from-bg-muted to-bg-card rounded-xl p-12 border-2 border-dashed border-border-default flex flex-col items-center justify-center">
                        <Icons.Award className="h-16 w-16 text-text-muted mb-4 opacity-50" />
                        <h4 className="text-lg font-semibold text-text-primary mb-2">No Applications Yet</h4>
                        <p className="text-text-secondary text-center max-w-md">
                          This event doesn't have any volunteer applications yet. Check back soon!
                        </p>
                      </div>
                    )}

                    {/* Filter Tabs */}
                    {volunteerApplications.length > 0 && (
                      <div className="flex gap-2 border-b border-border-default mb-4">
                        {["all", "pending", "accepted", "rejected"].map((filter) => {
                          const count = filter === "all" 
                            ? getVolunteerStats().total
                            : filter === "pending"
                            ? getVolunteerStats().pending
                            : filter === "accepted"
                            ? getVolunteerStats().accepted
                            : getVolunteerStats().rejected;

                          return (
                            <button
                              key={filter}
                              onClick={() => setVolunteerFilterStatus(filter as any)}
                              className={`px-4 py-3 font-medium text-sm capitalize transition-all ${
                                volunteerFilterStatus === filter
                                  ? "border-b-2 border-primary text-primary"
                                  : "text-text-secondary hover:text-text-primary"
                              }`}
                            >
                              {filter} ({count})
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Applications List */}
                    {!volunteersLoading && getFilteredVolunteers().length > 0 && (
                      <div className="space-y-4">
                        {getFilteredVolunteers().map((app: any) => (
                          <div key={app.id} className="bg-bg-muted rounded-lg border border-border-default overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="p-5">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="mb-3">
                                    <h4 className="font-semibold text-text-primary text-lg truncate">{app.student_email}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                                        {app.role}
                                      </span>
                                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                                        app.status === "accepted"
                                          ? "bg-green-900/20 text-green-400 border-green-700/50"
                                          : app.status === "rejected"
                                          ? "bg-red-900/20 text-red-400 border-red-700/50"
                                          : "bg-yellow-900/20 text-yellow-400 border-yellow-700/50"
                                      }`}>
                                        {app.status === "pending" ? "Pending" : app.status === "accepted" ? "Approved" : "Rejected"}
                                      </span>
                                    </div>
                                  </div>

                                  {app.message && (
                                    <div className="mb-3">
                                      <p className="text-xs text-text-muted font-medium mb-1">Why they want to volunteer:</p>
                                      <p className="text-sm text-text-secondary line-clamp-2 bg-bg-card p-2 rounded">{app.message}</p>
                                    </div>
                                  )}

                                  <p className="text-xs text-text-muted">
                                    Applied {new Date(app.created_at).toLocaleDateString()} at {new Date(app.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>

                                {app.status === "pending" && (
                                  <div className="flex flex-col gap-2 md:flex-row">
                                    <LoadingButton
                                      onClick={() => handleVolunteerResponse(app.id, "accepted")}
                                      disabled={processingVolunteerId === app.id}
                                      loading={processingVolunteerId === app.id}
                                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                      ✓ Accept
                                    </LoadingButton>
                                    <LoadingButton
                                      onClick={() => handleVolunteerResponse(app.id, "rejected")}
                                      disabled={processingVolunteerId === app.id}
                                      loading={processingVolunteerId === app.id}
                                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                      ✕ Reject
                                    </LoadingButton>
                                  </div>
                                )}

                                {app.status !== "pending" && (
                                  <span className="px-4 py-2 text-xs text-text-muted font-semibold text-right">
                                    {app.status === "accepted" ? "Approved" : "Rejected"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!volunteersLoading && volunteerApplications.length > 0 && getFilteredVolunteers().length === 0 && (
                      <div className="bg-gradient-to-br from-bg-muted to-bg-card rounded-xl p-12 border-2 border-dashed border-border-default flex flex-col items-center justify-center">
                        <p className="text-text-secondary text-center">No {volunteerFilterStatus === "all" ? "applications" : `${volunteerFilterStatus} applications`}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Banners Tab */}
              {eventDetailView === "banners" && (
                <div className="space-y-6">
                  <BannerUploadForm
                    bannerType="event"
                    eventId={event.id}
                    onSuccess={() => {
                      toast.success("Banner submitted for approval");
                    }}
                  />
                </div>
              )}

              {/* Certificates Tab */}
              {eventDetailView === "certificates" && (
                <div className="space-y-6">
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                      <Icons.Award className="h-5 w-5 text-primary" />
                      Issue Certificate for {event.title}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block">Approved Volunteer *</label>
                        <select value={certApplicationId} onChange={e=>setCertApplicationId(e.target.value)} className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary">
                          <option value="">Select volunteer</option>
                          {approvedVolunteers.filter(v => v.event_id === event.id).map(v => (
                            <option key={v.id} value={v.id}>
                              {v.student_email} - {v.volunteer_roles?.title || "Volunteer"}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block">Certificate Title</label>
                        <input value={certTitle} onChange={e=>setCertTitle(e.target.value)} className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary" placeholder="Certificate of Appreciation"/>
                      </div>
                      <div className="md:col-span-2">
                        <button onClick={handleIssueCertificate} disabled={issuingCertificate} className="w-full bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover disabled:opacity-50 font-medium">
                          {issuingCertificate ? "Issuing..." : "Issue Certificate"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <h4 className="text-lg font-bold text-text-primary mb-4">Approved Volunteers for this Event ({approvedVolunteers.filter(v => v.event_id === event.id).length})</h4>
                    <div className="space-y-2">
                      {approvedVolunteers.filter(v => v.event_id === event.id).map(v => (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-bg-muted rounded-lg border border-border-default">
                          <div>
                            <p className="font-medium text-text-primary">{v.student_email}</p>
                            <p className="text-sm text-text-muted">{v.volunteer_roles?.title || "Volunteer"}</p>
                          </div>
                          <span className="px-3 py-1 bg-green-900/20 text-green-400 border border-green-700/50 rounded-full text-xs">Approved</span>
                        </div>
                      ))}
                      {approvedVolunteers.filter(v => v.event_id === event.id).length === 0 && (
                        <p className="text-center text-text-muted py-4">No approved volunteers for this event yet</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* REGISTRATIONS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Icons.TrendingUp className="h-5 w-5 text-primary" /> Event Analytics
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Total Events</p>
                    <div className="text-3xl font-bold text-text-primary">{events.length}</div>
                  </div>
                  <Icons.Calendar className="h-8 w-8 text-primary/30" />
                </div>
              </div>

              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Total Registrations</p>
                    <div className="text-3xl font-bold text-text-primary">{allRegistrations.length}</div>
                  </div>
                  <Icons.Users className="h-8 w-8 text-primary/30" />
                </div>
              </div>

              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Total Revenue</p>
                    <div className="text-3xl font-bold text-text-primary">₹{getTotalRevenue()}</div>
                  </div>
                  <Icons.Rupee className="h-8 w-8 text-primary/30" />
                </div>
              </div>

              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Avg Registration/Event</p>
                    <div className="text-3xl font-bold text-text-primary">
                      {events.length > 0 ? (allRegistrations.length / events.length).toFixed(1) : 0}
                    </div>
                  </div>
                  <Icons.TrendingUp className="h-8 w-8 text-primary/30" />
                </div>
              </div>
            </div>

            {/* Event-wise Analytics */}
            <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
              <div className="p-6 border-b border-border-default">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Icons.TrendingUp className="h-5 w-5 text-primary" />
                  Event-wise Analytics
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-text-secondary border-b border-border-default bg-bg-muted">
                      <th className="px-4 py-3">Event Name</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Registrations</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">Avg Price Paid</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                          No events created yet
                        </td>
                      </tr>
                    ) : (
                      events.map((event) => {
                        const regs = getEventRegistrations(event.id);
                        const revenue = regs.reduce((sum, r) => sum + r.final_price, 0);
                        const avgPrice = regs.length > 0 ? (revenue / regs.length).toFixed(2) : "0";
                        const isLive = new Date().toDateString() === new Date(event.date).toDateString();
                        const isPast = new Date() > new Date(event.date);

                        return (
                          <tr key={event.id} className="border-t border-border-default hover:bg-bg-muted/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {event.banner_image && (
                                  <img src={event.banner_image} alt={event.title} className="h-8 w-8 rounded object-cover" />
                                )}
                                <span className="font-medium text-text-primary truncate">{event.title}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {new Date(event.date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-text-primary">{regs.length}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-text-primary">₹{revenue}</td>
                            <td className="px-4 py-3 text-text-secondary">₹{avgPrice}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isLive
                                  ? "bg-green-900/20 text-green-400 border-green-700/50"
                                  : isPast
                                  ? "bg-gray-900/20 text-gray-400 border-gray-700/50"
                                  : "bg-blue-900/20 text-blue-400 border-blue-700/50"
                              }`}>
                                {isLive ? "Live" : isPast ? "Completed" : "Upcoming"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Monthly Revenue Trend (Simplified) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Icons.TrendingUp className="h-5 w-5 text-primary" />
                  Revenue by Month
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const monthlyRevenue: { [key: string]: number } = {};
                    allRegistrations.forEach((reg) => {
                      const month = new Date(reg.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + reg.final_price;
                    });
                    
                    return Object.entries(monthlyRevenue)
                      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                      .slice(-6)
                      .map(([month, revenue]) => (
                        <div key={month}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-text-secondary">{month}</span>
                            <span className="font-semibold text-text-primary">₹{revenue}</span>
                          </div>
                          <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all"
                              style={{ width: `${Math.min((revenue / getTotalRevenue()) * 100 || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>

              <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Icons.Users className="h-5 w-5 text-primary" />
                  Registrations by Month
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const monthlyRegs: { [key: string]: number } = {};
                    allRegistrations.forEach((reg) => {
                      const month = new Date(reg.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
                      monthlyRegs[month] = (monthlyRegs[month] || 0) + 1;
                    });
                    
                    const maxRegs = Math.max(...Object.values(monthlyRegs), 1);
                    return Object.entries(monthlyRegs)
                      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                      .slice(-6)
                      .map(([month, count]) => (
                        <div key={month}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-text-secondary">{month}</span>
                            <span className="font-semibold text-text-primary">{count}</span>
                          </div>
                          <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                              style={{ width: `${(count / maxRegs) * 100}%` }}
                            />
                          </div>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            </div>

            {/* Top Performing Events */}
            <div className="bg-bg-card rounded-xl p-6 border border-border-default">
              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Award className="h-5 w-5 text-primary" />
                Top Performing Events
              </h3>
              <div className="space-y-3">
                {events
                  .map((event) => {
                    const regs = getEventRegistrations(event.id);
                    const revenue = regs.reduce((sum, r) => sum + r.final_price, 0);
                    return { event, regs: regs.length, revenue };
                  })
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div key={item.event.id} className="flex items-center justify-between p-3 bg-bg-muted rounded-lg">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-lg font-bold text-primary">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text-primary truncate">{item.event.title}</p>
                          <p className="text-xs text-text-muted">{item.regs} registrations</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-text-primary">₹{item.revenue}</p>
                      </div>
                    </div>
                  ))}
                {events.length === 0 && (
                  <p className="text-center text-text-muted py-4">No events yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SPONSORSHIPS TAB */}
        {activeTab === "sponsorships" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Sponsorship Earnings</h2>
              <p className="text-text-secondary">Track your sponsorship revenue and payouts</p>
            </div>
            <SponsorshipPayout organizerEmail={session?.user?.email || ""} />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-xl p-6 border border-border-default">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primarySoft rounded-full flex items-center justify-center border-2 border-border-default">
                  <Icons.Users className="h-8 w-8 text-text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">Organizer Profile</h2>
                  <p className="text-sm text-text-muted">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-bg-muted rounded-lg p-4">
                  <div className="text-sm text-text-muted mb-1">Total Events</div>
                  <div className="text-text-primary font-semibold">{events.length}</div>
                </div>
                <div className="bg-bg-muted rounded-lg p-4">
                  <div className="text-sm text-text-muted mb-1">Total Registrations</div>
                  <div className="text-text-primary font-semibold">{allRegistrations.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-3">
              <h3 className="text-lg font-bold text-text-primary mb-4">Settings</h3>
              <button
                onClick={() => toast.info("Help & support coming soon")}
                className="w-full text-left px-4 py-3 bg-bg-muted rounded-lg text-text-primary hover:bg-bg-muted transition-all transition-all duration-fast ease-standard"
              >
                <span className="flex items-center gap-2">
                  <Icons.Info className="h-4 w-4 text-text-secondary" />
                  Help & Support
                </span>
              </button>
              <button
                onClick={() => toast.info("Guidelines coming soon")}
                className="w-full text-left px-4 py-3 bg-bg-muted rounded-lg text-text-primary hover:bg-bg-muted transition-all transition-all duration-fast ease-standard"
              >
                <span className="flex items-center gap-2">
                  <Icons.Clipboard className="h-4 w-4 text-text-secondary" />
                  Organizer Guidelines
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 px-2 py-2">
          {[
            { id: "dashboard", icon: Icons.Dashboard, label: "Dashboard" },
            { id: "events", icon: Icons.Clipboard, label: "Events" },
            { id: "analytics", icon: Icons.TrendingUp, label: "Analytics" },
            { id: "sponsorships", icon: Icons.Handshake, label: "Sponsorships" },
            { id: "profile", icon: Icons.User, label: "Profile" },
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
              <tab.icon className="h-5 w-5" />
              <span className="text-[11px] font-medium truncate">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      <RegistrationsModal
        eventId={registrationsModal.eventId}
        eventTitle={registrationsModal.eventTitle}
        isOpen={registrationsModal.isOpen}
        onClose={() =>
          setRegistrationsModal((prev) => ({ ...prev, isOpen: false }))
        }
      />

      <AttendanceModal
        eventId={attendanceModal.eventId}
        eventTitle={attendanceModal.eventTitle}
        isOpen={attendanceModal.isOpen}
        onClose={() =>
          setAttendanceModal((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Fest Submission Modal */}
      {festSubmissionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-bg-card border-b border-border-default p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-text-primary">
                Submit "{festSubmissionModal.eventTitle}" to Fest
              </h2>
              <button
                onClick={() =>
                  setFestSubmissionModal({
                    ...festSubmissionModal,
                    isOpen: false,
                  })
                }
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <EventSubmitToFest
                eventId={festSubmissionModal.eventId}
                eventTitle={festSubmissionModal.eventTitle}
                onSuccess={() => {
                  setFestSubmissionModal({
                    ...festSubmissionModal,
                    isOpen: false,
                  });
                  toast.success("Event submitted to fest!");
                  // Optionally refetch events
                }}
                onClose={() =>
                  setFestSubmissionModal({
                    ...festSubmissionModal,
                    isOpen: false,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
