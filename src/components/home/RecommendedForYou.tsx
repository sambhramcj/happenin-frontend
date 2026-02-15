"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Calendar, MapPin } from "lucide-react";

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

interface RecommendedForYouProps {
  selectedCollege: string;
}

export default function RecommendedForYou({ selectedCollege }: RecommendedForYouProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedEvents();
  }, [selectedCollege]);

  const fetchRecommendedEvents = async () => {
    try {
      const response = await fetch("/api/home/recommended");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching recommended events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Recommended For You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-xl h-[200px] animate-pulse"
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
          <Heart className="w-5 h-5 text-pink-500" />
          Recommended For You
        </h2>
        <p className="text-xs text-gray-500">
          Based on your interests and activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group flex gap-4 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200"
          >
            {/* Banner */}
            <div className="relative w-32 h-full flex-shrink-0 bg-gray-100">
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
            <div className="flex-1 p-4 space-y-2">
              <div>
                <h3 className="font-semibold line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {event.description}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(event.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {event.category && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                    {event.category}
                  </span>
                )}
              </div>

              {/* Price/Organizer Row */}
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
                      <div className="relative w-4 h-4 rounded-full overflow-hidden">
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
    </div>
  );
}
