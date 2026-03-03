"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award } from "lucide-react";

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

interface FallbackEvent {
  id: string;
  title: string;
  banner_url: string | null;
  banner_image: string | null;
  start_date?: string | null;
  start_datetime?: string | null;
  date?: string | null;
  college?: string | null;
}

interface SponsorSpotlightProps {
  selectedCollege: string;
}

export default function SponsorSpotlight({ selectedCollege }: SponsorSpotlightProps) {
  const [deals, setDeals] = useState<SponsorDeal[]>([]);
  const [fallbackEvents, setFallbackEvents] = useState<FallbackEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSponsoredContent();
  }, [selectedCollege]);

  useEffect(() => {
  }, []);

  const getSponsorName = (deal: SponsorDeal) =>
    deal.sponsors_profile?.company_name || "Sponsor";

  const fetchSponsoredContent = async () => {
    try {
      const response = await fetch("/api/home/sponsored");
      const data = await response.json();
      const liveDeals = data.deals || [];
      setDeals(liveDeals);

      if (!Array.isArray(liveDeals) || liveDeals.length === 0) {
        const fallbackResponse = await fetch("/api/events");
        const fallbackData = await fallbackResponse.json();
        const allEvents = Array.isArray(fallbackData) ? fallbackData : (fallbackData.events || []);
        const now = new Date();

        const fallback = allEvents
          .map((event: any) => ({
            ...event,
            start_date: event.start_date || event.start_datetime || event.date || null,
          }))
          .filter((event: any) => {
            const eventDate = new Date(event.start_date || "");
            return !Number.isNaN(eventDate.getTime()) && eventDate >= now;
          })
          .filter((event: any) => selectedCollege === "all" || !event.college || event.college === selectedCollege)
          .slice(0, 4);

        setFallbackEvents(fallback);
      }

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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-64 md:w-52 bg-gray-100 rounded-2xl h-[300px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (deals.length === 0) {
    if (fallbackEvents.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Sponsor Spotlight
          </h2>
          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
            Featured Picks
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {fallbackEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group flex-shrink-0 w-64 md:w-52 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative aspect-[4/5] bg-gray-100 rounded-t-2xl overflow-hidden">
                {(event.banner_url || event.banner_image) && (
                  <Image
                    src={event.banner_url || event.banner_image || ""}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="px-3.5 pt-3 pb-3.5">
                <p className="text-sm font-semibold leading-5 line-clamp-1">{event.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

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

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {deals.map((deal) => (
          <Link
            key={deal.id}
            href={`/events/${deal.events.id}`}
            onClick={() => handleSponsorClick(deal)}
            className="group flex-shrink-0 w-64 md:w-52 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
          >
            <div className="relative aspect-[4/5] bg-gray-100 rounded-t-2xl overflow-hidden">
              {(deal.events.banner_url || deal.events.banner_image) && (
                <Image
                  src={deal.events.banner_url || deal.events.banner_image || ""}
                  alt={deal.events.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>
            <div className="px-3.5 pt-3 pb-3.5">
              <div className="flex items-center gap-2.5">
                {deal.sponsors_profile?.logo_url ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image src={deal.sponsors_profile.logo_url} alt={getSponsorName(deal)} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                    {getSponsorName(deal).charAt(0).toUpperCase()}
                  </div>
                )}
                <h4 className="font-semibold text-sm leading-5 line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{deal.events.title}</h4>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
