# CRITICAL_FLOWS.md

> **Status:** Production System Documentation  
> **Last Updated:** February 17, 2026  
> **Purpose:** Document critical user journeys and their dependencies

---

## Overview

This document details the **critical end-to-end flows** that MUST work flawlessly during fest days when 10,000+ users are active simultaneously.

---

## Table of Contents

1. [Student Registration & Event Discovery](#1-student-registration--event-discovery)
2. [Ticket Purchase Flow](#2-ticket-purchase-flow)
3. [Event Check-In Flow (Fest Day)](#3-event-check-in-flow-fest-day)
4. [Organizer Event Creation](#4-organizer-event-creation)
5. [Certificate Generation & Distribution](#5-certificate-generation--distribution)
6. [Volunteer Application & Approval](#6-volunteer-application--approval)
7. [Fest Submission & Approval](#7-fest-submission--approval)
8. [Sponsorship Deal Flow](#8-sponsorship-deal-flow)
9. [Banner Management Flow](#9-banner-management-flow)
10. [WhatsApp Group Join Flow](#10-whatsapp-group-join-flow)

---

## 1. Student Registration & Event Discovery

### User Story
> "As a student, I want to create an account, discover events near me, and register for events I'm interested in."

---

### Flow: Account Creation

**Steps:**
```
1. Student visits /auth
2. Chooses signup method:
   - Option A: Email/Password
   - Option B: Google OAuth
3A. Email/Password:
   - Enters email, password, role='student'
   - POST /api/auth/signup
   - Password hashed with bcrypt
   - INSERT into users table
   - Auto-login via NextAuth
3B. Google OAuth:
   - Google consent screen
   - User approves
   - NextAuth creates user with role='student'
   - Empty password_hash (OAuth users don't need password)
4. Redirect to /dashboard/student
5. Profile incomplete banner shown
6. Student fills profile:
   - POST /api/student/profile
   - full_name, dob, college_name, college_email
   - INSERT into student_profiles
7. Profile complete → can register for events
```

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| NextAuth | Authentication | ❌ CRITICAL - Can't login |
| Supabase | User storage | ❌ CRITICAL - Can't create accounts |
| Google OAuth | OAuth login | 🟡 MODERATE - Email login still works |
| bcrypt | Password hashing | ❌ CRITICAL - Can't create password users |

---

### Flow: Event Discovery

**Steps:**
```
1. Student on /dashboard/student or /events
2. System fetches events from Supabase:
   - Query: SELECT * FROM events WHERE start_datetime > NOW()
   - Order by: start_datetime ASC
3. Filters applied (client-side or server-side):
   - Category
   - College
   - Price range
   - Distance (if geolocation enabled)
4. Student can:
   - View event details
   - Favorite event (POST /api/favorites)
   - Register for event (if free)
   - Purchase ticket (if paid)
5. Voice search:
   - Browser Web Speech API
   - Converts speech to text
   - Filters events by keyword
```

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| Supabase | Event data | ❌ CRITICAL - No events shown |
| PostGIS | Nearby search | 🟡 MODERATE - Distance filter breaks |
| Web Speech API | Voice search | 🟢 LOW - Manual search still works |

---

## 2. Ticket Purchase Flow

### User Story
> "As a student, I want to buy a ticket for a paid event using UPI/Card."

---

### Flow Diagram

```
1. Student clicks "Register" on paid event
2. System checks:
   - User authenticated?
   - Profile complete? (full_name, dob, college_name, college_email)
   - Already registered?
   - Event full?
   - Registrations closed?
3. All checks pass → Initiate payment:
   - POST /api/payments/create-order { eventId }
4. Backend:
   - Fetch event.price from database
   - Create Razorpay order:
     * amount = event.price * 100 (paise)
     * currency = INR
     * receipt = evt_{eventId}_{timestamp}
   - Return { orderId, amount, eventDetails }
5. Frontend opens Razorpay Checkout modal:
   - key: NEXT_PUBLIC_RAZORPAY_KEY_ID
   - order_id: from backend
   - handler: callback function
6. User selects payment method (UPI/Card/NetBanking)
7. User completes payment
8. Razorpay calls frontend handler:
   - handler({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
9. Frontend calls POST /api/payments/verify:
   - Send all 3 Razorpay IDs + eventId + studentEmail
10. Backend verifies signature:
   - expected = HMAC_SHA256(order_id|payment_id, SECRET)
   - compare with razorpay_signature (timing-safe)
11. If valid:
   - UPDATE payments SET status='success', razorpay_payment_id=...
   - INSERT INTO registrations (event_id, user_email, status='registered')
12. Frontend shows success message + ticket number
13. Student can view ticket in /dashboard/student
```

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| Razorpay | Payment processing | ❌ CRITICAL - No ticket sales |
| Supabase | Event/payment storage | ❌ CRITICAL - Data loss |
| NextAuth | User identification | ❌ CRITICAL - Can't identify buyer |
| Profile API | Profile validation | ❌ CRITICAL - Incomplete data |

---

### Failure Scenarios

| Scenario | System Behavior | User Experience |
|----------|-----------------|-----------------|
| Payment succeeds, verification fails | Payment in limbo, no registration | Show error, tell user to contact support |
| Network timeout during payment | Razorpay retries handler | May create duplicate registrations (need idempotency) |
| Database write fails after payment | Payment successful, no ticket | Admin manually reconciles via Razorpay dashboard |
| User closes modal before payment | Razorpay order expires | No harm, user can retry |

⚠️ **CRITICAL RISK:** No idempotency key found in payment flow. Duplicate registrations possible if user clicks "pay" multiple times.

---

## 3. Event Check-In Flow (Fest Day)

### User Story
> "As an organizer, I need to check in attendees at the event entrance using their ticket QR codes."

---

### Flow: QR Code Check-In

```
1. Attendee shows ticket QR code (on phone or printed)
2. Organizer scans QR code using:
   - Mobile camera app → manual entry
   - OR: Dedicated scanner in organizer dashboard
3. QR code contains:
   - registration_id (UUID)
   - OR: student_email + event_id
4. Organizer enters code or scans:
   - POST /api/organizer/checkin
   - Body: { registration_id } OR { email, eventId }
5. Backend validates:
   - Registration exists
   - Not already checked in
   - Organizer owns this event
6. Backend updates:
   - UPDATE registrations SET status='checked_in' WHERE id=...
7. Frontend shows:
   - ✅ Check-in successful
   - Attendee name + college
   - Audio/visual feedback
8. Real-time stats update:
   - Total checked in: X / Y
```

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| Supabase | Registration lookup | ❌ CRITICAL - Can't verify tickets |
| QR Scanner | Code reading | 🟡 MODERATE - Manual entry fallback |
| Real-time updates | Live stats | 🟢 LOW - Can refresh manually |

---

### Bulk Check-In (Performance)

**Challenge:** 1000+ attendees checking in over 30 minutes = 33 requests/min

**Optimization:**
- Batch check-ins: POST /api/organizer/checkin/batch { ids: [...] }
- Offline mode: Store check-ins locally, sync when online
- Database: Index on registrations(event_id, status)

⚠️ **PERFORMANCE RISK:** No batch check-in API found. Individual requests may bottleneck at scale.

---

## 4. Organizer Event Creation

### User Story
> "As an organizer, I want to create an event with all details, pricing, and schedule."

---

### Flow: Event Creation

```
1. Organizer navigates to /dashboard/organizer
2. Clicks "Create Event"
3. Fills multi-step form:
   - Basic Info: title, description, category
   - Schedule: start_datetime, end_datetime, venue
   - Pricing: price, allow_bulk_tickets
   - Registration: registration_close_datetime, max_attendees
   - Volunteers: needs_volunteers, volunteer_roles (JSONB)
   - Sponsorships: sponsorship_enabled, packages
   - Advanced: access_control (college/year restrictions)
4. Frontend validates:
   - Required fields filled
   - Dates are future dates
   - Price >= 0
5. POST /api/events/create
6. Backend:
   - Verify organizer_email from NextAuth session
   - Insert into events table
   - If sponsorship_enabled: Create default packages (bronze/silver/gold)
   - If access_control: Insert into event_access_control table
7. Return event_id
8. Redirect to /dashboard/organizer/events/{event_id}
9. Organizer can now:
   - Upload banner image
   - Create certificate template
   - Add custom sponsorship deliverables
   - Publish event
```

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| Supabase | Event storage | ❌ CRITICAL - Can't create events |
| NextAuth | Organizer verification | ❌ CRITICAL - Can't identify creator |
| File Upload | Banner images | 🟡 MODERATE - Can add later |

---

## 5. Certificate Generation & Distribution

### User Story
> "As an organizer, after the event, I want to generate and send certificates to all participants."

---

### Flow: Certificate Template Creation

```
1. Organizer goes to /dashboard/organizer/events/{eventId}/certificates
2. Clicks "Create Certificate Template"
3. Uploads base certificate image (PNG/JPG)
   - POST /api/organizer/certificate-template/upload-image
   - File → Supabase Storage (happenin-certificates bucket)
4. Interactive editor loads:
   - Certificate image shown
   - Organizer drags "Name" text box to position
   - Adjusts font, size, color, alignment
5. Preview with sample name
6. Save template:
   - POST /api/organizer/certificate-template/create
   - Body: {
       event_id, certificate_image_url,
       name_position_x, name_position_y,
       name_font_family, name_font_size, name_font_color,
       recipient_type: 'participant' | 'volunteer' | 'winner'
     }
   - INSERT into certificate_templates
7. Template saved, ready for generation
```

---

### Flow: Bulk Certificate Generation

```
1. After event ends, organizer clicks "Generate Certificates"
2. Selects recipients:
   - Option A: All registered participants
   - Option B: Only checked-in attendees
   - Option C: Upload CSV with names
3. Frontend sends POST /api/organizer/certificate-template/generate:
   - Body: { template_id, recipients: [{ name, email }] }
4. Backend queues certificate generation:
   - For each recipient:
     * Fetch certificate template
     * Overlay recipient name on image at (x, y)
     * Generate PDF/image
     * Upload to Supabase Storage
     * INSERT into certificate_recipients (status='generated')
     * INSERT into student_certificates (for student dashboard)
5. Backend sends email to each recipient:
   - Subject: "Your Certificate for {event_name}"
   - Body: Link to download certificate
6. Student receives email, downloads certificate
7. Certificate appears in /dashboard/student (Certificates tab)
```

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| Supabase Storage | Certificate files | ❌ CRITICAL - Can't store certificates |
| Image Processing | Certificate generation | ❌ CRITICAL - No certificates created |
| Email Service | Certificate delivery | 🟡 MODERATE - Can download from dashboard |
| PDF Generation | Certificate format | 🟡 MODERATE - Can use PNG instead |

---

### Performance Considerations

**Challenge:** 500 certificates × 2 seconds/cert = 16 minutes generation time

**Solutions:**
- Queue-based processing (background job)
- Progress bar for organizer
- Batch generation (10 at a time)
- Lazy generation (generate on-demand when student views)

⚠️ **PERFORMANCE RISK:** Synchronous generation will timeout. Verify background job implementation.

---

## 6. Volunteer Application & Approval

### User Story
> "As a student, I want to apply for volunteer roles, and as an organizer, I want to review and approve applications."

---

### Flow: Student Application

```
1. Student browses events with needs_volunteers=true
2. Clicks event → "Volunteer" tab shown
3. Views volunteer roles (from events.volunteer_roles JSONB):
   - Role: Registration Desk
   - Count needed: 5
   - Description: Check-in attendees
4. Clicks "Apply for Registration Desk"
5. Fills motivation statement (optional)
6. POST /api/volunteer/apply:
   - Body: { event_id, role, message }
7. Backend:
   - INSERT into volunteer_applications (status='pending')
8. Confirmation message: "Application submitted!"
9. Organizer receives notification (if enabled)
```

---

### Flow: Organizer Approval

```
1. Organizer goes to /dashboard/organizer/volunteers
2. Views pending applications:
   - Grouped by event
   - Shows student name, college, past volunteer experience
3. For each application:
   - View student's volunteer certificates
   - View motivation statement
   - Approve or Reject
4. On Approve:
   - POST /api/organizer/volunteers/approve
   - Body: { application_id }
   - UPDATE volunteer_applications SET status='approved'
   - INSERT into volunteer_assignments
5. On Reject:
   - UPDATE volunteer_applications SET status='rejected'
   - Optional: Add rejection_reason
6. Student receives notification
7. Approved volunteers shown on event page
```

---

## 7. Fest Submission & Approval

### User Story
> "As an organizer, I want to submit my event to a college fest for increased visibility."

---

### Flow: Submit to Fest

```
1. Organizer goes to event dashboard
2. Clicks "Submit to Fest"
3. Selects fest from dropdown (or searches)
4. Clicks "Submit"
5. POST /api/fests/submit:
   - Body: { fest_id, event_id }
6. Backend:
   - Verify organizer owns event
   - Verify fest is accepting submissions
   - INSERT into festival_submissions (status='pending')
7. Fest core team receives notification
8. Confirmation: "Submitted for review"
```

---

### Flow: Fest Team Approval

```
1. Fest core team member goes to /fests/{festId}/submissions
2. Views pending submissions:
   - Event title, organizer, date, description
3. For each submission:
   - Approve: status='approved' → event shown on fest page
   - Reject: status='rejected' + rejection_reason
4. UPDATE festival_submissions
5. Organizer receives notification
6. If approved:
   - Event appears on fest homepage
   - Event linked to fest in UI
   - Fest analytics include this event
```

---

## 8. Sponsorship Deal Flow

### User Story
> "As a sponsor, I want to sponsor an event and get my logo displayed on tickets and banners."

---

### Flow: Razorpay Online Sponsorship (NEW - Primary)

**Sponsorship Packages (Fixed Pricing):**
- Digital: ₹10,000/event (event-level visibility)
- App: ₹25,000/event (event-level + homepage banner during fest)
- Fest: ₹50,000/fest (all events + promotional placements)

**Step-by-Step:**
```
1. Sponsor browses event or fest details page
2. Views sponsorship package options:
   - Digital (₹10k) - Event page banner, tickets, certificates
   - App (₹25k) - All above + homepage rotating banner
   - Fest (₹50k) - All events + multiple placements
3. Selects package → Clicks "Sponsor Now"
4. POST /api/sponsorships/create-order
   - Body: { eventId, packType ('digital'|'app'|'fest'), festId? }
   - Backend validates:
     * Sponsor authenticated
     * Event sponsorship_enabled = true
     * No duplicate package (prevent duplicate buys)
   - Backend creates Razorpay order (fixed amount in paise)
   - Returns { orderId, amount, currency }
5. Frontend loads Razorpay SDK dynamically
6. Opens Razorpay Checkout modal (UPI/Card/NetBanking options)
7. Sponsor completes payment
8. Razorpay handler calls POST /api/sponsorships/verify
   - Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   - Backend verifies HMAC-SHA256 signature (timing-safe comparison)
   - Idempotent: Checks for duplicate by razorpay_order_id
   - Updates sponsorship_orders: status='paid', visibility_active=true
9. Frontend shows success message
10. Sponsor logos instantly appear on:
    - Event tickets (digital/app/fest)
    - Event certificates (digital/app/fest)
    - Event page banner (all)
    - Homepage rotating banner (app/fest, during fest period)
    - Additional placements (fest pack)
```

**Database Flow:**
```
sponsorship_orders table:
- status: 'created' → 'paid' (automatic on verify)
- visibility_active: false → true (automatic on verify)  
- organizer_payout_settled: false (admin toggles if needed)
- razorpay_order_id: unique prevention
- razorpay_payment_id: saved for reference
```

**Key Security Features:**
- ✅ Fixed pricing enforced server-side (no client override)
- ✅ HMAC-SHA256 signature verification (prevents fraud)
- ✅ Timing-safe comparison (prevents timing attacks)
- ✅ Idempotent verification (safe retries)
- ✅ Duplicate prevention (per pack/scope)

---

### Flow: Legacy Manual Sponsorship (Deprecated)

⚠️ **DEPRECATED as of February 2026**

Old flow (for reference only):
```
1. Sponsor contacts organizer offline
2. Negotiate package and amount
3. Sponsor pays organizer outside app (bank transfer, UPI, cash)
4. Organizer marks deal as confirmed in admin panel
5. Admin approves → sponsorship features activate
```

⚠️ **Why Deprecated:**
- Slow: Required organizer and admin intervention
- Manual: Prone to errors and miscommunication
- Delayed: Logo display happened after admin approval
- Why Replaced: Razorpay automation eliminates friction

---

## 9. Banner Management Flow

### User Story
> "As an organizer/sponsor, I want to create promotional banners, and as an admin, I need to approve them."

---

### Flow: Banner Creation

```
1. Organizer/Sponsor goes to banner creation page
2. Fills form:
   - Title, image upload
   - Type: fest / event / sponsor
   - Placement: home_top / home_mid / event_page
   - Link target: event or sponsor profile
   - Start/end date (optional)
3. POST /api/banners/create:
   - Upload image to Supabase Storage
   - INSERT into banners (status='pending')
4. Admin receives notification
5. Confirmation: "Banner submitted for review"
```

---

### Flow: Admin Approval

```
1. Admin goes to /dashboard/admin/banners
2. Views pending banners:
   - Image preview
   - Creator, type, placement
3. For each banner:
   - Approve: status='approved' → banner goes live
   - Reject: status='rejected' + reason
4. UPDATE banners SET status=..., approved_by=admin_email
5. Creator receives notification
6. If approved:
   - Banner shown on homepage/event page
   - Analytics tracking (views/clicks)
```

---

## Cross-Flow Dependencies

### Critical Shared Services

| Service | Used By | Failure Impact |
|---------|---------|----------------|
| **Supabase** | All flows | ❌ CRITICAL - Entire app breaks |
| **NextAuth** | All authenticated flows | ❌ CRITICAL - No user actions |
| **Razorpay** | Ticket purchase, sponsorship | ❌ CRITICAL - No payments |
| **Supabase Storage** | Certificates, banners, profiles | 🟡 MODERATE - Feature-specific |
| **Email Service** | Certificates, notifications | 🟡 MODERATE - Can view in-app |

---

### Data Integrity Critical Paths

1. **Registration → Payment → Check-In**
   - Registration ID must persist across payment
   - Duplicate registrations must be prevented
   - Check-in must fail if not registered

2. **Certificate Template → Generation → Delivery**
   - Template must exist before generation
   - Generated certificate URL must be accessible
   - Student_certificates must link to template

3. **Event → Fest → Sponsorship**
   - Event can exist without fest
   - Fest submission must reference existing event
   - Sponsorship must reference existing event

---

## Performance Bottlenecks (10K+ Users)

### Identified Risks

1. **Database Connection Pool Exhaustion**
   - 10K concurrent users × 5 requests/min = 50K requests/min
   - Supabase connection pooling must handle load
   - Recommend: Monitor connection count, enable PgBouncer

2. **Event Listing Query (Read-Heavy)**
   - SELECT * FROM events WHERE start_datetime > NOW()
   - With 1000+ events, needs proper indexing
   - Current: idx_events_start_datetime exists ✅
   - Recommend: Add caching (Redis or Next.js ISR)

3. **Certificate Generation (CPU-Heavy)**
   - Image manipulation + PDF generation
   - 500 certificates = 16+ minutes if synchronous
   - Recommend: Background job queue (BullMQ, Inngest)

4. **Check-In Endpoint (Write-Heavy)**
   - 1000 attendees × 1 check-in each = 1000 writes in 30 min
   - Database write throughput must sustain 33 writes/min
   - Current: No batch API found
   - Recommend: Batch check-in endpoint

5. **Real-Time Notifications**
   - Push notifications for 10K users
   - Firebase Cloud Messaging rate limits?
   - Recommend: Batch sends, prioritize urgent notifications

---

## 10. WhatsApp Group Join Flow

### User Story
> "As a registered student, I want to join the event's WhatsApp group (if organizer has enabled it) to stay updated and connect with other participants."

---

### Flow: Organizer Enables WhatsApp Group

**Steps:**
```
1. Organizer creates or edits event
2. In event settings, finds "WhatsApp Group (Optional)" section
3. Toggles "Enable WhatsApp Group" checkbox ON
4. Enters WhatsApp invite link (format: https://chat.whatsapp.com/...)
5. System validates link format (must be chat.whatsapp.com URL)
6. Organizer saves event
7. System stores:
   - events.whatsapp_group_enabled = TRUE
   - events.whatsapp_group_link = 'https://chat.whatsapp.com/...'
```

---

### Flow: Student Joins WhatsApp Group

**Steps:**
```
1. Student completes registration for event (paid or free)
2A. Success Overlay Path:
   - After payment success, overlay shows "Join WhatsApp Group" button
   - Student clicks button
   - System checks registration exists
   - Opens WhatsApp link in new tab
   - Logs join click to whatsapp_group_joins table
   - Student lands on WhatsApp app/web with group invite

2B. My Events Path:
   - Student navigates to /dashboard/student → My Events tab
   - For events with WhatsApp enabled, "Join WhatsApp Group" button shown
   - Student clicks button
   - Same flow as 2A (verification → open link → log join)
```

---

### Security Checks

**Before Exposing WhatsApp Link:**
1. ✅ User is authenticated (JWT session)
2. ✅ User role is 'student'
3. ✅ Registration exists for this event + student_email
4. ✅ Event has whatsapp_group_enabled = TRUE
5. ✅ Event has valid whatsapp_group_link

**If any check fails:** Return 401/403/404, do NOT expose link

**Public API Sanitization:** GET /api/events never returns whatsapp_group_enabled or whatsapp_group_link to prevent public exposure

---

### Dependencies

| Service | Purpose | Failure Impact |
|---------|---------|----------------|
| NextAuth | User authentication | ❌ Cannot verify student identity |
| Supabase | Registration verification | ❌ Cannot check if user registered |
| WhatsApp | Group invite link | 🟢 External service, not platform-controlled |

---

### Non-Negotiable Rules

**Global Rules (MUST be enforced):**
- ❌ **NO auto-adding:** Students are NOT automatically added to WhatsApp group. They must click "Join" button voluntarily.
- ❌ **NO phone numbers:** Platform does NOT collect phone numbers for WhatsApp. Uses link-based invite only.
- ❌ **NO WhatsApp APIs:** Platform does NOT use WhatsApp Business API or bots. Pure invite link approach.
- ❌ **NO public exposure:** WhatsApp links are NEVER shown in public event listings or to non-registered users.
- ✅ **Registration verification:** Link is ONLY accessible to students who have completed registration.
- ✅ **Opt-in only:** Feature is completely optional. Organizers can disable anytime. Students see nothing if disabled.

---

### Analytics

**Tracked Metrics:**
- Join clicks logged to `whatsapp_group_joins` table
- Tracks: event_id, student_email, joined_at timestamp
- Admin can view: Number of join clicks per event

**NOT Tracked:**
- Actual WhatsApp group membership (platform has no access)
- Messages sent in group
- User activity in WhatsApp group

---

### Example API Usage

**Organizer Settings API:**
```typescript
// GET /api/organizer/events/{eventId}/whatsapp
// Returns current settings for organizer's event
{
  "whatsapp_group_enabled": true,
  "whatsapp_group_link": "https://chat.whatsapp.com/ABC123XYZ"
}

// PATCH /api/organizer/events/{eventId}/whatsapp
// Update settings (with validation)
{
  "whatsapp_group_enabled": true,
  "whatsapp_group_link": "https://chat.whatsapp.com/ABC123XYZ"
}
```

**Student Join API:**
```typescript
// POST /api/whatsapp/join
// Request: { eventId: "uuid" }
// Returns link after verification
{
  "link": "https://chat.whatsapp.com/ABC123XYZ"
}
// Frontend opens link in new tab
```

**Status Check API:**
```typescript
// GET /api/whatsapp/status?eventId=uuid
// Returns if WhatsApp is enabled (does NOT return link)
{
  "enabled": true
}
```

---

**END OF CRITICAL_FLOWS.md**
