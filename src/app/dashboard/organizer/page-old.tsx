"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import DashboardHeader from "@/components/DashboardHeader";
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

export default function OrganizerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);

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

  // Registrations modal state
  const [registrationsModal, setRegistrationsModal] = useState<{
    isOpen: boolean;
    eventId: string;
    eventTitle: string;
  }>({
    isOpen: false,
    eventId: "",
    eventTitle: "",
  });

  // Attendance modal state
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
  }, [session, status, router]);

  async function fetchEvents() {
    const res = await fetch("/api/events");
    const data: Event[] = await res.json();

    setEvents(
      data.filter(
        (event) => event.organizer_email === session?.user?.email
      )
    );
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
          // Parse Excel file
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
          // Parse CSV file
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
          toast.error("No valid members found in file. Check the format.");
          return;
        }

        setEligibleMembers(parsed);
        toast.success(`Uploaded ${parsed.length} eligible members`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to parse file. Ensure it has columns: Name, Member ID");
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setBannerImage(file);

    // Create preview
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
      console.error('Image upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleCreateEvent() {
    // Upload banner image first if present
    let bannerImageUrl: string | null = null;
    if (bannerImage) {
      bannerImageUrl = await uploadBannerImage();
      if (!bannerImageUrl) {
        return; // Stop if image upload failed
      }
    }

    await fetch("/api/events", {
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

    fetchEvents();
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
  if (!session?.user || (session.user as any).role !== "organizer") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-[#0f0519]">
      <DashboardHeader />
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-purple-200 mb-2">Organizer Dashboard</h1>
          <p className="text-purple-400">Manage your events and discounts</p>
        </div>

        {/* Create Event */}
        <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-6 sm:p-8 mb-10 border border-purple-500/20">
          <h2 className="text-2xl font-bold text-purple-200 mb-6 flex items-center gap-2">
            <span className="text-2xl">✨</span>
            Create New Event
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Event Title</label>
              <input 
                className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none" 
                placeholder="Enter event title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Description</label>
              <textarea 
                className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none resize-none" 
                placeholder="Describe your event"
                rows={3}
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Date</label>
                <input 
                  className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none" 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-300 mb-2">Location</label>
                <input 
                  className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none" 
                  placeholder="Event location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Price (₹)</label>
              <input 
                className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-3 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none" 
                type="number"
                placeholder="Enter price" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-300 mb-2">Event Banner Image</label>
              <div className="space-y-3">
                {bannerImagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-purple-500/30">
                    <img 
                      src={bannerImagePreview} 
                      alt="Banner preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerImage(null);
                        setBannerImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-purple-500/30 border-dashed rounded-lg cursor-pointer bg-[#1a0b2e]/50 hover:bg-[#1a0b2e] transition-colors group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-purple-400 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="mb-2 text-sm text-purple-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-purple-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleBannerImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={discountEnabled} 
                  onChange={(e) => setDiscountEnabled(e.target.checked)}
                  className="w-5 h-5 text-purple-500 bg-[#1a0b2e] border-purple-500/30 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-purple-300 group-hover:text-purple-200">Enable Club Discount</span>
              </label>
            </div>

            {discountEnabled && (
              <div className="border-2 border-dashed border-purple-500/30 rounded-xl p-5 bg-[#1a0b2e]/50 mt-4">
                <h3 className="text-sm font-semibold text-purple-300 mb-4 flex items-center gap-2">
                  <span>🎫</span>
                  Discount Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Club Name</label>
                    <input 
                      className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2.5 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none" 
                      placeholder="e.g., IEEE, ACM" 
                      value={discountClub} 
                      onChange={(e) => setDiscountClub(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Discount Amount (₹)</label>
                    <input 
                      className="w-full bg-[#1a0b2e] border border-purple-500/30 rounded-lg px-4 py-2.5 text-purple-100 placeholder-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none" 
                      type="number" 
                      placeholder="Enter discount amount" 
                      value={discountAmount} 
                      onChange={(e) => setDiscountAmount(Number(e.target.value))} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-300 mb-2">Eligible Members CSV</label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-purple-500/30 border-dashed rounded-lg cursor-pointer bg-[#1a0b2e]/50 hover:bg-[#1a0b2e] transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-purple-400 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                        <p className="mb-2 text-sm text-purple-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-purple-500">CSV or Excel (.xlsx) file</p>
                      </div>
                      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCSVUpload} className="hidden" />
                    </label>
                  </div>

                  {eligibleMembers.length > 0 && (
                    <div className="mt-3 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-300 font-medium flex items-center gap-2">
                        <span>✓</span>
                        {eligibleMembers.length} eligible {eligibleMembers.length === 1 ? 'member' : 'members'} uploaded successfully
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={handleCreateEvent} 
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-6"
            >
              Create Event
            </button>
          </div>
        </div>

        {/* Events */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-purple-200 mb-2 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            My Events
          </h2>
          <p className="text-purple-400 text-sm">Total: {events.length} {events.length === 1 ? 'event' : 'events'}</p>
        </div>

        {events.length === 0 && (
          <div className="bg-[#2d1b4e] rounded-xl shadow-lg p-12 text-center border border-purple-500/20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-purple-300 text-lg">No events created yet.</p>
            <p className="text-purple-500 text-sm mt-2">Create your first event above to get started!</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div 
              key={event.id} 
              className="bg-[#2d1b4e] rounded-xl shadow-md overflow-hidden border border-purple-500/20 hover:border-purple-500/40 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
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
              <div className="p-6">
                <h3 className="text-xl font-bold text-purple-200 mb-2 line-clamp-2">{event.title}</h3>
                <p className="text-purple-400 text-sm mb-4 line-clamp-2">{event.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">📆</span>
                  <div>
                    <p className="text-xs text-purple-500">Date</p>
                    <p className="text-sm font-medium text-purple-200">{event.date ? (() => {
                      try {
                        return new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                      } catch {
                        return event.date;
                      }
                    })() : 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">📍</span>
                  <div>
                    <p className="text-xs text-purple-500">Location</p>
                    <p className="text-sm font-medium text-purple-200">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">💰</span>
                  <div>
                    <p className="text-xs text-purple-500">Price</p>
                    <p className="text-sm font-medium text-purple-200">₹{event.price}</p>
                  </div>
                </div>
              </div>

              {event.discount_enabled && (
                <div className="mt-4 pt-4 border-t border-purple-500/20">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-green-900/30 text-green-300 rounded-full border border-green-500/30">
                    <span>🎫</span>
                    {event.discount_club} discount: ₹{event.discount_amount}
                  </span>
                </div>
              )}

              {event.eligible_members && event.eligible_members.length > 0 && (
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  <p className="text-xs text-purple-500">
                    <span className="font-medium text-purple-300">{event.eligible_members.length}</span> eligible {event.eligible_members.length === 1 ? 'member' : 'members'}
                  </p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-purple-500/20">
                <button
                  onClick={() =>
                    setRegistrationsModal({
                      isOpen: true,
                      eventId: event.id,
                      eventTitle: event.title,
                    })
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-purple-500 hover:to-pink-500 focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all font-medium text-sm mb-2"
                >
                  👥 View Registrations
                </button>
                <button
                  onClick={() =>
                    setAttendanceModal({
                      isOpen: true,
                      eventId: event.id,
                      eventTitle: event.title,
                    })
                  }
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-2 px-4 rounded-lg hover:from-blue-500 hover:to-cyan-500 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all font-medium text-sm"
                >
                  📱 Scan Attendance
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>

        {/* Registrations Modal */}
        <RegistrationsModal
          eventId={registrationsModal.eventId}
          eventTitle={registrationsModal.eventTitle}
          isOpen={registrationsModal.isOpen}
          onClose={() =>
            setRegistrationsModal((prev) => ({ ...prev, isOpen: false }))
          }
        />

        {/* Attendance Modal */}
        <AttendanceModal
          eventId={attendanceModal.eventId}
          eventTitle={attendanceModal.eventTitle}
          isOpen={attendanceModal.isOpen}
          onClose={() =>
            setAttendanceModal((prev) => ({ ...prev, isOpen: false }))
          }
        />
      </div>
    </div>
  );
}
