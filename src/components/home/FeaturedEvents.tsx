"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Calendar, TrendingUp } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  banner_image: string | null;
  start_date: string;
  ticket_price: number | null;
  price: number | null;
  boost_priority: number;
  organizers_profile?: {
    first_name: string;
    last_name: string;
    logo_url: string | null;
  };
}

interface FeaturedEventsProps {
  selectedCollege: string;
}

export default function FeaturedEvents({ selectedCollege }: FeaturedEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedEvents();
  }, [selectedCollege]);

  useEffect(() => {
  }, []);

  const fetchFeaturedEvents = async () => {
    try {
      const response = await fetch("/api/home/featured");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching featured events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Featured Events
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-[300px] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Featured Events
        </h2>
        <span className="text-xs text-gray-400 px-2 py-1 bg-purple-50 rounded border border-purple-200">
          Boosted Visibility
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border-2 border-purple-200"
          >
            {/* Featured Badge */}
            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3 h-3" />
              Featured
            </div>

            {/* Banner Image */}
            <div className="relative h-48 bg-gray-100">
              {(event.banner_url || event.banner_image) && (
                <Image
                  src={event.banner_url || event.banner_image || ""}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-lg line-clamp-1 group-hover:text-purple-600 transition-colors">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {(event.ticket_price || event.price) && (
                  <span className="font-bold text-green-600 text-base">
                    ₹{event.ticket_price || event.price}
                  </span>
                )}
              </div>

              {/* Organizer Info */}
              {event.organizers_profile && (
                <div className="flex items-center gap-2 pt-2 border-t border-purple-100">
                  {event.organizers_profile.logo_url && (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden">
                      <Image
                        src={event.organizers_profile.logo_url}
                        alt="Organizer"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-xs text-gray-600">
                    By {event.organizers_profile.first_name}{" "}
                    {event.organizers_profile.last_name}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
