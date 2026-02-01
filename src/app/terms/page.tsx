export default function TermsPage() {
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
              Legal
            </span>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Terms &amp; Conditions</h1>
            <p className="text-sm text-slate-500">Last updated: February 1, 2026</p>
            <p className="max-w-3xl text-base text-slate-700">
              Welcome to Happenin. These Terms &amp; Conditions (“Terms”) govern your access to and use of the Happenin
              website, PWA, and any future mobile applications (collectively, the “Platform”).
            </p>
            <p className="max-w-3xl text-base text-slate-700">
              By accessing or using Happenin, you agree to be bound by these Terms. If you do not agree, please do not
              use the Platform.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(124,58,237,0.25)]">
              <h2 className="text-xl font-semibold text-slate-900">1. Eligibility</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>You must be at least 16 years old to use Happenin.</li>
                <li>By using the Platform, you confirm that the information you provide is accurate and belongs to you.</li>
                <li>Accounts created using fake, misleading, or impersonated details may be suspended or terminated.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">2. User Accounts</h2>
              <p className="mt-3 text-slate-700">You are responsible for:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
                <li>Maintaining the confidentiality of your login credentials</li>
                <li>All activities that occur under your account</li>
              </ul>
              <p className="mt-3 text-slate-700">
                Happenin is not responsible for any loss or damage arising from unauthorized access to your account.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">3. User Roles</h2>
              <div className="mt-3 space-y-4 text-slate-700">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">a) Students</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Can browse events, register, make payments, volunteer, and receive certificates</li>
                    <li>Must complete mandatory profile details before registering for events</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">b) Organizers / Clubs</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Can create and manage events</li>
                    <li>Can view registrations, volunteers, and attendance</li>
                    <li>Are responsible for the accuracy of event details and execution</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">c) Admins</h3>
                  <p className="mt-2">Oversee platform operations and compliance.</p>
                </div>
                <p>Happenin reserves the right to modify or revoke roles at any time.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">4. Event Registrations &amp; Payments</h2>
              <div className="mt-3 space-y-2 text-slate-700">
                <p>All event payments are processed via third-party payment gateways.</p>
                <p>Happenin does not guarantee event quality, execution, or outcomes.</p>
                <p>Once a payment is successful, registration is considered complete unless otherwise stated.</p>
              </div>
              <div className="mt-4 text-slate-700">
                <h3 className="text-base font-semibold text-slate-900">Refunds</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Refunds, if any, are governed by the event organizer’s policy</li>
                  <li>Happenin may assist in coordination but is not liable for refund decisions</li>
                </ul>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">5. Event Changes &amp; Cancellations</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Event details (date, time, venue, format) may change at the organizer’s discretion</li>
                <li>Happenin is not responsible for cancellations, postponements, or changes made by organizers</li>
                <li>Organizers are solely responsible for informing participants</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">6. Volunteering &amp; Certificates</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Volunteering opportunities are optional and event-specific</li>
                <li>Selection, acceptance, or rejection of volunteers is solely the organizer’s decision</li>
                <li>Certificates are issued by organizers and hosted via Happenin</li>
                <li>Happenin does not guarantee certificate authenticity beyond organizer submissions</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">7. Platform Availability</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Happenin strives for high availability but does not guarantee uninterrupted access</li>
                <li>Downtime may occur due to maintenance, network issues, or force majeure events</li>
                <li>Offline features are provided on a best-effort basis</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">8. Prohibited Activities</h2>
              <p className="mt-3 text-slate-700">You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
                <li>Misuse the platform for fraud or illegal activities</li>
                <li>Attempt to bypass payments or security mechanisms</li>
                <li>Upload malicious, offensive, or misleading content</li>
                <li>Scrape, reverse-engineer, or exploit platform services</li>
                <li>Harass organizers, volunteers, or other users</li>
              </ul>
              <p className="mt-3 text-slate-700">Violation may result in immediate suspension or termination.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">9. Intellectual Property</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>All platform content, branding, UI, and code belong to Happenin unless stated otherwise</li>
                <li>Event content (logos, posters) remains the property of respective organizers</li>
                <li>You may not copy, modify, or redistribute platform assets without permission</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">10. Limitation of Liability</h2>
              <p className="mt-3 text-slate-700">To the maximum extent permitted by law, Happenin is not liable for:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
                <li>Event cancellations or disputes</li>
                <li>Organizer actions or negligence</li>
                <li>Financial loss due to third-party services</li>
                <li>Personal injury or property damage at events</li>
              </ul>
              <p className="mt-3 text-slate-700">Use of the platform is at your own risk.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">11. Indemnification</h2>
              <p className="mt-3 text-slate-700">
                You agree to indemnify and hold harmless Happenin and its team from any claims, losses, or damages arising
                from:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
                <li>Your use of the platform</li>
                <li>Violation of these Terms</li>
                <li>Misrepresentation or misuse of services</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">12. Termination</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Suspend or terminate your account without notice if Terms are violated</li>
                <li>Remove content or restrict access for security or legal reasons</li>
              </ul>
              <p className="mt-3 text-slate-700">You may stop using the platform at any time.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">13. Governing Law</h2>
              <p className="mt-3 text-slate-700">
                These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts
                in India.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">14. Changes to Terms</h2>
              <p className="mt-3 text-slate-700">
                We may update these Terms from time to time. Continued use of the platform after changes implies
                acceptance.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">15. Contact</h2>
              <div className="mt-3 space-y-2 text-slate-700">
                <p>For questions or concerns:</p>
                <p>
                  📧 Email:{' '}
                  <a className="font-medium text-purple-600 hover:text-purple-500" href="mailto:support@happenin.app">
                    support@happenin.app
                  </a>
                </p>
                <p>
                  🌐 Website:{' '}
                  <a className="font-medium text-purple-600 hover:text-purple-500" href="https://happenin.app">
                    https://happenin.app
                  </a>
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
