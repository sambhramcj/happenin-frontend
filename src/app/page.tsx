'use client';
import { ArrowRight, Calendar, Users, Zap, CheckCircle2, TrendingUp, MapPin, Clock, Search, CreditCard, QrCode, BarChart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

function LandingPage() {
  const router = useRouter();
  const primary = '#6D28D9';
  const primarySoft = '#EDE9FE';
  const textPrimary = '#111827';
  const textSecondary = '#6B7280';
  const bgMuted = '#F9FAFB';

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: primary }}>Happenin</div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/auth')} className="text-gray-600 hover:text-gray-900 font-medium">Login</button>
            <button onClick={() => router.push('/auth')} style={{ backgroundColor: primary }} className="px-6 py-2 text-white font-semibold rounded-lg hover:opacity-90 transition">Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4" style={{ backgroundColor: bgMuted }}>
        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">
              <div className="inline-block px-4 py-2 rounded-full border" style={{ backgroundColor: 'white', borderColor: primary }}>
                <span style={{ color: primary }} className="text-sm font-semibold">Campus Events Made Simple</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight" style={{ color: textPrimary }}>
                Your Campus Events, All in One Place
              </h1>
              <p className="text-xl lg:text-2xl leading-relaxed" style={{ color: textSecondary }}>
                Discover inter-college fests, workshops, and cultural events. Register with one click. Never miss what's happening on campus.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => router.push('/events')} 
                  style={{ backgroundColor: primary }} 
                  className="px-10 py-4 text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition shadow-lg"
                >
                  Browse Events <ArrowRight className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => router.push('/auth')} 
                  style={{ borderColor: primary, color: primary }} 
                  className="px-10 py-4 border-2 text-lg font-semibold rounded-xl hover:bg-white transition"
                >
                  Create Event
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div>
                  <div className="text-3xl font-bold" style={{ color: primary }}>1000+</div>
                  <div className="text-sm" style={{ color: textSecondary }}>Active Students</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{ color: primary }}>500+</div>
                  <div className="text-sm" style={{ color: textSecondary }}>Events Listed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold" style={{ color: primary }}>10+</div>
                  <div className="text-sm" style={{ color: textSecondary }}>Colleges</div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: textPrimary }}>Everything you need in one app</h2>
            <p className="text-xl" style={{ color: textSecondary }}>Simplified event discovery and management for students and organizers</p>
          </div>

          {/* Feature 1 - Browse Events */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: primarySoft }}>
                <Search className="w-4 h-4" style={{ color: primary }} />
                <span style={{ color: primary }} className="text-sm font-semibold">Discover</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold" style={{ color: textPrimary }}>Find Events That Matter</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                Browse through hundreds of campus events, filter by college, category, and date. Get personalized recommendations based on your interests.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Search across all colleges and events</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Filter by category, price, and location</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>See what's trending and happening today</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2 - Quick Registration */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: primarySoft }}>
                <Zap className="w-4 h-4" style={{ color: primary }} />
                <span style={{ color: primary }} className="text-sm font-semibold">Register</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold" style={{ color: textPrimary }}>One-Click Registration</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                No more form filling hassles. Register for events instantly with secure payments and get your tickets delivered immediately.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Secure Razorpay payment integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Instant ticket generation with QR codes</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Email confirmations and reminders</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 3 - Manage Events */}
          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: primarySoft }}>
                <BarChart className="w-4 h-4" style={{ color: primary }} />
                <span style={{ color: primary }} className="text-sm font-semibold">Organize</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold" style={{ color: textPrimary }}>Built for Organizers</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                Powerful dashboard to create events, manage registrations, track sales, and analyze attendee data. Everything you need to run successful events.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Create and customize event pages</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>Real-time registration tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: primary }} />
                  <span style={{ color: textSecondary }}>QR code check-in system</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4" style={{ backgroundColor: bgMuted }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: textPrimary }}>The Old Way is Broken</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: textSecondary }}>
              Finding and registering for campus events shouldn't be this complicated
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-200 transition">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: primarySoft }}>
                <MapPin style={{ color: primary }} className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>Scattered Information</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                WhatsApp groups, Instagram stories, and random posters. Where do you even start looking?
              </p>
            </div>
            <div className="p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-200 transition">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: primarySoft }}>
                <Clock style={{ color: primary }} className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>Messy Registration</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                Google Forms, manual entries, payment screenshot chaos. Registration takes forever.
              </p>
            </div>
            <div className="p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-purple-200 transition">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: primarySoft }}>
                <Users style={{ color: primary }} className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>Missing Out</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                By the time you hear about the event, registrations are already closed or full.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: textPrimary }}>How Happenin Works</h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: textSecondary }}>
              Three simple steps to never miss an event again
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primary }}>
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primarySoft }}>
                <Search style={{ color: primary }} className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>Browse Events</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                Discover events from all colleges in one feed. Filter by interest, date, and location.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primary }}>
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primarySoft }}>
                <CreditCard style={{ color: primary }} className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>Register Instantly</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                One-click registration with secure payment. Get your ticket instantly via email.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primary }}>
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: primarySoft }}>
                <QrCode style={{ color: primary }} className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: textPrimary }}>Attend Event</h3>
              <p className="text-lg leading-relaxed" style={{ color: textSecondary }}>
                Show your QR code ticket at the venue for instant check-in. That's it!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - removed, replaced by features above */}

      {/* CTA Section */}
      <section className="py-32 px-4" style={{ backgroundColor: primary }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Campus Experience?
          </h2>
          <p className="text-xl mb-10 text-purple-100">
            Join thousands of students already using Happenin to discover and attend amazing events
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => router.push('/events')} 
              className="px-10 py-4 bg-white text-lg font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition shadow-lg"
              style={{ color: primary }}
            >
              Browse Events <ArrowRight className="w-6 h-6" />
            </button>
            <button 
              onClick={() => router.push('/auth')} 
              className="px-10 py-4 bg-transparent border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="text-3xl font-bold mb-4" style={{ color: primary }}>Happenin</div>
              <p className="text-gray-400 text-lg mb-6">
                The all-in-one platform for discovering and managing campus events across India.
              </p>
              <div className="flex gap-4">
                <button className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
                  <span className="text-gray-400">X</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
                  <span className="text-gray-400">in</span>
                </button>
                <button className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition">
                  <span className="text-gray-400">ig</span>
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-3">
                <li><button onClick={() => router.push('/events')} className="text-gray-400 hover:text-white transition">Browse Events</button></li>
                <li><button onClick={() => router.push('/auth')} className="text-gray-400 hover:text-white transition">Create Event</button></li>
                <li><button onClick={() => router.push('/auth')} className="text-gray-400 hover:text-white transition">Pricing</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                <li><button onClick={() => router.push('/about')} className="text-gray-400 hover:text-white transition">About</button></li>
                <li><button onClick={() => router.push('/contact')} className="text-gray-400 hover:text-white transition">Contact</button></li>
                <li><button onClick={() => router.push('/contact')} className="text-gray-400 hover:text-white transition">Support</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-lg mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><button onClick={() => router.push('/terms')} className="text-gray-400 hover:text-white transition">Terms</button></li>
                <li><button onClick={() => router.push('/privacy')} className="text-gray-400 hover:text-white transition">Privacy</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500">© 2026 Happenin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('light');
  }, [setTheme]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user) {
      const role = (session.user as any).role;
      if (role === 'student') router.push('/dashboard/student');
      else if (role === 'organizer') router.push('/dashboard/organizer');
      else if (role === 'admin') router.push('/dashboard/admin');
      else if (role === 'sponsor') router.push('/dashboard/sponsor');
    }
  }, [session, status, router]);

  if (status === 'loading' || session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return <LandingPage />;
}
