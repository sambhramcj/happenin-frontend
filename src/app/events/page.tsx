"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Calendar, MapPin, Users, Clock, TrendingUp, Sparkles, ChevronDown, ChevronLeft, ChevronRight, Flame } from "lucide-react";
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
}

interface Banner {
  id: string;
  image_url: string;
  redirect_url?: string;
  title?: string;
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
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [todayEvents, setTodayEvents] = useState<Event[]>([]);
  const [weekEvents, setWeekEvents] = useState<Event[]>([]);
  const [popularEvents, setPopularEvents] = useState<Event[]>([]);
  const [eventsTab, setEventsTab] = useState<"all" | "nearby">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  const primary = '#6D28D9';
  const primaryLight = '#EDE9FE';

  useEffect(() => {
    fetchEvents();
  }, [selectedCollege]);

  // Banner auto-advance
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      
      // Fetch colleges
      const collegesRes = await fetch('/api/colleges');
      const collegesData = await collegesRes.json();
      setColleges((collegesData.data || []).map((college: any) => college.name).filter(Boolean));

      // Fetch banners
      const bannersRes = await fetch('/api/home/banners');
      const bannersData = await bannersRes.json();
      const homeBanners = bannersData.banners || [];

      // Fetch events
      const res = await fetch("/api/events");
      const data = await res.json();
      const allEvents = Array.isArray(data) ? data : (data.events || []);
      setEvents(allEvents);

      // Fallback banners from event images when home banners are empty
      const eventBanners: Banner[] = allEvents
        .filter((event: Event) => Boolean(event.banner_image || event.banner_url))
        .slice(0, 5)
        .map((event: Event) => ({
          id: `event-${event.id}`,
          image_url: event.banner_image || event.banner_url || '',
          title: event.title,
          redirect_url: `/events/${event.id}`,
        }));

      setBanners(homeBanners.length > 0 ? homeBanners : eventBanners);

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

  const handleBannerClick = (banner: Banner) => {
    if (banner.redirect_url) {
      if (banner.redirect_url.startsWith('/')) {
        router.push(banner.redirect_url);
      } else {
        window.open(banner.redirect_url, '_blank');
      }
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

  const applyPriceFilter = (list: Event[]) =>
    list.filter((event) => {
      if (priceFilter === "free") return Number(event.price || event.ticket_price || 0) === 0;
      if (priceFilter === "paid") return Number(event.price || event.ticket_price || 0) > 0;
      return true;
    });

  const todayDisplay = applyPriceFilter(todayEvents).filter((event) => scopeEvents.some((s) => s.id === event.id));
  const weekDisplay = applyPriceFilter(weekEvents).filter((event) => scopeEvents.some((s) => s.id === event.id));
  const popularDisplay = applyPriceFilter(popularEvents).filter((event) => scopeEvents.some((s) => s.id === event.id));

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

          {banners.length > 0 ? (
            <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-2xl group shadow-xl">
              <div className="relative w-full h-full">
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={() => handleBannerClick(banner)}
                    style={{ cursor: banner.redirect_url ? 'pointer' : 'default' }}
                  >
                    <Image
                      src={banner.image_url}
                      alt={banner.title || 'Banner'}
                      fill
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>

              {banners.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentBannerIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentBannerIndex ? 'w-8 opacity-100' : 'opacity-50'
                        }`}
                        style={{ backgroundColor: 'white' }}
                      />
                    ))}
                  </div>
                </>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {todayDisplay.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="relative h-48" style={{ backgroundColor: primaryLight }}>
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
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">Today</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-lg line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{event.title}</h4>
                    <p className="text-sm line-clamp-2 text-gray-600 dark:text-gray-400">{event.description}</p>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold" style={{ color: primary }}>
                        {(event.price === 0 || event.ticket_price === 0) ? 'FREE' : `₹${event.price || event.ticket_price}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {weekDisplay.map((event) => {
                const eventDate = new Date(event.start_date || event.event_date || event.date || '');
                const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="relative h-48" style={{ backgroundColor: primaryLight }}>
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
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                          in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-lg line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{event.title}</h4>
                      <p className="text-sm line-clamp-2 text-gray-600 dark:text-gray-400">{event.description}</p>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm font-semibold" style={{ color: primary }}>
                          {(event.price === 0 || event.ticket_price === 0) ? 'FREE' : `₹${event.price || event.ticket_price}`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {popularDisplay.map((event, index) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="relative h-48" style={{ backgroundColor: primaryLight }}>
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
                    <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500 text-white">
                      <TrendingUp className="w-3 h-3" />
                      #{index + 1}
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-lg line-clamp-1 text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">{event.title}</h4>
                    <p className="text-sm line-clamp-2 text-gray-600 dark:text-gray-400">{event.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{(event.registration_count || event.registrations_count) || 0} registered</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-semibold" style={{ color: primary }}>
                        {(event.price === 0 || event.ticket_price === 0) ? 'FREE' : `₹${event.price || event.ticket_price}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
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
