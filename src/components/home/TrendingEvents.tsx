"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp, Calendar, MapPin, Users } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  banner_image: string | null;
  start_date: string;
  ticket_price: number | null;
  price: number | null;
  registration_count?: number;
  organizers_profile?: {
    first_name: string;
    last_name: string;
    logo_url: string | null;
  };
}

interface TrendingEventsProps {
  selectedCollege: string;
}

export default function TrendingEvents({ selectedCollege }: TrendingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTrendingEvents();
  }, [selectedCollege]);

  const fetchTrendingEvents = async () => {
    try {
      const response = await fetch("/api/home/trending");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching trending events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-500" />
          Trending Now
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-[280px] animate-pulse"
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
          <TrendingUp className="w-6 h-6 text-red-500" />
          Trending Now
        </h2>
        <p className="text-sm text-gray-500">
          Top events by registrations in your college
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event, index) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200"
          >
            {/* Trending Badge */}
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />#{index + 1}
            </div>

            {/* Banner Image */}
            <div className="relative h-40 bg-gray-100">
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
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {event.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.start_date).toLocaleDateString()}
                </div>
                {event.registration_count && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.registration_count} registered
                  </div>
                )}
              </div>

              {/* Price */}
              {(event.ticket_price || event.price) && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-lg font-bold text-green-600">
                    ₹{event.ticket_price || event.price}
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
