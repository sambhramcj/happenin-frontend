export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative">
        <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
            <a href="/" className="text-lg font-semibold tracking-tight text-slate-900">
              <span className="bg-gradient-to-r from-purple-300 via-violet-200 to-fuchsia-300 bg-clip-text text-transparent">
                Happenin
              </span>
            </a>
            <a
              href="/"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Back to home
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 pb-16 pt-12">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-purple-600">
              Our story
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">About Happenin</h1>
            <p className="max-w-3xl text-base text-slate-700">
              Happenin started with a simple thought:
            </p>
            <blockquote className="max-w-3xl rounded-2xl border border-purple-200 bg-purple-50 p-5 text-base text-slate-800">
              College events are amazing — discovering and managing them shouldn’t be messy.
            </blockquote>
            <p className="max-w-3xl text-base text-slate-700">
              Every college has clubs, fests, workshops, competitions, and cultural nights happening all the time… but
              registrations are scattered, payments are confusing, links get lost, and organizers end up juggling
              spreadsheets at 2 AM. So we decided to fix that.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(124,58,237,0.25)]">
              <h2 className="text-xl font-semibold text-slate-900">What is Happenin?</h2>
              <p className="mt-3 text-slate-700">
                Happenin is a college-first event platform that helps students discover events easily and helps
                organizers run them smoothly.
              </p>
              <p className="mt-3 text-slate-700">
                From registrations and payments to volunteer hiring and certificates — everything lives in one place.
                No spam. No chaos. No “check this Google Form” messages at the last minute.
              </p>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Built for Students</h2>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                  <li>Discover what’s happening in your campus (and nearby colleges)</li>
                  <li>Register for events in seconds</li>
                  <li>Get digital tickets and QR codes</li>
                  <li>Track all your events in one place</li>
                  <li>Volunteer, participate, and build your college journey</li>
                </ul>
                <p className="mt-3 text-slate-700">No more hunting through WhatsApp groups.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-xl font-semibold text-slate-900">Built for Organizers &amp; Clubs</h2>
                <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                  <li>Create events effortlessly</li>
                  <li>Collect payments securely</li>
                  <li>Manage registrations without spreadsheets</li>
                  <li>Hire and manage volunteers</li>
                  <li>Track attendance using QR codes</li>
                  <li>Issue participation and volunteering certificates</li>
                </ul>
                <p className="mt-3 text-slate-700">So you can focus on the event — not the admin work.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Why We’re Different</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>College-only (designed around real campus workflows)</li>
                <li>Offline-friendly (because fest Wi-Fi never works)</li>
                <li>Secure (payments &amp; data handled properly)</li>
                <li>Built for scale (from club meets to full-scale college fests)</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Our Vision</h2>
              <p className="mt-3 text-slate-700">
                We want Happenin to become the default platform for college events across India — a place where every
                student’s college life, experiences, and contributions are captured.
              </p>
              <p className="mt-3 text-slate-700">
                Because college isn’t just about classes. It’s about everything that happens in between.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Who’s Behind Happenin?</h2>
              <p className="mt-3 text-slate-700">
                Happenin is being built by a college student who got tired of broken registration links, messy Excel
                sheets, and last-minute confusion — and decided to build something better.
              </p>
              <p className="mt-3 text-slate-700">
                This product is shaped directly by real campus experiences and constant feedback from students and
                organizers.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">One Last Thing</h2>
              <p className="mt-3 text-slate-700">
                We’re still early. We’re learning. And we’re building this with the college community.
              </p>
              <p className="mt-3 text-slate-700">
                If you have feedback, ideas, or want to bring Happenin to your campus — we’d love to hear from you.
                Reach out anytime via the Contact page.
              </p>
              <a
                href="/contact"
                className="mt-4 inline-flex w-fit items-center rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:border-purple-300 hover:bg-purple-100"
              >
                Contact us
              </a>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
