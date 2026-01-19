"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { RegistrationsModal } from "@/components/RegistrationsModal";
import AttendanceModal from "@/components/AttendanceModal";

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
  const [activeTab, setActiveTab] = useState<"dashboard" | "events" | "registrations" | "profile">("dashboard");

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [selectedEventForRegs, setSelectedEventForRegs] = useState<string>("");

  // Event form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountClub, setDiscountClub] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [eligibleMembers, setEligibleMembers] = useState<EligibleMember[]>([]);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || (session.user as any).role !== "organizer") {
      router.replace("/login");
      return;
    }

    fetchEvents();
    fetchAllRegistrations();
  }, [session, status, router]);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data = await res.json();

    setEvents(
      data.events ? data.events.filter((event: Event) => event.organizer_email === session?.user?.email) : []
    );
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
    let bannerImageUrl: string | null = null;
    if (bannerImage) {
      bannerImageUrl = await uploadBannerImage();
      if (!bannerImageUrl) {
        return;
      }
    }

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        date,
        location,
        price,
        bannerImage: bannerImageUrl,
        discountEnabled,
        discountClub,
        discountAmount,
        eligibleMembers,
        organizerEmail: session?.user?.email,
      }),
    });

    if (res.ok) {
      toast.success("Event created successfully!");
      setTitle("");
      setDescription("");
      setDate("");
      setLocation("");
      setPrice("");
      setDiscountEnabled(false);
      setDiscountClub("");
      setDiscountAmount(0);
      setEligibleMembers([]);
      setBannerImage(null);
      setBannerImagePreview(null);
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
      <div className="min-h-screen bg-gradient-to-br from-[#0f0519] via-[#1a0b2e] to-[#0f0519] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || (session.user as any).role !== "organizer") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0519] via-[#1a0b2e] to-[#0f0519] pb-24">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-[#1a0b2e]/95 backdrop-blur-md border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center border border-purple-500/30">
              <span className="text-xl">🎯</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-purple-200">Organizer</h1>
              <p className="text-xs text-purple-400">{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Live Snapshot */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>⚡</span> Live Snapshot
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">🟢</div>
                  <div className="text-3xl font-bold text-purple-100">{getLiveEvents().length}</div>
                  <div className="text-sm text-purple-400">Live Events</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">🎟</div>
                  <div className="text-3xl font-bold text-purple-100">{getTotalRegistrationsToday()}</div>
                  <div className="text-sm text-purple-400">Today</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-3xl font-bold text-purple-100">₹{getTotalRevenue()}</div>
                  <div className="text-sm text-purple-400">Collected</div>
                </div>
                <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-3xl font-bold text-purple-100">{events.length}</div>
                  <div className="text-sm text-purple-400">Total Events</div>
                </div>
              </div>
            </section>

            {/* Today's Events */}
            <section>
              <h2 className="text-2xl font-bold text-purple-200 mb-4 flex items-center gap-2">
                <span>🔥</span> Today's Events
              </h2>
              {getTodayEvents().length === 0 ? (
                <div className="bg-[#2d1b4e]/50 rounded-xl p-8 text-center border border-purple-500/20">
                  <p className="text-purple-400">No events today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTodayEvents().map((event) => {
                    const regs = getEventRegistrations(event.id);
                    const isLive = new Date().toDateString() === new Date(event.date).toDateString();
                    
                    return (
                      <div key={event.id} className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/30">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-purple-100 mb-2">{event.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-purple-400">
                              <span>📍 {event.location}</span>
                              <span>💰 ₹{event.price}</span>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isLive ? "bg-green-900/30 text-green-300 border border-green-500/30" : "bg-yellow-900/30 text-yellow-300 border border-yellow-500/30"
                          }`}>
                            {isLive ? "🟢 Live" : "🟡 Upcoming"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="text-2xl font-bold text-purple-200">{regs.length}</div>
                          <div className="text-sm text-purple-400">registrations</div>
                        </div>
                        <button
                          onClick={() =>
                            setRegistrationsModal({
                              isOpen: true,
                              eventId: event.id,
                              eventTitle: event.title,
                            })
                          }
                          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-500 transition-all font-medium"
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
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-200 flex items-center gap-2">
                <span>📅</span> My Events ({events.length})
              </h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all font-medium"
              >
                {showCreateForm ? "Cancel" : "+ Create Event"}
              </button>
            </div>

            {showCreateForm && (
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20 space-y-4">
                <h3 className="text-lg font-bold text-purple-200 mb-4">Create New Event</h3>
                
                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Event Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100 resize-none"
                    rows={3}
                    placeholder="Describe your event"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-purple-300 mb-2 block">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-purple-300 mb-2 block">Location</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100"
                      placeholder="Event location"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-purple-300 mb-2 block">Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100"
                    placeholder="Enter price"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={discountEnabled}
                      onChange={(e) => setDiscountEnabled(e.target.checked)}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <span className="text-sm text-purple-300">Enable Club Discount</span>
                  </label>
                </div>

                {discountEnabled && (
                  <div className="bg-[#1a0b2e]/50 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-sm text-purple-300 mb-2 block">Club Name</label>
                      <input
                        value={discountClub}
                        onChange={(e) => setDiscountClub(e.target.value)}
                        className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100"
                        placeholder="e.g., IEEE, ACM"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-purple-300 mb-2 block">Discount Amount (₹)</label>
                      <input
                        type="number"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value))}
                        className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2 text-purple-100"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-purple-300 mb-2 block">Eligible Members (CSV/Excel)</label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleCSVUpload}
                        className="w-full text-sm text-purple-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                      />
                      {eligibleMembers.length > 0 && (
                        <p className="text-xs text-green-400 mt-2">✓ {eligibleMembers.length} members uploaded</p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateEvent}
                  disabled={uploadingImage}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all font-semibold disabled:opacity-50"
                >
                  {uploadingImage ? "Uploading..." : "Create Event"}
                </button>
              </div>
            )}

            {/* Event List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
                const regs = getEventRegistrations(event.id);
                return (
                  <div key={event.id} className="bg-[#2d1b4e] rounded-xl overflow-hidden border border-purple-500/30">
                    {event.banner_image && (
                      <img src={event.banner_image} alt={event.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-purple-100 mb-2 line-clamp-1">{event.title}</h3>
                      <p className="text-sm text-purple-400 mb-3 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between text-xs text-purple-300 mb-3">
                        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                        <span>💰 ₹{event.price}</span>
                      </div>
                      <div className="text-sm text-purple-200 mb-3">
                        <span className="font-semibold">{regs.length}</span> registrations
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() =>
                            setRegistrationsModal({
                              isOpen: true,
                              eventId: event.id,
                              eventTitle: event.title,
                            })
                          }
                          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-500 transition-all text-sm font-medium"
                        >
                          View Registrations
                        </button>
                        <button
                          onClick={() =>
                            setAttendanceModal({
                              isOpen: true,
                              eventId: event.id,
                              eventTitle: event.title,
                            })
                          }
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-500 transition-all text-sm font-medium"
                        >
                          Scan Attendance
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REGISTRATIONS TAB */}
        {activeTab === "registrations" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-purple-200 flex items-center gap-2">
              <span>👥</span> Registrations
            </h2>

            <div>
              <label className="text-sm text-purple-300 mb-2 block">Select Event</label>
              <select
                value={selectedEventForRegs}
                onChange={(e) => setSelectedEventForRegs(e.target.value)}
                className="w-full bg-[#2d1b4e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedEventForRegs && (
              <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {(() => {
                    const regs = getEventRegistrations(selectedEventForRegs);
                    const paid = regs.length;
                    const revenue = regs.reduce((sum, r) => sum + r.final_price, 0);
                    
                    return (
                      <>
                        <div>
                          <div className="text-2xl font-bold text-purple-100">{regs.length}</div>
                          <div className="text-xs text-purple-400">Total</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-300">{paid}</div>
                          <div className="text-xs text-purple-400">Paid</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-100">₹{revenue}</div>
                          <div className="text-xs text-purple-400">Revenue</div>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              const event = events.find(e => e.id === selectedEventForRegs);
                              if (event) {
                                setRegistrationsModal({
                                  isOpen: true,
                                  eventId: event.id,
                                  eventTitle: event.title,
                                });
                              }
                            }}
                            className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-all"
                          >
                            View List
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {!selectedEventForRegs && (
              <div className="bg-[#2d1b4e]/50 rounded-xl p-8 text-center border border-purple-500/20">
                <p className="text-purple-400">Select an event to view registrations</p>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center border-2 border-purple-500/50">
                  <span className="text-3xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-purple-100">Organizer Profile</h2>
                  <p className="text-sm text-purple-400">{session?.user?.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#1a0b2e] rounded-lg p-4">
                  <div className="text-sm text-purple-400 mb-1">Role</div>
                  <div className="text-purple-100 font-semibold">Event Organizer</div>
                </div>
                <div className="bg-[#1a0b2e] rounded-lg p-4">
                  <div className="text-sm text-purple-400 mb-1">Total Events</div>
                  <div className="text-purple-100 font-semibold">{events.length}</div>
                </div>
                <div className="bg-[#1a0b2e] rounded-lg p-4">
                  <div className="text-sm text-purple-400 mb-1">Total Registrations</div>
                  <div className="text-purple-100 font-semibold">{allRegistrations.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#2d1b4e] rounded-xl p-6 border border-purple-500/20 space-y-3">
              <h3 className="text-lg font-bold text-purple-200 mb-4">Settings</h3>
              <button
                onClick={() => toast.info("Help & support coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                💬 Help & Support
              </button>
              <button
                onClick={() => toast.info("Guidelines coming soon")}
                className="w-full text-left px-4 py-3 bg-[#1a0b2e] rounded-lg text-purple-200 hover:bg-purple-600/10 transition-all"
              >
                📋 Organizer Guidelines
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a0b2e]/95 backdrop-blur-md border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto flex justify-around items-center py-3">
          {[
            { id: "dashboard", icon: "🎯", label: "Dashboard" },
            { id: "events", icon: "📅", label: "Events" },
            { id: "registrations", icon: "👥", label: "Registrations" },
            { id: "profile", icon: "⚙️", label: "Profile" },
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
    </div>
  );
}
