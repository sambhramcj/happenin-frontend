'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface BankAccount {
  id: string;
  organizer_email: string;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  is_verified: boolean;
  created_at: string;
}

interface SponsorshipPayoutRow {
  id: string;
  gross_amount: number;
  platform_fee: number;
  payout_amount: number;
  payout_status: 'pending' | 'paid';
  payout_method: string | null;
  paid_at: string | null;
  created_at: string;
  sponsorship_deals: {
    events: { id: string; title: string } | null;
    sponsorship_packages: { tier: string } | null;
    sponsors_profile: { company_name: string } | null;
  } | null;
}

interface OrganizerPayoutSummary {
  bankAccount: BankAccount | null;
  totals: {
    totalEarnings: number;
    paidToOrganizer: number;
    pendingPayouts: number;
  };
  payouts: SponsorshipPayoutRow[];
}

interface SponsorshipPayoutProps {
  organizerEmail: string;
}

export function SponsorshipPayout({ organizerEmail }: SponsorshipPayoutProps) {
  const [payoutData, setPayoutData] = useState<OrganizerPayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (!organizerEmail) return;
    fetchPayoutData();
  }, [organizerEmail]);

  useEffect(() => {
    if (payoutData?.bankAccount) {
      setAccountHolderName(payoutData.bankAccount.account_holder_name || '');
      setBankName(payoutData.bankAccount.bank_name || '');
      setAccountNumber(payoutData.bankAccount.account_number || '');
      setIfscCode(payoutData.bankAccount.ifsc_code || '');
      setUpiId(payoutData.bankAccount.upi_id || '');
    }
  }, [payoutData?.bankAccount]);

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

  const handleSaveBankDetails = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/organizer/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_holder_name: accountHolderName,
          bank_name: bankName,
          account_number: accountNumber,
          ifsc_code: ifscCode,
          upi_id: upiId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Failed to save payout details');
        return;
      }

      setPayoutData((prev) => (prev ? { ...prev, bankAccount: data.bankAccount } : prev));
      toast.success('Payout details saved');
    } catch (error) {
      console.error('Error saving payout details:', error);
      toast.error('Failed to save payout details');
    } finally {
      setSaving(false);
    }
  };

  const getPayoutStatusStyle = (status: string) => {
    if (status === 'paid') return 'bg-successSoft text-success';
    return 'bg-warningSoft text-warning';
  };

  if (loading) {
    return <div className="animate-pulse py-4">Loading payout information...</div>;
  }

  if (!payoutData) {
    return null;
  }

  const bankAccount = payoutData.bankAccount;
  const bankIsVerified = bankAccount?.is_verified;

  return (
    <div className="space-y-6">
      <div className="bg-bg-card border border-border-default rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Payout Details</h3>
            <p className="text-sm text-text-secondary">Add bank or UPI details for manual payouts</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              bankAccount
                ? bankIsVerified
                  ? 'bg-successSoft text-success'
                  : 'bg-warningSoft text-warning'
                : 'bg-bg-muted text-text-secondary'
            }`}
          >
            {bankAccount ? (bankIsVerified ? 'Verified' : 'Pending verification') : 'Not submitted'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Account Holder Name</label>
            <input
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              disabled={bankIsVerified}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Bank Name</label>
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={bankIsVerified}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              placeholder="Bank name"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">Account Number</label>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              disabled={bankIsVerified}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              placeholder="Account number"
            />
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1 block">IFSC Code</label>
            <input
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              disabled={bankIsVerified}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              placeholder="IFSC"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-text-secondary mb-1 block">UPI ID (optional)</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              disabled={bankIsVerified}
              className="w-full bg-bg-muted border border-border-default rounded-lg px-3 py-2 text-text-primary"
              placeholder="name@bank"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-text-muted">
            Bank details are required to receive payouts. Verified details cannot be edited.
          </p>
          <button
            onClick={handleSaveBankDetails}
            disabled={bankIsVerified || saving}
            className="px-4 py-2 rounded-lg bg-primary text-text-inverse text-sm font-semibold hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>

      {!bankAccount && (
        <div className="bg-warningSoft border border-border-default rounded-lg p-4">
          <p className="text-sm text-warning">Add payout details to receive sponsorship payouts.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-border-default rounded-lg p-5">
          <div className="text-sm text-text-muted">Total Earnings</div>
          <div className="text-2xl font-bold text-text-primary">₹{Math.round(payoutData.totals.totalEarnings)}</div>
        </div>
        <div className="bg-bg-card border border-border-default rounded-lg p-5">
          <div className="text-sm text-text-muted">Paid to You</div>
          <div className="text-2xl font-bold text-text-primary">₹{Math.round(payoutData.totals.paidToOrganizer)}</div>
        </div>
        <div className="bg-bg-card border border-border-default rounded-lg p-5">
          <div className="text-sm text-text-muted">Pending Payouts</div>
          <div className="text-2xl font-bold text-text-primary">{payoutData.totals.pendingPayouts}</div>
        </div>
      </div>

      <div className="bg-bg-card border border-border-default rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted border-b border-border-default">
            <tr>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Event</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Sponsor</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Package Tier</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Gross Amount</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Platform Fee</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Your Earnings</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Payout Status</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Paid At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {payoutData.payouts.map((payout) => {
              const sponsorName = payout.sponsorship_deals?.sponsors_profile?.company_name || 'Sponsor';
              const eventName = payout.sponsorship_deals?.events?.title || 'Event';
              const tier = payout.sponsorship_deals?.sponsorship_packages?.tier || 'standard';
              const feeRate = payout.gross_amount > 0 ? Math.round((payout.platform_fee / payout.gross_amount) * 100) : 0;

              return (
                <tr key={payout.id} className="hover:bg-bg-muted transition-colors">
                  <td className="px-4 py-3 text-text-primary font-medium">{eventName}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">{sponsorName}</td>
                  <td className="px-4 py-3 text-text-primary capitalize">{tier}</td>
                  <td className="px-4 py-3 text-right text-text-primary font-medium">₹{Math.round(payout.gross_amount)}</td>
                  <td className="px-4 py-3 text-right text-text-primary">{feeRate}%</td>
                  <td className="px-4 py-3 text-right text-text-primary font-semibold">₹{Math.round(payout.payout_amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getPayoutStatusStyle(payout.payout_status)}`}>
                      {payout.payout_status === 'paid' ? 'Paid' : 'Pending payout'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {payout.paid_at ? new Date(payout.paid_at).toLocaleString() : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {payoutData.payouts.length === 0 && (
          <div className="px-4 py-8 text-center text-text-secondary">
            No sponsorship payouts yet.
          </div>
        )}
      </div>
    </div>
  );
}
