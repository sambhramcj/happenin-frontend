"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { SPONSORSHIP_VISIBILITY } from "@/types/sponsorship";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PackType = "digital" | "app" | "fest";

export default function SponsorEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [packages, setPackages] = useState<Array<{ type: PackType; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PackType | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "paid" | "pending">("idle");

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  async function fetchEventDetails() {
    setLoading(true);
    const eventRes = await fetch(`/api/events`);
    if (eventRes.ok) {
      const all = await eventRes.json();
      const e = (all || []).find((x: any) => x.id === eventId);
      setEvent(e || null);
      if (e) {
        const packs: Array<{ type: PackType; price: number }> = [
          { type: "digital", price: 10000 },
          { type: "app", price: 25000 },
        ];
        if (e.fest_id) {
          packs.push({ type: "fest", price: 50000 });
        }
        setPackages(packs);
      }
    }
    setLoading(false);
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

  async function handleSponsorNow() {
    if (!selectedPackage) {
      toast.error("Select a sponsorship pack");
      return;
    }

    if (!eventId) {
      toast.error("Missing event details");
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus("processing");

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Razorpay SDK failed to load");
        setPaymentStatus("idle");
        return;
      }

      const res = await fetch("/api/sponsorships/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          pack_type: selectedPackage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create order");
        setPaymentStatus("idle");
        return;
      }

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(data.amount * 100),
        currency: data.currency || "INR",
        name: "Happenin",
        description: "Sponsorship Payment",
        order_id: data.orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/sponsorships/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok) {
              setPaymentStatus("paid");
              toast.success("Sponsorship payment confirmed");
            } else {
              console.error("Verification error:", verifyData);
              setPaymentStatus("pending");
              toast.error("Payment verification pending");
            }
          } catch (error) {
            setPaymentStatus("pending");
            toast.error("Payment verification pending");
          }
        },
        prefill: {},
      });

      razorpay.open();
    } catch (error) {
      toast.error("Payment failed");
      setPaymentStatus("idle");
    } finally {
      setProcessing(false);
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
          {event.banner_image && (
            <img src={event.banner_image} alt={event.title} className="w-full h-64 object-cover" />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2">{event.title}</h1>
            <p className="text-text-secondary mb-4">{event.description}</p>
            <div className="text-xs text-text-muted">
              {event.location} · {event.date ? new Date(event.date).toLocaleDateString() : "Date TBA"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {packages.length === 0 && (
            <div className="bg-bg-card rounded-xl border border-border-default p-6 text-text-secondary">
              Sponsorship visibility is not enabled for this event.
            </div>
          )}

          {packages.map((pkg) => {
            const visibilityList = SPONSORSHIP_VISIBILITY[pkg.type] || [];
            const isSelected = selectedPackage === pkg.type;

            return (
              <button
                key={pkg.type}
                type="button"
                onClick={() => setSelectedPackage(pkg.type)}
                className={`w-full text-left bg-bg-card rounded-xl border p-6 transition-colors ${
                  isSelected ? "border-primary bg-bg-muted" : "border-border-default"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-text-primary capitalize">
                    {pkg.type} Visibility Pack
                  </div>
                  <div className="text-sm text-text-secondary">₹{pkg.price.toLocaleString()}</div>
                </div>

                <div className="space-y-2">
                  {visibilityList.map((item) => (
                    <div key={item} className="text-sm text-text-secondary">
                      • {item}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-bg-card rounded-xl border border-border-default p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Sponsor This Event</h2>
          <p className="text-sm text-text-secondary">
            Payments are processed securely by Razorpay. Visibility activates after payment confirmation.
          </p>

          <button
            onClick={handleSponsorNow}
            disabled={!selectedPackage || processing}
            className="w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover disabled:opacity-50"
          >
            {processing ? "Processing..." : "Sponsor Now"}
          </button>

          {paymentStatus === "paid" && (
            <div className="text-sm text-text-secondary">
              Status: Active
            </div>
          )}

          {paymentStatus === "pending" && (
            <div className="text-sm text-text-secondary">
              Status: Verification pending
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
