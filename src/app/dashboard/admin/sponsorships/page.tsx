'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Deal {
  id: string;
  event_id: string;
  package_id: string;
  payment_status: string;
  transaction_reference?: string;
  payment_method?: string;
  payment_date?: string;
  verified_by_admin?: boolean;
  visibility_active?: boolean;
  created_at: string;
  sponsor_email: string;
  events?: { id: string; title: string } | null;
  fests?: { id: string; title: string } | null;
  sponsorship_packages: { id: string; type: string; price: number; scope: string };
  sponsors_profile: { company_name: string; email: string; is_active: boolean };
  sponsor_analytics?: { clicks: number; impressions: number };
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

  const handleVerifyPayment = async (dealId: string) => {
    try {
      setUpdatingId(dealId);
      const res = await fetch('/api/admin/sponsorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_payment',
          deal_id: dealId,
        }),
      });

      if (res.ok) {
        toast.success('Payment verified. Visibility enabled.');
        await fetchDeals();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to verify payment');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectPayment = async (dealId: string) => {
    try {
      setUpdatingId(dealId);
      const res = await fetch('/api/admin/sponsorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_payment',
          deal_id: dealId,
        }),
      });

      if (res.ok) {
        toast.success('Payment rejected');
        await fetchDeals();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to reject payment');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleVisibility = async (dealId: string, value: boolean) => {
    try {
      setUpdatingId(dealId);
      const res = await fetch('/api/admin/sponsorships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_visibility',
          deal_id: dealId,
          value,
        }),
      });

      if (res.ok) {
        toast.success(value ? 'Visibility enabled' : 'Visibility disabled');
        await fetchDeals();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
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

  const formatStatus = (status: string) => status.replace(/_/g, " ");

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
          <div className="text-text-secondary text-sm font-medium">Verified Deals</div>
          <div className="text-3xl font-bold text-text-primary mt-2">
            {deals.filter((d) => d.payment_status === 'verified').length}
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
          {['pending', 'verified', 'rejected'].map((status) => (
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
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Pack</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Price</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Payment Details</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Visibility</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Clicks/Impressions</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {deals.map((deal) => (
              <tr key={deal.id} className="hover:bg-bg-muted transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-text-primary">{deal.sponsors_profile.company_name}</div>
                  <div className="text-xs text-text-muted">{deal.sponsor_email}</div>
                  {!deal.sponsors_profile.is_active && (
                    <div className="text-xs text-text-muted mt-1">Disabled</div>
                  )}
                </td>
                <td className="px-4 py-3 text-text-primary">
                  {deal.events?.title || deal.fests?.title || "Fest Sponsorship"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-bg-card text-text-primary border border-border-default capitalize">
                    {deal.sponsorship_packages.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text-primary font-medium">
                  ₹{deal.sponsorship_packages.price?.toLocaleString?.() || deal.sponsorship_packages.price}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-text-secondary">
                    <div>Method: {deal.payment_method || "-"}</div>
                    <div>Reference: {deal.transaction_reference || "-"}</div>
                    <div>Date: {deal.payment_date || "-"}</div>
                    <div>Status: {formatStatus(deal.payment_status)}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {deal.visibility_active ? "Active" : "Inactive"}
                </td>
                <td className="px-4 py-3 text-xs text-text-secondary">
                  {deal.sponsor_analytics?.clicks ?? 0} / {deal.sponsor_analytics?.impressions ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {deal.payment_status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyPayment(deal.id)}
                          disabled={updatingId === deal.id}
                          className="text-xs px-2 py-1 border border-border-default text-text-primary hover:bg-bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingId === deal.id ? 'Verifying...' : 'Verify Payment'}
                        </button>
                        <button
                          onClick={() => handleRejectPayment(deal.id)}
                          disabled={updatingId === deal.id}
                          className="text-xs px-2 py-1 border border-border-default text-text-secondary hover:bg-bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {deal.payment_status === "verified" && (
                      <button
                        onClick={() => handleToggleVisibility(deal.id, !deal.visibility_active)}
                        disabled={updatingId === deal.id}
                        className="text-xs px-2 py-1 border border-border-default text-text-secondary hover:bg-bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deal.visibility_active ? "Disable Visibility" : "Enable Visibility"}
                      </button>
                    )}
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
