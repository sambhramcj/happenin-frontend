"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";

interface SponsorshipDeal {
  id: string;
  event_id?: string;
  fest_id?: string;
  sponsor_email: string;
  pack_type: string;
  amount: number;
  status: string;
  visibility_active: boolean;
  organizer_payout_settled: boolean;
  created_at: string;
  events?: { id: string; title: string };
  fests?: { id: string; title: string };
  sponsors_profile: { company_name: string; email: string };
}

interface OrganizerSponsorshipDealsProps {
  eventId?: string;
}

export function OrganizerSponsorshipDeals({ eventId }: OrganizerSponsorshipDealsProps) {
  const [deals, setDeals] = useState<SponsorshipDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeals();
  }, [eventId]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      // Query new sponsorship_orders endpoint for this event
      const url = eventId 
        ? `/api/sponsorships/orders?event_id=${eventId}`
        : '/api/sponsorships/orders';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Filter to only paid orders
        const paidOrders = (data.deals || []).filter((deal: SponsorshipDeal) => deal.status === 'paid');
        setDeals(paidOrders);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status: string) =>
    status ? status.replace(/_/g, " ") : "pending";

  if (loading) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-default p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-bg-muted rounded w-1/3" />
          <div className="h-20 bg-bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <div className="bg-bg-card rounded-xl border border-border-default p-6 text-center">
        <Icons.DollarSign className="h-12 w-12 mx-auto text-text-muted mb-2" />
        <p className="text-text-secondary text-sm">No sponsorship orders yet</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border-default p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">Sponsorship Orders</h3>
      <p className="text-sm text-text-secondary mb-4">
        Sponsorship visibility activates automatically when payment is verified by Razorpay. Organizers can view order status and payout settlement.
      </p>
      
      <div className="space-y-4">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="bg-bg-muted rounded-lg p-4 border border-border-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-bg-card text-text-primary border border-border-default capitalize">
                    {deal.pack_type}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      deal.status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : deal.status === 'created'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {deal.status}
                  </span>
                </div>
                <p className="text-text-primary font-medium">{deal.sponsors_profile.company_name}</p>
                <p className="text-text-muted text-xs">{deal.sponsors_profile.email}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-text-primary">₹{(deal.amount / 100).toLocaleString()}</div>
                <div className="text-xs text-text-muted">Sponsorship amount</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Event: {deal.events?.title || deal.fests?.title || 'Fest Sponsorship'}</span>
              <div className="space-x-3">
                <span>{deal.visibility_active ? "✓ Visible" : "✗ Hidden"}</span>
                <span>{deal.organizer_payout_settled ? "✓ Payout Settled" : "✗ Pending"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
