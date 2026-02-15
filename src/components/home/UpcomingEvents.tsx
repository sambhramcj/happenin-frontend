"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, ArrowRight } from "lucide-react";

interface Event {
  id: string;
  title: string;
  banner_url: string | null;
  banner_image: string | null;
  start_date: string;
  ticket_price: number | null;
  price: number | null;
  organizers_profile?: {
    first_name: string;
    last_name: string;
    logo_url: string | null;
  };
}

interface UpcomingEventsProps {
  selectedCollege: string;
}

export default function UpcomingEvents({ selectedCollege }: UpcomingEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingEvents();
  }, [selectedCollege]);

  const fetchUpcomingEvents = async () => {
    try {
      const response = await fetch("/api/home/upcoming");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Upcoming Events
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 bg-gray-100 rounded-xl h-[280px] animate-pulse"
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
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Upcoming Events
        </h2>
        <Link
          href="/events"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex-shrink-0 w-64 group"
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200">
              {/* Banner */}
              <div className="relative h-36 bg-gray-100">
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
              <div className="p-3 space-y-2">
                <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                {/* Price */}
                {(event.ticket_price || event.price) ? (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-base font-bold text-green-600">
                      ₹{event.ticket_price || event.price}
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-sm font-medium text-green-600">
                      Free
                    </span>
                  </div>
                )}

                {/* Organizer */}
                {event.organizers_profile && (
                  <div className="flex items-center gap-2 pt-2">
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
                    <span className="text-xs text-gray-600 truncate">
                      {event.organizers_profile.first_name}{" "}
                      {event.organizers_profile.last_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
