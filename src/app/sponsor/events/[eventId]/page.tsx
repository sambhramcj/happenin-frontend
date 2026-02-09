"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { SPONSORSHIP_VISIBILITY } from "@/types/sponsorship";

export default function SponsorEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Bank" | "Cash">("UPI");
  const [transactionReference, setTransactionReference] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  async function fetchEventDetails() {
    setLoading(true);
    const res = await fetch(`/api/sponsorship/packages?event_id=${eventId}`);
    if (res.ok) {
      const data = await res.json();
      setPackages(data.packages || []);
    }

    const eventRes = await fetch(`/api/events`);
    if (eventRes.ok) {
      const all = await eventRes.json();
      const e = (all || []).find((x: any) => x.id === eventId);
      setEvent(e || null);
    }
    setLoading(false);
  }

  async function submitSponsorship() {
    if (!selectedPackage) {
      toast.error("Select a sponsorship pack");
      return;
    }

    if (!transactionReference.trim() || !paymentDate) {
      toast.error("Enter payment reference and date");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/sponsorship/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          package_id: selectedPackage.id,
          transaction_reference: transactionReference,
          payment_method: paymentMethod,
          payment_date: paymentDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit sponsorship");
        return;
      }

      toast.success("Payment details submitted for verification");
      setTransactionReference("");
      setPaymentDate("");
    } catch (error) {
      toast.error("Failed to submit sponsorship");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-bg-muted p-6">Loading...</div>;
  }

  if (!event) {
    return <div className="min-h-screen bg-bg-muted p-6">Event not found</div>;
  }

  return (
    <div className="min-h-screen bg-bg-muted p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
          {event.banner_image && <img src={event.banner_image} alt={event.title} className="w-full h-64 object-cover" />}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2">{event.title}</h1>
            <p className="text-text-secondary mb-4">{event.description}</p>
            <div className="text-xs text-text-muted">{event.location} · {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}</div>
          </div>
        </div>

        <div className="space-y-4">
          {packages.length === 0 && (
            <div className="bg-bg-card rounded-xl border border-border-default p-6 text-text-secondary">
              Sponsorship visibility is not enabled for this event.
            </div>
          )}

          {packages.map((pkg) => {
            const visibilityList = SPONSORSHIP_VISIBILITY[pkg.type as keyof typeof SPONSORSHIP_VISIBILITY] || [];
            const isSelected = selectedPackage?.id === pkg.id;

            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPackage(pkg)}
                className={`w-full text-left bg-bg-card rounded-xl border p-6 transition-colors ${
                  isSelected ? "border-primary bg-bg-muted" : "border-border-default"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-text-primary capitalize">
                    {pkg.type} Visibility Pack
                  </div>
                  <div className="text-sm text-text-secondary">₹{pkg.price?.toLocaleString?.() || pkg.price}</div>
                </div>

                <div className="space-y-2">
                  {visibilityList.map((item: string) => (
                    <div key={item} className="text-sm text-text-secondary">• {item}</div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Submit Offline Payment Details</h2>
          <p className="text-sm text-text-secondary">
            Pay Happenin directly via UPI, bank transfer, or cash. Your visibility activates only after admin verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "UPI" | "Bank" | "Cash")}
                className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              >
                <option value="UPI">UPI</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Transaction Reference</label>
            <input
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="UPI reference / bank transfer ID / cash receipt"
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
            />
          </div>

          <button
            onClick={submitSponsorship}
            disabled={!selectedPackage || submitting}
            className="w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit for Verification"}
          </button>
        </div>
      </div>
    </div>
  );
}
