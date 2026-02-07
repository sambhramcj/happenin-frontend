"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Icons } from "@/components/icons";

interface SponsorshipDeal {
  id: string;
  event_id: string;
  sponsor_id: string;
  amount_paid: number;
  status: string;
  confirmed_by?: string;
  confirmed_at?: string;
  payment_proof_url?: string;
  created_at: string;
  events: { id: string; title: string };
  sponsorship_packages: { tier: string };
  sponsors_profile: { company_name: string; email: string };
}

interface OrganizerSponsorshipDealsProps {
  eventId?: string;
}

export function OrganizerSponsorshipDeals({ eventId }: OrganizerSponsorshipDealsProps) {
  const [deals, setDeals] = useState<SponsorshipDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

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

  const handleConfirmPayment = async (dealId: string) => {
    if (!confirm('Confirm that you have received the sponsor payment (outside app)?')) {
      return;
    }

    try {
      setConfirmingId(dealId);
      const res = await fetch(`/api/organizer/sponsorships/${dealId}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast.success('Sponsorship confirmed! All features unlocked.');
        await fetchDeals();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to confirm sponsorship');
      }
    } catch (error) {
      console.error('Error confirming sponsorship:', error);
      toast.error('Failed to confirm sponsorship');
    } finally {
      setConfirmingId(null);
    }
  };

  const getTierGradient = (tier: string) => {
    const gradients: Record<string, string> = {
      bronze: 'from-amber-700 to-amber-600',
      silver: 'from-gray-400 to-gray-500',
      gold: 'from-yellow-500 to-yellow-600',
      platinum: 'from-purple-600 to-purple-700',
    };
    return gradients[tier.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border border-warning/20',
      confirmed: 'bg-success/10 text-success border border-success/20',
      active: 'bg-info/10 text-info border border-info/20',
      completed: 'bg-text-muted/10 text-text-muted border border-text-muted/20',
    };
    return colors[status] || 'bg-text-muted/10 text-text-muted';
  };

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
      
      <div className="space-y-4">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="bg-bg-muted rounded-lg p-4 border border-border-default"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTierGradient(deal.sponsorship_packages.tier)} text-white capitalize`}>
                    {deal.sponsorship_packages.tier}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)} capitalize`}>
                    {deal.status}
                  </span>
                </div>
                <p className="text-text-primary font-medium">{deal.sponsors_profile.company_name}</p>
                <p className="text-text-muted text-xs">{deal.sponsors_profile.email}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-text-primary">₹{(deal.amount_paid / 100).toFixed(0)}</div>
                <div className="text-xs text-text-muted">Sponsorship amount</div>
              </div>
            </div>

            {deal.status === 'pending' && (
              <div className="bg-warningSoft border border-warning/30 rounded-lg p-3 mb-3 text-sm">
                <p className="text-warning font-medium mb-1">Payment Pending</p>
                <p className="text-warning/80 text-xs">
                  Coordinate with sponsor for payment (UPI/Bank/Offline). Once received, click Confirm below.
                </p>
              </div>
            )}

            {deal.status === 'confirmed' && (
              <div className="bg-successSoft border border-success/30 rounded-lg p-3 mb-3 text-sm">
                <p className="text-success font-medium mb-1">Payment Confirmed</p>
                <p className="text-success/80 text-xs">
                  All sponsor deliverables are active (logos, certificates, QR scanning, reports).
                </p>
                {deal.confirmed_at && (
                  <p className="text-success/70 text-xs mt-1">
                    Confirmed on {new Date(deal.confirmed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Event: {deal.events.title}</span>
              {deal.status === 'pending' && (
                <button
                  onClick={() => handleConfirmPayment(deal.id)}
                  disabled={confirmingId === deal.id}
                  className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {confirmingId === deal.id ? (
                    <span className="flex items-center gap-2">
                      <Icons.Loader2 className="h-4 w-4 animate-spin" />
                      Confirming...
                    </span>
                  ) : (
                    'Mark As Paid'
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
