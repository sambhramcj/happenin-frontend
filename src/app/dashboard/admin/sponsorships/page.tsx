'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Deal {
  id: string;
  event_id: string;
  package_id: string;
  amount_paid: number;
  platform_fee: number;
  organizer_amount: number;
  status: string;
  created_at: string;
  sponsor_id: string;
  events: { id: string; title: string };
  sponsorship_packages: { id: string; tier: string };
  sponsors_profile: { company_name: string; email: string; is_active: boolean };
}

interface Analytics {
  totalRevenue: number;
  dealsCount: number;
}

export default function AdminSponsorshipsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({ totalRevenue: 0, dealsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'admin') {
      router.push('/');
      return;
    }

    fetchDeals();
  }, [session, statusFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const url = new URL('/api/admin/sponsorships', window.location.origin);
      if (statusFilter) url.searchParams.append('status', statusFilter);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setDeals(data.deals || []);
        setAnalytics(data.analytics || { totalRevenue: 0, dealsCount: 0 });
      } else {
        toast.error(data.error || 'Failed to fetch deals');
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to fetch sponsorship deals');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSponsor = async (email: string) => {
    if (!confirm(`Are you sure you want to disable this sponsor?`)) return;

    try {
      setUpdatingId(email);
      const res = await fetch('/api/admin/sponsorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          target_type: 'sponsor',
          target_id: email,
          value: false,
        }),
      });

      if (res.ok) {
        toast.success('Sponsor disabled');
        await fetchDeals();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to disable sponsor');
      }
    } catch (error) {
      console.error('Error disabling sponsor:', error);
      toast.error('Failed to disable sponsor');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDisablePackage = async (packageId: string) => {
    if (!confirm(`Are you sure you want to disable this package?`)) return;

    try {
      setUpdatingId(packageId);
      const res = await fetch('/api/admin/sponsorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          target_type: 'package',
          target_id: packageId,
          value: false,
        }),
      });

      if (res.ok) {
        toast.success('Package disabled');
        await fetchDeals();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to disable package');
      }
    } catch (error) {
      console.error('Error disabling package:', error);
      toast.error('Failed to disable package');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading sponsorships...</div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      bronze: 'from-amber-700 to-amber-600',
      silver: 'from-gray-400 to-gray-500',
      gold: 'from-yellow-500 to-yellow-600',
      platinum: 'from-purple-600 to-purple-700',
    };
    return colors[tier.toLowerCase()] || 'from-gray-500 to-gray-600';
  };

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
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Sponsorships Management</h1>
        <p className="text-text-secondary mt-1">Track and manage all sponsorship deals</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-bg-card border border-border-default rounded-lg p-6">
          <div className="text-text-secondary text-sm font-medium">Total Platform Revenue</div>
          <div className="text-3xl font-bold text-text-primary mt-2">
            ₹{(analytics.totalRevenue / 100000).toFixed(2)}L
          </div>
          <div className="text-text-muted text-xs mt-2">From {analytics.dealsCount} deals</div>
        </div>

        <div className="bg-bg-card border border-border-default rounded-lg p-6">
          <div className="text-text-secondary text-sm font-medium">Active Deals</div>
          <div className="text-3xl font-bold text-text-primary mt-2">
            {deals.filter((d) => ['pending', 'confirmed', 'active'].includes(d.status)).length}
          </div>
          <div className="text-text-muted text-xs mt-2">Out of {deals.length} total</div>
        </div>
      </div>

      {/* Filter & Controls */}
      <div className="bg-bg-card border border-border-default rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === null
                ? 'bg-text-primary text-bg-card'
                : 'border border-border-default text-text-secondary hover:bg-bg-muted'
            }`}
          >
            All
          </button>
          {['pending', 'confirmed', 'active', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                statusFilter === status
                  ? 'bg-text-primary text-bg-card'
                  : 'border border-border-default text-text-secondary hover:bg-bg-muted'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Deals Table */}
      <div className="overflow-x-auto bg-bg-card border border-border-default rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted border-b border-border-default">
            <tr>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Sponsor</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Event</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Tier</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Amount Paid</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Platform Fee</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Organizer Amount</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Status</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-bg-muted transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{deal.sponsors_profile.company_name}</div>
                  <div className="text-xs text-text-muted">{deal.sponsor_id}</div>
                  {!deal.sponsors_profile.is_active && (
                    <div className="text-xs text-red-600 mt-1">Disabled</div>
                  )}
                </td>
                <td className="px-4 py-3 text-text-primary">{deal.events.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTierColor(
                      deal.sponsorship_packages.tier
                    )} text-white capitalize`}
                  >
                    {deal.sponsorship_packages.tier}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text-primary font-medium">
                  ₹{(deal.amount_paid / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right text-text-primary font-medium">
                  ₹{(deal.platform_fee / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3 text-right text-text-primary font-medium">
                  ₹{(deal.organizer_amount / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)} capitalize`}>
                    {deal.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDisableSponsor(deal.sponsors_profile.email)}
                      disabled={updatingId === deal.sponsors_profile.email}
                      className="text-xs px-2 py-1 border border-border-default text-text-secondary hover:bg-bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingId === deal.sponsors_profile.email ? 'Updating...' : 'Disable Sponsor'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {deals.length === 0 && (
          <div className="px-4 py-8 text-center text-text-secondary">
            No sponsorship deals found
          </div>
        )}
      </div>
    </div>
  );
}
