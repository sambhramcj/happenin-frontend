"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

interface EventSubmitProps {
  eventId: string;
  eventTitle: string;
  onSuccess?: () => void;
  onClose?: () => void;
}

interface Fest {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

export default function EventSubmitToFest({
  eventId,
  eventTitle,
  onSuccess,
  onClose,
}: EventSubmitProps) {
  const { data: session } = useSession();
  const [fests, setFests] = useState<Fest[]>([]);
  const [selectedFestId, setSelectedFestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchFests();
  }, []);

  const fetchFests = async () => {
    try {
      const res = await fetch("/api/fests");
      if (res.ok) {
        const data = await res.json();
        setFests(data.fests || []);
      }
    } catch (error) {
      console.error("Error fetching fests:", error);
      toast.error("Failed to load fests");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFestId) {
      toast.error("Please select a fest");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/fests/${selectedFestId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Event submitted to fest!");
        setSelectedFestId("");
        if (onSuccess) onSuccess();
      } else {
        toast.error(data.error || "Failed to submit event");
      }
    } catch (error) {
      toast.error("Failed to submit event");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border-default space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Icons.Flame className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-text-primary">Submit to Fest</h3>
      </div>

      <div>
        <label className="text-sm text-text-secondary mb-2 block">
          Select a Fest
        </label>
        <select
          value={selectedFestId}
          onChange={(e) => setSelectedFestId(e.target.value)}
          className="w-full bg-bg-muted border border-border-default rounded-lg px-4 py-2 text-text-primary focus:ring-2 focus:ring-primary focus:border-primary"
        >
          <option value="">-- Choose a fest --</option>
          {fests.map((fest) => (
            <option key={fest.id} value={fest.id}>
              {fest.title} ({new Date(fest.start_date).toLocaleDateString()} -{" "}
              {new Date(fest.end_date).toLocaleDateString()})
            </option>
          ))}
        </select>
        {fests.length === 0 && (
          <p className="text-xs text-text-muted mt-2">No fests available</p>
        )}
      </div>

      <div className="bg-bg-muted rounded-lg p-4 border border-border-default">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold">Event:</span> {eventTitle}
        </p>
        <p className="text-xs text-text-muted mt-2">
          Once submitted, the fest coordinator will review and approve your event.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!selectedFestId || loading}
          className="flex-1 bg-gradient-to-r from-primary to-pink-500 text-text-inverse py-2 rounded-lg hover:from-primaryHover hover:to-pink-600 transition-all font-medium disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Event"}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-muted text-text-primary rounded-lg hover:bg-border-default transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
