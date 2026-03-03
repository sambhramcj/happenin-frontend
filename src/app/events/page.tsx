"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Calendar, MapPin, Clock, Sparkles, ChevronDown, Flame } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string;
  date?: string;
  event_date?: string;
  start_date?: string;
  price?: number;
  ticket_price?: number;
  location: string;
  organizer_email: string;
  category?: string;
  capacity?: number;
  registrations_count?: number;
  registration_count?: number;
  banner_url?: string;
  banner_image?: string;
  college?: string;
  organizers_profile?: {
    first_name?: string;
    last_name?: string;
    logo_url?: string | null;
  };
}

export default function EventsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dynamic content state
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [colleges, setColleges] = useState<string[]>([]);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [weekEvents, setWeekEvents] = useState<Event[]>([]);
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [eventsTab, setEventsTab] = useState<"all" | "nearby">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  const primary = '#6D28D9';
  const primaryLight = '#EDE9FE';

  useEffect(() => {
    fetchEvents();
  }, [selectedCollege]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch colleges
      const collegesRes = await fetch('/api/colleges');
      const collegesData = await collegesRes.json();
      setColleges((collegesData.data || []).map((college: any) => college.name).filter(Boolean));

      // Fetch events
      const res = await fetch("/api/events");
      const data = await res.json();
      const allEvents = Array.isArray(data) ? data : (data.events || []);
      setEvents(allEvents);

      // Filter events by college
      const filteredEvents = selectedCollege === 'all' 
        ? allEvents 
        : allEvents.filter((e: Event) => e.college === selectedCollege);

      // Today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysEvents = filteredEvents.filter((event: Event) => {
        const eventDate = new Date(event.start_date || event.event_date || event.date || '');
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });
      setTodayEvents(todaysEvents.slice(0, 6));

      // This week's events
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const thisWeeksEvents = filteredEvents.filter((event: Event) => {
        const eventDate = new Date(event.start_date || event.event_date || event.date || '');
        return eventDate >= today && eventDate <= weekFromNow;
      });
      setWeekEvents(thisWeeksEvents.slice(0, 6));

      // Popular events
      const popular = [...filteredEvents]
        .sort((a: Event, b: Event) => ((b.registration_count || b.registrations_count) || 0) - ((a.registration_count || a.registrations_count) || 0))
        .slice(0, 6);
      setPopularEvents(popular);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesCollege = selectedCollege === 'all' || event.college === selectedCollege;
    return matchesCollege;
  });

  const nearbyEvents = filteredEvents.filter((event) => {
    if (selectedCollege !== "all") return event.college === selectedCollege;
    const eventDate = new Date(event.start_date || event.event_date || event.date || "");
    const now = new Date();
    const oneWeek = new Date(now);
    oneWeek.setDate(oneWeek.getDate() + 7);
    return eventDate >= now && eventDate <= oneWeek;
  });

  const scopeEvents = eventsTab === "nearby" ? nearbyEvents : filteredEvents;

  const getEventDate = (event: Event) => new Date(event.start_date || event.event_date || event.date || "");

  const applyDateFilter = (list: Event[]) => {
    if (dateFilter === "all") return list;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const monthEnd = new Date(todayStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    return list.filter((event) => {
      const eventDate = getEventDate(event);
      if (Number.isNaN(eventDate.getTime())) return false;

      if (dateFilter === "today") return eventDate >= todayStart && eventDate < tomorrowStart;
      if (dateFilter === "week") return eventDate >= todayStart && eventDate <= weekEnd;
      if (dateFilter === "month") return eventDate >= todayStart && eventDate <= monthEnd;
      return true;
    });
  };

  const applyPriceFilter = (list: Event[]) =>
    list.filter((event) => {
      if (priceFilter === "free") return Number(event.price || event.ticket_price || 0) === 0;
      if (priceFilter === "paid") return Number(event.price || event.ticket_price || 0) > 0;
      return true;
    });

  const todayDisplay = applyDateFilter(applyPriceFilter(todayEvents)).filter((event) => scopeEvents.some((s) => s.id === event.id));
  const weekDisplay = applyDateFilter(applyPriceFilter(weekEvents)).filter((event) => scopeEvents.some((s) => s.id === event.id));
  const popularDisplay = applyDateFilter(applyPriceFilter(popularEvents)).filter((event) => scopeEvents.some((s) => s.id === event.id));
  const featuredDisplay = applyDateFilter(applyPriceFilter(scopeEvents))
    .filter((event) => Boolean(event.banner_url || event.banner_image))
    .slice(0, 6);

  const getOrganizerName = (event: Event) => {
    const firstName = event.organizers_profile?.first_name || '';
    const lastName = event.organizers_profile?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    if (fullName) return fullName;
    return event.organizer_email?.split('@')[0] || 'Organizer';
  };

  const renderEventCard = (event: Event) => (
    <Link
      key={event.id}
      href={`/events/${event.id}`}
      className="group mobile-card-compact flex-shrink-0 w-48 sm:w-56 md:w-64 bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="relative aspect-[4/5]" style={{ backgroundColor: primaryLight }}>
        {(event.banner_url || event.banner_image) ? (
          <Image
            src={event.banner_url || event.banner_image || ''}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-16 h-16 opacity-20" style={{ color: primary }} />
          </div>
        )}
      </div>
      <div className="mobile-card-compact-content p-2.5">
        <div className="flex items-center gap-2">
          {event.organizers_profile?.logo_url ? (
            <div className="relative h-5 w-5 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
              <Image src={event.organizers_profile.logo_url} alt={getOrganizerName(event)} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
              {getOrganizerName(event).charAt(0).toUpperCase()}
            </div>
          )}
          <h4 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{event.title}</h4>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4 w-full border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg shadow-sm">
        <button
          onClick={() => router.push("/")}
          className="hover:opacity-80 transition-opacity"
        >
          <img src="/branding/logo-wordmark-brand.svg" alt="Happenin" className="h-8 sm:h-9 w-auto" />
        </button>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />
          <button
            onClick={() => router.push("/auth")}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all hover:opacity-90 shadow-md hover:shadow-lg text-sm sm:text-base"
            style={{ backgroundColor: primary, color: 'white' }}
          >
            {session ? "Dashboard" : "Login"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Hero Section with College Selector */}
        <div className="mb-10 sm:mb-14">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8 mb-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ backgroundColor: primaryLight }}>
                <Sparkles className="w-4 h-4" style={{ color: primary }} />
                <span className="text-sm font-semibold" style={{ color: primary }}>Discover & Register</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-3">Discover Events</h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">Find workshops, fests, and cultural events happening across colleges</p>
            </div>
            
            <div className="relative w-full lg:w-auto">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-3 px-6 py-3.5 rounded-xl border-2 transition-all hover:shadow-md w-full sm:w-auto min-w-[240px]"
                style={{ backgroundColor: primaryLight, borderColor: primary }}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: primary }} />
                  <span className="text-sm font-bold truncate" style={{ color: primary }}>
                    {selectedCollege === 'all' ? 'All Colleges' : selectedCollege}
                  </span>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: primary }}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-full sm:w-80 bg-white dark:bg-gray-800 border-2 rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden" style={{ borderColor: primary }}>
                  <div className="p-3">
                    <button
                      onClick={() => {
                        setSelectedCollege('all');
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${
                        selectedCollege === 'all' ? 'font-bold' : 'font-medium'
                      }`}
                      style={selectedCollege === 'all' ? { backgroundColor: primaryLight, color: primary } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5" />
                        <span>All Colleges</span>
                      </div>
                    </button>
                    <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>
                    <div className="max-h-64 overflow-y-auto">
                      {colleges.map((college) => (
                        <button
                          key={college}
                          onClick={() => {
                            setSelectedCollege(college);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-5 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all ${
                            selectedCollege === college ? 'font-bold' : 'font-medium'
                          } text-gray-900 dark:text-white`}
                          style={selectedCollege === college ? { backgroundColor: primaryLight, color: primary } : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCollege === college ? primary : '#D1D5DB' }}></div>
                            <span className="text-sm">{college}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEventsTab("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${eventsTab === "all" ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300"}`}
              >
                All Events
              </button>
              <button
                onClick={() => setEventsTab("nearby")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${eventsTab === "nearby" ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300"}`}
              >
                Nearby
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
              {(["all", "free", "paid"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setPriceFilter(item)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priceFilter === item ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {item === "all" ? "All" : item === "free" ? "Free" : "Paid"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
              {([
                { key: "all", label: "All Dates" },
                { key: "today", label: "Today" },
                { key: "week", label: "This Week" },
                { key: "month", label: "This Month" },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  onClick={() => setDateFilter(item.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateFilter === item.key ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Carousel */}
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: primaryLight }}>
                <Sparkles style={{ color: primary }} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Featured</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Highlights from across campuses</p>
              </div>
            </div>
          </div>

          {featuredDisplay.length > 0 ? (
            <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide">
              {featuredDisplay.map((event) => renderEventCard(event))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-10 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">No featured banners yet.</p>
            </div>
          )}
        </section>

        {/* Happening Today Section */}
        <section className="mb-14 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: primaryLight }}>
                <Calendar style={{ color: primary }} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Happening Today</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Don't miss out on today's events</p>
              </div>
            </div>
          </div>
          {todayDisplay.length > 0 ? (
            <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide">
              {todayDisplay.map((event) => renderEventCard(event))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">No events scheduled for today.</p>
            </div>
          )}
        </section>

        {/* Upcoming This Week Section */}
        <section className="mb-14 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: primaryLight }}>
                <Clock style={{ color: primary }} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Upcoming This Week</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Plan ahead for this week's events</p>
              </div>
            </div>
          </div>
          {weekDisplay.length > 0 ? (
            <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide">
              {weekDisplay.map((event) => renderEventCard(event))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">No events scheduled for this week.</p>
            </div>
          )}
        </section>

        {/* Popular on Happenin Section */}
        <section className="mb-14 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl" style={{ backgroundColor: primaryLight }}>
                <Flame style={{ color: primary }} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Popular on Happenin</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Most registered events right now</p>
              </div>
            </div>
          </div>
          {popularDisplay.length > 0 ? (
            <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide">
              {popularDisplay.map((event) => renderEventCard(event))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">No popular events yet.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
