'use client';

import { ArrowRight, Calendar, Users, Zap, CheckCircle2, Sparkles, BarChart3, Shield, Heart, TrendingUp, MapPin, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

function LandingPage() {
  const router = useRouter();
  const primary = '#6D28D9';
  const primaryHover = '#5B21B6';
  const primarySoft = '#EDE9FE';
  const textPrimary = '#111827';
  const textSecondary = '#6B7280';
  const bgMuted = '#F9FAFB';

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: textPrimary }} className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <div className="text-2xl font-bold" style={{ color: primary }}>Happenin</div>
            <div className="flex gap-3 items-center">
              <button onClick={() => router.push('/auth')} style={{ color: textSecondary }} className="hover:font-semibold transition">Log In</button>
              <button onClick={() => router.push('/auth')} style={{ backgroundColor: primary, color: 'white' }} className="px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition">Sign Up</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4" style={{ backgroundColor: bgMuted }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full" style={{ backgroundColor: primarySoft }}>
                <span style={{ color: primary }} className="text-sm font-semibold">✨ The All-in-One Event Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ color: textPrimary }}>
                Discover Campus Events. Register Instantly.
              </h1>
              <p className="text-xl" style={{ color: textSecondary }}>Find inter-college fests, club meetings, and student events. Secure your spot with one click. Join thousands already using Happenin.</p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={() => router.push('/auth')} style={{ backgroundColor: primary }} className="px-8 py-3 text-white font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition">
                  Explore Events <ArrowRight className="w-5 h-5" />
                </button>
                <button onClick={() => router.push('/auth')} style={{ borderColor: primary, color: primary }} className="px-8 py-3 border-2 font-semibold rounded-lg hover:bg-gray-50 transition">
                  Host an Event
                </button>
              </div>
            </div>
            <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="rounded-2xl p-8 border">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: primarySoft }} className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <Users style={{ color: primary }} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">1000+ Students</div>
                    <div style={{ color: textSecondary }} className="text-sm">Active members</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: primarySoft }} className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <Calendar style={{ color: primary }} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">500+ Events</div>
                    <div style={{ color: textSecondary }} className="text-sm">Listed this year</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: primarySoft }} className="w-12 h-12 rounded-lg flex items-center justify-center">
                    <TrendingUp style={{ color: primary }} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">10+ Colleges</div>
                    <div style={{ color: textSecondary }} className="text-sm">Partner institutions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Why Happenin?</h2>
          <p style={{ color: textSecondary }} className="text-center text-lg max-w-2xl mx-auto mb-16">Students spend too much time searching for events. Clubs struggle with registrations. Happenin solves it all.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="p-8 rounded-xl border">
              <div style={{ backgroundColor: primarySoft }} className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <MapPin style={{ color: primary }} className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Events Scattered Everywhere</h3>
              <p style={{ color: textSecondary }}>Lost in WhatsApp groups? No single source of truth. Students miss events constantly.</p>
            </div>

            <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="p-8 rounded-xl border">
              <div style={{ backgroundColor: primarySoft }} className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock style={{ color: primary }} className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Complicated Registrations</h3>
              <p style={{ color: textSecondary }}>Google Forms, manual tracking, email confirmations. Confusing for everyone.</p>
            </div>

            <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="p-8 rounded-xl border">
              <div style={{ backgroundColor: primarySoft }} className="w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 style={{ color: primary }} className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">No Analytics or Insights</h3>
              <p style={{ color: textSecondary }}>Clubs can't track attendance or measure event success properly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section style={{ backgroundColor: bgMuted }} className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How Happenin Works</h2>
          <p style={{ color: textSecondary }} className="text-center text-lg mx-auto mb-16 max-w-2xl">Designed for simplicity. Built for scale.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div style={{ backgroundColor: primary }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">1</div>
              <h3 className="text-2xl font-bold mb-3">Students Discover</h3>
              <p style={{ color: textSecondary }}>Browse all college and inter-college events in one app. Filter by club, date, or type.</p>
            </div>

            <div className="text-center">
              <div style={{ backgroundColor: primary }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">2</div>
              <h3 className="text-2xl font-bold mb-3">One-Click Registration</h3>
              <p style={{ color: textSecondary }}>Register instantly with saved payment details. Get instant confirmation.</p>
            </div>

            <div className="text-center">
              <div style={{ backgroundColor: primary }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">3</div>
              <h3 className="text-2xl font-bold mb-3">Show Up & Enjoy</h3>
              <p style={{ color: textSecondary }}>Present your QR code at the event. Automatic certificate generation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Clubs */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold mb-4">For Club Organizers</h2>
                <p style={{ color: textSecondary }} className="text-lg">Stop using spreadsheets. Get powerful tools to manage events end-to-end.</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div style={{ backgroundColor: primarySoft }} className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 style={{ color: primary }} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">Accept Payments</div>
                    <div style={{ color: textSecondary }} className="text-sm">Razorpay integration for instant settlements</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div style={{ backgroundColor: primarySoft }} className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 style={{ color: primary }} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">Track Registrations</div>
                    <div style={{ color: textSecondary }} className="text-sm">Real-time dashboard with attendee analytics</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div style={{ backgroundColor: primarySoft }} className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 style={{ color: primary }} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">Manage Sponsors</div>
                    <div style={{ color: textSecondary }} className="text-sm">Sponsorship packages and verified payments</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div style={{ backgroundColor: primarySoft }} className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 style={{ color: primary }} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold">Auto Certificates</div>
                    <div style={{ color: textSecondary }} className="text-sm">Generate and distribute certificates instantly</div>
                  </div>
                </div>
              </div>

              <button onClick={() => router.push('/auth')} style={{ backgroundColor: primary }} className="px-8 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition inline-flex items-center gap-2">
                Start Listing Events <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div style={{ backgroundColor: bgMuted }} className="p-8 rounded-xl">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 border">
                    <Sparkles style={{ color: primary }} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">99% Uptime SLA</div>
                    <div style={{ color: textSecondary }} className="text-sm">Enterprise-grade reliability</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 border">
                    <Shield style={{ color: primary }} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">Bank-Level Security</div>
                    <div style={{ color: textSecondary }} className="text-sm">PCI-DSS compliant payments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ backgroundColor: bgMuted }} className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Transparent Pricing</h2>
          <p style={{ color: textSecondary }} className="text-lg mb-12">No hidden fees. Just success.</p>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }} className="p-8 rounded-xl border">
              <h3 className="text-2xl font-bold mb-4">For Students</h3>
              <div className="mb-6">
                <p style={{ color: textSecondary }} className="text-lg">Completely Free</p>
              </div>
              <ul style={{ color: textSecondary }} className="space-y-2 text-left">
                <li className="flex gap-2"><CheckCircle2 style={{ color: primary }} className="w-5 h-5 flex-shrink-0" /> Discover all events</li>
                <li className="flex gap-2"><CheckCircle2 style={{ color: primary }} className="w-5 h-5 flex-shrink-0" /> Book tickets instantly</li>
                <li className="flex gap-2"><CheckCircle2 style={{ color: primary }} className="w-5 h-5 flex-shrink-0" /> Get certificates</li>
              </ul>
            </div>

            <div style={{ backgroundColor: primary }} className="p-8 rounded-xl">
              <h3 className="text-2xl font-bold mb-4 text-white">For Organizers</h3>
              <div className="mb-6">
                <p className="text-white text-lg">5% Commission</p>
                <p style={{ color: primarySoft }} className="text-sm">Per successful ticket sale</p>
              </div>
              <ul style={{ color: primarySoft }} className="space-y-2 text-left text-sm">
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /> Instant settlements</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /> No setup fees</li>
                <li className="flex gap-2"><CheckCircle2 className="w-5 h-5 flex-shrink-0" /> 24/7 support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Frequently Asked</h2>
          <p style={{ color: textSecondary }} className="text-center mb-12">Get answers to common questions</p>

          <div className="space-y-4">
            <details style={{ backgroundColor: bgMuted }} className="rounded-lg p-6 cursor-pointer group">
              <summary className="font-semibold flex items-center justify-between">
                Is there a fee for students?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p style={{ color: textSecondary }} className="mt-4 text-sm">No, Happenin is completely free for students. There are no hidden charges for discovering or registering for events.</p>
            </details>

            <details style={{ backgroundColor: bgMuted }} className="rounded-lg p-6 cursor-pointer group">
              <summary className="font-semibold flex items-center justify-between">
                How long does refund processing take?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p style={{ color: textSecondary }} className="mt-4 text-sm">Refunds are processed within 7-10 business days. Organizers set their own cancellation and refund policies for each event.</p>
            </details>

            <details style={{ backgroundColor: bgMuted }} className="rounded-lg p-6 cursor-pointer group">
              <summary className="font-semibold flex items-center justify-between">
                Can my club list events?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p style={{ color: textSecondary }} className="mt-4 text-sm">Yes! Any registered club or student organization can list events. Sign up and start in minutes.</p>
            </details>

            <details style={{ backgroundColor: bgMuted }} className="rounded-lg p-6 cursor-pointer group">
              <summary className="font-semibold flex items-center justify-between">
                Which payment methods are supported?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p style={{ color: textSecondary }} className="mt-4 text-sm">We support UPI, credit/debit cards, net banking, and digital wallets via Razorpay integration.</p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: primary }} className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 text-white">Ready to Get Started?</h2>
          <p style={{ color: primarySoft }} className="text-lg mb-8">Join thousands of students and organizers using Happenin today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => router.push('/auth')} style={{ backgroundColor: 'white', color: primary }} className="px-8 py-3 font-semibold rounded-lg hover:opacity-90 transition">
              Explore Events Now
            </button>
            <button onClick={() => router.push('/auth')} style={{ borderColor: 'white', color: 'white' }} className="px-8 py-3 border-2 font-semibold rounded-lg hover:bg-white hover:bg-opacity-10 transition">
              List Your Event
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: textPrimary, color: 'white' }} className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold mb-3">Happenin</div>
              <p className="text-sm opacity-70">Making campus events accessible to everyone.</p>
            </div>
            <div>
              <div className="font-bold mb-3 text-sm">Company</div>
              <ul className="text-sm opacity-70 space-y-1">
                <li><button onClick={() => router.push('/about')} className="hover:opacity-100">About</button></li>
                <li><button onClick={() => router.push('/contact')} className="hover:opacity-100">Contact</button></li>
              </ul>
            </div>
            <div>
              <div className="font-bold mb-3 text-sm">Legal</div>
              <ul className="text-sm opacity-70 space-y-1">
                <li><button onClick={() => router.push('/privacy')} className="hover:opacity-100">Privacy</button></li>
                <li><button onClick={() => router.push('/terms')} className="hover:opacity-100">Terms</button></li>
              </ul>
            </div>
            <div>
              <div className="font-bold mb-3 text-sm">Social</div>
              <ul className="text-sm opacity-70 space-y-1">
                <li><a href="#" className="hover:opacity-100">Twitter</a></li>
                <li><a href="#" className="hover:opacity-100">Instagram</a></li>
              </ul>
            </div>
          </div>
          <div style={{ borderColor: 'rgba(255,255,255,0.1)' }} className="border-t pt-8 text-center text-sm opacity-70">
            <p>© 2026 Happenin. Making campus events accessible.</p>
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
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      if (userRole === 'organizer') {
        router.push('/dashboard/organizer');
      } else if (userRole === 'admin') {
        router.push('/dashboard/admin');
      } else if (userRole === 'sponsor') {
        router.push('/dashboard/sponsor');
      } else {
        router.push('/dashboard/student');
      }
    }
  }, [status, session, router]);

  if (status === 'loading' || session?.user) {
    return null;
  }

  return <LandingPage />;
}