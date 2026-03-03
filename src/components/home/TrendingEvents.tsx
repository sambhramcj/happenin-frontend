"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

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
  registration_count?: number;
  college?: string | null;
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

  const getOrganizerName = (event: Event) => {
    const firstName = event.organizers_profile?.first_name || "";
    const lastName = event.organizers_profile?.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Organizer";
  };

  const fetchTrendingEvents = async () => {
    try {
      const response = await fetch("/api/home/trending");
      const data = await response.json();
      let list = data.events || [];

      if (!Array.isArray(list) || list.length === 0) {
        const fallbackResponse = await fetch("/api/events");
        const fallbackData = await fallbackResponse.json();
        const allEvents = Array.isArray(fallbackData) ? fallbackData : (fallbackData.events || []);
        const now = new Date();

        list = allEvents
          .map((event: any) => ({
            ...event,
            start_date: event.start_date || event.start_datetime || event.date || null,
            registration_count: Number(event.registration_count || event.registrations_count || 0),
          }))
          .filter((event: any) => {
            const eventDate = new Date(event.start_date || "");
            return !Number.isNaN(eventDate.getTime()) && eventDate >= now;
          })
          .filter((event: any) => selectedCollege === "all" || !event.college || event.college === selectedCollege)
          .sort((a: any, b: any) => Number(b.registration_count || 0) - Number(a.registration_count || 0))
          .slice(0, 5);
      }

      setEvents(list);
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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-64 md:w-52 bg-gray-100 rounded-2xl h-[300px] animate-pulse"
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

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {events.map((event, index) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group relative flex-shrink-0 w-64 md:w-52 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />#{index + 1}
            </div>

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
                    <Image src={event.organizers_profile.logo_url} alt={getOrganizerName(event)} fill className="object-cover" />
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
    </div>
  );
}
