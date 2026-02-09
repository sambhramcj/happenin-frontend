"use client";

import { SPONSORSHIP_PACKS, SPONSORSHIP_VISIBILITY } from "@/types/sponsorship";

interface SponsorshipPackagesManagerProps {
  eventId: string;
}

export default function SponsorshipPackagesManager() {
  const packs = Object.entries(SPONSORSHIP_PACKS).map(([key, value]) => ({
    type: key,
    price: value.price,
    scope: value.scope,
    visibility: SPONSORSHIP_VISIBILITY[key as keyof typeof SPONSORSHIP_VISIBILITY] || [],
  }));

  return (
    <div className="bg-bg-card rounded-xl border border-border-default p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">Sponsorship Visibility Packs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packs.map((pack) => (
          <div key={pack.type} className="bg-bg-muted border border-border-default rounded-lg p-4">
            <div className="text-sm font-semibold text-text-primary capitalize">
              {pack.type} pack
            </div>
            <div className="text-xs text-text-secondary mb-2">₹{pack.price.toLocaleString()}</div>
            <ul className="space-y-1 text-xs text-text-secondary">
              {pack.visibility.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
