"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/skeletons";

interface Fest {
  id: string;
  title: string;
  description: string;
  banner_image?: string;
  start_date: string;
  end_date: string;
  location: string;
  core_team_leader_email: string;
}

interface FestMember {
  id: string;
  member_email: string;
  role: "leader" | "member";
}

interface EventSubmission {
  id: string;
  event_id: string;
  approval_status: "pending" | "approved" | "rejected";
  submitted_by_email: string;
  rejection_reason?: string;
  events?: {
    title: string;
  };
}

interface FestDetailsProps {
  festId: string;
  onClose?: () => void;
}

export default function FestDetails({ festId, onClose }: FestDetailsProps) {
  const { data: session } = useSession();
  const [fest, setFest] = useState<Fest | null>(null);
  const [members, setMembers] = useState<FestMember[]>([]);
  const [eventSubmissions, setEventSubmissions] = useState<EventSubmission[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "events">(
    "overview"
  );
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [processingEvent, setProcessingEvent] = useState<string | null>(null);

  const isLeader = fest?.core_team_leader_email === session?.user?.email;

  useEffect(() => {
    fetchFestDetails();
    fetchMembers();
    fetchEventSubmissions();
  }, [festId]);

  const fetchFestDetails = async () => {
    try {
      const res = await fetch(`/api/fests/${festId}`);
      if (res.ok) {
        const data = await res.json();
        setFest(data.fest);
      }
    } catch (error) {
      console.error("Error fetching fest:", error);
      toast.error("Failed to load fest details");
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/fests/${festId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventSubmissions = async () => {
    try {
      const res = await fetch(`/api/fests/${festId}/events`);
      if (res.ok) {
        const data = await res.json();
        setEventSubmissions(data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }

    setAddingMember(true);
    try {
      const res = await fetch(`/api/fests/${festId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberEmail: newMemberEmail,
          role: "member",
        }),
      });

      if (res.ok) {
        toast.success("Member added!");
        setNewMemberEmail("");
        fetchMembers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to add member");
      }
    } catch (error) {
      toast.error("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!confirm("Remove this member?")) return;

    try {
      const res = await fetch(`/api/fests/${festId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberEmail }),
      });

      if (res.ok) {
        toast.success("Member removed");
        fetchMembers();
      } else {
        toast.error("Failed to remove member");
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleApproveEvent = async (festEventId: string) => {
    setProcessingEvent(festEventId);
    try {
      const res = await fetch(`/api/fests/${festId}/events`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festEventId,
          action: "approved",
        }),
      });

      if (res.ok) {
        toast.success("Event approved!");
        fetchEventSubmissions();
      } else {
        toast.error("Failed to approve event");
      }
    } catch (error) {
      toast.error("Failed to approve event");
    } finally {
      setProcessingEvent(null);
    }
  };

  const handleRejectEvent = async (festEventId: string) => {
    const reason = prompt("Rejection reason (optional):");

    setProcessingEvent(festEventId);
    try {
      const res = await fetch(`/api/fests/${festId}/events`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          festEventId,
          action: "rejected",
          rejectionReason: reason || "No reason provided",
        }),
      });

      if (res.ok) {
        toast.success("Event rejected");
        fetchEventSubmissions();
      } else {
        toast.error("Failed to reject event");
      }
    } catch (error) {
      toast.error("Failed to reject event");
    } finally {
      setProcessingEvent(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-6">
        <p className="text-sm text-text-muted text-center">Loading events…</p>
        <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
          <Skeleton className="w-full h-48" />
          <div className="p-6 space-y-3">
            <Skeleton className="w-2/3 h-6" variant="text" />
            <Skeleton className="w-full h-4" variant="text" />
            <Skeleton className="w-1/2 h-4" variant="text" />
          </div>
        </div>
      </div>
    );
  }

  if (!fest) {
    return (
      <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
        <p className="text-text-muted">Fest not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        {fest.banner_image && (
          <img
            src={fest.banner_image}
            alt={fest.title}
            className="w-full h-48 object-cover rounded-xl"
          />
        )}
        <div
          className={`absolute inset-0 rounded-xl ${
            !fest.banner_image ? "bg-gradient-to-br from-primary/20 to-pink-500/20" : "bg-black/30"
          }`}
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <h1 className="text-3xl font-bold">{fest.title}</h1>
          <p className="text-sm opacity-90 mt-1">{fest.description}</p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-xl p-4 border border-border-default">
          <p className="text-xs text-text-muted mb-1">Start Date</p>
          <p className="font-semibold text-text-primary">
            {new Date(fest.start_date).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border-default">
          <p className="text-xs text-text-muted mb-1">End Date</p>
          <p className="font-semibold text-text-primary">
            {new Date(fest.end_date).toLocaleDateString()}
          </p>
        </div>
        <div className="bg-bg-card rounded-xl p-4 border border-border-default">
          <p className="text-xs text-text-muted mb-1">Location</p>
          <p className="font-semibold text-text-primary">{fest.location || "TBA"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border-default">
        {[
          { id: "overview", icon: Icons.Info, label: "Overview" },
          { id: "members", icon: Icons.Users, label: "Core Team" },
          { id: "events", icon: Icons.Calendar, label: "Events" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === tab.id
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
      {activeTab === "overview" && (
        <div className="bg-bg-card rounded-xl p-6 border border-border-default">
          <h3 className="text-lg font-bold text-text-primary mb-4">About This Fest</h3>
          <p className="text-text-secondary leading-relaxed">{fest.description}</p>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && isLeader && (
        <div className="space-y-4">
          <div className="bg-bg-card rounded-xl p-6 border border-border-default">
            <h3 className="text-lg font-bold text-text-primary mb-4">Add Team Member</h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="member@example.com"
                className="flex-1 bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleAddMember}
                disabled={addingMember}
                className="px-6 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover transition-all disabled:opacity-50"
              >
                {addingMember ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          <div className="bg-bg-card rounded-xl p-6 border border-border-default">
            <h3 className="text-lg font-bold text-text-primary mb-4">Core Team</h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium text-text-primary">{member.member_email}</p>
                    <p className="text-xs text-text-muted capitalize">{member.role}</p>
                  </div>
                  {member.role !== "leader" && (
                    <button
                      onClick={() => handleRemoveMember(member.member_email)}
                      className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-700/50 rounded text-xs hover:bg-red-900/30 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "members" && !isLeader && (
        <div className="bg-bg-card rounded-xl p-8 text-center border border-border-default">
          <p className="text-text-muted">Only the fest leader can manage the core team</p>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === "events" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-bg-card rounded-xl p-4 border border-border-default">
              <p className="text-2xl font-bold text-primary">
                {eventSubmissions.length}
              </p>
              <p className="text-xs text-text-muted">Total Submissions</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border-default">
              <p className="text-2xl font-bold text-green-500">
                {eventSubmissions.filter((e) => e.approval_status === "approved").length}
              </p>
              <p className="text-xs text-text-muted">Approved</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border-default">
              <p className="text-2xl font-bold text-yellow-500">
                {eventSubmissions.filter((e) => e.approval_status === "pending").length}
              </p>
              <p className="text-xs text-text-muted">Pending</p>
            </div>
          </div>

          <div className="bg-bg-card rounded-xl p-6 border border-border-default">
            <h3 className="text-lg font-bold text-text-primary mb-4">Event Submissions</h3>
            {eventSubmissions.length === 0 ? (
              <p className="text-center text-text-muted py-8">No event submissions yet</p>
            ) : (
              <div className="space-y-3">
                {eventSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="flex items-start justify-between p-4 bg-bg-muted rounded-lg border border-border-default"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">
                        {submission.events?.title || "Event"}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Submitted by: {submission.submitted_by_email}
                      </p>
                      {submission.rejection_reason && (
                        <p className="text-xs text-red-400 mt-2">
                          Reason: {submission.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          submission.approval_status === "approved"
                            ? "bg-green-900/20 text-green-400 border-green-700/50"
                            : submission.approval_status === "rejected"
                            ? "bg-red-900/20 text-red-400 border-red-700/50"
                            : "bg-yellow-900/20 text-yellow-400 border-yellow-700/50"
                        }`}
                      >
                        {submission.approval_status}
                      </span>
                      {isLeader && submission.approval_status === "pending" && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleApproveEvent(submission.id)}
                            disabled={processingEvent === submission.id}
                            className="px-3 py-1 bg-green-900/20 text-green-400 border border-green-700/50 rounded text-xs hover:bg-green-900/30 transition-all disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleRejectEvent(submission.id)}
                            disabled={processingEvent === submission.id}
                            className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-700/50 rounded text-xs hover:bg-red-900/30 transition-all disabled:opacity-50"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="w-full py-2 bg-bg-muted text-text-primary rounded-lg hover:bg-border-default transition-all font-medium"
        >
          Close
        </button>
      )}
    </div>
  );
}
