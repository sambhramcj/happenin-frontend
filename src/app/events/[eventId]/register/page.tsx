"use client";

import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icons } from "@/components/icons";

export default function EventRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();

  const eventId = params.eventId as string;

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
