"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  banner_image: string | null;
  start_date: string;
  start_datetime?: string | null;
  date?: string | null;
  ticket_price: number | null;
  price: number | null;
  category: string | null;
  college?: string | null;
  organizers_profile?: {
    first_name: string;
    last_name: string;
    logo_url: string | null;
  };
}

interface InfiniteEventFeedProps {
  selectedCategory: string;
  selectedCollege: string;
}

export default function InfiniteEventFeed({
  selectedCategory,
  selectedCollege,
}: InfiniteEventFeedProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const getEventStartDate = (event: Event | any) => {
    const rawDate = event.start_date || event.start_datetime || event.date || "";
    return new Date(rawDate);
  };

  const sortEventsUpcomingFirst = (list: Event[]) => {
    const now = Date.now();

    return [...list].sort((a, b) => {
      const aDate = getEventStartDate(a);
      const bDate = getEventStartDate(b);

      const aValid = !Number.isNaN(aDate.getTime());
      const bValid = !Number.isNaN(bDate.getTime());

      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;

      const aTime = aDate.getTime();
      const bTime = bDate.getTime();

      const aUpcoming = aTime >= now;
      const bUpcoming = bTime >= now;

      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      if (aUpcoming && bUpcoming) return aTime - bTime;
      return bTime - aTime;
    });
  };

  const getOrganizerName = (event: Event) => {
    const firstName = event.organizers_profile?.first_name || "";
    const lastName = event.organizers_profile?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Organizer";
  };

  // Reset when category changes
  useEffect(() => {
    setEvents([]);
    setCursor(null);
    setHasMore(true);
    fetchEvents(null, selectedCategory);
  }, [selectedCategory]);

  const fetchEvents = async (
    currentCursor: string | null,
    category: string
  ) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentCursor) params.append("cursor", currentCursor);
      if (category !== "all") params.append("category", category);
      if (selectedCollege === "all") params.append("scope", "all");

      const response = await fetch(`/api/home/feed?${params.toString()}`);
      const data = await response.json();

      if (response.ok && Array.isArray(data.events) && data.events.length > 0) {
        const normalizedIncoming = (data.events || []).map((event: any) => ({
          ...event,
          start_date: event.start_date || event.start_datetime || event.date || null,
        }));

        setEvents((prev) =>
          sortEventsUpcomingFirst(
            currentCursor === null
              ? normalizedIncoming
              : [...prev, ...normalizedIncoming]
          )
        );
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } else {
        // First-page fallback: use /api/events if feed endpoint returns empty/error
        if (currentCursor === null) {
          const fallbackResponse = await fetch("/api/events");
          const fallbackData = await fallbackResponse.json();
          const allEvents = Array.isArray(fallbackData)
            ? fallbackData
            : (fallbackData.events || []);

          const fallbackList = allEvents
            .map((event: any) => ({
              ...event,
              start_date: event.start_date || event.start_datetime || event.date || null,
            }))
            .filter((event: any) => selectedCollege === "all" || !event.college || event.college === selectedCollege)
            .filter((event: any) => category === "all" || event.category === category)
            .slice(0, 120);

          const sortedFallback = sortEventsUpcomingFirst(fallbackList).slice(0, 20);

          if (sortedFallback.length > 0) {
            setEvents(sortedFallback);
            setCursor(null);
            setHasMore(false);
          } else {
            setHasMore(false);
          }
        } else {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error fetching feed events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchEvents(cursor, selectedCategory);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [cursor, hasMore, isLoading, selectedCategory]);

  if (events.length === 0 && isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">All Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl h-[300px] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">All Events</h2>
        <div className="text-center py-12 text-gray-500">
          <p>No events found for the selected category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        {selectedCategory === "all"
          ? "All Events"
          : `${selectedCategory} Events`}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
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
              <div className="flex items-center gap-2.5">
                {event.organizers_profile?.logo_url ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image
                      src={event.organizers_profile.logo_url}
                      alt={getOrganizerName(event)}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    {getOrganizerName(event).charAt(0).toUpperCase()}
                  </div>
                )}
                <h4 className="font-semibold text-sm leading-5 line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{event.title}</h4>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={observerTarget} className="py-8 text-center">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading more events...
          </div>
        )}
        {!hasMore && events.length > 0 && (
          <p className="text-gray-500">You've reached the end!</p>
        )}
      </div>
    </div>
  );
}
