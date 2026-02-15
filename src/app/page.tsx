"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Users, TrendingUp, Zap, Shield, MapPin, Heart, Gift, ChevronDown, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { CollegeSelector } from "@/components/CollegeSelector";
import { BannerCarousel } from "@/components/BannerCarousel";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  price?: number;
  registrations?: number;
  image?: string;
  club?: string;
  time?: string;
  college?: string;
}

// Simple Event Card Component
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-lg"
    >
      {event.image && (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-40 object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(event.date)}
          </span>
          {event.price !== undefined && (
            <span className="font-semibold text-purple-600">
              {event.price === 0 ? "Free" : `₹${event.price}`}
            </span>
          )}
        </div>
        {event.location && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
            <MapPin className="w-4 h-4" />
            {event.location}
          </div>
        )}
      </div>
    </div>
  );
}

// Landing Page Component (Not used - kept for reference)
function LandingPageOld() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Happenin
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#clubs" className="text-gray-600 hover:text-gray-900">For Clubs</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
              <Link href="/auth" className="text-purple-600 hover:text-purple-700 font-medium">
                Log In
              </Link>
              <Link
                href="/auth"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Discover Every College Event.{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  In One Place.
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                Book tickets, explore fests, and never miss campus action again.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 font-semibold text-lg flex items-center justify-center gap-2 shadow-lg"
                >
                  Explore Events
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-white text-purple-600 border-2 border-purple-600 rounded-xl hover:bg-purple-50 font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Host Your Event
                  <Zap className="w-5 h-5" />
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                Trusted by <span className="font-bold">1000+ students</span> across{" "}
                <span className="font-bold">10+ colleges</span>
              </p>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Calendar className="w-32 h-32 text-purple-600 mx-auto" />
                  <p className="text-2xl font-bold text-gray-900">
                    Your Campus Events Hub
                  </p>
                </div>
              </div>
              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium">500+ Events</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium">Live Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              College life is chaotic. Event discovery shouldn't be.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Events scattered across WhatsApp
              </h3>
              <p className="text-gray-600">
                Juggling multiple group chats and losing track of event details
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Missed registrations
              </h3>
              <p className="text-gray-600">
                Registration deadlines pass by before you even know about the event
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Complicated ticket systems
              </h3>
              <p className="text-gray-600">
                Confusing Google Forms and uncertain payment confirmations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Happenin Does
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for campus events in one powerful platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto">
                <Heart className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Discover</h3>
              <p className="text-gray-600">
                Browse inter-college and intra-college events, fests, and workshops all in one feed
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center mx-auto">
                <Zap className="w-10 h-10 text-pink-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Register Instantly</h3>
              <p className="text-gray-600">
                Secure ticket booking with seamless payments via UPI, cards, and net banking
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto">
                <TrendingUp className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">For Clubs</h3>
              <p className="text-gray-600">
                Manage registrations, analytics, and payments in one centralized dashboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in seconds
            </p>
          </div>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-300 to-pink-300 transform -translate-x-1/2 hidden md:block"></div>
            
            {/* Steps */}
            <div className="space-y-16">
              {[
                {
                  step: 1,
                  title: "Open Happenin",
                  description: "Browse events from colleges near you",
                  icon: <Calendar className="w-8 h-8" />,
                },
                {
                  step: 2,
                  title: "Find an Event",
                  description: "Filter by category, date, or college",
                  icon: <MapPin className="w-8 h-8" />,
                },
                {
                  step: 3,
                  title: "Book & Attend",
                  description: "Secure your spot with instant confirmation",
                  icon: <Users className="w-8 h-8" />,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="flex-1 text-center md:text-right">
                    {index % 2 === 0 && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Step {item.step}: {item.title}
                        </h3>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                    {item.icon}
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    {index % 2 !== 0 && (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Step {item.step}: {item.title}
                        </h3>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Students Everywhere
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="p-6">
              <div className="text-5xl font-bold text-purple-600 mb-2">1000+</div>
              <p className="text-gray-600">Active Students</p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-pink-600 mb-2">10+</div>
              <p className="text-gray-600">Partner Colleges</p>
            </div>
            <div className="p-6">
              <div className="text-5xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">Events Hosted</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Clubs Section */}
      <section id="clubs" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold">
                Running a Fest? We Handle Everything.
              </h2>
              <ul className="space-y-4">
                {[
                  "Sell tickets with integrated payments",
                  "Track registrations in real-time",
                  "Boost visibility with sponsorships",
                  "Only 5% flat commission",
                  "QR-based attendance scanning",
                  "Automated certificate generation",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-lg">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-900 rounded-xl hover:bg-gray-100 font-semibold text-lg"
              >
                List Your Event
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="space-y-4">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 text-white mx-auto mb-4" />
                  <p className="text-2xl font-bold">All-in-One Platform</p>
                  <p className="text-white/80">Everything you need to run successful events</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/*Rewards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-yellow-50">
        <div className="max-w-7xl mx-auto text-center">
          <Gift className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Refer & Earn Rewards
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Invite friends and get exclusive benefits, early bird discounts, and fest passes
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 font-semibold text-lg shadow-lg"
          >
            Start Earning
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "Is Happenin free to use?",
                answer: "Yes! Browsing and discovering events is completely free. You only pay when you register for paid events.",
              },
              {
                question: "How does payment work?",
                answer: "We use Razorpay for secure payments. You can pay via UPI, cards, or net banking. Payments are instant and you receive confirmation immediately.",
              },
              {
                question: "Can any college join?",
                answer: "Yes! We're expanding to colleges across India. If your college isn't listed, contact us to get onboarded.",
              },
              {
                question: "What's your refund policy?",
                answer: "Refund eligibility depends on the event organizer's policy. Check the event details page for specific refund terms.",
              },
            ].map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <ChevronDown className="w-5 h-5 text-purple-600" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 ml-7">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-bold">
            Ready to Experience Campus Like Never Before?
          </h2>
          <p className="text-2xl text-white/90">
            Join thousands of students discovering and attending amazing events
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="px-10 py-5 bg-white text-purple-900 rounded-xl hover:bg-gray-100 font-bold text-xl shadow-2xl"
            >
              Get Started Now
            </Link>
            <Link
              href="/auth"
              className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 font-bold text-xl"
            >
              Host Your First Event
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Happenin</div>
              <p className="text-gray-400">
                Your campus events platform
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">For Students</a></li>
                <li><a href="#" className="hover:text-white">For Clubs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Happenin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
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
