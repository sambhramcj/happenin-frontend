"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Loader2 } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  banner_image: string | null;
  start_date: string;
  ticket_price: number | null;
  price: number | null;
  category: string | null;
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

      const response = await fetch(`/api/home/feed?${params.toString()}`);
      const data = await response.json();

      if (data.events && data.events.length > 0) {
        setEvents((prev) =>
          currentCursor === null ? data.events : [...prev, ...data.events]
        );
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-[300px] animate-pulse"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200"
          >
            {/* Banner */}
            <div className="relative h-44 bg-gray-100">
              {(event.banner_url || event.banner_image) && (
                <Image
                  src={event.banner_url || event.banner_image || ""}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              {event.category && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-gray-700">
                  {event.category}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                {new Date(event.start_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {(event.ticket_price || event.price) ? (
                  <span className="text-base font-bold text-green-600">
                    ₹{event.ticket_price || event.price}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-green-600">
                    Free
                  </span>
                )}

                {event.organizers_profile && (
                  <div className="flex items-center gap-1">
                    {event.organizers_profile.logo_url && (
                      <div className="relative w-5 h-5 rounded-full overflow-hidden">
                        <Image
                          src={event.organizers_profile.logo_url}
                          alt="Organizer"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs text-gray-600 truncate max-w-[100px]">
                      {event.organizers_profile.first_name}
                    </span>
                  </div>
                )}
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
