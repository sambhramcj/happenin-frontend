"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { EventDetailSkeleton } from "@/components/skeletons";
import { LoadingButton } from "@/components/LoadingButton";
import { EventSponsors } from "@/components/EventSponsors";
import { BannerCarousel } from "@/components/BannerCarousel";


interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  start_datetime?: string;
  end_datetime?: string;
  schedule_sessions?: unknown[];
  location: string;
  price: string;
  banner_image?: string;
  brochure_url?: string;
  organizer_email: string;
  needs_volunteers?: boolean;
  volunteer_roles?: VolunteerRole[];
  volunteer_description?: string;
  discount_enabled?: boolean;
  discount_club?: string;
  discount_amount?: number;
  sponsorship_enabled?: boolean;
  prize_pool_amount?: number;
  prize_pool_description?: string;
  organizer_contact_name?: string;
  organizer_contact_phone?: string;
  organizer_contact_email?: string;
  whatsapp_group_enabled?: boolean;
  whatsapp_group_link?: string;
  max_attendees?: number;
}

interface VolunteerRole {
  role: string;
  count: number;
  description: string;
}

interface BulkTicketPack {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  base_price: number;
  bulk_price: number;
  discount_percentage: number;
  total_cost: number;
  status: string;
  available_count: number;
}

type EventTabId = "overview" | "volunteers" | "bulk";

