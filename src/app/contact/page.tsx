export default function ContactPage() {
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
              Support
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Contact Us</h1>
            <p className="max-w-3xl text-base text-slate-700">
              Got a question? Found a bug? Planning an event? We’re here to help.
            </p>
            <p className="max-w-3xl text-base text-slate-700">
              At Happenin, we believe good communication keeps events running smoothly — so don’t hesitate to reach out.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(124,58,237,0.25)]">
              <h2 className="text-xl font-semibold text-slate-900">Get in Touch</h2>
              <p className="mt-3 text-slate-700">General Support</p>
              <p className="mt-2 text-slate-700">For help with registrations, payments, tickets, or account issues:</p>
              <div className="mt-3 space-y-1 text-slate-700">
                <p>
                  Email:{' '}
                  <a className="font-medium text-purple-600 hover:text-purple-500" href="mailto:support@happenin.app">
                    support@happenin.app
                  </a>
                </p>
                <p>Response time: Within 24–48 hours (usually faster during fest season)</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">For Organizers &amp; Clubs</h2>
              <p className="mt-3 text-slate-700">If you’re a college club, fest committee, or organizer and want to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
                <li>List your events</li>
                <li>Enable registrations &amp; payments</li>
                <li>Hire volunteers</li>
                <li>Issue certificates</li>
                <li>Discuss sponsorships or promotions</li>
              </ul>
              <div className="mt-3 space-y-1 text-slate-700">
                <p>
                  Email:{' '}
                  <a
                    className="font-medium text-purple-600 hover:text-purple-500"
                    href="mailto:organizers@happenin.app"
                  >
                    organizers@happenin.app
                  </a>
                </p>
                <p>Subject line suggestion: Organizer Query – &lt;College Name&gt;</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Partnerships &amp; Sponsorships</h2>
              <p className="mt-3 text-slate-700">For brand collaborations, sponsorships, or campus partnerships:</p>
              <div className="mt-3 space-y-1 text-slate-700">
                <p>
                  Email:{' '}
                  <a
                    className="font-medium text-purple-600 hover:text-purple-500"
                    href="mailto:partnerships@happenin.app"
                  >
                    partnerships@happenin.app
                  </a>
                </p>
                <p>Subject line suggestion: Partnership – &lt;Brand / Company Name&gt;</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Report an Issue</h2>
              <p className="mt-3 text-slate-700">If you’ve found a bug, payment issue, or anything that doesn’t feel right:</p>
              <div className="mt-3 space-y-2 text-slate-700">
                <p>
                  Email:{' '}
                  <a className="font-medium text-purple-600 hover:text-purple-500" href="mailto:bugs@happenin.app">
                    bugs@happenin.app
                  </a>
                </p>
                <p>Please include:</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>Your registered email</li>
                  <li>Event name (if applicable)</li>
                  <li>Screenshot or screen recording (if possible)</li>
                </ul>
                <p>This helps us fix things faster.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Feedback &amp; Suggestions</h2>
              <p className="mt-3 text-slate-700">Have an idea that could make Happenin better?</p>
              <p className="mt-2 text-slate-700">We love hearing from students and organizers.</p>
              <p className="mt-3 text-slate-700">
                Email:{' '}
                <a className="font-medium text-purple-600 hover:text-purple-500" href="mailto:feedback@happenin.app">
                  feedback@happenin.app
                </a>
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Support Hours</h2>
              <p className="mt-3 text-slate-700">Monday – Saturday</p>
              <p className="text-slate-700">10:00 AM – 8:00 PM (IST)</p>
              <p className="mt-2 text-slate-700">Fest days may have extended support hours.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">Stay Connected</h2>
              <p className="mt-3 text-slate-700">
                More channels coming soon. For now, official communication happens only through the emails listed above.
              </p>
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="text-xl font-semibold text-slate-900">Important Note</h2>
              <p className="mt-3 text-slate-700">
                Happenin will never ask for your password, OTP, or payment details over email or phone. If someone does,
                report it immediately.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
