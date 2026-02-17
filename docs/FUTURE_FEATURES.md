# FUTURE_FEATURES.md

> **Status:** Documentation of Planned & Partially Implemented Features  
> **Last Updated:** February 17, 2026  
> **Purpose:** Track features in the codebase that are not production-ready or ideas for future development

---

## Overview

This document lists **features mentioned in code/migrations but NOT fully production-ready**, as well as **potential future enhancements** discovered during documentation. Use this to plan post-fest improvements.

---

## Table of Contents

1. [Partially Implemented Features](#1-partially-implemented-features)
2. [Database Schema Ready, UI Not Built](#2-database-schema-ready-ui-not-built)
3. [Future Feature Ideas](#3-future-feature-ideas)
4. [Technical Debt & Improvements](#4-technical-debt--improvements)

---

## 1. Partially Implemented Features

### 🟢 Online Sponsorship Payments (Razorpay) — Completed

**Status:** Production-ready (packs live)

**What Exists:**
- API endpoints: `POST /api/sponsorships/create-order`, `POST /api/sponsorships/verify`
- Orders listing: `GET /api/sponsorships/orders`
- Inserts `sponsorship_orders` with status='created' and verifies to `paid`
- Pack pricing: `digital`, `app`, `fest` (fixed amounts)
- Sponsor dashboard + admin controls (visibility, payout settlement)

**Remaining Improvements (Optional):**
- Webhook redundancy for sponsorship payments
- Sponsor email receipts/confirmations

**Priority:** 🟢 Low (optional hardening)

**Effort:** 2-4 days (webhooks + email templates)

---

### 🟡 Razorpay Webhooks

**Status:** Not implemented, relying on client-side handler

**What's Missing:**
- Webhook endpoint: `POST /api/webhooks/razorpay`
- Signature verification (HMAC SHA256 with webhook secret)
- Auto-create registrations if client-side handler fails
- Handle edge cases: payment success but user closed browser

**Risk:**
- If user closes browser after payment, no ticket created
- Current mitigation: User can retry, but payment already succeeded (potential duplicate)

**Priority:** 🔴 High (critical for reliability)

**Effort:** 1 week (endpoint + signature verification + testing)

**Implementation Notes:**
```typescript
// POST /api/webhooks/razorpay
// 1. Verify signature: HMAC_SHA256(webhook_body, RAZORPAY_WEBHOOK_SECRET)
// 2. Parse event: payment.captured, payment.failed, refund.created
// 3. Update database: payments.status, create registration if missing
// 4. Return 200 OK (Razorpay retries if non-200)
```

---

### 🟡 Batch Check-In API

**Status:** Not found in codebase

**What's Missing:**
- API endpoint: `POST /api/organizer/checkin/batch`
- Accept array of registration IDs
- Update all in single database transaction
- Return success count + errors

**Current Workaround:**
- Individual check-ins (1 API call per attendee)
- Works but slow for 500+ attendees

**Priority:** 🟡 Medium (individual check-ins work, but batch is faster)

**Effort:** 1-2 days (endpoint + testing)

**Implementation Notes:**
```typescript
// POST /api/organizer/checkin/batch
// Body: { registration_ids: ['uuid1', 'uuid2', ...] }
// 1. Validate organizer owns event
// 2. Batch UPDATE registrations SET status='checked_in' WHERE id IN (...)
// 3. Return { success: 450, failed: 50, errors: [...] }
```

---

### 🟡 Offline Check-In Sync

**Status:** Not implemented, mentioned in planning

**What's Missing:**
- Service worker caches check-ins when offline
- IndexedDB stores pending check-ins
- Auto-sync when connection restored
- Conflict resolution (if same attendee checked in offline+online)

**Current Workaround:**
- Organizers use paper lists if internet fails
- Manually update database later

**Priority:** 🟢 Low (manual fallback exists)

**Effort:** 1 week (service worker + IndexedDB + sync logic)

---

### 🟡 Certificate Generation (Performance)

**Status:** Works, but may be slow at scale

**Potential Issue:**
- Synchronous generation: 500 certificates × 2s each = 16 minutes
- API timeout (Vercel: 10s hobby, 60s pro, 300s enterprise)

**Solutions Not Yet Implemented:**
1. **Background Job Queue** (BullMQ, Innest, etc.)
   - Queue certificate generation tasks
   - Process asynchronously
   - Show progress bar to organizer
   
2. **Lazy Generation**
   - Generate certificate only when student views/downloads
   - Cache generated certificate forever
   
3. **Pre-generated Templates**
   - Use placeholders, replace on-the-fly (faster than image manipulation)

**Priority:** 🟡 Medium (test with 500+ certificates before fest)

**Effort:** 1-2 weeks (background queue setup + testing)

---

## 2. Database Schema Ready, UI Not Built

### 🟢 Event Capacity Enforcement

**Schema:** `events.max_attendees` column NOT present (needs new migration)

**What's Missing:**
- Capacity check before payment
- "Event Full" message on frontend
- Registration close when max reached
- Database trigger or constraint to enforce

**Priority:** 🔴 High (safety issue if venue has capacity limits)

**Effort:** 2-3 days (API check + frontend UI + testing)

**Implementation Notes:**
```sql
-- Option 1: Database constraint (trigger)
CREATE FUNCTION check_event_capacity() RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM registrations WHERE event_id = NEW.event_id) >= 
     (SELECT max_attendees FROM events WHERE id = NEW.event_id) THEN
    RAISE EXCEPTION 'Event is full';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_capacity
BEFORE INSERT ON registrations
FOR EACH ROW EXECUTE FUNCTION check_event_capacity();

-- Option 2: App-level check (before payment)
const registrationCount = await supabase
  .from('registrations')
  .select('id', { count: 'exact' })
  .eq('event_id', eventId);
  
const event = await supabase
  .from('events')
  .select('max_attendees')
  .eq('id', eventId)
  .single();

if (registrationCount.count >= event.max_attendees) {
  return { error: 'Event is full' };
}
```

---

### 🟢 Event Recommendations (Collaborative Filtering)

**Schema:** `user_event_interactions`, `user_preferences`, `event_similarity_cache` (migration 20)

**What Exists:**
- Tables + RLS policies for interactions and preferences
- Heuristic recommendations via `GET /api/home/recommended` (clubs, college, category history)

**What's Missing:**
- Collaborative filtering job (similarity scoring + cache refresh)
- Scheduled task/cron to compute recommendations
- Optional: materialized recommendations table for faster reads
- Recommendation trigger: When user favorites 3+ events

**Priority:** 🟢 Low (nice-to-have, not critical)

**Effort:** 1 week (cron setup + frontend UI + testing)

**Implementation Notes:**
```typescript
// Nightly job (cron/edge function)
// 1) Build/update event_similarity_cache from user_event_interactions
// 2) Optionally write per-user results to a materialized table for fast reads
// 3) Expose GET /api/recommendations to read cached results
```

---

### 🟢 Event Cancellation & Refunds

**Schema:** `event_cancellations` table exists (migration 23)

**What Exists:**
- Table tracks cancellations: `event_id`, `cancelled_by`, `cancellation_reason`, `refund_status`, `notification_sent`, `cancelled_at`
- Organizer UI for cancel/reschedule flow

**What's Missing:**
- Automatic refund initiation via Razorpay API
- Email notifications to attendees
- Refund status sync ("pending", "completed", "failed")

**Priority:** 🟡 Medium (needed if events get cancelled)

**Effort:** 1 week (UI + Razorpay refund API + email + testing)

**Implementation Notes:**
```typescript
// POST /api/organizer/events/{eventId}/cancel
// 1. UPDATE events SET status='cancelled'
// 2. INSERT INTO event_cancellations (...)
// 3. Fetch all payments for event
// 4. For each payment:
//    - Call Razorpay API: razorpay.payments.refund(payment_id, amount)
//    - UPDATE payments SET status='refunded'
// 5. Send email to all attendees
```

---

### 🟢 Event Schedule (Time Slots)

**Schema:** `event_schedule` table exists (migration 05)

**What Exists:**
- Table with columns: `event_id`, `activity_name`, `start_time`, `end_time`, `speaker`, `session_description`

**What's Missing:**
- Organizer UI: Add schedule items (timeline builder)
- Frontend: Event detail page → "Schedule" tab
- Calendar view (day/week view)

**Priority:** 🟢 Low (description field can list schedule as text)

**Effort:** 3-5 days (UI + timeline component)

---

### 🟢 Geolocation & Nearby Events

**Schema:** PostGIS enabled (migration 15, 16), `events.location` (GEOGRAPHY type)

**What Exists:**
- PostGIS extension installed
- Spatial indexing on `events.location`
- PostgreSQL function: `get_nearby_events(lat, lon, radius_km)`

**What's Missing:**
- Browser geolocation prompt ("Allow location access?")
- Frontend: "Nearby Events" filter
- Map view (Google Maps, Mapbox)

**Priority:** 🟢 Low (users can filter by college/city)

**Effort:** 1 week (frontend geolocation + map integration + testing)

**Implementation Notes:**
```typescript
// Frontend: Request user location
navigator.geolocation.getCurrentPosition((pos) => {
  const { latitude, longitude } = pos.coords;
  fetch(`/api/events/nearby?lat=${latitude}&lon=${longitude}&radius=10`);
});

// Backend: Call PostgreSQL function
const { data } = await supabase.rpc('get_nearby_events', {
  user_lat: lat,
  user_lon: lon,
  radius_km: 10
});
```

---

### 🟢 Bulk Tickets & Group Bookings

**Schema:** `bulk_ticket_allocations` table exists (migration 11)

**What Exists:**
- Table tracks bulk purchases: `allocated_to_email`, `event_id`, `quantity`, `price_per_ticket`
- Separate `bulk_tickets` table: Individual tickets with redemption codes

**What's Missing:**
- Organizer UI: Purchase bulk tickets for team/sponsors
- Redemption flow: Student enters code → ticket assigned
- Bulk discount pricing
- CSV export of bulk ticket codes

**Priority:** 🟢 Low (individual tickets work)

**Effort:** 1 week (UI + redemption flow + testing)

---

### 🟢 Admin Analytics Dashboard

**Schema:** `admin_analytics` and `event_logs` tables exist (migration 22)

**What Exists:**
- Tables track: daily signups, events created, tickets sold, total revenue
- Event logs: Every action logged (registration, payment, check-in)

**What's Missing:**
- Admin dashboard: Charts (Recharts library installed)
- Metrics: Total users, revenue, top events, daily active users
- Filters: Date range, college, event category
- CSV export

**Priority:** 🟡 Medium (manual SQL queries work but tedious)

**Effort:** 1 week (dashboard UI + charts + queries)

---

### 🟢 Notifications System

**Schema:** `notifications` table exists (migration 09)

**What Exists:**
- Table with columns: `user_email`, `title`, `message`, `type`, `is_read`, `action_url`
- Types: "event_reminder", "payment_success", "certificate_ready", "volunteer_approved"

**What's Missing:**
- Frontend: Notification bell icon (with unread count)
- Push notifications (Firebase Cloud Messaging or web push)
- Email notifications (via Resend, SendGrid, etc.)
- Notification preferences (user can opt-out)

**Priority:** 🟡 Medium (would improve engagement)

**Effort:** 2 weeks (frontend UI + email service + push notifications)

---

## 3. Future Feature Ideas

### 💡 Social Features

**Ideas:**
- **Event Chat:** Live chat for attendees during event (Firebase Realtime Database or Supabase Realtime)
- **Attendee List:** See who else is attending (privacy toggle)
- **Share to Social Media:** Share event details to Twitter, Instagram, WhatsApp
- **Friend Invites:** Invite friends to event via email (referral system)

**Priority:** 🟢 Low (post-fest enhancements)

**Effort:** 2-4 weeks depending on scope

---

### 💡 Gamification

**Ideas:**
- **Badges/Achievements:** "Attended 5 events", "First Check-In", "Early Bird"
- **Leaderboard:** Most events attended, most volunteer hours
- **Points System:** Earn points for attending, volunteering → redeem for merch/discounts
- **Streaks:** Attend events X days in a row

**Priority:** 🟢 Low (fun but not critical)

**Effort:** 2-3 weeks (badge system + points tracking + UI)

---

### 💡 Advanced Analytics

**Ideas:**
- **Heatmaps:** Which events are most popular by time/day
- **Drop-Off Analysis:** Where users abandon registration flow
- **A/B Testing:** Test different event page layouts
- **Predictive Analytics:** Forecast attendance based on past events

**Priority:** 🟢 Low (manual analysis sufficient for now)

**Effort:** 3-4 weeks (analytics infrastructure + ML models)

---

### 💡 Multi-Language Support

**Ideas:**
- Support Hindi, Tamil, Telugu, etc.
- i18n library (next-intl, react-i18next)
- Translation management (Lokalise, Crowdin)

**Priority:** 🟢 Low (most users comfortable with English)

**Effort:** 2 weeks (i18n setup + translations)

---

### 💡 Event Waitlist

**Ideas:**
- If event full, user can join waitlist
- If someone cancels, waitlist user gets ticket automatically
- Email notification: "Spot available in [event name]!"

**Priority:** 🟡 Medium (helpful for high-demand events)

**Effort:** 1 week (waitlist table + auto-allocation logic + emails)

---

### 💡 Ticket Transfers

**Ideas:**
- User can transfer ticket to friend (change email)
- Admin/organizer approval required
- Transfer history tracked

**Priority:** 🟢 Low (users can forward email)

**Effort:** 1 week (transfer UI + approval flow)

---

### 💡 QR Code Check-In App (Mobile)

**Ideas:**
- Native mobile app (React Native) for organizers
- Faster QR scanning (device camera)
- Offline mode (IndexedDB + sync)
- Better UX than web app on mobile

**Priority:** 🟡 Medium (web app works but native is better)

**Effort:** 4-6 weeks (React Native app + testing)

---

## 4. Technical Debt & Improvements

### 🔴 Critical Fixes (Pre-Fest)

1. **Enable RLS on users and payments tables**
   - Current: RLS not enabled → data breach risk
   - Fix: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
   - Effort: 1 hour + testing

2. **Add UNIQUE constraint on registrations(event_id, user_email)**
   - Current: Duplicate registrations possible
   - Fix: `ALTER TABLE registrations ADD CONSTRAINT unique_registration UNIQUE (event_id, user_email);`
   - Effort: 30 minutes

3. **Implement Razorpay Webhooks**
   - Current: Client-side handler only → lost payments if browser closed
   - Fix: See [Partially Implemented Features](#partially-implemented-features)
   - Effort: 1 week

4. **Add sponsor role to users.role CHECK constraint**
   - Current: Code uses 'sponsor' role but database doesn't allow it
   - Fix: `ALTER TABLE users DROP CONSTRAINT users_role_check; ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('student', 'organizer', 'admin', 'sponsor'));`
   - Effort: 15 minutes

5. **Reconcile revenue split rates (10-15% vs 20%)**
   - Current: Code uses 10-15%, database function uses 20%
   - Fix: Decide on one rate, update both
   - Effort: 1 hour (decision + code change)

---

### 🟡 High-Priority Improvements

1. **Add missing indexes**
   - `payments(student_email, event_id, status)`
   - `registrations(user_email)`
   - `volunteer_applications(event_id, status)`
   - Effort: 1 hour + testing

2. **Implement idempotency keys in payment flow**
   - Prevent duplicate registrations on retry
   - Razorpay order_id as idempotency key
   - Effort: 2 days

3. **Rate limiting on auth endpoints**
   - Prevent brute-force login attempts
   - Use Upstash Redis (already installed)
   - Effort: 1 day

4. **Password reset flow**
   - Current: Not documented/implemented
   - NextAuth supports password reset emails
   - Effort: 2-3 days (email service + UI + testing)

5. **Health check endpoint**
   - `/api/health` → Returns 200 if app alive
   - Use for uptime monitoring
   - Effort: 30 minutes

---

### 🟢 Nice-to-Have Improvements

1. **Code splitting & lazy loading**
   - Reduce initial bundle size
   - Lazy load admin/organizer dashboards (not needed by students)
   - Effort: 2-3 days

2. **Image optimization**
   - Use Next.js Image component everywhere
   - WebP format with fallback
   - Effort: 1 week (audit + replace)

3. **Database query optimization**
   - Use `select('column1, column2')` instead of `select('*')`
   - Add database views for complex queries
   - Effort: 1 week (audit + optimize)

4. **Error boundaries (React)**
   - Catch frontend errors gracefully
   - Show friendly error page instead of blank screen
   - Effort: 1 day

5. **Automated testing**
   - Unit tests (Jest)
   - Integration tests (Playwright, Cypress)
   - Load tests (k6, Artillery)
   - Effort: 2-4 weeks (setup + write tests)

---

## Feature Priority Matrix

| Feature | Priority | Effort | Impact | Recommendation |
|---------|----------|--------|--------|----------------|
| RLS on users/payments | 🔴 CRITICAL | 1 hour | 🔴 HIGH | **DO BEFORE FEST** |
| UNIQUE constraint on registrations | 🔴 CRITICAL | 30 min | 🔴 HIGH | **DO BEFORE FEST** |
| Razorpay Webhooks | 🔴 HIGH | 1 week | 🔴 HIGH | **DO BEFORE FEST** |
| Event Capacity Enforcement | 🔴 HIGH | 2-3 days | 🔴 HIGH | **DO BEFORE FEST** |
| Batch Check-In API | 🟡 MEDIUM | 1-2 days | 🟡 MEDIUM | Post-Fest Sprint 1 |
| Certificate Performance | 🟡 MEDIUM | 1-2 weeks | 🟡 MEDIUM | Test first, fix if slow |
| Event Cancellation/Refunds | 🟡 MEDIUM | 1 week | 🟡 MEDIUM | Post-Fest Sprint 2 |
| Admin Analytics Dashboard | 🟡 MEDIUM | 1 week | 🟢 LOW | Post-Fest Sprint 2 |
| Notifications System | 🟡 MEDIUM | 2 weeks | 🟡 MEDIUM | Post-Fest Sprint 3 |
| Event Recommendations | 🟢 LOW | 1 week | 🟢 LOW | Nice-to-have |
| Geolocation | 🟢 LOW | 1 week | 🟢 LOW | Nice-to-have |
| Bulk Tickets | 🟢 LOW | 1 week | 🟢 LOW | Nice-to-have |
| Social Features | 🟢 LOW | 2-4 weeks | 🟢 LOW | Future roadmap |
| Gamification | 🟢 LOW | 2-3 weeks | 🟢 LOW | Future roadmap |

---

## Post-Fest Roadmap

### Sprint 1 (2 weeks after fest)
- Fix: Sponsor role constraint
- Fix: Revenue split reconciliation
- Feature: Batch check-in API
- Feature: Health check endpoint
- Improvement: Add missing indexes

### Sprint 2 (1 month after fest)
- Feature: Event cancellation + refunds
- Feature: Admin analytics dashboard
- Improvement: Idempotency keys
- Improvement: Rate limiting

### Sprint 3 (2 months after fest)
- Feature: Notifications system (email + push)
- Feature: Certificate performance (background queue)
- Feature: Password reset flow
- Testing: Automated tests (unit + integration)

### Future (3+ months)
- Event recommendations
- Geolocation + map view
- Social features (chat, attendee list)
- Mobile app (React Native)

---

**END OF FUTURE_FEATURES.md**
