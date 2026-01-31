"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { NearbyEvents } from "@/components/NearbyEvents";
import { NearbyColleges } from "@/components/NearbyColleges";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/skeletons";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  price: number;
  location: string;
  organizer_email: string;
}

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "free" | "paid">("all");
  const [activeTab, setActiveTab] = useState<"all" | "nearby" | "colleges">("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (filter === "free") return event.price === 0;
    if (filter === "paid") return event.price > 0;
    return true;
  });

  const handleRegister = (eventId: string) => {
    if (!session) {
      router.push("/auth");
      return;
    }
    router.push(`/dashboard/student?register=${eventId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => router.push("/")}
          className="text-2xl font-bold text-purple-600 dark:text-purple-400"
        >
          Happenin
        </button>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => router.push("/auth")}
            className="px-5 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 border border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 rounded-lg transition-all"
          >
            Login
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Browse upcoming workshops, fests, competitions, and cultural events
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === "all"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveTab("nearby")}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === "nearby"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            📍 Nearby Events
          </button>
          <button
            onClick={() => setActiveTab("colleges")}
            className={`px-6 py-3 font-medium transition-all border-b-2 ${
              activeTab === "colleges"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            🏫 Nearby Colleges
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "nearby" && <NearbyEvents />}
        {activeTab === "colleges" && <NearbyColleges />}
        {activeTab === "all" && (
          <>
            {/* Filters */}
            <div className="flex gap-3 mb-8">
              {["all", "free", "paid"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Loading events…</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <Skeleton className="w-2/3 h-6" variant="text" />
                      <Skeleton className="w-16 h-6 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-4" variant="text" />
                    <Skeleton className="w-5/6 h-4" variant="text" />
                    <div className="space-y-2">
                      <Skeleton className="w-1/2 h-4" variant="text" />
                      <Skeleton className="w-2/3 h-4" variant="text" />
                    </div>
                    <Skeleton className="w-full h-10 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-xl">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">
                      {event.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        event.price === 0
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {event.price === 0 ? "FREE" : `₹${event.price}`}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {event.location}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRegister(event.id)}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-medium rounded-lg transition-all shadow-sm"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
