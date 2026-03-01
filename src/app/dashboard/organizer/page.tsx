"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { RegistrationsModal } from "@/components/RegistrationsModal";
import { useEventSchedule } from "@/hooks/useEventSchedule";
import { EventScheduleBuilder } from "@/components/EventScheduleBuilder";
import { SponsorshipPayout } from "@/components/SponsorshipPayout";
import { OrganizerSponsorshipDeals } from "@/components/OrganizerSponsorshipDeals";
import AttendanceModal from "@/components/AttendanceModal";
import EventSubmitToFest from "@/components/EventSubmitToFest";
import { BannerUploadForm } from "@/components/BannerUploadForm";
import { Icons } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardEventListSkeleton, DashboardStatsSkeleton } from "@/components/skeletons";
import { LoadingButton } from "@/components/LoadingButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { EventTimelineDisplay } from "@/components/EventTimelineDisplay";
import { BulkTicketManager } from "@/components/BulkTicketManager";
import QRScanner from "@/components/QRScanner";
import CertificateGenerationWizard from "@/components/CertificateGenerationWizard";

type EligibleMember = {
  name: string;
  memberId: string;
};

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  start_datetime?: string;
  end_datetime?: string;
  schedule_sessions?: Array<{ date: string; start_time: string; end_time: string; description: string }> | null;
  location: string;
  price: string;
  max_attendees?: number | null;
  organizer_email: string;
  banner_image?: string;
  discount_enabled?: boolean;
  sponsorship_enabled?: boolean;
  boost_visibility?: boolean;
  boost_payment_status?: "unpaid" | "pending" | "completed" | string;
  boost_priority?: number;
  boost_end_date?: string | null;
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
  status?: string | null;
};

type AttendanceRecord = {
  id: string;
  student_email: string;
  scanned_at: string;
  organizer_email: string;
};

