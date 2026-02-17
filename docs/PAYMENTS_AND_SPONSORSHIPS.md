# PAYMENTS_AND_SPONSORSHIPS.md

> **Status:** Production System Documentation  
> **Last Updated:** February 17, 2026  
> **Payment Gateway:** Razorpay

---

## Overview

Happenin uses **Razorpay** for payment processing across two domains:
1. **Ticket Payments** (student → organizer)
2. **Sponsorship Payments** (sponsor → organizer)

**Payment Modes:**
- Razorpay Online Payments (ticket purchases, sponsorships)
- Manual Payments (sponsorships via outside-app transfers)

---

## Table of Contents

1. [Razorpay Integration](#1-razorpay-integration)
2. [Ticket Payment Flow](#2-ticket-payment-flow)
3. [Bulk Ticket Payments](#3-bulk-ticket-payments)
4. [Sponsorship Payment Flow](#4-sponsorship-payment-flow)
5. [Payment Verification](#5-payment-verification)
6. [Revenue Splits](#6-revenue-splits)
7. [Refunds & Disputes](#7-refunds--disputes)
8. [Security & Compliance](#8-security--compliance)

---

## 1. Razorpay Integration

### Configuration

**File:** [frontend/src/lib/razorpay.ts](frontend/src/lib/razorpay.ts)

```typescript
import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});
```

---

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `RAZORPAY_KEY_ID` | Razorpay API key (server-side) | ✅ YES |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (server-side) | ✅ YES |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay key (client-side checkout) | ✅ YES |

**⚠️ CRITICAL:** Never expose `RAZORPAY_KEY_SECRET` to client. Only use `NEXT_PUBLIC_RAZORPAY_KEY_ID` in browser.

---

### Razorpay SDK Versions

**Server-Side:** `razorpay` npm package (Node.js SDK)  
**Client-Side:** Razorpay Checkout.js (loaded via CDN)

**Checkout Script:**
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 2. Ticket Payment Flow

### Step-by-Step Flow

```
1. Student browses event → Clicks "Register"
2. Frontend calls POST /api/payments/create-order
   - Body: { eventId }
3. Backend validates:
   - User is authenticated (NextAuth session)
   - Student profile is complete (full_name, dob, college_name, college_email)
   - Event exists and is not closed
4. Backend creates Razorpay order:
   - Amount: event.price * 100 (paise)
   - Currency: INR
   - Receipt: custom ID
5. Backend returns { orderId, amount, eventDetails }
6. Frontend opens Razorpay Checkout modal
7. User completes payment (UPI/Card/NetBanking)
8. Razorpay webhook → POST /api/payments/verify
9. Backend verifies signature (HMAC SHA256)
10. Backend updates:
   - payments table: status='success'
   - registrations table: INSERT new registration
11. Frontend shows success message + ticket
```

---

### API Endpoint: Create Order

**Route:** `POST /api/payments/create-order`  
**File:** [frontend/src/app/api/payments/create-order/route.ts](frontend/src/app/api/payments/create-order/route.ts)

**Request Body:**
```json
{
  "eventId": "uuid"
}
```

**Authentication:** NextAuth session required  
**Role:** `student` (implicit, but not explicitly checked in code)

---

#### Validation Steps

1. **Profile Completeness Check:**
   ```typescript
   const { data: profile } = await supabase
     .from("student_profiles")
     .select("full_name, dob, college_name, college_email")
     .eq("student_email", studentEmail)
     .single();

   const required = ["full_name", "dob", "college_name", "college_email"];
   const missing = required.some((k) => !profile[k]);
   
   if (missing) {
     return { error: "Profile incomplete" };
   }
   ```

2. **Event Validation:**
   - Event exists
   - Event is not cancelled
   - Registrations are open

3. **Duplicate Registration Check:**
   ```typescript
   const { data: existing } = await supabase
     .from("registrations")
     .select("*")
     .eq("event_id", eventId)
     .eq("user_email", studentEmail)
     .single();

   if (existing) {
     return { error: "Already registered" };
   }
   ```

---

#### Razorpay Order Creation

```typescript
const order = await razorpay.orders.create({
  amount: finalPrice * 100, // Convert rupees to paise
  currency: "INR",
  receipt: `evt_${eventId}_${Date.now()}`,
  notes: {
    eventId,
    studentEmail,
  },
});
```

**Response:**
```json
{
  "orderId": "order_xyz123",
  "amount": 50000,
  "currency": "INR",
  "eventId": "uuid",
  "eventTitle": "Hackathon 2026"
}
```

---

### Client-Side Checkout

**File:** [frontend/src/app/dashboard/student/page.tsx](frontend/src/app/dashboard/student/page.tsx) (inferred from grep results)

```typescript
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: orderData.amount,
  currency: "INR",
  order_id: orderData.orderId,
  name: "Happenin",
  description: orderData.eventTitle,
  handler: async function (response) {
    // Send payment details to verification endpoint
    await fetch("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        eventId: orderData.eventId,
      }),
    });
  },
  prefill: {
    email: session.user.email,
  },
};

const rzp = new Razorpay(options);
rzp.open();
```

---

## 3. Bulk Ticket Payments

### Overview

Bulk ticket purchases allow users to buy multiple tickets at discounted rates (e.g., "Group of 10" package).

**Tables Involved:**
- `bulk_ticket_packs` (organizer creates packs)
- `bulk_ticket_purchases` (user purchases pack)
- `bulk_tickets` (individual tickets generated)

---

### Bulk Ticket Flow

```
1. Organizer creates bulk pack:
   - POST /api/bulk-tickets (inferred)
   - quantity=10, base_price=500, bulk_price=450
2. Student browses bulk packs for event
3. Student clicks "Buy Group Pack"
4. Payment flow similar to regular tickets:
   - Create Razorpay order for (bulk_price * quantity)
5. On payment success:
   - INSERT into bulk_ticket_purchases
   - Generate 'quantity' rows in bulk_tickets table
   - Each ticket gets unique ticket_number
6. Student can assign tickets to others (assigned_to_email)
7. Each ticket can be checked in independently
```

---

### Bulk Ticket Schema (Recap)

**bulk_ticket_packs:**
- Discount: `(base_price - bulk_price) / base_price * 100`
- Inventory: `available_count = quantity - sold_count` (generated column)

**bulk_tickets:**
- Status: `available` → `assigned` → `used`
- QR Code: `qr_code_data` field for check-in

⚠️ **WARNING:** Bulk ticket payment integration not explicitly documented in code. API routes for bulk ticket purchases need verification.

---

## 4. Sponsorship Payment Flow

### Razorpay Flat-Fee Sponsorship System (NEW - February 2026)

As of February 2026, sponsorships are powered by **Razorpay Standard Orders** with predefined flat-fee packages:

**Available Packages:**
- **Digital Pack:** ₹10,000 (event-level logo on tickets, certificates, event page banner)
- **App Pack:** ₹25,000 (event-level + homepage rotating banner during fest period)
- **Fest Pack:** ₹50,000 (all-events + homepage placements + additional promotional coverage)

**Payment Flow:**
```
1. Sponsor browses sponsorship options at event detail page
2. Selects pack type (Digital/App/Fest)
3. Clicks "Sponsor Now" button
4. Frontend calls POST /api/sponsorships/create-order
   - Body: { eventId, packType, festId? }
5. Backend validates:
   - Sponsor role authenticated
   - Event sponsorship enabled
   - No active sponsorship for same pack/scope (duplicate check)
6. Backend creates Razorpay order:
   - Amount: Fixed (10000/25000/50000 paise)
   - Currency: INR
   - Receipt: custom ID
7. Backend stores order record with status='created'
8. Frontend loads Razorpay SDK dynamically
9. Opens Razorpay Checkout modal with order details
10. Sponsor completes payment (UPI/Card/NetBanking)
11. Razorpay handler calls POST /api/sponsorships/verify
12. Backend verifies HMAC-SHA256 signature (timing-safe comparison)
13. Backend checks for duplicates (razorpay_order_id, razorpay_payment_id)
14. Updates order: status='paid', visibility_active=true
15. Frontend shows success message
16. Sponsor logos instantly appear on event tickets, certificates, banners
```

---

### Sponsorship Pack Creation API

**Route:** `POST /api/sponsorships/create-order`  
**File:** [frontend/src/app/api/sponsorships/create-order/route.ts](frontend/src/app/api/sponsorships/create-order/route.ts)

**Authentication:** NextAuth session (sponsor role required)

**Request Body:**
```json
{
  "eventId": "uuid",
  "packType": "digital|app|fest",
  "festId": "uuid (optional, required if packType='fest')"
}
```

**Validation Steps:**
1. User is authenticated and has sponsor role
2. Event exists and `sponsorship_enabled=true`
3. Sponsor profile exists (`sponsors_profile` table)
4. No active sponsorship exists for same pack+scope combination

**Fixed Pricing (Server-Side Enforced):**
```typescript
const PACK_PRICES = {
  digital: 1000000,  // ₹10,000 in paise
  app: 2500000,      // ₹25,000 in paise
  fest: 5000000,     // ₹50,000 in paise
};

const amount = PACK_PRICES[packType];
// ✅ No client override possible
```

---

**Response:**
```json
{
  "orderId": "order_xyz123",
  "amount": 1000000,
  "currency": "INR",
  "orderRecordId": "uuid",
  "packType": "digital",
  "eventId": "uuid"
}
```

---

### Sponsorship Payment Verification API

**Route:** `POST /api/sponsorships/verify`  
**File:** [frontend/src/app/api/sponsorships/verify/route.ts](frontend/src/app/api/sponsorships/verify/route.ts)

**Authentication:** NextAuth session (sponsor role required)

**Signature Verification Logic:**
```typescript
import crypto from "crypto";

const {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
} = await req.json();

// Generate expected signature
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

// Timing-safe comparison (prevents timing attacks)
const sigA = Buffer.from(expectedSignature);
const sigB = Buffer.from(razorpay_signature);

if (!crypto.timingSafeEqual(sigA, sigB)) {
  return { error: "Invalid signature" };
}
```

**Idempotency & Duplicate Detection:**
```typescript
// Check if already paid (handles retries gracefully)
const { data: existing } = await supabase
  .from("sponsorship_orders")
  .select("*")
  .eq("razorpay_order_id", razorpay_order_id)
  .single();

if (existing?.status === "paid") {
  // Already processed - return success for retry safety
  return { success: true, message: "Payment already verified" };
}
```

**Status Update:**
```typescript
// Update order to paid and activate visibility
await supabase
  .from("sponsorship_orders")
  .update({
    status: "paid",
    visibility_active: true,
    razorpay_payment_id,
    razorpay_signature_verified: true,
  })
  .eq("id", orderRecordId);
```

**Response:**
```json
{
  "success": true,
  "orderId": "uuid",
  "status": "paid",
  "message": "Sponsorship activated"
}
```

---

### Sponsorship Orders List API

**Route:** `GET /api/sponsorships/orders`  
**File:** [frontend/src/app/api/sponsorships/orders/route.ts](frontend/src/app/api/sponsorships/orders/route.ts)

**Authentication:** Required (role-aware filtering)

**Role-Based Filtering:**
- **Sponsor:** Sees only their own orders
- **Organizer:** Sees orders for events they organize
- **Admin:** Sees all orders

**Query Params:**
- `event_id` (optional): Filter by event
- `fest_id` (optional): Filter by fest
- `status` (optional): Filter by status (created|paid|failed)

**Response:**
```json
{
  "deals": [
    {
      "id": "uuid",
      "sponsor_email": "sponsor@example.com",
      "event_id": "uuid",
      "fest_id": null,
      "pack_type": "digital",
      "amount": 1000000,
      "status": "paid",
      "visibility_active": true,
      "organizer_payout_settled": false,
      "created_at": "2026-02-09T...",
      "events": { "id": "uuid", "title": "TechFest 2026" },
      "fests": null,
      "sponsors_profile": {
        "company_name": "TechCorp Inc",
        "email": "sponsor@example.com",
        "website_url": "https://techcorp.com",
        "is_active": true
      }
    }
  ]
}
```

---

### Sponsor Logo Upload

**Route:** `POST /api/sponsor/upload-logo`  
**File:** [frontend/src/app/api/sponsor/upload-logo/route.ts](frontend/src/app/api/sponsor/upload-logo/route.ts)

**Authentication:** NextAuth session (sponsor role)

**Validation:**
- File type: PNG, SVG only (MIME validation)
- Max size: 2MB
- Directory: `sponsor-assets/{sponsor_email_hash}/`

**Request:**
```typescript
FormData with key "logo" (File)
```

**Response:**
```json
{
  "success": true,
  "logoUrl": "https://supabase-url.com/storage/v1/object/public/sponsor-assets/..."
}
```

---

## Legacy: Manual Sponsorship System (Deprecated)

⚠️ **DEPRECATED:** The old manual sponsorship payment system (offline bank transfers) is **no longer in use** as of February 2026.

**What changed:**
- Old endpoint `POST /api/sponsorship/deals` - **DELETED**
- Old status values: pending/verified/rejected - **REPLACED** with created/paid/failed
- Old table reference: `sponsorship_deals` - **REPLACED** with `sponsorship_orders`

**Why:**
- Manual sponsorship flow was slow and required admin intervention
- Razorpay integration ensures instant payment verification
- Reduced friction for sponsor onboarding
- Automated visibility activation without admin approval delays

**Note:** 
- Some internal components (`SponsorshipPayout`, `AdminSponsorshipPayouts`) still reference the old `sponsorship_deals` table for historical organizer payout tracking
- These are maintained for backward compatibility and analytics
- New sponsorships exclusively use `sponsorship_orders` table
- Current endpoints: `POST /api/sponsorships/create-order`, `POST /api/sponsorships/verify`

---

## 5. Payment Verification

### Razorpay Signature Verification

**Route:** `POST /api/payments/verify`  
**File:** [frontend/src/app/api/payments/verify/route.ts](frontend/src/app/api/payments/verify/route.ts)

**Purpose:** Verify payment authenticity using HMAC SHA256

---

### Verification Logic

```typescript
import crypto from "crypto";

const {
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  eventId,
  studentEmail,
} = await req.json();

// Generate expected signature
const expectedSignature = crypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest("hex");

// Compare signatures (constant-time comparison)
const sigA = Buffer.from(expectedSignature);
const sigB = Buffer.from(razorpay_signature);

if (!crypto.timingSafeEqual(sigA, sigB)) {
  return { error: "Invalid signature" };
}

// Signature valid → Update database
await supabase.from("payments").update({
  status: "success",
  razorpay_payment_id,
}).eq("razorpay_order_id", razorpay_order_id);

await supabase.from("registrations").insert({
  event_id: eventId,
  user_email: studentEmail,
  status: "registered",
});
```

**⚠️ CRITICAL:** Never skip signature verification. This prevents fake payment confirmations.

---

### Failure Handling

```typescript
if (verificationFailed) {
  await supabase.from("payments").update({
    status: "failed",
  }).eq("razorpay_order_id", razorpay_order_id);
  
  return { error: "Payment verification failed" };
}
```

---

## 6. Revenue Splits

### Ticket Payments

**100% to Organizer** (no platform fee currently)

⚠️ **OBSERVATION:** No platform fee deduction observed in ticket payment flow. Entire `event.price` goes to organizer.

---

### Sponsorship Payments (Razorpay Flat-Fee)

**Direct Payment to Organizer**
- Sponsor pays fixed amount (₹10,000 / ₹25,000 / ₹50,000)
- **100% goes to organizer** (no platform deduction)
- Automatic payment verification via Razorpay signature
- Instant visibility activation

**Example:**
- Sponsor pays: ₹10,000 (Digital Pack)
- Organizer receives: ₹10,000
- Platform fee: ₹0 (currently)

**Note:** Future versions may introduce platform commission. Currently, all sponsorship revenue goes directly to event organizer.

---

## 7. Refunds & Disputes

### Ticket Refunds

**Status Field:** `payments.status` can be `refunded`  
**Reason Field:** `event_cancellations.refund_status`

**Flow (Inferred):**
```
1. Event is cancelled
2. Organizer triggers refund process
3. Admin initiates Razorpay refund API call:
   - rzp.refund.create({ payment_id, amount })
4. Update payments.status='refunded'
5. Update event_cancellations.refund_status='completed'
6. Optional: Delete registration or mark cancelled
```

⚠️ **WARNING:** Refund API integration code not found. May be manual process via Razorpay dashboard.

---

### Payment Disputes

**Table:** `payment_disputes` (migration 22)

**Fields:**
- `payment_id`: disputed payment
- `student_email`: disputer
- `reason`: dispute reason
- `status`: open, investigating, resolved, refunded
- `admin_notes`: internal notes

**Access:** Admin-only (RLS policy)

**Flow:**
```
1. Student reports payment issue (double charge, no ticket, etc.)
2. Admin reviews dispute in /dashboard/admin
3. Admin investigates with Razorpay records
4. Resolution:
   - Refund issued → status='refunded'
   - No action → status='resolved'
```

---

## 8. Security & Compliance

### ✅ **Strong Security Practices**

1. **Signature Verification:** All payments verified with HMAC SHA256
2. **Server-Side Secrets:** `RAZORPAY_KEY_SECRET` never exposed to client
3. **Timing-Safe Comparison:** `crypto.timingSafeEqual()` prevents timing attacks
4. **Profile Validation:** Ensures complete student data before payment
5. **Duplicate Check:** Prevents double registration

---

### ⚠️ **Security Gaps**

#### 1. No RLS on Payments Table
**Risk:** Students could query other users' payment records via Supabase client  
**Mitigation:** Enable RLS with policy:
```sql
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT
  USING (student_email = auth.jwt()->>'email');
```

---

#### 2. Payment Amount Not Re-Validated
**Risk:** Client could manipulate `eventId` in /create-order request
**Current Mitigation:** Backend fetches event.price from database (good!)
**Additional Risk:** Time-of-check vs time-of-use if event price changes mid-flow

---

#### 3. No Webhook Verification
**Risk:** If Razorpay sends webhooks, they may not be verified
**Status:** ⚠️ Webhook endpoint not found in codebase. Relies on client-side handler.
**Recommendation:** Implement webhook verification for server-to-server payment confirmation

---

#### 4. Sponsorship Pricing Is Server-Enforced ✅
**Status:** SECURE - Fixed pack prices hardcoded in backend
**Benefit:** Clients cannot override sponsorship amounts
**Implementation:** `PACK_PRICES` constant in `/api/sponsorships/create-order`

---

### 🔒 **Pre-Fest Checklist**

**Ticket Payments:**
- [ ] Test Razorpay payment flow end-to-end (test mode → live mode)
- [ ] Verify signature verification works correctly
- [ ] Enable RLS on `payments` table
- [ ] Test refund flow (manual or automated)
- [ ] Test payment failure scenarios (card declined, UPI timeout)
- [ ] Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is live key (not test)
- [ ] Ensure Razorpay account has sufficient balance for refunds

**Sponsorship Payments (NEW):**
- [ ] Test sponsorship order creation (all pack types: digital/app/fest)
- [ ] Verify HMAC-SHA256 signature verification works
- [ ] Test idempotent verification (retry payments)
- [ ] Verify sponsor logos appear on tickets/certificates/banners after payment
- [ ] Test role-based access control (sponsors see own orders, organizers see their events' orders)
- [ ] Verify duplicate prevention (cannot buy same pack twice for same event)
- [ ] Test organizer payout settlement toggle in admin dashboard
- [ ] Verify visibility can be toggled on/off by admin
- [ ] Load test sponsorship endpoints with multiple concurrent payments

---

## Payment Flow Diagrams

### Ticket Purchase Flow (ASCII)

```
Student             Frontend                 Backend                 Razorpay             Database
   |                   |                        |                       |                      |
   |--Click Register-->|                        |                       |                      |
   |                   |---POST /create-order-->|                       |                      |
   |                   |                        |---Validate Profile--->|                      |
   |                   |                        |<----------------------|                      |
   |                   |                        |---Fetch Event-------->|                      |
   |                   |                        |<----------------------|                      |
   |                   |                        |---Create Order------->|                      |
   |                   |                        |<--Order ID + Amount---|                      |
   |                   |<--Order Details--------|                       |                      |
   |<--Razorpay Modal--|                        |                       |                      |
   |                   |                        |                       |                      |
   |---Pay (UPI/Card)->|----------------------->|                       |                      |
   |                   |                        |                       |--Process Payment---->|
   |                   |                        |                       |<--Payment Success----|
   |                   |---POST /verify-------->|                       |                      |
   |                   |  (signature, IDs)      |                       |                      |
   |                   |                        |---Verify Signature--->|                      |
   |                   |                        |<--Valid/Invalid-------|                      |
   |                   |                        |---Update payment------>                      |
   |                   |                        |---Create registration->                      |
   |                   |<--Success--------------|                       |                      |
   |<--Ticket Shown----|                        |                       |                      |
```

---

### Manual Sponsorship Flow (ASCII)

```
Sponsor             Organizer               Admin                  Database
   |                   |                      |                        |
   |--Contact--------->|                      |                        |
   |<--Negotiate-------|                      |                        |
   |                   |                      |                        |
   |===Pay Outside App (Bank/UPI)============>|                        |
   |                   |                      |                        |
   |--Send Receipt---->|                      |                        |
   |                   |--Upload Proof------->|                        |
   |                   |--Mark Confirmed----->|---INSERT sponsorship_deals-->
   |                   |                      |   (status='confirmed')
   |                   |                      |   (facilitation_fee_paid=false)
   |                   |                      |                        |
   |                   |<--Features Unlock----|                        |
   | (Logo on tickets, banners, etc.)         |                        |
   |                   |                      |                        |
   |                   |--Later: Pay Platform (20%)------------------>|
   |                   |                      |---Mark facilitation_fee_paid=true-->
```

---

**END OF PAYMENTS_AND_SPONSORSHIPS.md**
