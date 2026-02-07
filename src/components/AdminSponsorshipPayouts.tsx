"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PayoutRow {
  id: string;
  organizer_email: string;
  gross_amount: number;
  platform_fee: number;
  payout_amount: number;
  payout_method: string | null;
  payout_status: "pending" | "paid";
  paid_at: string | null;
  sponsorship_deals: {
    events: { title: string } | null;
    sponsorship_packages: { tier: string } | null;
    sponsors_profile: { company_name: string } | null;
  } | null;
  organizer_bank_accounts: {
    organizer_email: string;
    account_holder_name: string | null;
    bank_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    upi_id: string | null;
    is_verified: boolean;
  } | null;
}

interface PayoutMetrics {
  totalSponsorshipRevenue: number;
  totalPlatformEarnings: number;
  totalPaidToOrganizers: number;
  pendingPayoutsCount: number;
}

export function AdminSponsorshipPayouts() {
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [metrics, setMetrics] = useState<PayoutMetrics | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [methods, setMethods] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/admin/sponsorship-payouts", window.location.origin);
      if (statusFilter) url.searchParams.set("status", statusFilter);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setPayouts(data.payouts || []);
        setMetrics(data.metrics || null);
      } else {
        toast.error(data.error || "Failed to fetch payouts");
      }
    } catch (error) {
      console.error("Error fetching payouts:", error);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    const payoutMethod = methods[payoutId] || "";
    if (!payoutMethod) {
      toast.error("Select payout method");
      return;
    }

    if (!confirm("Confirm that payout is completed externally?")) return;

    try {
      setUpdatingId(payoutId);
      const res = await fetch("/api/admin/sponsorship-payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payout_id: payoutId, payout_method: payoutMethod }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update payout");
        return;
      }

      toast.success("Payout marked as paid");
      await fetchPayouts();
    } catch (error) {
      console.error("Error updating payout:", error);
      toast.error("Failed to update payout");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleVerifyBank = async (organizerEmail: string, nextValue: boolean) => {
    try {
      setVerifyingId(organizerEmail);
      const res = await fetch("/api/admin/organizer-bank-accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizer_email: organizerEmail, is_verified: nextValue }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update bank verification");
        return;
      }

      toast.success("Bank verification updated");
      await fetchPayouts();
    } catch (error) {
      console.error("Error verifying bank:", error);
      toast.error("Failed to update bank verification");
    } finally {
      setVerifyingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "paid") return "bg-successSoft text-success";
    return "bg-warningSoft text-warning";
  };

  if (loading) {
    return <div className="animate-pulse py-6">Loading payouts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary">Sponsorship Payouts</h2>
        <p className="text-text-secondary">Track and confirm manual organizer payouts</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-bg-card border border-border-default rounded-lg p-5">
            <div className="text-sm text-text-muted">Total Sponsorship Revenue</div>
            <div className="text-2xl font-bold text-text-primary">₹{Math.round(metrics.totalSponsorshipRevenue)}</div>
          </div>
          <div className="bg-bg-card border border-border-default rounded-lg p-5">
            <div className="text-sm text-text-muted">Total Platform Earnings</div>
            <div className="text-2xl font-bold text-text-primary">₹{Math.round(metrics.totalPlatformEarnings)}</div>
          </div>
          <div className="bg-bg-card border border-border-default rounded-lg p-5">
            <div className="text-sm text-text-muted">Total Paid to Organizers</div>
            <div className="text-2xl font-bold text-text-primary">₹{Math.round(metrics.totalPaidToOrganizers)}</div>
          </div>
          <div className="bg-bg-card border border-border-default rounded-lg p-5">
            <div className="text-sm text-text-muted">Pending Payouts</div>
            <div className="text-2xl font-bold text-text-primary">{metrics.pendingPayoutsCount}</div>
          </div>
        </div>
      )}

      <div className="bg-bg-card border border-border-default rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === null
                ? "bg-text-primary text-bg-card"
                : "border border-border-default text-text-secondary hover:bg-bg-muted"
            }`}
          >
            All
          </button>
          {["pending", "paid"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                statusFilter === status
                  ? "bg-text-primary text-bg-card"
                  : "border border-border-default text-text-secondary hover:bg-bg-muted"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto bg-bg-card border border-border-default rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-bg-muted border-b border-border-default">
            <tr>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Event</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Organizer</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Sponsor</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Tier</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Gross</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Platform Fee</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Organizer Amount</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Bank / UPI</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Payout Status</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {payouts.map((payout) => {
              const bank = payout.organizer_bank_accounts;
              const bankVerified = bank?.is_verified;
              const payoutMethod = methods[payout.id] || payout.payout_method || "";

              return (
                <tr key={payout.id} className="hover:bg-bg-muted transition-colors">
                  <td className="px-4 py-3 text-text-primary">
                    {payout.sponsorship_deals?.events?.title || "Event"}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{payout.organizer_email}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {payout.sponsorship_deals?.sponsors_profile?.company_name || "Sponsor"}
                  </td>
                  <td className="px-4 py-3 text-text-primary capitalize">
                    {payout.sponsorship_deals?.sponsorship_packages?.tier || "standard"}
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary font-medium">₹{Math.round(payout.gross_amount)}</td>
                  <td className="px-4 py-3 text-right text-text-primary">₹{Math.round(payout.platform_fee)}</td>
                  <td className="px-4 py-3 text-right text-text-primary font-semibold">₹{Math.round(payout.payout_amount)}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {bank ? (
                      <div className="space-y-1">
                        <div className="text-text-primary">{bank.account_holder_name || "Account"}</div>
                        <div className="text-xs text-text-muted">
                          {bank.upi_id || [bank.bank_name, bank.account_number].filter(Boolean).join(" ") || "-"}
                        </div>
                        <div className="text-xs text-text-muted">{bank.ifsc_code || ""}</div>
                        <div className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${bankVerified ? "bg-successSoft text-success" : "bg-warningSoft text-warning"}`}>
                          {bankVerified ? "Verified" : "Pending"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted">No details</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(payout.payout_status)}`}>
                      {payout.payout_status === "paid" ? "Paid" : "Pending payout"}
                    </span>
                    {payout.paid_at && (
                      <div className="text-xs text-text-muted mt-1">
                        {new Date(payout.paid_at).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {bank && (
                        <button
                          onClick={() => handleVerifyBank(payout.organizer_email, !bankVerified)}
                          disabled={verifyingId === payout.organizer_email}
                          className="text-xs px-2 py-1 border border-border-default text-text-secondary hover:bg-bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {verifyingId === payout.organizer_email
                            ? "Updating..."
                            : bankVerified
                            ? "Unverify"
                            : "Verify"}
                        </button>
                      )}
                      <select
                        value={payoutMethod}
                        onChange={(e) =>
                          setMethods((prev) => ({
                            ...prev,
                            [payout.id]: e.target.value,
                          }))
                        }
                        disabled={payout.payout_status === "paid"}
                        className="bg-bg-muted border border-border-default rounded-lg px-2 py-1 text-xs text-text-primary"
                      >
                        <option value="">Select method</option>
                        <option value="UPI">UPI</option>
                        <option value="IMPS">IMPS</option>
                      </select>
                      <button
                        onClick={() => handleMarkPaid(payout.id)}
                        disabled={
                          payout.payout_status === "paid" || updatingId === payout.id
                        }
                        className="text-xs px-2 py-1 bg-primary text-text-inverse rounded-lg hover:bg-primaryHover disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingId === payout.id ? "Updating..." : "Mark as Paid"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {payouts.length === 0 && (
          <div className="px-4 py-8 text-center text-text-secondary">No payouts found</div>
        )}
      </div>
    </div>
  );
}