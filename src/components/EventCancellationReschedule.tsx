"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";
import { toast } from "sonner";

interface EventManagementProps {
  eventId: string;
  eventTitle?: string;
  onStatusChange?: (status: "cancelled" | "rescheduled" | "active") => void;
}

export function EventCancellationReschedule({
  eventId,
  eventTitle = "Event",
  onStatusChange,
}: EventManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"cancel" | "reschedule" | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    newDate: "",
    newTime: "",
    newVenue: "",
    refundProcessing: false,
  });

  const handleCancel = async () => {
    if (!formData.reason.trim()) {
      toast.error("Please provide a cancellation reason");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellationReason: formData.reason,
          refundProcessing: formData.refundProcessing,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel event");
      }

      const data = await response.json();
      toast.success(`Event cancelled! Notifications sent to ${data.notificationsSent} registered users.`);
      onStatusChange?.("cancelled");
      setShowModal(false);
      setFormData({ reason: "", newDate: "", newTime: "", newVenue: "", refundProcessing: false });
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel event");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!formData.newDate || !formData.reason.trim()) {
      toast.error("Please provide new date and reason for rescheduling");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newDate: formData.newDate,
          newTime: formData.newTime || undefined,
          newVenue: formData.newVenue || undefined,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reschedule event");
      }

      const data = await response.json();
      toast.success(
        `Event rescheduled! Notifications sent to ${data.notificationsSent} registered users.`
      );
      onStatusChange?.("rescheduled");
      setShowModal(false);
      setFormData({ reason: "", newDate: "", newTime: "", newVenue: "", refundProcessing: false });
    } catch (error) {
      console.error("Error rescheduling event:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reschedule event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => {
            setAction("reschedule");
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Icons.Clock className="w-4 h-4" />
          <span>Reschedule Event</span>
        </button>

        <button
          onClick={() => {
            setAction("cancel");
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Icons.X className="w-4 h-4" />
          <span>Cancel Event</span>
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {action === "cancel" ? "Cancel Event" : "Reschedule Event"}
            </h2>

            {/* Form */}
            <div className="space-y-4">
              {action === "reschedule" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Date
                    </label>
                    <input
                      type="date"
                      value={formData.newDate}
                      onChange={(e) =>
                        setFormData({ ...formData, newDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Time (Optional)
                    </label>
                    <input
                      type="time"
                      value={formData.newTime}
                      onChange={(e) =>
                        setFormData({ ...formData, newTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Venue (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.newVenue}
                      onChange={(e) =>
                        setFormData({ ...formData, newVenue: e.target.value })
                      }
                      placeholder="e.g., New Location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              {action === "cancel" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enable Automatic Refunds?
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.refundProcessing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          refundProcessing: e.target.checked,
                        })
                      }
                      disabled={loading}
                      className="w-5 h-5 text-blue-600 bg-gray-50 border-2 border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all checked:bg-blue-600 checked:border-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      Process refunds automatically
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {action === "cancel"
                    ? "Cancellation Reason"
                    : "Rescheduling Reason"}
                  <span className="text-red-500"> *</span>
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder={
                    action === "cancel"
                      ? "Explain why the event is being cancelled..."
                      : "Explain why the event is being rescheduled..."
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Warning Message */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
              <Icons.AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                All registered participants will be notified immediately via
                notifications.
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    reason: "",
                    newDate: "",
                    newTime: "",
                    newVenue: "",
                    refundProcessing: false,
                  });
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (action === "cancel") {
                    handleCancel();
                  } else {
                    handleReschedule();
                  }
                }}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  action === "cancel"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading && <Icons.Loader2 className="w-4 h-4 animate-spin" />}
                {action === "cancel" ? "Cancel Event" : "Reschedule Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
