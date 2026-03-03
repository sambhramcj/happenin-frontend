"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icons } from "@/components/icons";

interface EventSummary {
  title: string;
  price?: number;
  ticket_price?: number;
}

export default function EventRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventSummary | null>(null);

  const eventId = params.eventId as string;
  const eventPrice = Number(event?.price ?? event?.ticket_price ?? 0);
  const eventPriceLabel = eventPrice > 0 ? `₹${eventPrice.toLocaleString("en-IN")}` : "Free";

  useEffect(() => {
    let isMounted = true;

    async function fetchEventSummary() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data?.event) {
          setEvent(data.event);
        }
      } catch {
        // Keep registration flow usable even if summary fetch fails
      }
    }

    fetchEventSummary();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  return (
    <div className="min-h-screen bg-bg-muted flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
        <h1 className="text-2xl font-bold text-text-primary">Event Registration</h1>
        <p className="text-text-secondary">
          Continue to register for this event. You can complete payment and get your ticket from the student dashboard flow.
        </p>

        <div className="bg-bg-muted rounded-lg p-4 text-sm text-text-secondary">
          Event ID: <span className="text-text-primary font-medium">{eventId}</span>
        </div>

        {event && (
          <div className="bg-bg-muted rounded-lg p-4 text-sm text-text-secondary space-y-1">
            <p>
              Event: <span className="text-text-primary font-medium">{event.title}</span>
            </p>
            <p>
              Entry Fee: <span className="text-text-primary font-medium">{eventPriceLabel}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push(`/events/${eventId}`)}
            className="flex-1 px-4 py-2 bg-bg-muted text-text-primary rounded-lg hover:bg-bg-card border border-border-default"
          >
            Back to Event
          </button>

          {session?.user ? (
            <button
              onClick={() => router.push("/dashboard/student")}
              className="flex-1 px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover"
            >
              Continue to Register
            </button>
          ) : (
            <button
              onClick={() => router.push(`/auth?redirect=/events/${eventId}/register`)}
              className="flex-1 px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover flex items-center justify-center gap-2"
            >
              <Icons.Lock className="h-4 w-4" />
              Login to Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
