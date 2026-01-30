"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import EventPhotoUpload from "@/components/EventPhotoUpload";
import EventPhotoGallery from "@/components/EventPhotoGallery";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  price: string;
  banner_image?: string;
  organizer_email: string;
  needs_volunteers?: boolean;
  volunteer_roles?: any[];
  volunteer_description?: string;
}

interface VolunteerRole {
  role: string;
  count: number;
  description: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "volunteers" | "photos">("overview");
  const [volunteering, setVolunteering] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [volunteerMessage, setVolunteerMessage] = useState("");
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
      }
    } catch (err) {
      console.error("Error fetching event:", err);
      toast.error("Failed to load event");
    } finally {
      setLoading(false);
    }
  }

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
    } catch (err) {
      toast.error("Failed to submit application");
    } finally {
      setVolunteering(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-muted flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary">Loading event...</p>
        </div>
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
          <img
            src={event.banner_image}
            alt={event.title}
            className="w-full h-80 object-cover rounded-xl mb-6 border border-border-default"
          />
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
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border-default mb-6 bg-bg-card rounded-t-lg p-3">
          {[
            { id: "overview", label: "Overview", icon: Icons.Info },
            { id: "photos", label: "Photos", icon: Icons.Camera },
            { id: "volunteers", label: "Volunteer", icon: Icons.Award },
          ].map(({ id, label, icon: Icon }: any) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === id
                  ? "bg-primary text-text-inverse"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
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
              </div>
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div className="space-y-6">
            {(session?.user as any)?.role === "student" && (
              <div className="bg-bg-card rounded-lg p-6 border border-border-default">
                <h3 className="text-lg font-bold text-text-primary mb-4">Upload Photos</h3>
                <EventPhotoUpload eventId={eventId} onUploadSuccess={() => {}} />
              </div>
            )}

            <div className="bg-bg-card rounded-lg p-6 border border-border-default">
              <h3 className="text-lg font-bold text-text-primary mb-4">Event Gallery</h3>
              <EventPhotoGallery eventId={eventId} />
            </div>
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

                {(session?.user as any)?.role === "student" && (
                  <div className="space-y-3">
                    <textarea
                      value={volunteerMessage}
                      onChange={(e) => setVolunteerMessage(e.target.value)}
                      placeholder="Tell us why you'd like to volunteer..."
                      className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
                      rows={4}
                    />
                    <button
                      onClick={handleVolunteerApply}
                      disabled={volunteering || !selectedRole || hasApplied}
                      className="w-full bg-gradient-to-r from-primary to-primaryHover text-text-inverse py-3 rounded-lg font-semibold hover:from-primaryHover hover:to-primary transition-all disabled:opacity-50"
                    >
                      {hasApplied ? "Application Submitted ✓" : "Submit Application"}
                    </button>
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
