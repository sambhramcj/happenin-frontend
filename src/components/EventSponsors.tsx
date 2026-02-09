'use client';

import { useEffect, useState } from 'react';

interface SponsorDeal {
  id: string;
  payment_status: string;
  visibility_active: boolean;
  sponsors_profile: {
    company_name: string;
    logo_url?: string;
    website_url?: string;
  };
  sponsorship_packages: {
    type: string;
    price: number;
  };
}

interface EventSponsorsProps {
  eventId: string;
}

export function EventSponsors({ eventId }: EventSponsorsProps) {
  const [sponsors, setSponsors] = useState<SponsorDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, [eventId]);

  const fetchSponsors = async () => {
    try {
      const res = await fetch(`/api/sponsorship/public?event_id=${eventId}`);
      const data = await res.json();
      if (res.ok && data.deals) {
        setSponsors(data.deals);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || sponsors.length === 0) {
    return null;
  }

  const sponsorsByType = sponsors.reduce((acc: Record<string, SponsorDeal[]>, sponsor) => {
    const type = sponsor.sponsorship_packages.type.toLowerCase();
    if (!acc[type]) acc[type] = [];
    acc[type].push(sponsor);
    return acc;
  }, {});

  const typeOrder = ['fest', 'app', 'digital'];

  return (
    <div className="bg-bg-card rounded-xl p-6 border border-border-default">
      <h3 className="text-lg font-bold text-text-primary mb-4">Event Sponsors</h3>
      
      <div className="space-y-6">
        {typeOrder.map((type) => {
          if (!sponsorsByType[type]) return null;

          return (
            <div key={type}>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 bg-bg-muted text-text-primary border border-border-default capitalize">
                {type} Sponsors
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sponsorsByType[type].map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.sponsors_profile.website_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 rounded-lg border border-border-default hover:border-primary hover:bg-bg-muted transition-all"
                  >
                    {sponsor.sponsors_profile.logo_url ? (
                      <div className="h-12 mb-2 flex items-center justify-center">
                        <img
                          src={sponsor.sponsors_profile.logo_url}
                          alt={sponsor.sponsors_profile.company_name}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-12 mb-2 flex items-center justify-center bg-bg-muted rounded">
                        <span className="text-text-secondary text-xs font-medium">Logo</span>
                      </div>
                    )}
                    <p className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                      {sponsor.sponsors_profile.company_name}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
