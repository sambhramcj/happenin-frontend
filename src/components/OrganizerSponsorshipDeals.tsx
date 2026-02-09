"use client";

import { useEffect, useState } from "react";
import { Icons } from "@/components/icons";

interface SponsorshipDeal {
  id: string;
  event_id: string;
  sponsor_email: string;
  payment_status: string;
  visibility_active: boolean;
  created_at: string;
  events: { id: string; title: string };
  sponsorship_packages: { type: string; price: number; scope: string };
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
      const url = eventId 
        ? `/api/sponsorship/deals?event_id=${eventId}`
        : '/api/sponsorship/deals';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
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
        <p className="text-text-secondary text-sm">No sponsorship deals yet</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card rounded-xl border border-border-default p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">Sponsorship Deals</h3>
      <p className="text-sm text-text-secondary mb-4">
        Sponsorship visibility activates after admin verifies payment. Organizers can only view status.
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
                    {deal.sponsorship_packages.type}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-bg-card text-text-secondary border border-border-default capitalize">
                    {formatStatus(deal.payment_status)}
                  </span>
                </div>
                <p className="text-text-primary font-medium">{deal.sponsors_profile.company_name}</p>
                <p className="text-text-muted text-xs">{deal.sponsors_profile.email}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-text-primary">₹{deal.sponsorship_packages.price?.toLocaleString?.() || deal.sponsorship_packages.price}</div>
                <div className="text-xs text-text-muted">Pack price</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Event: {deal.events.title}</span>
              <span>{deal.visibility_active ? "Visibility Active" : "Visibility Inactive"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
