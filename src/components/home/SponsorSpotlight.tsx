"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, ExternalLink } from "lucide-react";

interface SponsorDeal {
  id: string;
  events: {
    id: string;
    title: string;
    banner_url: string | null;
    banner_image: string | null;
  };
  sponsors_profile: {
    company_name: string;
    logo_url: string | null;
    banner_url: string | null;
    industry: string | null;
  };
}

interface SponsorSpotlightProps {
  selectedCollege: string;
}

export default function SponsorSpotlight({ selectedCollege }: SponsorSpotlightProps) {
  const [deals, setDeals] = useState<SponsorDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchSponsoredContent();
  }, [selectedCollege]);

  useEffect(() => {
  }, []);

  useEffect(() => {
    if (deals.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % deals.length);
    }, 8000); // Auto-advance every 8 seconds

    return () => clearInterval(interval);
  }, [deals.length]);

  const fetchSponsoredContent = async () => {
    try {
      const response = await fetch("/api/home/sponsored");
      const data = await response.json();
      setDeals(data.deals || []);

      // Track impressions for analytics
      if (data.deals && data.deals.length > 0) {
        // TODO: Track sponsor impressions
      }
    } catch (error) {
      console.error("Error fetching sponsored content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSponsorClick = (deal: SponsorDeal) => {
    // TODO: Track sponsor click analytics
    console.log("Sponsor clicked:", deal.sponsors_profile.company_name);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Sponsor Spotlight
        </h2>
        <div className="bg-gray-100 rounded-xl h-[200px] animate-pulse" />
      </div>
    );
  }

  if (deals.length === 0) {
    return null;
  }

  const currentDeal = deals[currentIndex];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Sponsor Spotlight
        </h2>
        <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
          Sponsored
        </span>
      </div>

      <div className="relative bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl overflow-hidden border border-yellow-200">
        <div className="relative h-[200px] overflow-hidden">
          {/* Sponsor Banner */}
          {currentDeal.sponsors_profile.banner_url && (
            <Image
              src={currentDeal.sponsors_profile.banner_url}
              alt={currentDeal.sponsors_profile.company_name}
              fill
              className="object-cover opacity-40"
            />
          )}

          {/* Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center p-6">
            <div className="flex items-center gap-6 text-white">
              {/* Sponsor Logo */}
              {currentDeal.sponsors_profile.logo_url && (
                <div className="relative w-20 h-20 bg-white rounded-lg p-2 flex-shrink-0">
                  <Image
                    src={currentDeal.sponsors_profile.logo_url}
                    alt={currentDeal.sponsors_profile.company_name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">
                    {currentDeal.sponsors_profile.company_name}
                  </h3>
                  {currentDeal.sponsors_profile.industry && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      {currentDeal.sponsors_profile.industry}
                    </span>
                  )}
                </div>
                <p className="text-sm opacity-90">
                  Proudly sponsoring {currentDeal.events.title}
                </p>

                <Link
                  href={`/events/${currentDeal.events.id}`}
                  onClick={() => handleSponsorClick(currentDeal)}
                  className="inline-flex items-center gap-2 text-sm bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  View Event
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        {deals.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1">
            {deals.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-yellow-500 w-6"
                    : "bg-yellow-300 hover:bg-yellow-400"
                }`}
                aria-label={`Go to sponsor ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
