'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SponsorshipDeal {
  id: string;
  event_id: string;
  amount_paid: number;
  platform_fee: number;
  organizer_amount: number;
  status: string;
  created_at: string;
  events: { id: string; title: string };
  sponsors_profile: { company_name: string; email: string };
}

interface OrganizerPayoutSummary {
  totalEarnings: number;
  activeDeals: number;
  deals: SponsorshipDeal[];
}

interface SponsorshipPayoutProps {
  organizerEmail: string;
}

export function SponsorshipPayout({ organizerEmail }: SponsorshipPayoutProps) {
  const [payoutData, setPayoutData] = useState<OrganizerPayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayoutData();
  }, [organizerEmail]);

  const fetchPayoutData = async () => {
    try {
      const res = await fetch(`/api/organizer/sponsorship-payout?email=${organizerEmail}`);
      if (res.ok) {
        const data = await res.json();
        setPayoutData(data);
      } else {
        toast.error('Failed to fetch payout data');
      }
    } catch (error) {
      console.error('Error fetching payout:', error);
      toast.error('Failed to load payout information');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse py-4">Loading payout information...</div>;
  }

  if (!payoutData) {
    return null;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <div className="text-green-800 text-sm font-medium mb-1">Total Sponsorship Earnings</div>
          <div className="text-3xl font-bold text-green-900">
            ₹{(payoutData.totalEarnings / 100).toFixed(0)}
          </div>
          <div className="text-xs text-green-700 mt-2">From {payoutData.deals.length} sponsorships</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <div className="text-blue-800 text-sm font-medium mb-1">Active Sponsorships</div>
          <div className="text-3xl font-bold text-blue-900">{payoutData.activeDeals}</div>
          <div className="text-xs text-blue-700 mt-2">Pending or confirmed deals</div>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-bg-card border border-border-default rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted border-b border-border-default">
            <tr>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Event</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Sponsor</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Amount Paid</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Your Earnings (80%)</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Status</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {payoutData.deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-bg-muted transition-colors">
                <td className="px-4 py-3 text-text-primary font-medium">{deal.events.title}</td>
                <td className="px-4 py-3 text-text-primary">{deal.sponsors_profile.company_name}</td>
                <td className="px-4 py-3 text-right text-text-primary font-medium">
                  ₹{(deal.amount_paid / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right text-green-600 font-bold">
                  ₹{(deal.organizer_amount / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)} capitalize`}>
                    {deal.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {new Date(deal.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payoutData.deals.length === 0 && (
          <div className="px-4 py-8 text-center text-text-secondary">
            No sponsorship deals yet. Enable sponsorships on your events to get started!
          </div>
        )}
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Earnings are calculated as 80% of the sponsorship amount paid. Confirmed or active deals are eligible for payout once they're completed.
        </p>
      </div>
    </div>
  );
}
