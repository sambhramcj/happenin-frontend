export default function PrivacyPolicyPage() {
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
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">Privacy Policy</h1>
            <p className="text-sm text-slate-500">Last updated: February 1, 2026</p>
            <p className="max-w-3xl text-base text-slate-700">
              Happenin (“we”, “our”, “us”) respects your privacy and is committed to protecting the personal information
              you share with us. This Privacy Policy explains what data we collect, why we collect it, how we use it,
              and your rights regarding that data.
            </p>
            <p className="max-w-3xl text-base text-slate-700">
              By using Happenin, you agree to the practices described in this policy.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(124,58,237,0.25)]">
              <h2 className="text-xl font-semibold text-slate-900">1. Information We Collect</h2>
              <p className="mt-2 text-slate-700">We only collect information that is necessary to run the platform smoothly.</p>

              <div className="mt-4 space-y-4 text-slate-700">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">a) Information you provide directly</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Full name</li>
                    <li>Email address (college or personal)</li>
                    <li>Date of birth (if required for events)</li>
                    <li>College name</li>
                    <li>Profile photo (optional)</li>
                    <li>Club memberships (optional)</li>
                    <li>Volunteer applications and certificates (if applicable)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">b) Event & transaction data</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Events you view or register for</li>
                    <li>Tickets and QR codes generated</li>
                    <li>Payment status and transaction references (we do not store card or UPI details)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">c) Automatically collected data</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Device type, browser, and operating system</li>
                    <li>IP address (for security and fraud prevention)</li>
                    <li>App usage data (pages visited, actions taken)</li>
                    <li>Offline activity data (stored locally and synced when online)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">2. How We Use Your Information</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Create and manage your account</li>
                <li>Allow event registrations and ticketing</li>
                <li>Enable volunteering and certificate issuance</li>
                <li>Process payments and refunds</li>
                <li>Send important notifications (event updates, ticket confirmations)</li>
                <li>Improve platform performance and reliability</li>
                <li>Prevent fraud, abuse, and duplicate registrations</li>
              </ul>
              <p className="mt-3 text-slate-700">We do not sell your personal data.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">3. Payments & Financial Information</h2>
              <div className="mt-3 space-y-2 text-slate-700">
                <p>Payments on Happenin are processed through trusted third-party gateways (such as Razorpay).</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>We do not store your card, UPI, or bank details</li>
                  <li>Payment verification happens securely on our servers</li>
                  <li>Only transaction references and payment status are stored</li>
                </ul>
                <p>All payment data is handled according to the payment provider’s security standards.</p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">4. Data Sharing</h2>
              <div className="mt-3 space-y-4 text-slate-700">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">a) With event organizers</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>Your name</li>
                    <li>Email</li>
                    <li>Registration status</li>
                    <li>Volunteer application details (if you applied)</li>
                  </ul>
                  <p className="mt-2">They cannot see your payment method or personal credentials.</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">b) With service providers</h3>
                  <p className="mt-2">We use trusted tools for authentication, database storage, file storage, payments, and analytics.</p>
                  <p className="mt-2">These providers only receive the minimum data required to perform their function.</p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">c) Legal requirements</h3>
                  <p className="mt-2">We may disclose information if required by law or government authorities.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">5. Cookies & Local Storage</h2>
              <p className="mt-3 text-slate-700">Happenin uses:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-slate-700">
                <li>Cookies for authentication and session management</li>
                <li>Local storage / IndexedDB for offline support and reliability</li>
              </ul>
              <p className="mt-3 text-slate-700">
                These are essential for the app to function properly. Disabling them may break core features.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">6. Data Security</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Secure authentication mechanisms</li>
                <li>Encrypted connections (HTTPS)</li>
                <li>Role-based access control</li>
                <li>Restricted server-side access to sensitive data</li>
              </ul>
              <p className="mt-3 text-slate-700">
                However, no system is 100% secure. You use the platform at your own risk.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">7. Data Retention</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>As long as your account is active</li>
                <li>As required for event records and legal compliance</li>
              </ul>
              <p className="mt-3 text-slate-700">
                You may request deletion of your account and associated data, subject to legal or operational requirements.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">8. Your Rights</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
                <li>Access your personal data</li>
                <li>Update or correct your information</li>
                <li>Request account deletion</li>
                <li>Withdraw consent (by stopping use of the platform)</li>
              </ul>
              <p className="mt-3 text-slate-700">To exercise these rights, contact us using the details below.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">9. Children’s Privacy</h2>
              <p className="mt-3 text-slate-700">
                Happenin is intended for college students and adults. We do not knowingly collect data from users under the
                age of 16.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">10. Changes to This Policy</h2>
              <p className="mt-3 text-slate-700">
                We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an
                updated date. Continued use of the platform means you accept the updated policy.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-900">11. Contact Us</h2>
              <div className="mt-3 space-y-2 text-slate-700">
                <p>If you have any questions or concerns about this Privacy Policy:</p>
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
