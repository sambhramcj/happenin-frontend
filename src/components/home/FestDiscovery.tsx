"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PartyPopper, ArrowRight } from "lucide-react";

interface Fest {
  id: string;
  name: string;
  description: string;
  banner_image: string | null;
  start_date: string;
  end_date: string;
  categories: string[];
  colleges: {
    name: string;
    logo_url: string | null;
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

interface FestDiscoveryProps {
  selectedCollege: string;
}

export default function FestDiscovery({ selectedCollege }: FestDiscoveryProps) {
  const [fests, setFests] = useState<Fest[]>([]);
  const [fallbackEvents, setFallbackEvents] = useState<FallbackEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFests();
  }, [selectedCollege]);

  const fetchFests = async () => {
    try {
      const response = await fetch("/api/home/fest-discovery");
      const data = await response.json();
      const liveFests = data.fests || [];
      setFests(liveFests);

      if (!Array.isArray(liveFests) || liveFests.length === 0) {
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
          .slice(0, 3);

        setFallbackEvents(fallback);
      }
    } catch (error) {
      console.error("Error fetching fests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PartyPopper className="w-6 h-6 text-pink-500" />
          Fests
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-[300px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fests.length === 0) {
    if (fallbackEvents.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <PartyPopper className="w-6 h-6 text-pink-500" />
            Fests
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fallbackEvents.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group mobile-card-compact bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative aspect-[3/2] bg-gray-100 rounded-t-2xl overflow-hidden">
                {(event.banner_url || event.banner_image) && (
                  <Image
                    src={event.banner_url || event.banner_image || ""}
                    alt={event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
              </div>
              <div className="mobile-card-compact-content px-3.5 pt-3 pb-3.5">
                <p className="text-sm font-semibold leading-5 line-clamp-1 text-gray-900 dark:text-white">{event.title}</p>
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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PartyPopper className="w-6 h-6 text-pink-500" />
          Fests
        </h2>
        <Link
          href="/fests"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fests.map((fest) => (
          <Link
            key={fest.id}
            href={`/fests/${fest.id}`}
            className="group mobile-card-compact bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
          >
            <div className="relative aspect-[3/2] bg-gray-100 rounded-t-2xl overflow-hidden">
              {fest.banner_image && (
                <Image
                  src={fest.banner_image}
                  alt={fest.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>

            <div className="mobile-card-compact-content px-3.5 pt-3 pb-3.5">
              <div className="flex items-center gap-2.5">
                {fest.colleges?.logo_url ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image src={fest.colleges.logo_url} alt={fest.colleges.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    {(fest.colleges?.name || "F").charAt(0).toUpperCase()}
                  </div>
                )}
                <h4 className="font-semibold text-sm leading-5 line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{fest.name}</h4>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