const DEFAULT_CLUB_OPTIONS = ["IEEE", "ACM", "Rotaract"];
const VOLUNTEER_ROLE_OPTIONS = [
  "Content",
  "Design",
  "Social Media",
  "Photography",
  "Videography",
  "Technical",
  "Logistics",
  "Hospitality",
  "Registration Desk",
  "Stage Management",
  "Public Relations",
  "Sponsorship Support",
];
const BRANCH_OPTIONS = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "AI & DS",
  "Biomedical",
  "Biotechnology",
  "Chemical",
  "Aerospace",
  "Architecture",
  "BBA",
  "BCom",
  "MBA",
  "MCA",
];
const YEAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "events" | "analytics" | "profile" | "sponsorships">("dashboard");

  // Event detail view state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [eventDetailView, setEventDetailView] = useState<"overview" | "timeline" | "bulk" | "volunteers" | "certificates" | "banners">("overview");

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [certificateCounts, setCertificateCounts] = useState<Record<string, number>>({});
  const [selectedEventForRegs, setSelectedEventForRegs] = useState<string>("");
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Event form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountClub, setDiscountClub] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [clubOptions, setClubOptions] = useState<string[]>(DEFAULT_CLUB_OPTIONS);
  const [collegeOptions, setCollegeOptions] = useState<string[]>([]);
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([]);
  const eventSchedule = useEventSchedule();
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [prizePoolEnabled, setPrizePoolEnabled] = useState(false);
  const [prizePoolDescription, setPrizePoolDescription] = useState("");
  const [prizePoolAmount, setPrizePoolAmount] = useState("");
  const [needsVolunteers, setNeedsVolunteers] = useState(false);
  const [volunteerRoles, setVolunteerRoles] = useState<string[]>([]);
  const [volunteerDescription, setVolunteerDescription] = useState("");
  const [registrationRestricted, setRegistrationRestricted] = useState(false);
  const [requireAllCriteria, setRequireAllCriteria] = useState(false);
  const [targetColleges, setTargetColleges] = useState<string[]>([]);
  const [targetBranches, setTargetBranches] = useState<string[]>([]);
  const [targetYears, setTargetYears] = useState<number[]>([]);
  const [targetClubs, setTargetClubs] = useState<string[]>([]);
  const [organizerContactEnabled, setOrganizerContactEnabled] = useState(false);
  const [organizerContactName, setOrganizerContactName] = useState("");
  const [organizerContactPhone, setOrganizerContactPhone] = useState("");
  const [organizerContactEmail, setOrganizerContactEmail] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState(false);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");

  // Bulk tickets states
  const [bulkTicketsEnabled, setBulkTicketsEnabled] = useState(false);
  const [bulkTicketPacks, setBulkTicketPacks] = useState<Array<{
    name: string;
    description: string;
    quantity: number;
    basePrice: number;
    bulkPrice: number;
    offerTitle: string;
    offerDescription: string;
    offerExpiryDate: string;
  }>>([]);

  // Certificate states
  const [approvedVolunteers, setApprovedVolunteers] = useState<any[]>([]);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [issuingCertificateForEventId, setIssuingCertificateForEventId] = useState<string | null>(null);
  const [certApplicationId, setCertApplicationId] = useState("");
  const [certTitle, setCertTitle] = useState("Certificate of Appreciation");
  const [certificateDraftsByEvent, setCertificateDraftsByEvent] = useState<
    Record<string, { applicationId: string; title: string }>
  >({});
  const [profileSection, setProfileSection] = useState<"main" | "help" | "guidelines">("main");

  // Volunteer states for tab
  const [volunteerApplications, setVolunteerApplications] = useState<any[]>([]);
  const [volunteersLoading, setVolunteersLoading] = useState(false);
  const [selectedEventForVolunteers, setSelectedEventForVolunteers] = useState<string>("");
  const [volunteerFilterStatus, setVolunteerFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [processingVolunteerId, setProcessingVolunteerId] = useState<string | null>(null);

  const [eventWhatsappEnabled, setEventWhatsappEnabled] = useState(false);
  const [eventWhatsappLink, setEventWhatsappLink] = useState("");
  const [eventWhatsappLoading, setEventWhatsappLoading] = useState(false);
  const [eventWhatsappSaving, setEventWhatsappSaving] = useState(false);
  const [eventEditMode, setEventEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMaxAttendees, setEditMaxAttendees] = useState("");
  const [editStartDateTime, setEditStartDateTime] = useState("");
  const [editEndDateTime, setEditEndDateTime] = useState("");
  const [editSponsorshipEnabled, setEditSponsorshipEnabled] = useState(false);
  const [savingEventEdits, setSavingEventEdits] = useState(false);
  const [attendanceByEvent, setAttendanceByEvent] = useState<Record<string, AttendanceRecord[]>>({});
  const [attendanceLoadingByEvent, setAttendanceLoadingByEvent] = useState<Record<string, boolean>>({});
  const [scannerEnabledByEvent, setScannerEnabledByEvent] = useState<Record<string, boolean>>({});
  const [boostAmountByEvent, setBoostAmountByEvent] = useState<Record<string, string>>({});
  const [boostDaysByEvent, setBoostDaysByEvent] = useState<Record<string, string>>({});
  const [boostSubmittingByEvent, setBoostSubmittingByEvent] = useState<Record<string, boolean>>({});
  const [certificateWizardType, setCertificateWizardType] = useState<"participant" | "volunteer">("participant");

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
      const myEvents = await fetchEvents();
      await Promise.all([
        fetchAllRegistrations(myEvents),
        fetchApprovedVolunteers(),
        fetchClubOptions(),
        fetchCollegeOptions(),
        fetchCertificateCounts(myEvents.map((event) => event.id)),
      ]);
      setDashboardLoading(false);
    };

    loadDashboard();
  }, [session, status, router]);

  useEffect(() => {
    if (!selectedEventId) return;
    fetchEventWhatsappSettings(selectedEventId);
    loadEventAttendance(selectedEventId);
    fetchVolunteersForEvent(selectedEventId);
    const selectedEvent = events.find((event) => event.id === selectedEventId);
    if (selectedEvent) {
      initializeEventEditDraft(selectedEvent);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (eventDetailView !== "volunteers" || !selectedEventId) return;
    if (selectedEventForVolunteers !== selectedEventId) {
      setSelectedEventForVolunteers(selectedEventId);
      fetchVolunteersForEvent(selectedEventId);
    }
  }, [eventDetailView, selectedEventId, selectedEventForVolunteers]);

  function initializeEventEditDraft(event: Event) {
    setEditTitle(event.title || "");
    setEditDescription(event.description || "");
    setEditLocation(event.location || "");
    setEditPrice(String(event.price || ""));
    setEditMaxAttendees(event.max_attendees ? String(event.max_attendees) : "");
    setEditStartDateTime(event.start_datetime ? event.start_datetime.slice(0, 16) : "");
    setEditEndDateTime(event.end_datetime ? event.end_datetime.slice(0, 16) : "");
    setEditSponsorshipEnabled(Boolean(event.sponsorship_enabled));
  }

  async function fetchEvents(): Promise<Event[]> {
    const res = await fetch("/api/events");
    const data = await res.json();

    const eventsData = Array.isArray(data) ? data : data.events || [];
    const organizerEvents = eventsData.filter((event: Event) => event.organizer_email === session?.user?.email);
    setEvents(organizerEvents);
    return organizerEvents;
  }

  async function fetchCertificateCounts(eventIds: string[]) {
    if (eventIds.length === 0) {
      setCertificateCounts({});
      return;
    }

    try {
      const params = new URLSearchParams({ eventIds: eventIds.join(",") });
      const res = await fetch(`/api/organizer/events/certificate-counts?${params.toString()}`);
      if (!res.ok) {
        setCertificateCounts({});
        return;
      }
      const data = await res.json();
      setCertificateCounts(data.counts || {});
    } catch (err) {
      console.error("Error loading certificate counts:", err);
      setCertificateCounts({});
    }
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
        const approved = (data.volunteers || []).filter((v: any) => v.status === "accepted");
        setApprovedVolunteers(approved);
      }
    } catch (err) {
      console.error("Error fetching approved volunteers:", err);
    }
  }

  async function fetchClubOptions() {
    try {
      const res = await fetch("/api/clubs");
      if (!res.ok) return;
      const data = await res.json();
      const clubs = Array.isArray(data?.clubs)
        ? data.clubs.map((club: any) => String(club || "").trim()).filter(Boolean)
        : [];

      if (clubs.length > 0) {
        setClubOptions(clubs);
      }
    } catch (err) {
      console.error("Error loading clubs:", err);
    }
  }

  async function fetchCollegeOptions() {
    try {
      const res = await fetch("/api/colleges?limit=200");
      if (!res.ok) return;
      const data = await res.json();
      const colleges = Array.isArray(data?.data)
        ? data.data
            .map((college: any) => String(college?.name || "").trim())
            .filter(Boolean)
        : [];
      if (colleges.length > 0) {
        setCollegeOptions(colleges);
      }
    } catch (err) {
      console.error("Error loading colleges:", err);
    }
  }

  async function fetchEventWhatsappSettings(eventId: string) {
    try {
      setEventWhatsappLoading(true);
      const res = await fetch(`/api/organizer/events/${eventId}/whatsapp`);
      if (!res.ok) return;
      const data = await res.json();
      setEventWhatsappEnabled(Boolean(data.whatsapp_group_enabled));
      setEventWhatsappLink(data.whatsapp_group_link || "");
    } catch (err) {
      console.error("Error fetching WhatsApp settings:", err);
    } finally {
      setEventWhatsappLoading(false);
    }
  }

  async function saveEventWhatsappSettings(eventId: string) {
    const trimmed = whatsappGroupLinkValue(eventWhatsappLink);
    if (eventWhatsappEnabled && !trimmed) {
      toast.error("WhatsApp link is required when enabled");
      return;
    }
    if (trimmed && !isValidWhatsappLink(trimmed)) {
      toast.error("WhatsApp link must start with https://chat.whatsapp.com/");
      return;
    }

    try {
      setEventWhatsappSaving(true);
      const res = await fetch(`/api/organizer/events/${eventId}/whatsapp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_group_enabled: eventWhatsappEnabled,
          whatsapp_group_link: trimmed,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to update WhatsApp settings");
        return;
      }

      const data = await res.json();
      setEventWhatsappEnabled(Boolean(data.whatsapp_group_enabled));
      setEventWhatsappLink(data.whatsapp_group_link || "");
      toast.success("WhatsApp settings updated");
    } catch (err) {
      console.error("Error saving WhatsApp settings:", err);
      toast.error("Failed to update WhatsApp settings");
    } finally {
      setEventWhatsappSaving(false);
    }
  }

  function whatsappGroupLinkValue(value: string) {
    return value.trim();
  }

  function isValidWhatsappLink(link: string) {
    return /^https:\/\/chat\.whatsapp\.com\/.+/.test(link);
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

  function getCertificateDraft(eventId: string) {
    return (
      certificateDraftsByEvent[eventId] || {
        applicationId: "",
        title: "Certificate of Appreciation",
      }
    );
  }

  function updateCertificateDraft(eventId: string, patch: Partial<{ applicationId: string; title: string }>) {
    setCertificateDraftsByEvent((prev) => ({
      ...prev,
      [eventId]: {
        ...getCertificateDraft(eventId),
        ...patch,
      },
    }));
  }

  async function handleIssueCertificateFromEventsTable(eventId: string) {
    const draft = getCertificateDraft(eventId);
    if (!draft.applicationId || !draft.title.trim()) {
      toast.error("Please select volunteer and enter certificate title");
      return;
    }

    try {
      setIssuingCertificateForEventId(eventId);
      const res = await fetch("/api/organizer/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: draft.applicationId,
          certificateTitle: draft.title.trim(),
          issuedDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to issue certificate");
      }

      toast.success("Certificate issued successfully!");
      updateCertificateDraft(eventId, {
        applicationId: "",
        title: "Certificate of Appreciation",
      });
      await Promise.all([
        fetchApprovedVolunteers(),
        fetchCertificateCounts(events.map((event) => event.id)),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to issue certificate");
    } finally {
      setIssuingCertificateForEventId(null);
    }
  }

  async function fetchAllRegistrations(sourceEvents?: Event[]) {
    try {
      const myEvents = sourceEvents || events.filter(e => e.organizer_email === session?.user?.email);
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

  async function handleSaveEventEdits(eventId: string) {
    if (!editTitle.trim() || !editDescription.trim() || !editLocation.trim() || !editPrice.trim()) {
      toast.error("Title, description, location and price are required");
      return;
    }

    try {
      setSavingEventEdits(true);
      const res = await fetch(`/api/organizer/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          location: editLocation,
          price: Number(editPrice),
          max_attendees: editMaxAttendees ? Number(editMaxAttendees) : null,
          start_datetime: editStartDateTime ? new Date(editStartDateTime).toISOString() : null,
          end_datetime: editEndDateTime ? new Date(editEndDateTime).toISOString() : null,
          sponsorship_enabled: editSponsorshipEnabled,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update event");
      }

      toast.success("Event details updated");
      setEventEditMode(false);
      const updatedEvents = await fetchEvents();
      await Promise.all([
        fetchAllRegistrations(updatedEvents),
        fetchCertificateCounts(updatedEvents.map((event) => event.id)),
      ]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update event");
    } finally {
      setSavingEventEdits(false);
    }
  }

  async function loadEventAttendance(eventId: string) {
    if (!eventId) return;
    try {
      setAttendanceLoadingByEvent((prev) => ({ ...prev, [eventId]: true }));
      const res = await fetch(`/api/organizer/attendance/${eventId}`);
      if (!res.ok) return;
      const data = await res.json();
      setAttendanceByEvent((prev) => ({ ...prev, [eventId]: data.attendance || [] }));
      setScannerEnabledByEvent((prev) => ({ ...prev, [eventId]: prev[eventId] ?? true }));
    } catch (err) {
      console.error("Error loading attendance:", err);
    } finally {
      setAttendanceLoadingByEvent((prev) => ({ ...prev, [eventId]: false }));
    }
  }

  async function handleInlineAttendanceScan(eventId: string, qrData: string) {
    try {
      const res = await fetch(`/api/organizer/attendance/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCodeData: qrData }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      toast.success("Attendance marked");
      await Promise.all([loadEventAttendance(eventId), fetchAllRegistrations()]);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark attendance");
    }
  }

  function downloadParticipants(event: Event, format: "csv" | "excel") {
    const rows = getEventRegistrations(event.id).map((registration) => ({
      student_email: registration.student_email,
      final_price: Number(registration.final_price || 0),
      status: registration.status || "registered",
      timestamp: new Date(registration.created_at).toISOString(),
      local_time: new Date(registration.created_at).toLocaleString(),
    }));

    if (rows.length === 0) {
      toast.error("No participants to export");
      return;
    }

    if (format === "csv") {
      const headers = ["Student Email", "Amount Paid", "Registration Status", "Timestamp (ISO)", "Timestamp (Local)"];
      const csv = [
        headers.join(","),
        ...rows.map((row) => [
          row.student_email,
          row.final_price,
          row.status,
          row.timestamp,
          row.local_time,
        ].join(",")),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${event.title.replace(/\s+/g, "-").toLowerCase()}-participants.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Participants CSV downloaded");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((row) => ({
        "Student Email": row.student_email,
        "Amount Paid": row.final_price,
        "Registration Status": row.status,
        "Timestamp (ISO)": row.timestamp,
        "Timestamp (Local)": row.local_time,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
    XLSX.writeFile(workbook, `${event.title.replace(/\s+/g, "-").toLowerCase()}-participants.xlsx`);
    toast.success("Participants Excel downloaded");
  }

  function getBoostStatusLabel(event: Event) {
    if (event.boost_payment_status === "completed") {
      return "Boost Active";
    }
    if (event.boost_payment_status === "pending") {
      return "Payment Pending Verification";
    }
    return "Not Boosted";
  }

  async function handleBoostRequest(eventId: string) {
    try {
      setBoostSubmittingByEvent((prev) => ({ ...prev, [eventId]: true }));

      if (!(window as any).Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
          document.body.appendChild(script);
        });
      }

      const res = await fetch(`/api/payments/create-featured-boost-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to create featured boost order");
      }

      const razorpay = new (window as any).Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(Number(data.amount || 0) * 100),
        currency: data.currency || "INR",
        name: "Happenin",
        description: "Featured Event Boost",
        order_id: data.orderId,
        prefill: { email: session?.user?.email },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!verifyRes.ok) {
            const verifyData = await verifyRes.json().catch(() => ({}));
            throw new Error(verifyData.error || "Boost payment verification failed");
          }

          toast.success("Featured boost activated");
          const updatedEvents = await fetchEvents();
          await fetchAllRegistrations(updatedEvents);
        },
      });

      razorpay.open();

    } catch (err: any) {
      toast.error(err.message || "Failed to start featured boost payment");
    } finally {
      setBoostSubmittingByEvent((prev) => ({ ...prev, [eventId]: false }));
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
    }
  }

  async function uploadBrochure(): Promise<string | null> {
    if (!brochureFile) return null;

    try {
      const formData = new FormData();
      formData.append('file', brochureFile);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload brochure');
      }

      return data.imageUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload brochure');
      return null;
    }
  }

  async function handleCreateEvent() {
    if (!title || !description || !location || !price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const missingTimelineBasics =
      eventSchedule.scheduleSessions.length === 0 ||
      !eventSchedule.startDateTime ||
      !eventSchedule.endDateTime;
    const missingSingleDayDate =
      eventSchedule.eventType === 'single-day' && !eventSchedule.eventDate;

    if (missingTimelineBasics || missingSingleDayDate) {
      toast.error("Please add timeline details for your event");
      return;
    }

    if (discountEnabled && !discountClub) {
      toast.error("Please select a club for discount");
      return;
    }

    const volunteerRoleNames = volunteerRoles;
    if (needsVolunteers && volunteerRoleNames.length === 0) {
      toast.error("Please add at least one volunteer role/domain");
      return;
    }

    const cleanedTargetColleges = targetColleges.map((item) => item.trim()).filter(Boolean);
    const cleanedTargetBranches = targetBranches.map((item) => item.trim()).filter(Boolean);
    const cleanedTargetYears = targetYears.filter((year) => Number.isInteger(year) && year > 0);
    const cleanedTargetClubs = targetClubs.map((club) => club.trim()).filter(Boolean);

    if (
      registrationRestricted &&
      cleanedTargetColleges.length === 0 &&
      cleanedTargetBranches.length === 0 &&
      cleanedTargetYears.length === 0 &&
      cleanedTargetClubs.length === 0
    ) {
      toast.error("Add at least one restriction: college, year, branch, or club");
      return;
    }

    const whatsappLink = whatsappGroupLinkValue(whatsappGroupLink);
    if (whatsappGroupEnabled && !whatsappLink) {
      toast.error("WhatsApp link is required when enabled");
      return;
    }
    if (whatsappLink && !isValidWhatsappLink(whatsappLink)) {
      toast.error("WhatsApp link must start with https://chat.whatsapp.com/");
      return;
    }

    setUploadingImage(true);
    let res: Response;
    try {
      let bannerImageUrl: string | null = null;
      if (bannerImage) {
        bannerImageUrl = await uploadBannerImage();
        if (!bannerImageUrl) {
          return;
        }
      }

      let brochureUrl: string | null = null;
      if (brochureFile) {
        brochureUrl = await uploadBrochure();
        if (!brochureUrl) {
          return;
        }
      }

      const scheduleData = eventSchedule.getEventScheduleData();

      res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          location,
          price,
          maxAttendees: maxAttendees ? Number(maxAttendees) : null,
          bannerImage: bannerImageUrl,
          brochureUrl,
          start_datetime: scheduleData.start_datetime,
          end_datetime: scheduleData.end_datetime,
          schedule_sessions: scheduleData.schedule_sessions,
          discountEnabled,
          discountClub,
          discountAmount,
          eligibleMembers,
          sponsorshipEnabled,
          needsVolunteers,
          volunteerRoles: volunteerRoleNames.map((role) => ({ role })),
          volunteerDescription: needsVolunteers ? volunteerDescription : null,
          registrationRestrictions: {
            enabled: registrationRestricted,
            requireAllCriteria,
            colleges: cleanedTargetColleges,
            branches: cleanedTargetBranches,
            years: cleanedTargetYears,
            clubs: cleanedTargetClubs,
          },
          prizePoolDescription: prizePoolEnabled ? prizePoolDescription : null,
          prizePoolAmount: prizePoolEnabled && prizePoolAmount ? Number(prizePoolAmount) : null,
          organizerContactName: organizerContactEnabled ? organizerContactName : null,
          organizerContactPhone: organizerContactEnabled ? organizerContactPhone : null,
          organizerContactEmail: organizerContactEnabled ? organizerContactEmail : null,
          whatsappGroupEnabled,
          whatsappGroupLink: whatsappLink || "",
          organizerEmail: session?.user?.email,
        }),
      });
    } finally {
      setUploadingImage(false);
    }

    if (res.ok) {
      const createdEvent = await res.json();
      const createdEventId = createdEvent?.event?.id || createdEvent?.id;
      const eventLink = createdEventId ? `${window.location.origin}/events/${createdEventId}` : `${window.location.origin}/events`;
      
      // Create bulk ticket packs if enabled
      if (bulkTicketsEnabled && bulkTicketPacks.length > 0 && createdEventId) {
        try {
          const packCreationPromises = bulkTicketPacks
            .filter(pack => pack.name && pack.quantity > 0 && pack.basePrice > 0 && pack.bulkPrice > 0)
            .map(pack => 
              fetch("/api/bulk-tickets/packs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  eventId: createdEventId,
                  organizerEmail: session?.user?.email,
                  name: pack.name,
                  description: pack.description,
                  quantity: pack.quantity,
                  basePrice: pack.basePrice,
                  bulkPrice: pack.bulkPrice,
                  offerTitle: pack.offerTitle,
                  offerDescription: pack.offerDescription,
                  offerExpiryDate: pack.offerExpiryDate || null,
                }),
              })
            );
          
          await Promise.all(packCreationPromises);
          toast.success(`${bulkTicketPacks.length} bulk ticket pack(s) created!`);
        } catch (error) {
          console.error("Error creating bulk ticket packs:", error);
          toast.error("Event created, but some bulk ticket packs failed to create");
        }
      }
      
      toast.success(
        <div>
          <p className="font-semibold mb-1">Event created successfully!</p>
          <p className="text-xs break-all">{eventLink}</p>
        </div>,
        { duration: 8000 }
      );

      setTitle("");
      setDescription("");
      setLocation("");
      setPrice("");
      setMaxAttendees("");
      setSponsorshipEnabled(false);
      setBannerImage(null);
      setBannerImagePreview(null);
      setBrochureFile(null);
      setPrizePoolEnabled(false);
      setPrizePoolDescription("");
      setPrizePoolAmount("");
      setNeedsVolunteers(false);
      setVolunteerRoles([]);
      setVolunteerDescription("");
      setRegistrationRestricted(false);
      setRequireAllCriteria(false);
      setTargetColleges([]);
      setTargetBranches([]);
      setTargetYears([]);
      setTargetClubs([]);
      setOrganizerContactEnabled(false);
      setOrganizerContactName("");
      setOrganizerContactPhone("");
      setOrganizerContactEmail("");
      setWhatsappGroupEnabled(false);
      setWhatsappGroupLink("");
      setBulkTicketsEnabled(false);
      setBulkTicketPacks([]);
      eventSchedule.setEventType('single-day');
      eventSchedule.setEventDate("");
      setShowCreateForm(false);
      fetchEvents();
      fetchAllRegistrations();
    } else {
      const errorData = await res.json().catch(() => ({}));
      toast.error(errorData?.error || "Failed to create event");
    }
  }

  // Analytics
  function getTodayEvents() {
    const today = new Date().toDateString();
    return events.filter(e => new Date(e.date).toDateString() === today);
  }

  function getEventDateRange(event: Event) {
    const startDate = event.start_datetime ? new Date(event.start_datetime) : new Date(event.date);
    const endDate = event.end_datetime
      ? new Date(event.end_datetime)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    return { startDate, endDate };
  }

  function getEventStatus(event: Event) {
    const now = new Date();
    const { startDate, endDate } = getEventDateRange(event);

    if (now >= startDate && now <= endDate) {
      return "Live";
    }
    if (now > endDate) {
      return "Completed";
    }
    return "Upcoming";
  }

  function getAttendancePercentage(eventId: string) {
    const regs = getEventRegistrations(eventId);
    if (regs.length === 0) {
      return 0;
    }
    const checkedInCount = regs.filter((registration) => registration.status === "checked_in").length;
    return Math.round((checkedInCount / regs.length) * 100);
  }

  function getOperationalStatus(event: Event) {
    const regs = getEventRegistrations(event.id);
    const checkedInCount = regs.filter((registration) => registration.status === "checked_in").length;
    const eventStatus = getEventStatus(event);

    if (eventStatus === "Completed") {
      return checkedInCount > 0 ? "Attendance Closed" : "Closed - No Check-ins";
    }
    if (checkedInCount > 0) {
      return "Attendance In Progress";
    }
    return eventStatus === "Live" ? "Ready for Check-in" : "Upcoming - Not Started";
  }

  function getLiveEvents() {
    const now = new Date();
    return events.filter((event) => {
      const start = event.start_datetime ? new Date(event.start_datetime) : new Date(event.date);
      const end = event.end_datetime
        ? new Date(event.end_datetime)
        : new Date(start.getTime() + 2 * 60 * 60 * 1000);
      return end >= now;
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

  function getUniqueParticipantsCount() {
    return new Set(allRegistrations.map((registration) => registration.student_email)).size;
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
            <img src="/branding/logo-wordmark-brand.svg" alt="Happenin" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Desktop Tabs Bar */}
      <div className="hidden md:block sticky top-[76px] z-30 bg-bg-card/95 backdrop-blur-md border-b border-border-default transition-all duration-medium ease-standard">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-start gap-2 overflow-x-auto">
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
              className={`px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-text-inverse"
                  : "bg-bg-card text-text-secondary hover:bg-bg-muted"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-6">
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
                  <div className="text-sm text-text-muted">Live & Upcoming</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Users className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{getUniqueParticipantsCount()}</div>
                  <div className="text-sm text-text-muted">Unique Participants</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Rupee className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">₹{getTotalRevenue()}</div>
                  <div className="text-sm text-text-muted">Total Collected</div>
                </div>
                <div className="bg-bg-card rounded-xl p-6 border border-border-default transition-all duration-medium ease-standard hover:-translate-y-1 hover:shadow-lg transition-all duration-medium ease-standard">
                  <Icons.Calendar className="h-6 w-6 mb-2 text-text-secondary" />
                  <div className="text-3xl font-bold text-text-primary">{events.length}</div>
                  <div className="text-sm text-text-muted">Total Events</div>
                </div>
              </div>
            </section>

            {/* Live Events */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
                <Icons.Flame className="h-5 w-5 text-primary" /> Live Events
              </h2>
              <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-bg-muted border-b border-border-default">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-text-primary">Event Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-primary">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-primary">Registrations</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-primary">Revenue</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-primary">Avg Price Paid</th>
                        <th className="text-left px-4 py-3 font-semibold text-text-primary">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getLiveEvents().length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                            No live or upcoming events.
                          </td>
                        </tr>
                      ) : (
                        getLiveEvents().map((event) => {
                          const regs = getEventRegistrations(event.id);
                          const revenue = regs.reduce((sum, registration) => sum + Number(registration.final_price || 0), 0);
                          const avgPrice = regs.length > 0 ? (revenue / regs.length).toFixed(2) : "0.00";
                          const status = getEventStatus(event);

                          return (
                            <tr key={event.id} className="border-t border-border-default hover:bg-bg-muted/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-text-primary">{event.title}</td>
                              <td className="px-4 py-3 text-text-secondary">{new Date(event.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-text-primary font-semibold">{regs.length}</td>
                              <td className="px-4 py-3 text-text-primary font-semibold">₹{revenue}</td>
                              <td className="px-4 py-3 text-text-secondary">₹{avgPrice}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                  status === "Live"
                                    ? "bg-green-900/20 text-green-400 border-green-700/50"
                                    : "bg-blue-900/20 text-blue-400 border-blue-700/50"
                                }`}>
                                  {status}
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
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition-all font-medium shadow-md"
              >
                {showCreateForm ? "Cancel" : "+ Create Event"}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4 md:max-w-4xl md:mx-auto">
                <h3 className="text-lg font-bold text-text-primary mb-4">Create New Event</h3>
                
                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <label className="text-sm text-text-secondary mb-2 block">Event Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    placeholder="Enter event title"
                  />
                </div>

                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <label className="text-sm text-text-secondary mb-2 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary resize-none"
                    rows={3}
                    placeholder="Describe your event"
                  />
                </div>

                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
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
                  eventDate={eventSchedule.eventDate}
                  onEventDateChange={eventSchedule.setEventDate}
                  scheduleSessions={eventSchedule.scheduleSessions}
                  onAddSession={eventSchedule.addScheduleSession}
                  onUpdateSession={eventSchedule.updateScheduleSession}
                  onRemoveSession={eventSchedule.removeScheduleSession}
                />

                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <label className="text-sm text-text-secondary mb-2 block">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    placeholder="Enter price"
                  />
                </div>

                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <label className="text-sm text-text-secondary mb-2 block">Max Attendees (Optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={discountEnabled}
                      onChange={(e) => setDiscountEnabled(e.target.checked)}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Enable Club Discount</span>
                  </label>
                </div>

                {discountEnabled && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Club Name</label>
                      <select
                        value={discountClub}
                        onChange={(e) => setDiscountClub(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                      >
                        <option value="">Select Club</option>
                        {clubOptions.map((club) => (
                          <option key={club} value={club}>
                            {club}
                          </option>
                        ))}
                      </select>
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

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={sponsorshipEnabled}
                      onChange={(e) => setSponsorshipEnabled(e.target.checked)}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Enable Sponsorship Visibility</span>
                  </label>
                </div>

                {sponsorshipEnabled && (
                  <div className="bg-bg-card rounded-lg p-4 border border-border-default">
                    <p className="text-sm text-text-muted">
                      Sponsorship visibility is managed by Happenin. Sponsors pay the platform directly.
                    </p>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={bulkTicketsEnabled}
                      onChange={(e) => {
                        setBulkTicketsEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setBulkTicketPacks([]);
                        }
                      }}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Enable Bulk Ticket Packs</span>
                  </label>
                </div>

                {bulkTicketsEnabled && (
                  <div className="bg-bg-muted rounded-lg p-4 border border-border-default space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-text-primary">Bulk Ticket Packs</h4>
                      <button
                        type="button"
                        onClick={() => {
                          const eventPrice = Number(price) || 0;
                          setBulkTicketPacks([
                            ...bulkTicketPacks,
                            {
                              name: "",
                              description: "",
                              quantity: 10,
                              basePrice: eventPrice,
                              bulkPrice: 0,
                              offerTitle: "",
                              offerDescription: "",
                              offerExpiryDate: "",
                            },
                          ]);
                        }}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primaryHover text-xs font-medium"
                      >
                        + Add Pack
                      </button>
                    </div>

                    {bulkTicketPacks.length === 0 && (
                      <p className="text-sm text-text-muted">No bulk ticket packs yet. Click "Add Pack" to create one.</p>
                    )}

                    {bulkTicketPacks.map((pack, index) => (
                      <div key={index} className="bg-bg-card rounded-lg p-4 border border-border-default space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-text-primary">Pack #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setBulkTicketPacks(bulkTicketPacks.filter((_, i) => i !== index));
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">Pack Name *</label>
                          <input
                            type="text"
                            value={pack.name}
                            onChange={(e) => {
                              const updated = [...bulkTicketPacks];
                              updated[index].name = e.target.value;
                              setBulkTicketPacks(updated);
                            }}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
                            placeholder="e.g., Group of 10"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">Number of Tickets *</label>
                          <input
                            type="number"
                            min={1}
                            value={pack.quantity}
                            onChange={(e) => {
                              const updated = [...bulkTicketPacks];
                              updated[index].quantity = Number(e.target.value);
                              setBulkTicketPacks(updated);
                            }}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">Bulk Price (₹) *</label>
                          <input
                            type="number"
                            min={0}
                            value={pack.bulkPrice}
                            onChange={(e) => {
                              const updated = [...bulkTicketPacks];
                              updated[index].bulkPrice = Number(e.target.value);
                              // Auto-update basePrice from event price
                              updated[index].basePrice = Number(price) || 0;
                              setBulkTicketPacks(updated);
                            }}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary"
                            placeholder="Total bulk price for the pack"
                          />
                          {Number(price) > 0 && pack.bulkPrice > 0 && pack.quantity > 0 && (
                            <div className="text-xs mt-1 space-y-0.5">
                              <p className="text-text-muted">
                                Price per ticket: ₹{(pack.bulkPrice / pack.quantity).toFixed(2)}
                              </p>
                              {(pack.bulkPrice / pack.quantity) < Number(price) && (
                                <p className="text-success">
                                  {Math.round(((Number(price) - (pack.bulkPrice / pack.quantity)) / Number(price)) * 100)}% discount per ticket (regular: ₹{price})
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-text-secondary mb-1 block">Description</label>
                          <textarea
                            value={pack.description}
                            onChange={(e) => {
                              const updated = [...bulkTicketPacks];
                              updated[index].description = e.target.value;
                              setBulkTicketPacks(updated);
                            }}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary resize-none"
                            rows={2}
                            placeholder="Optional description"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={needsVolunteers}
                      onChange={(e) => {
                        setNeedsVolunteers(e.target.checked);
                        if (!e.target.checked) {
                          setVolunteerRoles([]);
                          setVolunteerDescription("");
                        }
                      }}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Need Volunteers (with role/domain requirements)</span>
                  </label>
                </div>

                {needsVolunteers && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Volunteer Roles / Domains</label>
                      <select
                        multiple
                        value={volunteerRoles}
                        onChange={(e) =>
                          setVolunteerRoles(Array.from(e.target.selectedOptions).map((option) => option.value))
                        }
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary min-h-[140px]"
                      >
                        {VOLUNTEER_ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-muted mt-1">Hold Ctrl/Cmd to select multiple roles.</p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Volunteer Instructions (Optional)</label>
                      <textarea
                        value={volunteerDescription}
                        onChange={(e) => setVolunteerDescription(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary resize-none"
                        rows={3}
                        placeholder="Briefly describe what volunteers should handle"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={registrationRestricted}
                      onChange={(e) => {
                        setRegistrationRestricted(e.target.checked);
                        if (!e.target.checked) {
                          setRequireAllCriteria(false);
                          setTargetColleges([]);
                          setTargetBranches([]);
                          setTargetYears([]);
                          setTargetClubs([]);
                        }
                      }}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Restrict Registration by College / Year / Branch / Club</span>
                  </label>
                </div>

                {registrationRestricted && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={!requireAllCriteria}
                          onChange={() => setRequireAllCriteria(false)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-text-secondary">Match ANY criteria</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={requireAllCriteria}
                          onChange={() => setRequireAllCriteria(true)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-text-secondary">Match ALL criteria</span>
                      </label>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Allowed Colleges</label>
                      <select
                        multiple
                        value={targetColleges}
                        onChange={(e) =>
                          setTargetColleges(Array.from(e.target.selectedOptions).map((option) => option.value))
                        }
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary min-h-[140px]"
                      >
                        {collegeOptions.map((college) => (
                          <option key={college} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-muted mt-1">Hold Ctrl/Cmd to select multiple colleges.</p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Allowed Branches</label>
                      <select
                        multiple
                        value={targetBranches}
                        onChange={(e) =>
                          setTargetBranches(Array.from(e.target.selectedOptions).map((option) => option.value))
                        }
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary min-h-[140px]"
                      >
                        {BRANCH_OPTIONS.map((branch) => (
                          <option key={branch} value={branch}>
                            {branch}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-muted mt-1">Hold Ctrl/Cmd to select multiple branches.</p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Allowed Years of Study</label>
                      <select
                        multiple
                        value={targetYears.map(String)}
                        onChange={(e) =>
                          setTargetYears(
                            Array.from(e.target.selectedOptions)
                              .map((option) => Number(option.value))
                              .filter((year) => Number.isInteger(year) && year > 0)
                          )
                        }
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary min-h-[140px]"
                      >
                        {YEAR_OPTIONS.map((year) => (
                          <option key={year} value={year}>
                            Year {year}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-muted mt-1">Hold Ctrl/Cmd to select multiple years.</p>
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Allowed Clubs</label>
                      <select
                        multiple
                        value={targetClubs}
                        onChange={(e) =>
                          setTargetClubs(Array.from(e.target.selectedOptions).map((option) => option.value))
                        }
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary min-h-[120px]"
                      >
                        {clubOptions.map((club) => (
                          <option key={club} value={club}>
                            {club}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-text-muted mt-1">Hold Ctrl/Cmd to select multiple clubs.</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={whatsappGroupEnabled}
                      onChange={(e) => setWhatsappGroupEnabled(e.target.checked)}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Enable WhatsApp Group for Participants</span>
                  </label>
                </div>

                {whatsappGroupEnabled && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">WhatsApp Group Invite Link</label>
                      <input
                        value={whatsappGroupLink}
                        onChange={(e) => setWhatsappGroupLink(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="https://chat.whatsapp.com/..."
                      />
                    </div>
                    <p className="text-xs text-text-muted">
                      Participants can choose to join this group. They are not added automatically.
                    </p>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={prizePoolEnabled}
                      onChange={(e) => {
                        setPrizePoolEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setPrizePoolAmount("");
                          setPrizePoolDescription("");
                        }
                      }}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Add Prize Pool & Rewards</span>
                  </label>
                </div>

                {prizePoolEnabled && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Total Prize Pool (₹)</label>
                      <input
                        type="number"
                        value={prizePoolAmount}
                        onChange={(e) => setPrizePoolAmount(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="e.g., 50000"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Prize Details & Distribution</label>
                      <textarea
                        value={prizePoolDescription}
                        onChange={(e) => setPrizePoolDescription(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary resize-none"
                        rows={3}
                        placeholder="e.g., 1st Prize: ₹25000, 2nd Prize: ₹15000, 3rd Prize: ₹10000"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={organizerContactEnabled}
                      onChange={(e) => {
                        setOrganizerContactEnabled(e.target.checked);
                        if (!e.target.checked) {
                          setOrganizerContactName("");
                          setOrganizerContactPhone("");
                          setOrganizerContactEmail("");
                        }
                      }}
                      className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Add Organizer Contact Details</span>
                  </label>
                </div>

                {organizerContactEnabled && (
                  <div className="bg-bg-muted rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Contact Name</label>
                      <input
                        type="text"
                        value={organizerContactName}
                        onChange={(e) => setOrganizerContactName(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="e.g., Event Coordinator"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Contact Phone</label>
                      <input
                        type="tel"
                        value={organizerContactPhone}
                        onChange={(e) => setOrganizerContactPhone(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="e.g., +91 9876543210"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">Contact Email</label>
                      <input
                        type="email"
                        value={organizerContactEmail}
                        onChange={(e) => setOrganizerContactEmail(e.target.value)}
                        className="w-full bg-bg-card border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="e.g., contact@event.com"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <label className="text-sm text-text-secondary mb-2 block">Event Banner - Optional</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleBannerImageChange}
                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-text-inverse hover:file:bg-primaryHover transition-all duration-fast ease-standard"
                  />
                  <p className="text-xs text-text-muted mt-2">
                    Recommended ratio: 4:5 (Instagram post). Allowed formats: JPG, JPEG, PNG, WEBP. Max size: 5MB.
                  </p>
                  {bannerImage && (
                    <p className="text-xs text-success mt-2">✓ {bannerImage.name}</p>
                  )}
                  {bannerImagePreview && (
                    <div className="mt-3">
                      <div className="w-full max-w-xs aspect-[4/5] rounded-lg border border-border-default overflow-hidden bg-bg-card">
                        <img
                          src={bannerImagePreview}
                          alt="Banner preview"
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <p className="text-xs text-text-muted mt-2">
                        Preview uses center-crop to 4:5. Non-4:5 images will be cropped automatically.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBannerImage(null);
                          setBannerImagePreview(null);
                        }}
                        className="mt-2 text-xs text-text-secondary hover:text-text-primary"
                      >
                        Remove banner
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-text-secondary mb-2 block">Brochure (PDF/Image) - Optional</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setBrochureFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-text-inverse hover:file:bg-blue-800 transition-all duration-fast ease-standard"
                  />
                  {brochureFile && (
                    <p className="text-xs text-success mt-2">✓ {brochureFile.name}</p>
                  )}
                </div>

                <LoadingButton
                  onClick={handleCreateEvent}
                  disabled={uploadingImage}
                  loading={uploadingImage}
                  loadingText="Uploading image…"
                  className="w-full bg-primary text-text-inverse py-3 rounded-lg hover:bg-primaryHover transition-all font-semibold disabled:opacity-50"
                >
                  Create Event
                </LoadingButton>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {events.map((event) => {
                const regs = getEventRegistrations(event.id);
                const revenue = regs.reduce((sum, registration) => sum + Number(registration.final_price || 0), 0);
                const attendancePercentage = getAttendancePercentage(event.id);
                const eventStatus = getEventStatus(event);
                const { startDate, endDate } = getEventDateRange(event);

                return (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEventId(event.id);
                      setEventDetailView("overview");
                      setEventEditMode(false);
                    }}
                    className="text-left bg-bg-card rounded-xl border border-border-default overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                  >
                    {event.banner_image ? (
                      <img src={event.banner_image} alt={event.title} className="w-full h-44 object-cover" />
                    ) : (
                      <div className="w-full h-44 bg-bg-muted flex items-center justify-center text-text-muted">
                        <Icons.Image className="h-8 w-8" />
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-text-primary line-clamp-2">{event.title}</h3>
                      <p className="text-sm text-text-secondary">
                        {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {endDate ? ` - ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-bg-muted rounded-lg p-2 border border-border-default">
                          <div className="text-text-muted">Registrations</div>
                          <div className="text-text-primary font-semibold">{regs.length}</div>
                        </div>
                        <div className="bg-bg-muted rounded-lg p-2 border border-border-default">
                          <div className="text-text-muted">Attendance</div>
                          <div className="text-text-primary font-semibold">{attendancePercentage}%</div>
                        </div>
                        <div className="bg-bg-muted rounded-lg p-2 border border-border-default col-span-2">
                          <div className="text-text-muted">Revenue</div>
                          <div className="text-text-primary font-semibold">₹{revenue}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          eventStatus === "Live"
                            ? "bg-green-900/20 text-green-400 border-green-700/50"
                            : eventStatus === "Completed"
                            ? "bg-gray-900/20 text-gray-400 border-gray-700/50"
                            : "bg-blue-900/20 text-blue-400 border-blue-700/50"
                        }`}>
                          {eventStatus}
                        </span>
                        <span className="text-xs text-text-muted">Issued: {certificateCounts[event.id] || 0}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {events.length === 0 && (
              <div className="bg-bg-card rounded-xl border border-border-default p-10 text-center text-text-muted">
                No events created yet.
              </div>
            )}
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
                <div className="flex items-center gap-2">
                  {!eventEditMode ? (
                    <>
                      <button
                        onClick={() => {
                          setFestSubmissionModal({
                            isOpen: true,
                            eventId: event.id,
                            eventTitle: event.title,
                          });
                        }}
                        className="px-4 py-2 border border-border-default text-primary rounded-lg hover:bg-bg-muted text-sm font-semibold flex items-center gap-2"
                      >
                        <Icons.Flame className="h-4 w-4" />
                        Submit to Fest
                      </button>
                      <button
                        onClick={() => {
                          initializeEventEditDraft(event);
                          setEventEditMode(true);
                        }}
                        className="px-4 py-2 border border-border-default text-text-primary rounded-lg hover:bg-bg-muted text-sm font-semibold"
                      >
                        Edit Event
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          initializeEventEditDraft(event);
                          setEventEditMode(false);
                        }}
                        className="px-4 py-2 border border-border-default text-text-secondary rounded-lg hover:bg-bg-muted text-sm font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEventEdits(event.id)}
                        disabled={savingEventEdits}
                        className="px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover text-sm font-semibold disabled:opacity-50"
                      >
                        {savingEventEdits ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Sub Navigation */}
              <div className="flex gap-2 border-b border-border-default overflow-x-auto">
                {[
                  { id: "overview", icon: Icons.Gauge, label: "Overview" },
                  { id: "timeline", icon: Icons.Clock, label: "Timeline" },
                  { id: "bulk", icon: Icons.Ticket, label: "Bulk Tickets" },
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
                  {eventEditMode && (
                    <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
                      <h3 className="text-lg font-bold text-text-primary">Edit Event Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-sm text-text-secondary mb-1 block">Event Title</label>
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm text-text-secondary mb-1 block">Description</label>
                          <textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary mb-1 block">Location</label>
                          <input
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary mb-1 block">Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary mb-1 block">Start Date & Time</label>
                          <input
                            type="datetime-local"
                            value={editStartDateTime}
                            onChange={(e) => setEditStartDateTime(e.target.value)}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary mb-1 block">End Date & Time</label>
                          <input
                            type="datetime-local"
                            value={editEndDateTime}
                            onChange={(e) => setEditEndDateTime(e.target.value)}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-text-secondary mb-1 block">Max Attendees</label>
                          <input
                            type="number"
                            min={1}
                            value={editMaxAttendees}
                            onChange={(e) => setEditMaxAttendees(e.target.value)}
                            className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                        <div className="flex items-center pt-7">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editSponsorshipEnabled}
                              onChange={(e) => setEditSponsorshipEnabled(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-text-secondary">Enable Sponsorship Visibility</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">WhatsApp Group</h3>
                        <p className="text-sm text-text-secondary">
                          Participants can choose to join this group. They are not added automatically.
                        </p>
                      </div>
                      {eventWhatsappLoading && (
                        <span className="text-xs text-text-muted">Loading...</span>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={eventWhatsappEnabled}
                        onChange={(e) => setEventWhatsappEnabled(e.target.checked)}
                        className="w-5 h-5 text-brand bg-bg-muted border-2 border-border-default rounded-md focus:ring-2 focus:ring-brand focus:ring-offset-2 transition-all checked:bg-brand checked:border-brand cursor-pointer"
                      />
                      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Enable WhatsApp Group for Participants</span>
                    </label>

                    <div>
                      <label className="text-sm text-text-secondary mb-2 block">WhatsApp Group Invite Link</label>
                      <input
                        value={eventWhatsappLink}
                        onChange={(e) => setEventWhatsappLink(e.target.value)}
                        className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary"
                        placeholder="https://chat.whatsapp.com/..."
                      />
                    </div>

                    <button
                      onClick={() => saveEventWhatsappSettings(event.id)}
                      disabled={eventWhatsappSaving}
                      className="w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover disabled:opacity-50"
                    >
                      {eventWhatsappSaving ? "Saving..." : "Save WhatsApp Settings"}
                    </button>
                  </div>
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

                  <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                      <h3 className="text-lg font-bold text-text-primary">Participants</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => downloadParticipants(event, "csv")}
                          className="px-3 py-2 bg-bg-muted border border-border-default rounded-lg text-sm text-text-primary hover:bg-bg-muted/70"
                        >
                          Download CSV
                        </button>
                        <button
                          onClick={() => downloadParticipants(event, "excel")}
                          className="px-3 py-2 bg-bg-muted border border-border-default rounded-lg text-sm text-text-primary hover:bg-bg-muted/70"
                        >
                          Download Excel
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-border-default">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className="bg-bg-muted border-b border-border-default">
                          <tr>
                            <th className="text-left px-3 py-2 font-semibold text-text-primary">Student Email</th>
                            <th className="text-left px-3 py-2 font-semibold text-text-primary">Amount Paid</th>
                            <th className="text-left px-3 py-2 font-semibold text-text-primary">Status</th>
                            <th className="text-left px-3 py-2 font-semibold text-text-primary">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-3 py-8 text-center text-text-muted">
                                No participants yet
                              </td>
                            </tr>
                          ) : (
                            regs.map((registration) => (
                              <tr key={registration.id} className="border-t border-border-default">
                                <td className="px-3 py-2 text-text-primary">{registration.student_email}</td>
                                <td className="px-3 py-2 text-text-primary">₹{registration.final_price}</td>
                                <td className="px-3 py-2 text-text-secondary">{registration.status || "registered"}</td>
                                <td className="px-3 py-2 text-text-secondary">
                                  {new Date(registration.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-text-primary">Attendance QR Scanner</h3>
                      <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(scannerEnabledByEvent[event.id])}
                          onChange={(e) =>
                            setScannerEnabledByEvent((prev) => ({
                              ...prev,
                              [event.id]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4"
                        />
                        Scanner On
                      </label>
                    </div>

                    {scannerEnabledByEvent[event.id] && (
                      <div className="bg-bg-muted border border-border-default rounded-lg p-3">
                        <QRScanner
                          eventId={event.id}
                          onScan={(qrData) => handleInlineAttendanceScan(event.id, qrData)}
                        />
                      </div>
                    )}

                    <div className="bg-bg-muted rounded-lg border border-border-default max-h-72 overflow-y-auto">
                      {attendanceLoadingByEvent[event.id] ? (
                        <div className="p-4 text-sm text-text-secondary">Loading attendance...</div>
                      ) : (attendanceByEvent[event.id] || []).length === 0 ? (
                        <div className="p-4 text-sm text-text-muted">No attendance records yet.</div>
                      ) : (
                        <div className="divide-y divide-border-default">
                          {(attendanceByEvent[event.id] || []).map((record) => (
                            <div key={record.id} className="px-4 py-3 flex items-center justify-between gap-2 text-sm">
                              <span className="text-text-primary truncate">{record.student_email}</span>
                              <span className="text-text-secondary whitespace-nowrap">
                                {new Date(record.scanned_at).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                    <h3 className="text-lg font-bold text-text-primary">Volunteers & Volunteer Certificates</h3>
                    <div className="text-sm text-text-secondary">
                      Applications: {volunteerApplications.length} • Approved: {volunteerApplications.filter((app) => app.status === "accepted").length}
                    </div>
                    <button
                      onClick={() => setEventDetailView("volunteers")}
                      className="px-4 py-2 border border-border-default rounded-lg text-sm font-semibold text-text-primary hover:bg-bg-muted"
                    >
                      Open Volunteer Details
                    </button>
                  </div>

                  <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                    <h3 className="text-lg font-bold text-text-primary">Push Event (Boost Visibility)</h3>
                    <div className="text-sm text-text-secondary">Status: {getBoostStatusLabel(event)}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block">Amount to Pay Happenin (₹)</label>
                        <input
                          type="number"
                          min={1}
                          value={boostAmountByEvent[event.id] || ""}
                          onChange={(e) =>
                            setBoostAmountByEvent((prev) => ({
                              ...prev,
                              [event.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                          placeholder="Enter boost amount"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-text-secondary mb-1 block">Boost Duration (days)</label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={boostDaysByEvent[event.id] || "7"}
                          onChange={(e) =>
                            setBoostDaysByEvent((prev) => ({
                              ...prev,
                              [event.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleBoostRequest(event.id)}
                      disabled={Boolean(boostSubmittingByEvent[event.id])}
                      className="px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover font-semibold disabled:opacity-50"
                    >
                      {boostSubmittingByEvent[event.id] ? "Submitting..." : "Pay & Push Event"}
                    </button>
                  </div>

                  {event.sponsorship_enabled && (
                    <div className="space-y-4">
                      <div className="bg-bg-card rounded-xl border border-border-default p-6">
                        <h3 className="text-lg font-bold text-text-primary mb-2">Sponsorship Visibility</h3>
                        <p className="text-sm text-text-secondary">
                          Sponsorship packs are managed by Happenin. Visibility activates only after admin verifies payment.
                        </p>
                      </div>
                      <OrganizerSponsorshipDeals eventId={event.id} />
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {eventDetailView === "timeline" && (
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <h3 className="text-lg font-bold text-text-primary mb-4">Event Timeline</h3>
                  <EventTimelineDisplay
                    startDateTime={event.start_datetime || event.date || ""}
                    endDateTime={event.end_datetime || event.date || ""}
                    scheduleSessions={event.schedule_sessions ?? null}
                    eventTitle={event.title}
                  />
                </div>
              )}

              {eventDetailView === "bulk" && (
                <div className="bg-bg-card rounded-xl p-6 border border-border-default">
                  <BulkTicketManager
                    eventId={event.id}
                    organizerEmail={session?.user?.email || ""}
                    onPackCreated={() => fetchEvents()}
                  />
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
                      <div className="bg-bg-muted rounded-xl p-12 border-2 border-dashed border-border-default flex flex-col items-center justify-center">
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
                                    Applied {new Date(app.applied_at || app.created_at).toLocaleDateString()} at {new Date(app.applied_at || app.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                      <div className="bg-bg-muted rounded-xl p-12 border-2 border-dashed border-border-default flex flex-col items-center justify-center">
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
                  <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-text-primary">Certificate Editor, Preview & Issue</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCertificateWizardType("participant")}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                            certificateWizardType === "participant"
                              ? "bg-primary text-text-inverse border-primary"
                              : "bg-bg-muted text-text-primary border-border-default"
                          }`}
                        >
                          Participants
                        </button>
                        <button
                          onClick={() => setCertificateWizardType("volunteer")}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                            certificateWizardType === "volunteer"
                              ? "bg-primary text-text-inverse border-primary"
                              : "bg-bg-muted text-text-primary border-border-default"
                          }`}
                        >
                          Volunteers
                        </button>
                      </div>
                    </div>
                    <CertificateGenerationWizard eventId={event.id} recipientType={certificateWizardType} />
                  </div>

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
                              {v.student_email} - {v.role || "Volunteer"}
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
                            <p className="text-sm text-text-muted">{v.role || "Volunteer"}</p>
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
                              className="h-full bg-primary rounded-full transition-all"
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
                              className="h-full bg-primary rounded-full transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-bg-card rounded-xl border border-border-default p-5">
                <div className="text-sm text-text-muted mb-1">Sponsorship Enabled Events</div>
                <div className="text-3xl font-bold text-text-primary">
                  {events.filter((event) => Boolean(event.sponsorship_enabled)).length}
                </div>
              </div>
              <div className="bg-bg-card rounded-xl border border-border-default p-5">
                <div className="text-sm text-text-muted mb-1">Live/Upcoming Sponsorship Events</div>
                <div className="text-3xl font-bold text-text-primary">
                  {
                    events.filter(
                      (event) => Boolean(event.sponsorship_enabled) && getEventStatus(event) !== "Completed"
                    ).length
                  }
                </div>
              </div>
            </div>
            <OrganizerSponsorshipDeals />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setProfileSection("main")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                    profileSection === "main"
                      ? "bg-primary text-text-inverse border-primary"
                      : "bg-bg-muted text-text-primary border-border-default hover:bg-bg-muted"
                  }`}
                >
                  Account
                </button>
                <button
                  onClick={() => setProfileSection("help")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                    profileSection === "help"
                      ? "bg-primary text-text-inverse border-primary"
                      : "bg-bg-muted text-text-primary border-border-default hover:bg-bg-muted"
                  }`}
                >
                  Help & Support
                </button>
                <button
                  onClick={() => setProfileSection("guidelines")}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all ${
                    profileSection === "guidelines"
                      ? "bg-primary text-text-inverse border-primary"
                      : "bg-bg-muted text-text-primary border-border-default hover:bg-bg-muted"
                  }`}
                >
                  Organizer Guidelines
                </button>
              </div>
            </div>

            {profileSection === "main" && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-3">
                <h3 className="text-lg font-bold text-text-primary mb-2">Account</h3>
                <p className="text-sm text-text-secondary">Use the sections above for support and operating guidelines.</p>
              </div>
            )}

            {profileSection === "help" && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                <h3 className="text-lg font-bold text-text-primary">Help & Support</h3>
                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <p className="text-sm text-text-secondary mb-2">For event issues, payment concerns, or attendee disputes, contact support:</p>
                  <p className="text-sm text-text-primary">Email: support@happenin.app</p>
                  <p className="text-sm text-text-primary">Response Window: Within 24 hours</p>
                </div>
                <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
                  <p className="text-sm text-text-secondary mb-2">Escalation Path</p>
                  <p className="text-sm text-text-primary">Include event name, issue summary, screenshots, and payment reference in the same email thread.</p>
                </div>
              </div>
            )}

            {profileSection === "guidelines" && (
              <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
                <h3 className="text-lg font-bold text-text-primary">Organizer Guidelines</h3>
                <div className="space-y-3">
                  {[
                    "Keep event timeline accurate before publishing.",
                    "Scan attendance only at the venue or official check-in desk.",
                    "Issue certificates only to approved volunteers and verified participants.",
                    "Use clear cancellation or reschedule communication in advance.",
                    "Keep sponsor deliverables and promised benefits updated.",
                  ].map((guideline) => (
                    <div key={guideline} className="bg-bg-muted rounded-lg p-3 border border-border-default text-sm text-text-primary">
                      {guideline}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-bg-card rounded-xl p-6 border border-border-default">
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

      {/* Bottom Navigation - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-card/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)]">
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
