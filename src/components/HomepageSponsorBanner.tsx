'use client';

import { useEffect, useState } from 'react';

interface SponsorDeal {
  id: string;
  sponsors_profile: {
    company_name: string;
    logo_url?: string;
    website_url?: string;
  };
}

interface HomepageSponsorBannerProps {
  maxSponsors?: number;
}

export function HomepageSponsorBanner({ maxSponsors = 5 }: HomepageSponsorBannerProps) {
  const [sponsors, setSponsors] = useState<SponsorDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      const res = await fetch('/api/sponsorship/public?placement=homepage');
      const data = await res.json();
      if (res.ok && data.deals) {
        setSponsors(data.deals.slice(0, maxSponsors));
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

  return (
    <section className="py-12 bg-gradient-to-r from-bg-card via-bg-muted to-bg-card border-t border-b border-border-default">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-2">Proudly Powered By</h2>
          <p className="text-text-secondary text-sm">Our premium partners making events better</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8">
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.sponsors_profile.website_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-transform hover:scale-105"
              title={sponsor.sponsors_profile.company_name}
            >
              {sponsor.sponsors_profile.logo_url ? (
                <img
                  src={sponsor.sponsors_profile.logo_url}
                  alt={sponsor.sponsors_profile.company_name}
                  className="h-12 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="px-4 py-2 bg-bg-muted rounded-lg text-text-secondary text-sm font-medium group-hover:bg-border-default transition-colors">
                  {sponsor.sponsors_profile.company_name}
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
