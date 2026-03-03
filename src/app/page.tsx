'use client';
import { ArrowRight, Calendar, Users, Zap, CheckCircle2, TrendingUp, MapPin, Clock, Search, CreditCard, QrCode, BarChart, Sparkles } from 'lucide-react';
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
  const bgMuted = '#F8FAFC';

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="text-2xl font-bold" style={{ color: primary }}>
            Happenin
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/events')}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              style={{ color: textPrimary }}
            >
              Explore
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="px-5 py-2 rounded-lg border font-semibold transition"
              style={{ backgroundColor: primarySoft, color: primary, borderColor: primary }}
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4" style={{ backgroundColor: bgMuted }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-white" style={{ borderColor: primary }}>
              <Sparkles className="w-4 h-4" style={{ color: primary }} />
              <span style={{ color: primary }} className="text-sm font-semibold">Campus Event OS</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight" style={{ color: textPrimary }}>
              Discover, register, and run college events—beautifully.
            </h1>

            <p className="text-lg lg:text-xl leading-relaxed" style={{ color: textSecondary }}>
              Happenin is the premium event platform for students, organizers, sponsors, and admins. From fests to workshops, every event journey lives in one reliable place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => router.push('/events')}
                style={{ backgroundColor: primary }}
                className="px-8 py-4 text-white text-base font-semibold rounded-xl flex items-center justify-center gap-3 hover:opacity-90 transition shadow-lg"
              >
                Browse Events <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push('/auth')}
                style={{ borderColor: primary, color: primary }}
                className="px-8 py-4 border-2 text-base font-semibold rounded-xl hover:bg-white transition"
              >
                Sign In to Dashboard
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6">
              <div>
                <p className="text-3xl font-bold" style={{ color: primary }}>Fast</p>
                <p className="text-sm" style={{ color: textSecondary }}>Registration & ticketing</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: primary }}>Secure</p>
                <p className="text-sm" style={{ color: textSecondary }}>Payments + access checks</p>
              </div>
              <div>
                <p className="text-3xl font-bold" style={{ color: primary }}>Unified</p>
                <p className="text-sm" style={{ color: textSecondary }}>Students to sponsors</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-sm">
            <h3 className="text-2xl font-bold mb-6" style={{ color: textPrimary }}>What Happenin gives you</h3>
            <div className="space-y-5">
              {[
                { icon: Search, title: 'Event Discovery', text: 'Find events by date, category, college, and trending signals.' },
                { icon: CreditCard, title: 'Seamless Registration', text: 'One-flow registration with ticketing and payment confirmation.' },
                { icon: QrCode, title: 'Faster Check-ins', text: 'QR-ready ticket flow for clean on-ground entry management.' },
                { icon: BarChart, title: 'Organizer Control', text: 'Manage events, volunteers, analytics, and announcements in one dashboard.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: primarySoft }}>
                    <item.icon className="w-5 h-5" style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: textPrimary }}>{item.title}</p>
                    <p className="text-sm" style={{ color: textSecondary }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4" style={{ color: textPrimary }}>Built for every campus role</h2>
            <p className="text-lg" style={{ color: textSecondary }}>
              One platform, role-specific value.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Students',
                icon: Users,
                points: ['Discover relevant events', 'Register in minutes', 'Track tickets and participation'],
              },
              {
                title: 'Organizers',
                icon: Calendar,
                points: ['Create rich event pages', 'Manage registrations and volunteers', 'Access event performance insights'],
              },
              {
                title: 'Sponsors',
                icon: TrendingUp,
                points: ['Promote through spotlight/banner placements', 'Track sponsored visibility', 'Support high-impact fests'],
              },
            ].map((role) => (
              <div key={role.title} className="border border-gray-200 rounded-2xl p-6 hover:border-purple-200 transition">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: primarySoft }}>
                  <role.icon className="w-5 h-5" style={{ color: primary }} />
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{role.title}</h3>
                <ul className="space-y-3">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5" style={{ color: primary }} />
                      <span className="text-sm" style={{ color: textSecondary }}>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4" style={{ backgroundColor: bgMuted }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4" style={{ color: textPrimary }}>Why people switch to Happenin</h2>
            <p className="text-lg" style={{ color: textSecondary }}>Clear process, less chaos, better turnout.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: 'No more scattered updates',
                text: 'Stop chasing posters, stories, and forwarded messages across apps.',
              },
              {
                icon: Clock,
                title: 'Faster execution',
                text: 'From listing to registration to check-in, flows are built for speed.',
              },
              {
                icon: Zap,
                title: 'Higher participation',
                text: 'Cleaner discovery and reminders help events fill up on time.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-7">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: primarySoft }}>
                  <item.icon className="w-6 h-6" style={{ color: primary }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4" style={{ color: textPrimary }}>How it works</h2>
            <p className="text-lg" style={{ color: textSecondary }}>Simple for students. Powerful for organizers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Search, title: 'Explore Events', text: 'Browse by category, college, and date to find what matters to you.' },
              { step: '02', icon: CreditCard, title: 'Register & Pay', text: 'Complete registration quickly with secure payment and instant confirmation.' },
              { step: '03', icon: QrCode, title: 'Check In Smoothly', text: 'Use your ticket for easy venue entry and participation tracking.' },
            ].map((item) => (
              <div key={item.step} className="border border-gray-200 rounded-2xl p-7">
                <p className="text-sm font-bold mb-4" style={{ color: primary }}>{item.step}</p>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: primarySoft }}>
                  <item.icon className="w-6 h-6" style={{ color: primary }} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-4" style={{ backgroundColor: primary }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-white">
            Ready to run better campus events?
          </h2>
          <p className="text-lg mb-9 text-purple-100">
            Whether you’re attending, hosting, or sponsoring—Happenin keeps the entire event journey clean and professional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/events')}
              className="px-8 py-4 bg-white text-base font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition shadow-lg"
              style={{ color: primary }}
            >
              Browse Events <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="px-8 py-4 bg-transparent border-2 border-white text-white text-base font-semibold rounded-xl hover:bg-white/10 transition"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <p className="text-2xl font-bold" style={{ color: primary }}>Happenin</p>
            <p className="text-sm text-gray-400 mt-1">Campus events, managed beautifully.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <button onClick={() => router.push('/events')} className="hover:text-white transition">Events</button>
            <button onClick={() => router.push('/terms')} className="hover:text-white transition">Terms</button>
            <button onClick={() => router.push('/privacy')} className="hover:text-white transition">Privacy</button>
            <button onClick={() => router.push('/contact')} className="hover:text-white transition">Contact</button>
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