interface EventTab {
  id: EventTabId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count?: number;
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EventTabId>("overview");
  const [volunteering, setVolunteering] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [volunteerMessage, setVolunteerMessage] = useState("");
  const [hasApplied, setHasApplied] = useState(false);
  const [bulkPacks, setBulkPacks] = useState<BulkTicketPack[]>([]);
  const [loadingBulkPacks, setLoadingBulkPacks] = useState(false);
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);

  const eventTabs: EventTab[] = [
    { id: "overview", label: "Overview", icon: Icons.Info },
    { id: "bulk", label: "Bulk Tickets", icon: Icons.Ticket, count: bulkPacks.length },
    { id: "volunteers", label: "Volunteer", icon: Icons.Award },
  ];

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
      }
    } catch {
      console.error("Error fetching event");
      toast.error("Failed to load event");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchBulkPacks = useCallback(async () => {
    try {
      setLoadingBulkPacks(true);
      const res = await fetch(`/api/bulk-tickets/packs?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setBulkPacks(data.filter((pack: BulkTicketPack) => pack.status === "active" && pack.available_count > 0));
      }
    } catch (err) {
      console.error("Error fetching bulk packs:", err);
    } finally {
      setLoadingBulkPacks(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
    fetchBulkPacks();
  }, [fetchEvent, fetchBulkPacks]);

  async function handleVolunteerApply() {
    if (!selectedRole) {
      toast.error("Please select a volunteer role");
      return;
    }

    try {
      setVolunteering(true);
      const res = await fetch("/api/volunteers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          role: selectedRole,
          message: volunteerMessage,
        }),
      });

      if (res.ok) {
        toast.success("Application submitted!");
        setHasApplied(true);
        setSelectedRole("");
        setVolunteerMessage("");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit application");
      }
    } catch {
      toast.error("Failed to submit application");
    } finally {
      setVolunteering(false);
    }
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

  async function handleBulkPackPurchase(pack: BulkTicketPack) {
    if (!session) {
      router.push(`/auth?redirect=/events/${eventId}`);
      return;
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "student") {
      toast.error("Only students can purchase bulk tickets");
      return;
    }

    try {
      setPurchasingPackId(pack.id);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load");
        setPurchasingPackId(null);
        return;
      }

      const createOrderRes = await fetch("/api/bulk-tickets/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulkPackId: pack.id,
          quantityPurchased: pack.quantity,
        }),
      });

      const createOrderData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        toast.error(createOrderData.error || "Failed to create bulk order");
        setPurchasingPackId(null);
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: createOrderData.amountPaise,
        currency: createOrderData.currency || "INR",
        name: "Happenin",
        description: `Bulk Pack: ${pack.name}`,
        order_id: createOrderData.orderId,
        prefill: { email: session.user.email },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => setPurchasingPackId(null),
        },
        handler: async (response: RazorpayPaymentResponse) => {
          const verifyRes = await fetch("/api/bulk-tickets/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bulkPackId: pack.id,
              quantityPurchased: pack.quantity,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            toast.error(verifyData.error || "Payment verification failed");
            setPurchasingPackId(null);
            return;
          }

          toast.success(`Bulk pack purchased! ${verifyData.tickets_generated || pack.quantity} tickets generated.`);
          await fetchBulkPacks();
          setPurchasingPackId(null);
        },
      });

      razorpay.open();
    } catch {
      toast.error("Failed to purchase bulk pack");
      setPurchasingPackId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-muted">
        <EventDetailSkeleton />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted text-lg mb-4">Event not found</p>
          <button
            onClick={() => router.back()}
            className="bg-primary text-text-inverse px-4 py-2 rounded-lg hover:bg-primaryHover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-muted">
      {/* Header */}
      <div className="bg-bg-card border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-bg-muted rounded-lg transition-all"
          >
            <Icons.ChevronLeft className="h-6 w-6 text-text-secondary" />
          </button>
          <h1 className="text-2xl font-bold text-text-primary flex-1 text-center">Event Details</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Banner */}
        {event.banner_image && (
          <div className="relative w-full h-80 rounded-xl mb-6 border border-border-default overflow-hidden">
            <Image
              src={event.banner_image}
              alt={event.title}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        {/* Event Info */}
        <div className="bg-bg-card rounded-xl p-6 border border-border-default mb-6">
          <h2 className="text-3xl font-bold text-text-primary mb-2">{event.title}</h2>
          <p className="text-text-muted mb-4">{event.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-text-muted mb-1">Date</p>
              <p className="font-semibold text-text-primary">
                {new Date(event.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Location</p>
              <p className="font-semibold text-text-primary">{event.location}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Price</p>
              <p className="font-semibold text-text-primary">₹{event.price}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Organizer</p>
              <p className="font-semibold text-text-primary text-sm">{event.organizer_email}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => router.push(`/events/${event.id}/register`)}
              className="px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover"
            >
              Register
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-default mb-6 bg-bg-card rounded-t-lg p-3">
          {eventTabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === id
                  ? "bg-primary text-text-inverse"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === id ? "bg-white/20" : "bg-primary text-text-inverse"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-bg-card rounded-lg p-6 border border-border-default space-y-6">
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-2">About This Event</h3>
                <p className="text-text-secondary leading-relaxed">{event.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Location</h3>
                <p className="text-text-secondary">{event.location}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary mb-2">Event Details</h3>
                <div className="space-y-2 text-text-secondary">
                  <p>📅 {new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                  <p>💰 Entry Fee: ₹{event.price}</p>
                  {event.max_attendees && (
                    <p>👥 Max Attendees: {event.max_attendees}</p>
                  )}
                  {event.discount_enabled && event.discount_club && (
                    <p>🎟️ {event.discount_club} members get ₹{event.discount_amount} discount</p>
                  )}
                </div>
              </div>

              {/* Prize Pool */}
              {event.prize_pool_amount && event.prize_pool_amount > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-5 border-2 border-yellow-400/50">
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-400 text-yellow-900 p-2 rounded-lg">
                      <Icons.Award className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Prize Pool</h3>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">₹{event.prize_pool_amount.toLocaleString()}</p>
                      {event.prize_pool_description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">{event.prize_pool_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Brochure */}
              {event.brochure_url && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Event Brochure</h3>
                  <a
                    href={event.brochure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-3 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-all"
                  >
                    <Icons.Download className="h-4 w-4" />
                    Download Brochure
                  </a>
                </div>
              )}

              {/* Organizer Contact */}
              {event.organizer_contact_name && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-3">Contact Organizer</h3>
                  <div className="bg-bg-muted rounded-lg p-4 space-y-2">
                    <p className="text-text-primary font-semibold">{event.organizer_contact_name}</p>
                    {event.organizer_contact_phone && (
                      <a
                        href={`tel:${event.organizer_contact_phone}`}
                        className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                      >
                        <Icons.Phone className="h-4 w-4" />
                        {event.organizer_contact_phone}
                      </a>
                    )}
                    {event.organizer_contact_email && (
                      <a
                        href={`mailto:${event.organizer_contact_email}`}
                        className="flex items-center gap-2 text-text-secondary hover:text-primary transition-colors"
                      >
                        <Icons.Mail className="h-4 w-4" />
                        {event.organizer_contact_email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* WhatsApp Group */}
              {event.whatsapp_group_enabled && event.whatsapp_group_link && (
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-3">Join Community</h3>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-5 border-2 border-green-400/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500 text-white p-2 rounded-lg">
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">WhatsApp Group</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          Connect with other participants and stay updated with event announcements
                        </p>
                        <a
                          href={event.whatsapp_group_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-semibold text-sm"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          Join WhatsApp Group
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Event Sponsors */}
            <EventSponsors eventId={eventId} />

            {/* Event Banners */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-text-primary">Featured Banners</h3>
              <BannerCarousel placement="event_page" maxBanners={2} />
            </div>
          </div>
        )}



        {/* Bulk Tickets Tab */}
        {activeTab === "bulk" && (
          <div className="bg-bg-card rounded-lg p-6 border border-border-default">
            {loadingBulkPacks ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-text-muted">Loading bulk packs...</p>
              </div>
            ) : bulkPacks.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">Available Bulk Ticket Packs</h3>
                  <p className="text-text-secondary text-sm mb-4">Save money by purchasing tickets in bulk for your group</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {bulkPacks.map((pack) => (
                    <div
                      key={pack.id}
                      className="bg-bg-muted rounded-lg p-5 border-2 border-border-default hover:border-primary transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-text-primary text-lg">{pack.name}</h4>
                          {pack.description && (
                            <p className="text-text-secondary text-sm mt-1">{pack.description}</p>
                          )}
                        </div>
                        <div className="bg-success/20 text-success px-2 py-1 rounded-full text-xs font-semibold">
                          {pack.discount_percentage}% OFF
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Number of tickets:</span>
                          <span className="font-semibold text-text-primary">{pack.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-muted">Price per ticket:</span>
                          <div className="text-right">
                            <span className="font-semibold text-text-primary">₹{pack.bulk_price}</span>
                            <span className="text-text-muted line-through ml-2 text-xs">₹{pack.base_price}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border-default">
                          <span className="text-text-primary font-semibold">Total Pack Price:</span>
                          <span className="text-primary font-bold text-lg">₹{pack.total_cost}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-text-muted">Available packs:</span>
                          <span className="text-text-primary font-medium">{pack.available_count}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleBulkPackPurchase(pack)}
                        disabled={purchasingPackId === pack.id}
                        className="w-full bg-primary text-text-inverse py-2.5 rounded-lg hover:bg-primaryHover font-semibold transition-all disabled:opacity-60"
                      >
                        {purchasingPackId === pack.id ? "Purchasing..." : "Purchase Pack"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-primarySoft border border-primary/30 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Icons.Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-text-primary space-y-1">
                      <p className="font-semibold">How bulk tickets work:</p>
                      <ul className="list-disc list-inside space-y-1 text-text-secondary">
                        <li>Purchase a pack for your group or organization</li>
                        <li>Receive individual tickets that can be distributed</li>
                        <li>Each ticket can be assigned to different members</li>
                        <li>Save money compared to individual purchases</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icons.Ticket className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">No bulk ticket packs available for this event</p>
              </div>
            )}
          </div>
        )}

        {/* Volunteers Tab */}
        {activeTab === "volunteers" && (
          <div className="bg-bg-card rounded-lg p-6 border border-border-default">
            {event.needs_volunteers ? (
              <div className="space-y-6">
                {event.volunteer_description && (
                  <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">Volunteer Opportunities</h3>
                    <p className="text-text-secondary">{event.volunteer_description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-4">Available Roles</h3>
                  <div className="space-y-3">
                    {event.volunteer_roles?.map((role: VolunteerRole, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedRole === role.role
                            ? "border-primary bg-primarySoft"
                            : "border-border-default hover:border-primary"
                        }`}
                        onClick={() => setSelectedRole(role.role)}
                      >
                        <h4 className="font-semibold text-text-primary">{role.role}</h4>
                        <p className="text-sm text-text-secondary">{role.description}</p>
                        <p className="text-xs text-text-muted mt-1">Positions: {role.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {((session?.user as { role?: string } | undefined)?.role === "student") && (
                  <div className="space-y-3">
                    <textarea
                      value={volunteerMessage}
                      onChange={(e) => setVolunteerMessage(e.target.value)}
                      placeholder="Tell us why you'd like to volunteer..."
                      className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
                      rows={4}
                    />
                    <LoadingButton
                      onClick={handleVolunteerApply}
                      disabled={volunteering || !selectedRole || hasApplied}
                      loading={volunteering}
                      loadingText="Submitting application…"
                      className="w-full bg-primary text-text-inverse py-3 rounded-lg font-semibold hover:bg-primaryHover transition-all disabled:opacity-50"
                    >
                      {hasApplied ? "Application Submitted ✓" : "Submit Application"}
                    </LoadingButton>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icons.Award className="h-12 w-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">This event is not looking for volunteers</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
