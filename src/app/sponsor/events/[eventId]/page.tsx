"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

export default function SponsorEventPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function sponsorPackage(pkg: any) {
    const amount = pkg.max_amount;
    const res = await fetch("/api/sponsorship/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        package_id: pkg.id,
        amount,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const { order, deal } = data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Happenin Sponsorship",
        description: "Sponsorship Package",
        order_id: order.id,
        handler: async function (response: any) {
          await fetch("/api/sponsorship/deals", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              deal_id: deal.id,
              razorpay_payment_id: response.razorpay_payment_id,
              status: "confirmed",
            }),
          });
          toast.success("Sponsorship confirmed");
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } else {
      const data = await res.json();
      toast.error(data.error || "Payment failed");
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
          {packages.map((pkg) => {
            const platformDefaults = (pkg.sponsorship_deliverables || []).filter((d: any) => d.type === "platform_default");
            const organizerDeliverables = (pkg.sponsorship_deliverables || []).filter((d: any) => d.type === "organizer_defined");

            return (
              <div key={pkg.id} className="bg-bg-card rounded-xl border border-border-default p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-text-primary capitalize">{pkg.tier} Package</div>
                  <div className="text-sm text-text-secondary">₹{pkg.min_amount} - ₹{pkg.max_amount}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Platform Deliverables</h3>
                    <div className="space-y-2">
                      {platformDefaults.map((d: any) => (
                        <div key={d.id} className="text-xs text-text-secondary">• {d.title}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Organizer Deliverables</h3>
                    <div className="space-y-2">
                      {organizerDeliverables.map((d: any) => (
                        <div key={d.id} className="text-xs text-text-secondary">• {d.title}: {d.description}</div>
                      ))}
                      {organizerDeliverables.length === 0 && (
                        <div className="text-xs text-text-muted">No organizer deliverables</div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => sponsorPackage(pkg)}
                  className="mt-4 w-full bg-primary text-text-inverse py-2 rounded-lg hover:bg-primaryHover"
                >
                  Sponsor This Package
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
