"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PartyPopper, Calendar, MapPin, ArrowRight } from "lucide-react";

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

interface FestDiscoveryProps {
  selectedCollege: string;
}

export default function FestDiscovery({ selectedCollege }: FestDiscoveryProps) {
  const [fests, setFests] = useState<Fest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFests();
  }, [selectedCollege]);

  const fetchFests = async () => {
    try {
      const response = await fetch("/api/home/fest-discovery");
      const data = await response.json();
      setFests(data.fests || []);
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
          Active Fests
        </h2>
        <div className="bg-gray-100 rounded-xl h-[300px] animate-pulse" />
      </div>
    );
  }

  if (fests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <PartyPopper className="w-6 h-6 text-pink-500" />
          Active Fests
        </h2>
        <Link
          href="/fests"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-4">
        {fests.map((fest) => (
          <div
            key={fest.id}
            className="relative bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-xl overflow-hidden border-2 border-pink-200 shadow-md hover:shadow-xl transition-all"
          >
            {/* Banner Background */}
            {fest.banner_image && (
              <div className="absolute inset-0 opacity-20">
                <Image
                  src={fest.banner_image}
                  alt={fest.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="relative p-6">
              <div className="flex items-start gap-6">
                {/* College Logo */}
                {fest.colleges.logo_url && (
                  <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded-lg p-2 shadow-md">
                    <Image
                      src={fest.colleges.logo_url}
                      alt={fest.colleges.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {fest.name}
                      </h3>
                      <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded-full animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {fest.colleges.name}
                    </p>
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-2">
                    {fest.description}
                  </p>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(fest.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    -{" "}
                    {new Date(fest.end_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  {/* Categories */}
                  {fest.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {fest.categories.slice(0, 5).map((category) => (
                        <span
                          key={category}
                          className="px-3 py-1 bg-white/80 text-gray-700 text-xs rounded-full border border-gray-200"
                        >
                          {category}
                        </span>
                      ))}
                      {fest.categories.length > 5 && (
                        <span className="px-3 py-1 bg-white/80 text-gray-500 text-xs rounded-full border border-gray-200">
                          +{fest.categories.length - 5} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href={`/fests/${fest.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all font-medium text-sm shadow-md"
                  >
                    Explore Events
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
