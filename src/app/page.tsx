'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ChevronDown, User, Briefcase } from 'lucide-react';
import { useTheme } from 'next-themes';
import { BannerCarousel } from '@/components/BannerCarousel';
import { CollegeSelector } from '@/components/CollegeSelector';

interface Event {
  id: string;
  title: string;
  club?: string;
  college?: string;
  date: string;
  time?: string;
  price: number;
  image?: string;
  registrations?: number;
}

// Event Card Component
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const router = useRouter();
  const { data: session } = useSession();

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session?.user) {
      router.push('/auth');
    } else {
      router.push(`/events/${event.id}/register`);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(147, 51, 234, 0.15)' }}
      className="bg-white rounded-2xl overflow-hidden border-2 border-gray-200 hover:border-purple-300 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="aspect-video bg-gray-100 relative">
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Calendar className="w-12 h-12" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
        {event.club && <p className="text-sm text-gray-600 mb-2">{event.club}</p>}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          </span>
          {event.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {event.time}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className={`font-semibold ${event.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {event.price === 0 ? 'FREE' : `₹${event.price}`}
          </span>
          <button
            onClick={handleRegister}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all"
          >
            Register
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Skeleton Loader
function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-4">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-8 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

// List Item Skeleton
function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
      <div className="w-16 h-16 bg-gray-200 rounded" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-16" />
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();
  const [selectedCollege, setSelectedCollege] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Ensure landing page is always light mode - MUST be first
  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  // Redirect logged-in users to their respective dashboards
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // @ts-ignore - role exists in session
      const userRole = session.user.role;
      if (userRole === 'organizer') {
        router.push('/dashboard/organizer');
      } else {
        router.push('/dashboard/student');
      }
    }
  }, [status, session, router]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchEvents();
    }
  }, [status]);

  // Don't render landing page for authenticated users
  if (status === 'loading') {
    return null;
  }

  if (session?.user) {
    return null;
  }

  const todayEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const trendingEvents = [...events]
    .sort((a, b) => (b.registrations || 0) - (a.registrations || 0))
    .slice(0, 6);

  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekFromNow;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Desktop Layout - Logo, College Selector, Login in one line */}
          <div className="hidden sm:flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Happenin</span>
            </div>

            {/* College Selector */}
            <div className="flex-1 max-w-xs">
              <CollegeSelector 
                value={selectedCollege}
                onChange={(collegeId, collegeName) => setSelectedCollege(collegeName)}
                placeholder="Select college..."
              />
            </div>

            {/* Login Button */}
            <button
              onClick={() => router.push('/auth')}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </button>
          </div>

          {/* Mobile Layout - Logo & Login in one line, College selector below */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center justify-between gap-3">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Happenin</span>
              </div>

              {/* Login Button */}
              <button
                onClick={() => router.push('/auth')}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            </div>

            {/* College Selector */}
            <CollegeSelector 
              value={selectedCollege}
              onChange={(collegeId, collegeName) => setSelectedCollege(collegeName)}
              placeholder="Select college..."
            />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200 w-full">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 relative overflow-x-hidden">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 border border-purple-200 rounded-full mb-6">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
              <span className="text-purple-800 font-semibold text-sm">Live events happening now</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black mb-4 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 bg-clip-text text-transparent">
                What's happening
              </span>
              <br />
              <span className="text-gray-900">in your campus today</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover events, workshops, fests & competitions
            </p>
          </div>
        </div>
      </section>

      {/* Promotional Banners - Top */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <BannerCarousel placement="home_top" maxBanners={3} />
      </section>

      {/* Happening Today */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-x-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full" />
          <h2 className="text-3xl font-bold text-gray-900">Happening Today</h2>
        </div>
        
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[280px] sm:min-w-[320px]">
                <EventCardSkeleton />
              </div>
            ))}
          </div>
        ) : todayEvents.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {todayEvents.map(event => (
              <div key={event.id} className="min-w-[280px] sm:min-w-[320px]">
                <EventCard 
                  event={event} 
                  onClick={() => router.push(`/events/${event.id}`)} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events listed yet. Check back soon.</p>
          </div>
        )}
      </section>

      {/* Trending in Your College */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-x-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full" />
          <h2 className="text-3xl font-bold text-gray-900">Trending in Your College</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : trendingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingEvents.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => router.push(`/events/${event.id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events listed yet. Check back soon.</p>
          </div>
        )}
      </section>

      {/* Upcoming This Week */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-purple-400 rounded-full" />
          <h2 className="text-3xl font-bold text-gray-900">Upcoming This Week</h2>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <ListItemSkeleton key={i} />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <motion.div
                key={event.id}
                whileHover={{ x: 4 }}
                className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 hover:shadow-md transition-all"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-8 h-8 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                    {event.college && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{event.college}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`font-semibold ${event.price === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {event.price === 0 ? 'FREE' : `₹${event.price}`}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-text-secondary">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events listed yet. Check back soon.</p>
          </div>
        )}
      </section>

      {/* Promotional Banners - Mid Page */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <BannerCarousel placement="home_mid" maxBanners={2} />
      </section>


      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-white font-bold">H</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">Happenin</span>
            </div>
            <div className="flex flex-wrap gap-8 text-sm text-gray-600">
              <a href="/about" className="hover:text-purple-600 visited:text-gray-600 transition-colors font-medium">About</a>
              <a href="/contact" className="hover:text-purple-600 visited:text-gray-600 transition-colors font-medium">Contact</a>
              <a href="/privacy" className="hover:text-purple-600 visited:text-gray-600 transition-colors font-medium">Privacy Policy</a>
              <a href="/terms" className="hover:text-purple-600 visited:text-gray-600 transition-colors font-medium">Terms</a>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500">
            © 2026 Happenin Technologies. Making campus events accessible.
          </div>
        </div>
      </footer>
    </main>
  );
}
