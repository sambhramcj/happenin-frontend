> **Last Updated:** February 17, 2026  

## High-Level Architecture

```
[Browser]
   |
   |  Next.js App Router (frontend/src/app)
   |  - Server components for layout + routing
   |  - Client components for interactive dashboards/forms
   v
[Next.js API Routes]
   |
   |  Auth: NextAuth (JWT sessions)
   |  Data: Supabase (Postgres + Storage + RLS)
   |  Payments: Razorpay (tickets); sponsorships may be manual
   v
[Supabase]
   - Postgres (events, registrations, tickets, attendance, etc.)
   - Storage (banners, brochures, certificates, images)
   - RLS policies

[External]
   - Google OAuth
   - Razorpay Checkout
```

---

## Client vs Server Responsibilities

**Client (React, App Router client components)**
- UI rendering for landing, dashboards, forms, and modals.
- Interactive flows: search, filters, QR scanning, notifications, favorites.
- Session awareness via `next-auth` SessionProvider.
- PWA install prompt and offline banners.

**Server (Next.js route handlers)**
- Auth: NextAuth credentials + Google OAuth.
- Business APIs: events, registrations, attendance, certificates, sponsorships.
- Admin APIs: analytics, logs, payouts, banners, moderation (if enabled).
- Supabase service role usage on server for privileged access.

---

## App Router Structure (frontend/src/app)

**Key routes**
- Public: `/` (landing), `/events/[eventId]`, `/fests`, `/fests/[festId]`
- Auth: `/auth` and `/auth/signup`
- Dashboards: `/dashboard/student`, `/dashboard/organizer`, `/dashboard/admin`, `/dashboard/sponsor`
- Sponsor flow: `/sponsor/events/[eventId]`

**Shared layout**
- `frontend/src/app/layout.tsx` sets metadata, PWA tags, and wraps Providers.
- `frontend/src/app/providers.tsx` provides SessionProvider, ThemeProvider, QueryProvider, OfflineBanner, Toaster.

---

## API Routes Layout (frontend/src/app/api)

Routes are grouped by domain folders. Current top-level structure:
- `access-control/`
- `admin/`
- `auth/`
- `badges/`
- `banners/`
- `bulk-tickets/`
- `calendar/`
- `categories/`
- `certificates/`
- `colleges/`
- `debug/`
- `event-history/`
- `events/`
- `fests/`
- `health/`
- `interactions/`
- `notifications/`
- `organizer/`
- `payments/`
- `recommendations/`
- `sponsor/`
- `sponsorship/`
- `sponsorships/`
- `student/`
- `team-registrations/`
- `upload-image/`
- `volunteers/`
- `whatsapp/` (NEW - Optional WhatsApp group join feature)

---

## Supabase Usage

**Client-side**
- Uses `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Used for user-facing queries and realtime where allowed by RLS.

**Server-side**
- Uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for privileged access.
- Required for admin and system operations.

**RLS**
- RLS is expected to guard data access. Exact policies are in migrations.
- ⚠️ Needs confirmation in code for policy coverage per table.

---

## Auth Flow (NextAuth)

- Auth route: `frontend/src/app/api/auth/[...nextauth]/route.ts`
- Providers: Credentials + Google OAuth.
- JWT session strategy with role attached to token.
- Role-based routing is enforced in `frontend/src/proxy.ts` (withAuth).
- `frontend/src/middleware.disabled.ts` is a placeholder and not active.

Roles appear in token/session:
- `student`
- `organizer`
- `admin`
- `sponsor` (dashboard exists; role usage needs confirmation)

⚠️ Needs confirmation in code: exact sponsor role assignment logic.

---

## Role-Based Dashboards

- Student: `/dashboard/student`
- Organizer: `/dashboard/organizer`
- Admin: `/dashboard/admin`
- Sponsor: `/dashboard/sponsor`

Route protection:
- Proxy middleware redirects users to the correct dashboard by role.
- Server APIs must still validate role (do not rely only on UI).

---

## Payment Integrations

**Ticket Payments (Razorpay)**
- Razorpay checkout used for event registration payments.
- Critical path: event registration -> payment -> ticket generation.

**Sponsorship Payments**
- Sponsor event page triggers a Razorpay checkout for sponsorship packages.
- ⚠️ Needs confirmation in code whether sponsorship payments are enabled in production or treated as manual.

---

## PWA-First Architecture

- `manifest.json` and `public/sw.js` are served by Next.js.
- PWA install prompt: `PWAInstallPrompt` in layout.
- Offline banners: `OfflineBanner` and `OfflineRetryBanner`.

---

## Critical Paths (Fest-Day Stability)

**Must remain stable during fest week:**
- Auth (login/signup/session) and role routing.
- Event discovery + event details API.
- Registration + Razorpay payment + ticket generation.
- Attendance QR scanning and attendance writes.
- Admin monitoring dashboards (analytics, payouts, banners).

---

## What MUST NOT Change Before Fest

- NextAuth callbacks and JWT role assignment.
- Role-based routing in `frontend/src/proxy.ts`.
- Supabase service role usage on server APIs.
- Payment flows for tickets (checkout + verification).
- Attendance QR scan routes and attendance write logic.
- Database schema or RLS policies without migrations.
- Public API route structure (clients depend on it).
- PWA manifest and service worker registration.

---

## ASCII Architecture Diagram

```
[User Browser]
  |  Next.js App Router
  |  - Client UI (dashboards, forms)
  |  - PWA (manifest, SW, offline banners)
  v
[Next.js API Routes]
  |  Auth (NextAuth)
  |  Business APIs (events, registrations, attendance)
  |  Admin APIs (analytics, banners, payouts)
  v
[Supabase]
  |  Postgres + RLS
  |  Storage buckets
  v
[External Services]
  - Google OAuth
  - Razorpay Checkout
```

---

## Fest-Day Risk Notes

- Avoid schema changes without verified migrations.
- Do not alter role checks or proxy behavior.
- Protect API rate limits and avoid long-running sync jobs.
- Ensure Razorpay keys and Supabase env vars are correct.
- Keep service role key server-only.
