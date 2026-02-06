"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Icons } from "@/components/icons";
import { TIER_BOUNDS, DELIVERABLE_CATEGORIES } from "@/types/sponsorship";

interface SponsorshipPackagesManagerProps {
  eventId: string;
}

export default function SponsorshipPackagesManager({ eventId }: SponsorshipPackagesManagerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTier, setCreatingTier] = useState<string | null>(null);

  const tiers = [
    { value: 'bronze', label: 'Bronze', color: 'from-amber-700 to-amber-600' },
    { value: 'silver', label: 'Silver', color: 'from-gray-400 to-gray-500' },
    { value: 'gold', label: 'Gold', color: 'from-yellow-500 to-yellow-600' },
    { value: 'platinum', label: 'Platinum', color: 'from-cyan-400 to-cyan-500' },
  ];

  useEffect(() => {
    fetchPackages();
  }, [eventId]);

  async function fetchPackages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/sponsorship/packages?event_id=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function createPackage(tier: string) {
    setCreatingTier(tier);
    try {
      const bounds = TIER_BOUNDS[tier as keyof typeof TIER_BOUNDS];
      const res = await fetch("/api/sponsorship/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          tier,
          min_amount: bounds.min,
          max_amount: bounds.max,
          organizer_notes: "",
          deliverables: [],
        }),
      });

      if (res.ok) {
        toast.success("Package created");
        fetchPackages();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create package");
      }
    } catch (err) {
      toast.error("Failed to create package");
    } finally {
      setCreatingTier(null);
    }
  }

  async function togglePackage(packageId: string, isActive: boolean) {
    try {
      const res = await fetch("/api/sponsorship/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          is_active: !isActive,
        }),
      });

      if (res.ok) {
        toast.success(isActive ? "Package disabled" : "Package enabled");
        fetchPackages();
      }
    } catch (err) {
      toast.error("Failed to update package");
    }
  }

  const existingTiers = new Set(packages.map((p) => p.tier));

  if (loading) {
    return (
      <div className="p-6 bg-bg-card rounded-xl border border-border-default">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-bg-muted rounded w-1/3" />
          <div className="h-20 bg-bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-bg-card rounded-xl border border-border-default p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Sponsorship Packages</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {tiers.map((tier) => {
            const existingPkg = packages.find((p) => p.tier === tier.value);
            const bounds = TIER_BOUNDS[tier.value as keyof typeof TIER_BOUNDS];

            if (existingPkg) {
              return (
                <div
                  key={tier.value}
                  className="p-4 border border-border-default rounded-lg bg-bg-muted"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-sm font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                      {tier.label}
                    </div>
                    <button
                      onClick={() => togglePackage(existingPkg.id, existingPkg.is_active)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        existingPkg.is_active
                          ? "bg-green-900/20 text-green-400 border border-green-700/50"
                          : "bg-red-900/20 text-red-400 border border-red-700/50"
                      }`}
                    >
                      {existingPkg.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <div className="text-text-secondary text-sm mb-2">
                    ₹{existingPkg.min_amount.toLocaleString()} - ₹{existingPkg.max_amount.toLocaleString()}
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/organizer/sponsorships/${existingPkg.id}`)}
                    className="text-xs text-primary hover:underline"
                  >
                    Manage Deliverables →
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tier.value}
                onClick={() => createPackage(tier.value)}
                disabled={creatingTier === tier.value}
                className="p-4 border-2 border-dashed border-border-default rounded-lg hover:border-primary transition-all disabled:opacity-50"
              >
                <div className={`text-sm font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent mb-2`}>
                  {tier.label}
                </div>
                <div className="text-text-muted text-xs mb-2">
                  ₹{bounds.min.toLocaleString()} - ₹{bounds.max.toLocaleString()}
                </div>
                <div className="text-xs text-primary">
                  {creatingTier === tier.value ? "Creating..." : "+ Add Package"}
                </div>
              </button>
            );
          })}
        </div>

        {packages.length === 0 && (
          <div className="text-center py-8 text-text-muted">
            <p className="text-sm">Create your first sponsorship package to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
