# PAYMENTS_AND_SPONSORSHIPS.md

> **Status:** Final Revenue Architecture (Production Target)
> **Last Updated:** February 26, 2026
> **Gateway:** Razorpay Route + Webhook Confirmation

---

## Final Revenue Model

Happenin now uses exactly three revenue streams:

1. **Ticket Commission**
   - Student pays ticket price `P`
   - Organizer gets `95%` of `P` via Razorpay Route transfer
   - Platform gets `5%` of `P`
   - Gateway fee is absorbed from platform share only

2. **Digital Visibility Packs**
   - Pack prices:
     - `silver`: ₹10,000
     - `gold`: ₹25,000
     - `platinum`: ₹1,00,000
   - Split:
     - Organizer: `20%`
     - Platform: `80%`
   - Gateway fee is absorbed from platform share only

3. **Featured Event Boost**
   - Flat price: ₹1,000
   - Platform keeps `100%`
   - No organizer transfer

---

## Deprecated / Removed Logic

The following are deprecated and must not be used for new payments:

- Legacy sponsorship order logic under `sponsorship_orders` for new digital pack sales
- Legacy sponsorship verify route as primary settlement path
- Legacy direct/manual sponsorship business model
- Legacy ticket create-order route as final ticket payment entrypoint

New canonical entrypoints are under dedicated `/api/payments/*` routes listed below.

---

## 1) Ticket Commission

### API

- **Create Order:** `POST /api/payments/create-ticket-order`
- **Webhook:** `POST /api/payments/webhook`

### Create Ticket Order Flow

1. Verify NextAuth session
2. Fetch event + organizer payout account
3. Compute:
   - `organizerAmount = 0.95 * ticketPrice`
   - `platformAmount = 0.05 * ticketPrice`
4. Create Razorpay order with transfer to organizer for exact `organizerAmount`
5. Save pending registration (`status='pending'`, order metadata)
6. Return order payload to frontend checkout

### Webhook Settlement

On `payment.captured`:

- Verify Razorpay webhook signature
- Idempotently map `razorpay_order_id` to pending registration
- Mark registration `confirmed`
- Persist transaction log row

---

## 2) Digital Visibility Packs

### API

- **Create Order:** `POST /api/payments/create-digital-pack-order`
- **Webhook:** `POST /api/payments/webhook`

### Pack Rules

- Fest scope:
  - Only one active `platinum` per fest
- Event scope:
  - Max one active `silver` or `gold` per event
- Admin approval required before `visibility_active=true`

### Create Digital Pack Order Flow

1. Verify sponsor role from NextAuth session
2. Validate event/fest eligibility + uniqueness constraints
3. Compute:
   - `organizerShare = 0.20 * packPrice`
   - `platformShare = 0.80 * packPrice`
4. Create Razorpay order with route transfer for exact `organizerShare`
5. Insert `digital_visibility_packs` row with:
   - `payment_status='pending'`
   - `visibility_active=false`
6. Return checkout payload

### Webhook Settlement

On `payment.captured`:

- Verify signature and idempotency
- Mark `payment_status='paid'`
- Keep `visibility_active=false` until admin approval

Admin approval transition:

- `visibility_active=false -> true` only by admin action

---

## 3) Featured Event Boost

### API

- **Create Order:** `POST /api/payments/create-featured-boost-order`
- **Webhook:** `POST /api/payments/webhook`

### Constraints

- Organizer role only
- Event can be boosted only during window:
  - from 7 days before event date
  - until 1 day before event date (event day excluded)
- Max 5 active featured boosts per college

### Settlement

- Flat ₹1,000
- No transfer
- Platform receives 100%
- Webhook activates boost row on payment capture

---

## Database Schema

### `digital_visibility_packs`

- `id`
- `sponsor_id`
- `event_id` (nullable)
- `fest_id` (nullable)
- `pack_type` (`silver | gold | platinum`)
- `amount`
- `organizer_share`
- `platform_share`
- `payment_status`
- `visibility_active`
- `admin_approved`
- `razorpay_order_id`
- `razorpay_payment_id`
- `created_at`
- `updated_at`

### `featured_events`

- `id`
- `event_id`
- `college_id`
- `start_date`
- `end_date`
- `payment_status`
- `active`
- `razorpay_order_id`
- `razorpay_payment_id`
- `created_at`
- `updated_at`

### `payment_transactions` (audit log)

- `id`
- `stream_type` (`ticket | digital_pack | featured_boost`)
- `source_id`
- `event_id` (nullable)
- `fest_id` (nullable)
- `payer_email`
- `organizer_email` (nullable)
- `gross_amount`
- `organizer_amount`
- `platform_amount`
- `gateway_fee_amount` (nullable)
- `razorpay_order_id`
- `razorpay_payment_id`
- `status`
- `created_at`

### `webhook_events` (idempotency)

- `id`
- `event_id` (Razorpay event id)
- `event_type`
- `payload`
- `processed_at`

---

## RLS & Security Requirements

- Role checks on all creation/update endpoints
- Duplicate prevention for all payment streams
- Enforce uniqueness constraints at DB level
- Idempotent webhook processing via stored webhook event id
- Admin-only approval to activate digital visibility
- Transaction audit row required for every successful capture

---

## Frontend Prioritization

### Homepage Ordering

1. Platinum banners
2. Active featured events
3. Normal events

### Event Page

- If Silver/Gold pack active:
  - show sponsor logo
  - inject event banner slot

### Tickets and Certificates

- If digital pack active for related event/fest:
  - inject sponsor logo dynamically
- Else:
  - render clean template

---

## Canonical New Routes

- `POST /api/payments/create-ticket-order`
- `POST /api/payments/create-digital-pack-order`
- `POST /api/payments/create-featured-boost-order`
- `POST /api/payments/webhook`

---

## Implementation Checklist

- [ ] SQL schema migration for new tables + constraints
- [ ] RLS policy migration for all new tables
- [ ] New payment creation routes
- [ ] Unified webhook with idempotency
- [ ] Admin approval controls for digital visibility
- [ ] Homepage ranking updates
- [ ] Event page sponsor injection updates
- [ ] Ticket/certificate sponsor logo injection
- [ ] Remove/disable deprecated legacy revenue routes
