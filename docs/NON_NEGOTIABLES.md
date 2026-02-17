# NON_NEGOTIABLES.md

> **Status:** Production System Documentation  
> **Last Updated:** February 17, 2026  
> **Purpose:** Features and systems that MUST NOT break during fest week

---

## Overview

This document lists the **absolute non-negotiable requirements** for Happenin during fest days when 10,000+ concurrent users are expected. These are the lines in the sand—if these break, the fest fails.

---

## Table of Contents

1. [Core Auth & Access](#1-core-auth--access)
2. [Event Browsing & Discovery](#2-event-browsing--discovery)
3. [Ticket Purchase & Registration](#3-ticket-purchase--registration)
4. [Check-In & Attendance](#4-check-in--attendance)
5. [Data Integrity](#5-data-integrity)
6. [Performance & Uptime](#6-performance--uptime)
7. [Security & Compliance](#7-security--compliance)
8. [Payment Processing](#8-payment-processing)

---

## 1. Core Auth & Access

### 🔴 **MUST WORK: User Login**

**Requirement:** Students, organizers, and admins MUST be able to log in at all times.

**Acceptance Criteria:**
- Login via email/password succeeds within 3 seconds
- Login via Google OAuth succeeds within 5 seconds
- Failed login shows clear error message (wrong password, account not found)
- Session persists across page refreshes
- Logout works immediately

**Failure Impact:** Users cannot access dashboards, cannot register for events, entire app unusable.

**Dependencies:**
- NextAuth service running
- Supabase database accessible
- Google OAuth API operational (for OAuth users)

**Testing:**
- Load test: 100 concurrent logins/min
- Fail test: Database down → graceful error message
- Edge case: Expired session → auto-redirect to login

---

### 🔴 **MUST WORK: Role-Based Redirects**

**Requirement:** Users MUST be redirected to their correct dashboard based on role.

**Acceptance Criteria:**
- Student logs in → /dashboard/student
- Organizer logs in → /dashboard/organizer
- Admin logs in → /dashboard/admin
- Wrong role accessing wrong dashboard → redirect to correct one
- No access to other role's features

**Failure Impact:** User sees empty/broken dashboard, cannot perform role-specific actions.

**Dependencies:**
- Middleware (proxy.ts) functioning
- JWT token contains correct role
- Database users.role field accurate

---

## 2. Event Browsing & Discovery

### 🔴 **MUST WORK: Event Listing Page**

**Requirement:** Users MUST be able to view all upcoming events without errors.

**Acceptance Criteria:**
- /events page loads within 2 seconds (with 1000+ events)
- Events sorted by start_datetime (earliest first)
- Event cards show: title, date, venue, price, organizer
- Pagination or infinite scroll works smoothly
- Filters work: category, college, price, date range

**Failure Impact:** Users cannot discover events, zero registrations, fest is invisible.

**Dependencies:**
- Supabase query: SELECT * FROM events WHERE start_datetime > NOW()
- Index: idx_events_start_datetime
- RLS policies allow public read

**Testing:**
- Load 5000 events → page still renders
- Apply all filters simultaneously → results accurate
- Mobile + slow 3G → page loads within 5 seconds

---

### 🔴 **MUST WORK: Event Detail Page**

**Requirement:** Clicking an event MUST show full details without 404 or errors.

**Acceptance Criteria:**
- /events/{eventId} loads within 1 second
- Shows: description, schedule, venue, organizer, sponsors, volunteers
- Register/Buy button clickable
- Related events shown (recommendations)
- Social share works (WhatsApp, Twitter, etc.)

**Failure Impact:** Users see broken page, cannot register, miss event information.

**Dependencies:**
- Supabase query: SELECT * FROM events WHERE id = {eventId}
- Related joins: sponsorship_deals, banners, volunteer_roles

---

### 🟡 **SHOULD WORK: Search & Filters**

**Requirement:** Search and filters should work, but manual browsing is acceptable fallback.

**Acceptance Criteria:**
- Search by keyword finds events (title, description)
- Voice search converts speech to text, filters events
- Filters: category, college, price (min/max), date range
- Nearby events (if geolocation enabled)

**Failure Impact:** Users must manually scroll through all events (annoying but not critical).

**Degradation Plan:** If search breaks, hide search bar, users browse full list.

---

## 3. Ticket Purchase & Registration

### 🔴 **MUST WORK: Razorpay Payment Flow**

**Requirement:** Paid events MUST accept payments via Razorpay without failures.

**Acceptance Criteria:**
- POST /api/payments/create-order returns order_id within 2 seconds
- Razorpay modal opens without errors
- All payment methods work: UPI, Card, NetBanking, Wallet
- Payment success → ticket created within 5 seconds
- Payment failure → clear error message, no duplicate charges

**Failure Impact:** No ticket sales = zero revenue for organizers = fest fails financially.

**Dependencies:**
- Razorpay API operational
- RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET correct
- Supabase database writable (payments, registrations tables)
- Signature verification working

**Testing:**
- 1000 concurrent payments → all succeed
- Network timeout mid-payment → no duplicate registrations
- Invalid signature → payment rejected, no ticket created
- Razorpay test mode → switch to live mode before fest

---

### 🔴 **MUST WORK: Free Event Registration**

**Requirement:** Free events MUST allow instant registration without payment.

**Acceptance Criteria:**
- Click "Register" → registration created within 1 second
- No payment modal shown for free events
- Confirmation message displays immediately
- Ticket appears in /dashboard/student

**Failure Impact:** Students cannot register even for free events, attendance drops.

**Dependencies:**
- POST /api/registrations (or similar endpoint)
- Supabase INSERT into registrations table
- Duplicate check (prevent double registration)

---

### 🔴 **MUST WORK: Registration Capacity Limits**

**Requirement:** Events with max_attendees MUST stop accepting registrations when full.

**Acceptance Criteria:**
- Event reaches max_attendees → "Event Full" message shown
- Register button disabled
- No over-registration (database constraint or app-level check)

**Failure Impact:** Overcrowded events, venue capacity exceeded, safety risk.

**Dependencies:**
- Database constraint or trigger: COUNT(registrations) < max_attendees
- Real-time capacity check before payment

⚠️ **WARNING:** Capacity enforcement not explicitly found in codebase. Verify implementation.

---

## 4. Check-In & Attendance

### 🔴 **MUST WORK: Organizer Check-In**

**Requirement:** Organizers MUST be able to check in attendees at the event entrance.

**Acceptance Criteria:**
- Scan QR code or enter registration ID
- POST /api/organizer/checkin succeeds within 500ms
- Confirmation shown: ✅ "{Name} checked in"
- Duplicate check-in rejected: "Already checked in"
- Invalid ticket rejected: "Ticket not found"
- Real-time count updates: "X / Y checked in"

**Failure Impact:** Chaos at event entrance, unauthorized entry, fire safety risk.

**Dependencies:**
- Supabase UPDATE registrations SET status='checked_in'
- Index: idx_registrations_event_status (for fast lookups)
- Offline mode (if network fails): cache check-ins, sync later

**Testing:**
- 1000 attendees checking in over 30 minutes (33 check-ins/min)
- Concurrent check-ins from multiple organizers
- Network outage during check-in → offline mode kicks in

---

### 🟡 **SHOULD WORK: Bulk Check-In**

**Requirement:** For large events (500+ attendees), bulk check-in speeds up process.

**Acceptance Criteria:**
- Upload CSV with registration IDs
- POST /api/organizer/checkin/batch
- All valid IDs checked in within 10 seconds
- Invalid IDs returned with errors

**Failure Impact:** Check-in takes too long, event delayed, attendees annoyed.

**Degradation Plan:** Fall back to individual check-ins (slower but works).

⚠️ **WARNING:** Batch check-in API not found in codebase. May need implementation.

---

## 5. Data Integrity

### 🔴 **MUST NOT HAPPEN: Duplicate Registrations**

**Requirement:** A user MUST NOT be able to register for the same event twice.

**Prevention:**
- Database UNIQUE constraint: (event_id, user_email) on registrations table
- App-level check before payment
- Idempotency key in payment flow (Razorpay order ID)

**Failure Impact:** Duplicate charges, database inconsistency, refund headaches.

**Testing:**
- Rapid double-click "Register" → only 1 registration created
- Network timeout, user retries → no duplicate

⚠️ **WARNING:** Unique constraint not explicitly found in registrations table schema. Verify before fest.

---

### 🔴 **MUST NOT HAPPEN: Payment Without Registration**

**Requirement:** If payment succeeds, registration MUST be created. No lost payments.

**Prevention:**
- Signature verification before database write
- Transaction: UPDATE payments + INSERT registrations (atomicity)
- Webhook fallback (Razorpay server-to-server confirmation)

**Failure Impact:** User paid but has no ticket = angry users, refund requests, support burden.

**Testing:**
- Database write fails after payment → rollback or manual reconciliation
- Network fails after payment, before registration → webhook creates registration

⚠️ **WARNING:** Webhook endpoint not found. Relying solely on client-side handler is risky.

---

### 🔴 **MUST NOT HAPPEN: Wrong User Checked In**

**Requirement:** Check-in MUST verify the correct user for the ticket.

**Prevention:**
- QR code contains registration_id (not just event_id)
- Backend validates: registration exists AND belongs to correct event
- Check-in fails if registration not found

**Failure Impact:** Unauthorized entry, attendee tracking incorrect, safety/security risk.

---

## 6. Performance & Uptime

### 🔴 **MUST MEET: 99.9% Uptime During Fest Days**

**Requirement:** App MUST be accessible 99.9% of the time during fest week (3 days × 24 hours).

**Allowed Downtime:** 4 minutes total across 3 days

**Acceptance Criteria:**
- No planned maintenance during fest
- Auto-scaling handles traffic spikes
- Database failover ready
- CDN/edge caching for static assets

**Failure Impact:** App down = no registrations, no check-ins, fest chaos.

**Monitoring:**
- Uptime monitoring (Vercel, Uptime Robot, etc.)
- Alert on 5xx errors or downtime > 1 minute
- On-call person available 24/7 during fest

---

### 🔴 **MUST MEET: Response Time < 3 Seconds**

**Requirement:** All pages and API endpoints MUST respond within 3 seconds (95th percentile).

**Acceptance Criteria:**
- Event listing page: < 2s
- Event detail page: < 1s
- Payment create-order: < 2s
- Check-in API: < 500ms
- Dashboard pages: < 2s

**Failure Impact:** Users abandon slow pages, registration drop-off, poor UX.

**Monitoring:**
- APM tool (Vercel Analytics, Sentry Performance, etc.)
- Alert if p95 > 3 seconds for any endpoint

---

### 🔴 **MUST HANDLE: 10,000 Concurrent Users**

**Requirement:** App MUST support 10K concurrent users without degradation.

**Acceptance Criteria:**
- Server auto-scales to needed capacity
- Database connection pool sized for load (PgBouncer)
- Razorpay rate limits not exceeded
- No connection timeouts or 503 errors

**Failure Impact:** App crashes, users see errors, fest fails.

**Testing:**
- Load test with 10K virtual users (k6, Artillery, Locust)
- Gradual ramp-up: 0 → 10K over 10 minutes
- Sustained load: 10K users for 1 hour
- Spike test: 0 → 10K in 1 minute (ticket sales rush)

---

## 7. Security & Compliance

### 🔴 **MUST BE SECURE: Payment Data**

**Requirement:** Payment data (card numbers, UPI IDs) MUST NEVER be stored in app database.

**Acceptance Criteria:**
- All payment processing via Razorpay (PCI-DSS compliant)
- App stores only: razorpay_order_id, razorpay_payment_id, amount, status
- No card numbers, CVV, or UPI IDs in database
- HTTPS enforced on all pages

**Failure Impact:** PCI-DSS violation, legal liability, data breach, user trust lost.

**Verification:**
- Audit payments table schema → no sensitive fields
- Check logs → no payment details logged

---

### 🔴 **MUST BE SECURE: User Passwords**

**Requirement:** Passwords MUST be hashed with bcrypt (never stored in plaintext).

**Acceptance Criteria:**
- users.password_hash contains bcrypt hash (starts with $2b$10$)
- users.password field unused or empty
- bcrypt rounds = 10 (minimum)

**Failure Impact:** Database breach exposes all passwords, account takeovers, reputation damage.

**Verification:**
- Check signup flow: bcrypt.hash(password, 10)
- Check login flow: bcrypt.compare(password, hash)

---

### 🔴 **MUST BE SECURE: Row-Level Security Enabled**

**Requirement:** Users MUST NOT be able to access other users' data via direct Supabase queries.

**Acceptance Criteria:**
- RLS enabled on: payments, registrations, student_profiles, student_certificates
- Policies enforce: users can only SELECT their own rows
- Admin exceptions via role check

**Failure Impact:** Data breach, users see other users' tickets/payments/profiles.

**Verification:**
- Test with Supabase client: student A tries to query student B's data → denied
- Check migrations: ALTER TABLE ... ENABLE ROW LEVEL SECURITY ✅

⚠️ **WARNING:** RLS not enabled on users and payments tables. **CRITICAL FIX NEEDED BEFORE FEST.**

---

## 8. Payment Processing

### 🔴 **MUST WORK: Razorpay Signature Verification**

**Requirement:** All payments MUST be verified with HMAC SHA256 signature before creating tickets.

**Acceptance Criteria:**
- Backend calculates: HMAC_SHA256(order_id|payment_id, SECRET)
- Compare with razorpay_signature using timingSafeEqual()
- Reject payment if signature invalid

**Failure Impact:** Attackers can fake payment confirmations, free tickets, revenue loss.

**Verification:**
- Code review: crypto.timingSafeEqual() used ✅
- Test with invalid signature → payment rejected ✅

---

### 🔴 **MUST WORK: Razorpay Refunds (Event Cancellation)**

**Requirement:** If event is cancelled, users MUST receive automatic refunds.

**Acceptance Criteria:**
- Organizer cancels event → refund flow triggered
- Admin initiates Razorpay refund API call for all registrations
- payments.status updated to 'refunded'
- event_cancellations.refund_status = 'completed'

**Failure Impact:** Users paid for cancelled event, no refund = angry users, chargebacks, bad press.

**Verification:**
- Test refund flow in Razorpay sandbox
- Check refund API integration code

⚠️ **WARNING:** Refund automation not found in codebase. May be manual process via Razorpay dashboard.

---

## 9. WhatsApp Group Join Feature

### 🔴 **MUST BE OPT-IN: No Auto-Adding to WhatsApp Groups**

**Requirement:** Students MUST NOT be automatically added to WhatsApp groups. Feature must be 100% opt-in.

**Acceptance Criteria:**
- WhatsApp group feature is optional (organizer can enable/disable)
- Link is ONLY shown to registered students (registration verification required)
- Student must explicitly click "Join WhatsApp Group" button
- No auto-redirects, no pre-fills, no background actions
- WhatsApp invite link opens in new tab only when student clicks button

**Failure Impact:** Privacy violation, user annoyance, spam complaints, potential legal issues.

**Non-Negotiable Rules:**
- ❌ NO auto-adding students to groups
- ❌ NO collecting phone numbers for WhatsApp
- ❌ NO WhatsApp APIs or bots
- ❌ NO public exposure of WhatsApp links (never in public event listings)
- ✅ Registration verification before exposing link
- ✅ Completely optional for organizers
- ✅ Manual click required for students

**Testing:**
- Verify link NOT shown in public event API responses
- Verify link NOT accessible to non-registered users (403 error)
- Verify no auto-redirects or background requests to WhatsApp
- Verify organizer can disable feature anytime

---

### 🟢 **OPTIONAL FEATURE: WhatsApp Group Analytics**

**Requirement:** System tracks join button clicks for analytics (optional).

**Acceptance Criteria:**
- Join clicks logged to `whatsapp_group_joins` table
- Tracks: event_id, student_email, joined_at timestamp
- Does NOT track actual WhatsApp group membership (platform has no access)
- Admin can optionally view join click metrics

**Failure Impact:** No analytics data (Low impact - feature is optional).

**Privacy Note:** Platform does NOT track messages, activity, or actual membership in WhatsApp groups. Only tracks button clicks.

---

## Pre-Fest Checklist

### ✅ **Must Complete Before Fest:**

#### Auth & Access
- [ ] Test login with 100 concurrent users (load test)
- [ ] Verify role-based redirects for all 3 roles
- [ ] Confirm NextAuth secret is strong (32+ characters)
- [ ] Test Google OAuth end-to-end

#### Event Discovery
- [ ] Load test event listing with 5000 events
- [ ] Verify all filters work correctly
- [ ] Test search with 100 queries

#### Payments
- [ ] Switch Razorpay from test mode to live mode
- [ ] Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are live keys
- [ ] Test payment flow end-to-end with real payment (₹1 test)
- [ ] Verify signature verification works
- [ ] Test payment failure scenario (declined card)

#### Check-In
- [ ] Test check-in with 1000 concurrent requests
- [ ] Verify duplicate check-in prevention
- [ ] Test offline check-in mode (if implemented)
- [ ] Load test: 33 check-ins/minute sustained for 30 minutes

#### Data Integrity
- [ ] **CRITICAL:** Enable RLS on users and payments tables
- [ ] Add UNIQUE constraint on registrations(event_id, user_email)
- [ ] Test duplicate registration prevention
- [ ] Verify no payment can succeed without registration

#### Performance
- [ ] Load test: 10K concurrent users for 1 hour
- [ ] Spike test: 0 → 10K users in 1 minute
- [ ] Monitor database connection pool
- [ ] Enable auto-scaling on Vercel/hosting platform
- [ ] Set up CDN for static assets

#### Security
- [ ] Audit all RLS policies (users can only see own data)
- [ ] Verify passwords are bcrypt hashed
- [ ] Confirm no payment data stored in database
- [ ] Force HTTPS on all pages
- [ ] Test SQL injection prevention (Supabase client protects)

#### Monitoring
- [ ] Set up uptime monitoring (99.9% SLA)
- [ ] Configure error alerting (Sentry, Datadog, etc.)
- [ ] Set up APM for response time tracking
- [ ] Create on-call rotation for fest days

#### Database
- [ ] Add missing indexes (see DATABASE_SCHEMA.md recommendations)
- [ ] Enable PgBouncer for connection pooling
- [ ] Configure database backups (hourly during fest)
- [ ] Test database failover (if available)

#### Payments & Refunds
- [ ] Document refund process (manual or automated)
- [ ] Test Razorpay webhook (if implemented)
- [ ] Ensure sufficient balance in Razorpay account for refunds
- [ ] Verify sponsorship payment split calculation (10%/15% vs 20%)

---

## Red Lines (Absolute Failures)

If ANY of these occur, **STOP THE FEST** and fix immediately:

1. ❌ **Login broken** → No one can access app
2. ❌ **Payment flow broken** → No ticket sales
3. ❌ **Check-in broken** → Chaos at event entrance
4. ❌ **Database offline** → All features dead
5. ❌ **Duplicate registrations** → Data corruption, double charges
6. ❌ **Payment without ticket** → Revenue loss, angry users
7. ❌ **RLS not enforced** → Data breach, privacy violation

---

**If in doubt, TEST IT AGAIN. Better safe than sorry at 10K+ scale.**

---

**END OF NON_NEGOTIABLES.md**
