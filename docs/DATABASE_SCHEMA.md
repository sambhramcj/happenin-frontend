# DATABASE_SCHEMA.md

> **Status:** Production System Documentation  
> **Last Updated:** February 17, 2026  
> **Database:** PostgreSQL 15+ with PostGIS via Supabase  
> **Migrations Applied:** 17 (consolidated and numbered 01-17)

---

## Overview

Happenin uses **PostgreSQL 15+** with **PostGIS** extension for geospatial queries. All infrastructure hosted on **Supabase** with Row Level Security (RLS) enabled on sensitive tables.

**Total Tables:** 58  
**Migrations:** 17 files (consolidated from 34 originals)  
**Architecture:** Event marketplace with sponsorships, geolocation, volunteers, fests, certificates, and comprehensive notifications

---

## Table of Contents

1. [Core Tables (Users & Auth)](#1-core-tables-users--auth)
2. [Events & Registrations](#2-events--registrations)
3. [Colleges & Geolocation](#3-colleges--geolocation)
4. [Payments & Tickets](#4-payments--tickets)
5. [Sponsorship System](#5-sponsorship-system)
5a. [Organizer Payout (Razorpay Route)](#5a-organizer-payout-razorpay-route)
6. [Certificates](#6-certificates)
7. [Volunteers](#7-volunteers)
8. [Fests (Festival Hierarchies)](#8-fests-festival-hierarchies)
9. [Banners](#9-banners)
10. [Notifications](#10-notifications)
11. [Access Control](#11-access-control)
12. [Recommendations & Analytics](#12-recommendations--analytics)
13. [Admin & Logs](#13-admin--logs)
14. [Storage Buckets](#14-storage-buckets)
15. [Read-Heavy vs Write-Heavy Tables](#15-read-heavy-vs-write-heavy-tables)
16. [Fest-Critical Tables](#16-fest-critical-tables)
17. [Missing Indexes & Risks](#17-missing-indexes--risks)

---

## 1. Core Tables (Users & Auth)

### `users`
**Purpose:** Core authentication and role management  
**Primary Key:** `email` (TEXT)

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `email` | TEXT | User identifier (also username) | PRIMARY KEY |
| `password` | TEXT | Legacy field (⚠️ may be unused) | NULLABLE |
| `password_hash` | TEXT | Bcrypt hashed password | NULLABLE |
| `role` | TEXT | User role | CHECK IN ('student', 'organizer', 'admin') |
| `college_id` | UUID | User's primary college affiliation | FK → colleges(id) |
| `created_at` | TIMESTAMP | Account creation time | DEFAULT NOW() |

**Indexes:**
- `idx_users_college` ON `college_id`

**RLS:** Not explicitly enabled in migrations (⚠️ verify in production)

**Performance:** **Read-heavy** during auth flows, **write-light** (user creation only)

---

### `student_profiles` ⚠️
**Purpose:** Extended student information  
**Primary Key:** `student_email` (inferred from code usage)

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `student_email` | TEXT | Links to users(email) | PK (inferred) |
| `full_name` | TEXT | Display name | |
| `dob` | DATE | Date of birth | |
| `college_name` | TEXT | College name (denormalized) | |
| `college_id` | UUID | FK to colleges | Added in migration 12 |
| `college_email` | TEXT | Official college email | |
| `phone_number` | TEXT | Contact number | |
| `personal_email` | TEXT | Alternate email | |
| `profile_photo_url` | TEXT | Profile picture URL | |

**⚠️ WARNING:** Table structure inferred from API usage in `/api/student/profile`. CREATE TABLE statement not found in migrations—may have been created separately or is missing from migration files.

**Indexes:**
- `idx_student_profiles_college_id` (added in migration 12)

**RLS:** Likely enabled (users can only access own profiles)

---

### `organizer_profiles` ⚠️
**Purpose:** Extended organizer information  
**Primary Key:** `organizer_email` (inferred)

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `organizer_email` | TEXT | Links to users(email) | PK (inferred) |
| `college_id` | UUID | Organizer's primary college | Added in migration 12 |
| Additional columns | UNKNOWN | Profile information | ⚠️ Schema not documented in migrations |

**⚠️ WARNING:** Table referenced in migration 12 but CREATE statement not found. Schema details unknown.

**Indexes:**
- `idx_organizer_profiles_college_id` (added in migration 12)

---

## 2. Events & Registrations

### `events`
**Purpose:** Core event information  
**Primary Key:** `id` (UUID)

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | UUID | Event identifier | PRIMARY KEY, gen_random_uuid() |
| `title` | TEXT | Event name | NOT NULL |
| `description` | TEXT | Event details | |
| `date` | TIMESTAMP | Legacy date field | ⚠️ Superseded by start_datetime |
| `start_datetime` | TIMESTAMP WITH TIME ZONE | Event start time | Added in migration 05 |
| `end_datetime` | TIMESTAMP WITH TIME ZONE | Event end time | Added in migration 05 |
| `venue` | TEXT | Location name | NOT NULL |
| `price` | DECIMAL(10,2) | Ticket price | DEFAULT 0 |
| `organizer_email` | TEXT | Event creator | NOT NULL, FK → users(email) |
| `organizer_contact_phone` | VARCHAR(20) | Contact phone | Migration 06 |
| `organizer_contact_email` | VARCHAR(255) | Contact email | Migration 06 |
| `needs_volunteers` | BOOLEAN | Volunteer recruitment flag | DEFAULT FALSE |
| `volunteer_roles` | JSONB | Volunteer role definitions | DEFAULT '[]' (migration 18) |
| `volunteer_description` | TEXT | Volunteer call text | Migration 18 |
| `prize_pool_amount` | NUMERIC(12,2) | Total prize money | Migration 06 |
| `prize_pool_description` | TEXT | Prize breakdown | Migration 06 |
| `brochure_url` | TEXT | Event brochure PDF | Migration 06 |
| `schedule_sessions` | JSONB | Multi-day schedule | Migration 05 |
| `registration_close_datetime` | TIMESTAMP WITH TIME ZONE | Auto-close registrations | Migration 05 |
| `registrations_closed` | BOOLEAN | Manual registration close | DEFAULT FALSE, migration 05 |
| `sponsorship_enabled` | BOOLEAN | Enable sponsorships | DEFAULT FALSE, migration 03 |
| `allow_bulk_tickets` | BOOLEAN | Enable bulk ticket sales | DEFAULT TRUE, migration 11 |
| `bulk_ticket_info` | JSONB | Bulk ticket metadata | Migration 11 |
| `college_id` | UUID | Hosting college | FK → colleges(id), migration 12 |
| `fest_id` | UUID | Parent fest (if part of festival) | FK → fests(id), migration 13 |
| `status` | VARCHAR(50) | Event status | ⚠️ Referenced but not explicitly added |
| `whatsapp_group_enabled` | BOOLEAN | WhatsApp group opt-in feature | DEFAULT FALSE, migration 25 |
| `whatsapp_group_link` | TEXT | WhatsApp invite link | Migration 25, nullable |
| `created_at` | TIMESTAMP | Record creation | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Last update | DEFAULT NOW() |

**Indexes:**
- `idx_events_organizer` ON `organizer_email`
- `idx_events_date` ON `date`
- `idx_events_start_datetime` ON `start_datetime`
- `idx_events_end_datetime` ON `end_datetime`
- `idx_events_registrations_closed` ON `registrations_closed`
- `idx_events_prize_pool_amount` ON `prize_pool_amount` WHERE NOT NULL
- `idx_events_college_id` ON `college_id`
- `idx_events_fest_id` ON `fest_id`
- `idx_events_volunteers` ON `needs_volunteers` WHERE `needs_volunteers = TRUE`

**Functions:**
- `is_event_live(event_id UUID)` → BOOLEAN
- `are_registrations_open(event_id UUID)` → BOOLEAN

**Performance:** **Read-heavy** (event listings, search, recommendations). **Write-moderate** (event creation, updates).

**Fest-Critical:** ✅ **CRITICAL** - Primary event data during fest days.

---

### `registrations`
**Purpose:** Track user registrations for events  
**Primary Key:** `id` (UUID)

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | Registration ID | PRIMARY KEY |
| `event_id` | UUID | Associated event | FK → events(id) ON DELETE CASCADE |
| `user_email` | TEXT | Registered user | NOT NULL |
| `registration_date` | TIMESTAMP | Registration time | DEFAULT NOW() |
| `status` | TEXT | Registration status | CHECK IN ('registered', 'checked_in', 'cancelled') |
| `created_at` | TIMESTAMP | Record creation | DEFAULT NOW() |

**Indexes:**
- `idx_registrations_event` ON `event_id`
- `idx_registrations_user` ON `user_email`

**Performance:** **Read-heavy** during fest days (attendance tracking). **Write-moderate** (new registrations).

**Fest-Critical:** ✅ **CRITICAL** - Check-in/attendance tracking during events.

---

### `whatsapp_group_joins`
**Purpose:** Track WhatsApp group join clicks for analytics  
**Primary Key:** `id` (UUID)  
**Migration:** 25

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | Join ID | PRIMARY KEY, gen_random_uuid() |
| `event_id` | UUID | Associated event | FK → events(id) ON DELETE CASCADE |
| `student_email` | TEXT | Student who joined | NOT NULL |
| `joined_at` | TIMESTAMP | Join click time | DEFAULT NOW() |

**Indexes:**
- `idx_whatsapp_joins_event` ON `event_id`
- `idx_whatsapp_joins_student` ON `student_email`

**Purpose:** Tracks when registered students click "Join WhatsApp Group" button. Does NOT track actual WhatsApp group membership (platform has no access to that). Used for analytics only.

**Performance:** **Write-light** (one click per student per event). **Read-rare** (admin analytics only).

**Fest-Critical:** 🟢 **LOW** - Optional analytics feature, not critical to event operations.

---

### `event_categories`
**Purpose:** Event categorization system  
**Primary Key:** `id` (UUID)  
**Migration:** 23

| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| `id` | UUID | Category ID | gen_random_uuid() |
| `category_name` | VARCHAR(255) | Category name | UNIQUE, NOT NULL |
| `description` | TEXT | Category description | |
| `icon_url` | VARCHAR(500) | Category icon | |
| `color_code` | VARCHAR(7) | Display color (hex) | '#6366F1' |
| `display_order` | INTEGER | Sort order | 0 |
| `created_at` | TIMESTAMP | Creation time | NOW() |

**Default Categories (10 categories seeded):**
- Tech & Innovation (#3B82F6)
- Cultural (#EC4899)
- Sports (#10B981)
- Business (#F59E0B)
- Education (#8B5CF6)
- Arts & Design (#F97316)
- Social Cause (#06B6D4)
- Entertainment (#EF4444)
- Sports & Fitness (#14B8A6)
- Career & Development (#6366F1)

**Indexes:**
- `idx_event_categories_name` ON `category_name`

---

### `event_category_mapping`
**Purpose:** Many-to-many relationship between events and categories  
**Primary Key:** `id` (UUID)  
**Migration:** 23

| Column | Type | FK |
|--------|------|----|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `category_id` | UUID | FK → event_categories(id) ON DELETE CASCADE |
| `created_at` | TIMESTAMP | |

**Constraints:** UNIQUE(event_id, category_id)

**Indexes:**
- `idx_event_category_mapping_event_id` ON `event_id`
- `idx_event_category_mapping_category_id` ON `category_id`

---

### `event_changelog`
**Purpose:** Audit trail for event status changes  
**Primary Key:** `id` (UUID)  
**Migration:** 23

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `status` | VARCHAR(50) | New status |
| `previous_status` | VARCHAR(50) | Old status |
| `changed_by` | VARCHAR(255) | User who made change |
| `reason` | TEXT | Reason for change |
| `details` | JSONB | Additional metadata |
| `created_at` | TIMESTAMP | Change timestamp |

**Indexes:**
- `idx_event_changelog_event_id` ON `event_id`
- `idx_event_changelog_status` ON `status`

---

### `event_reschedules`
**Purpose:** Track event rescheduling history  
**Primary Key:** `id` (UUID)  
**Migration:** 23

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `original_date` | TIMESTAMP | Old date |
| `new_date` | TIMESTAMP | New date |
| `original_time` | VARCHAR(5) | Old time |
| `new_time` | VARCHAR(5) | New time |
| `original_venue` | VARCHAR(500) | Old venue |
| `new_venue` | VARCHAR(500) | New venue |
| `rescheduled_by` | VARCHAR(255) | User who rescheduled |
| `reason` | TEXT | Reason for reschedule |
| `notification_sent` | BOOLEAN | Notification status |
| `created_at` | TIMESTAMP | Reschedule time |

**Indexes:**
- `idx_event_reschedules_event_id` ON `event_id`

**Performance:** **Write-light** (reschedules are rare). **Read-moderate** (displayed to affected users).

---

### `event_cancellations`
**Purpose:** Track event cancellations  
**Primary Key:** `id` (UUID)  
**Migration:** 23

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `cancelled_by` | VARCHAR(255) | User who cancelled |
| `cancellation_reason` | TEXT | Cancellation reason |
| `refund_status` | VARCHAR(50) | Refund processing status |
| `notification_sent` | BOOLEAN | Notification status |
| `cancelled_at` | TIMESTAMP | Cancellation time |

**Indexes:**
- `idx_event_cancellations_event_id` ON `event_id`

**Performance:** **Write-rare** (cancellations uncommon). **Read-rare** (historical data).

---

### `event_locations`
**Purpose:** Geospatial event location data  
**Primary Key:** `id` (UUID)  
**Migration:** 15, 16

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE, UNIQUE |
| `college_id` | UUID | FK → colleges(id) |
| `is_virtual` | BOOLEAN | Virtual event flag |
| `venue_name` | TEXT | Venue name |
| `latitude` | NUMERIC(10,8) | Latitude coordinate |
| `longitude` | NUMERIC(11,8) | Longitude coordinate |
| `location` | GEOMETRY(Point, 4326) | PostGIS spatial point (migration 16) |
| `created_at` | TIMESTAMP | Creation time |

**Indexes:**
- `idx_event_locations_college` ON `college_id`
- `idx_event_locations_location` GIST(`location`) - Spatial index

**Performance:** **Read-heavy** (nearby event discovery). **Write-light** (one-time setup per event).

**RLS Policies:**
- Public can read all locations
- Organizers can update their event locations

---

## 3. Colleges & Geolocation

### `colleges`
**Purpose:** College/university information with geolocation  
**Primary Key:** `id` (UUID)  
**Migrations:** 01, 02, 15, 16

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | UUID | College ID | PRIMARY KEY |
| `name` | TEXT | Full college name | UNIQUE, NOT NULL |
| `short_name` | TEXT | Abbreviation (e.g., "BMSCE") | Migration 02 |
| `slug` | TEXT | URL-friendly identifier | UNIQUE, migration 15 |
| `domain` | TEXT | Email domain | UNIQUE (migration 01) |
| `email_domain` | TEXT | Official email domain | Migration 02 (duplicate?) |
| `city` | TEXT | City | NOT NULL (migration 02) |
| `state` | TEXT | State | NOT NULL (migration 02) |
| `country` | TEXT | Country | DEFAULT 'India' |
| `latitude` | NUMERIC(10,8) | Latitude | Migration 15 |
| `longitude` | NUMERIC(11,8) | Longitude | Migration 15 |
| `location` | GEOMETRY(Point, 4326) | PostGIS spatial point | Migration 16 |
| `college_type` | TEXT | Type of institution | CHECK IN ('public', 'private', 'autonomous', 'deemed') |
| `contact_email` | TEXT | Contact email | Migration 15 |
| `contact_phone` | TEXT | Contact phone | Migration 15 |
| `website_url` | TEXT | College website | Migration 15 |
| `logo_url` | TEXT | College logo | |
| `verified` | BOOLEAN | Verification status | DEFAULT FALSE |
| `admin_email` | TEXT | College admin contact | Migration 01 |
| `is_verified` | BOOLEAN | Duplicate verification flag? | Migration 15 |
| `created_at` | TIMESTAMP | Creation time | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Last update | DEFAULT NOW() |

**Indexes:**
- `idx_colleges_domain` ON `domain`
- `idx_colleges_verified` ON `verified`
- `idx_colleges_name` ON `name`
- `idx_colleges_state` ON `state`
- `idx_colleges_city` ON `city`
- `idx_colleges_email_domain` ON `email_domain`
- `idx_colleges_location` ON (`latitude`, `longitude`)
- `idx_colleges_location` GIST(`location`) - PostGIS spatial index

**Functions:**
- `get_nearby_colleges(user_lat, user_lng, radius_km)` → TABLE - PostGIS-powered nearby search

**RLS Policies:**
- Public read access
- Admins can manage (insert/update/delete)
- Authenticated users can insert (for "suggest college" feature)

**Performance:** **Read-very-heavy** (college autocomplete, nearby discovery). **Write-rare** (admin operation).

**Fest-Critical:** 🟡 **MODERATE** - Used for filtering nearby events, college-based access control.

---

### `favorite_colleges`
**Purpose:** Students can favorite/follow colleges  
**Primary Key:** `id` (UUID)  
**Migration:** 15

| Column | Type | FK |
|--------|------|----|
| `id` | UUID | PRIMARY KEY |
| `student_email` | TEXT | FK → users(email) ON DELETE CASCADE |
| `college_id` | UUID | FK → colleges(id) ON DELETE CASCADE |
| `created_at` | TIMESTAMP | |

**Constraints:** UNIQUE(student_email, college_id)

**Indexes:**
- `idx_favorite_colleges_email` ON `student_email`

**RLS Policies:**
- Students can read/add/remove own favorites

**Performance:** **Read-moderate** (personalized feeds). **Write-moderate** (user favorites).

---

### `favorite_events`
**Purpose:** Students can favorite events  
**Primary Key:** `id` (UUID)  
**Migration:** 17

| Column | Type | FK |
|--------|------|----|
| `id` | UUID | PRIMARY KEY |
| `student_email` | TEXT | NOT NULL |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `created_at` | TIMESTAMP WITH TIME ZONE | |

**Constraints:** UNIQUE(student_email, event_id)

**Indexes:**
- `idx_favorite_events_student` ON `student_email`
- `idx_favorite_events_event` ON `event_id`

**RLS Policies:**
- Users can only see/manage their own favorites

**Performance:** **Read-heavy** (user dashboard). **Write-moderate** (favoriting events).

---

## 4. Payments & Tickets

### `payments`
**Purpose:** Ticket purchase transactions (Razorpay)  
**Primary Key:** `id` (UUID)  
**Migration:** 15

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | Payment ID | PRIMARY KEY |
| `student_email` | TEXT | Buyer | FK → users(email) |
| `event_id` | UUID | Associated event | FK → events(id) ON DELETE CASCADE |
| `amount` | NUMERIC | Payment amount | NOT NULL |
| `status` | TEXT | Payment status | CHECK IN ('pending', 'success', 'failed', 'refunded') |
| `created_at` | TIMESTAMP | Payment initiation | DEFAULT NOW() |

**Indexes:** ⚠️ No explicit indexes found in migrations (potential bottleneck)

**⚠️ MISSING COLUMNS:** Schema may be incomplete. Expected fields like `razorpay_order_id`, `razorpay_payment_id`, `receipt_url` not documented.

**Performance:** **Write-heavy** during ticket sales. **Read-moderate** (payment verification, receipts).

**Fest-Critical:** ✅ **CRITICAL** - Payment processing during peak sales (48 hours before event).

---

### `bulk_ticket_packs`
**Purpose:** Bulk ticket packages with discounts  
**Primary Key:** `id` (UUID)  
**Migration:** 11

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `organizer_email` | TEXT | Creator |
| `name` | VARCHAR(255) | Package name (e.g., "Group of 10") |
| `description` | TEXT | Package description |
| `quantity` | INTEGER | Number of tickets in pack |
| `base_price` | DECIMAL(10,2) | Regular price per ticket |
| `bulk_price` | DECIMAL(10,2) | Discounted price per ticket |
| `discount_percentage` | INTEGER | Calculated discount |
| `total_cost` | DECIMAL(10,2) | Total package cost |
| `offer_title` | VARCHAR(255) | Promotional title |
| `offer_description` | TEXT | Offer details |
| `offer_expiry_date` | TIMESTAMP WITH TIME ZONE | Offer expiration |
| `status` | VARCHAR(50) | CHECK IN ('active', 'sold_out', 'expired', 'inactive') |
| `sold_count` | INTEGER | Packs sold |
| `available_count` | INTEGER | GENERATED - remaining inventory |
| `created_at` | TIMESTAMP WITH TIME ZONE | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | |

**Indexes:**
- `idx_bulk_packs_event` ON `event_id`
- `idx_bulk_packs_organizer` ON `organizer_email`
- `idx_bulk_packs_status` ON `status`

**Performance:** **Read-moderate** (package browsing). **Write-light** (organizer setup).

---

### `bulk_ticket_purchases`
**Purpose:** Individual purchases of bulk packs  
**Primary Key:** `id` (UUID)  
**Migration:** 11

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `bulk_pack_id` | UUID | FK → bulk_ticket_packs(id) ON DELETE CASCADE |
| `buyer_email` | TEXT | Purchaser |
| `quantity_purchased` | INTEGER | Packs purchased |
| `price_per_ticket` | DECIMAL(10,2) | Price per ticket |
| `total_amount` | DECIMAL(10,2) | Total paid |
| `payment_status` | VARCHAR(50) | CHECK IN ('pending', 'completed', 'failed', 'refunded') |
| `purchase_date` | TIMESTAMP WITH TIME ZONE | |
| `payment_id` | UUID | Reference to payments table? |

**Constraints:** UNIQUE(bulk_pack_id, buyer_email)

**Indexes:**
- `idx_bulk_purchases_pack` ON `bulk_pack_id`
- `idx_bulk_purchases_buyer` ON `buyer_email`
- `idx_bulk_purchases_payment_status` ON `payment_status`

**Fest-Critical:** 🟡 **MODERATE** - Bulk ticket sales during pre-fest window.

---

### `bulk_tickets`
**Purpose:** Individual tickets generated from bulk purchases  
**Primary Key:** `id` (UUID)  
**Migration:** 11

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `bulk_purchase_id` | UUID | FK → bulk_ticket_purchases(id) ON DELETE CASCADE |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `ticket_number` | VARCHAR(50) | Unique ticket number (e.g., BULK-EVENT-001) |
| `qr_code_data` | TEXT | QR code payload |
| `assigned_to_email` | TEXT | Ticket recipient |
| `checked_in` | BOOLEAN | Check-in status |
| `checked_in_at` | TIMESTAMP WITH TIME ZONE | Check-in time |
| `check_in_by_email` | TEXT | Who checked in |
| `status` | VARCHAR(50) | CHECK IN ('available', 'assigned', 'used', 'cancelled') |
| `created_at` | TIMESTAMP WITH TIME ZONE | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | |

**Constraints:** UNIQUE(`ticket_number`)

**Indexes:**
- `idx_bulk_tickets_purchase` ON `bulk_purchase_id`
- `idx_bulk_tickets_event` ON `event_id`
- `idx_bulk_tickets_assigned_to` ON `assigned_to_email`
- `idx_bulk_tickets_status` ON `status`

**Fest-Critical:** ✅ **CRITICAL** - Ticket validation and check-in during fest.

---

## 5. Sponsorship System

### `sponsors_profile`
**Purpose:** Sponsor company profiles  
**Primary Key:** `email` (TEXT)  
**Migration:** 03

| Column | Type | Purpose |
|--------|------|---------|
| `email` | TEXT | PRIMARY KEY, FK → users(email) ON DELETE CASCADE |
| `company_name` | TEXT | Company name |
| `logo_url` | TEXT | Company logo |
| `website_url` | TEXT | Company website |
| `contact_name` | TEXT | Contact person |
| `contact_phone` | TEXT | Contact phone |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP WITH TIME ZONE | |

**Performance:** **Read-moderate** (display sponsor info). **Write-rare** (sponsor registration).

---

### `sponsors` ⚠️
**Purpose:** Sponsor entities (alternate/duplicate table?)  
**Primary Key:** `id` (UUID)  
**Migration:** 19

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `name` | TEXT | Sponsor name |
| `logo_url` | TEXT | Logo |
| `website_url` | TEXT | Website |
| `contact_email` | TEXT | Contact email |
| `created_at` | TIMESTAMP | |

**⚠️ WARNING:** This table appears to duplicate `sponsors_profile`. Unclear which is actively used. Recommend code audit.

**RLS Policies (migration 19):**
- Public read
- Organizers/admins can insert
- Admins can update/delete

---

### `sponsorship_packages`
**Purpose:** Sponsorship tier packages for events  
**Primary Key:** `id` (UUID)  
**Migration:** 03

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | |
| `tier` | TEXT | Sponsorship tier | CHECK IN ('bronze', 'silver', 'gold', 'platinum') |
| `min_amount` | NUMERIC | Minimum sponsorship | NOT NULL |
| `max_amount` | NUMERIC | Maximum sponsorship | NOT NULL |
| `organizer_notes` | TEXT | Tier description | |
| `is_active` | BOOLEAN | Active status | DEFAULT TRUE |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |

**Indexes:**
- `idx_sponsorship_packages_event` ON `event_id`

**Functions:**
- `sponsorship_tier_rank(tier TEXT)` → INT - Rank tiers numerically

**Triggers:**
- `trigger_add_default_deliverables` - Auto-adds platform default deliverables on package creation

---

### `sponsorship_orders` (NEW - February 2026)
**Purpose:** Razorpay flat-fee sponsorship orders (REPLACES OLD MANUAL FLOW)  
**Primary Key:** `id` (UUID)  
**Migration:** 26

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | |
| `sponsor_email` | TEXT | FK → users(email) ON DELETE CASCADE | |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | Nullable (null if fest-level) |
| `fest_id` | UUID | FK → fests(id) ON DELETE CASCADE | Nullable (null if event-level) |
| `pack_type` | TEXT | Sponsorship pack | CHECK IN ('digital', 'app', 'fest') |
| `amount` | NUMERIC | Fixed price (paise) | NOT NULL |
| `razorpay_order_id` | TEXT | Razorpay order ID | UNIQUE, NOT NULL |
| `razorpay_payment_id` | TEXT | Razorpay payment ID | UNIQUE, Nullable |
| `status` | TEXT | Payment status | CHECK IN ('created', 'paid', 'failed'), DEFAULT 'created' |
| `visibility_active` | BOOLEAN | Logo displayed? | DEFAULT FALSE |
| `organizer_payout_settled` | BOOLEAN | Admin marked as settled? | DEFAULT FALSE |
| `organizer_payout_settled_at` | TIMESTAMP WITH TIME ZONE | Settlement date | Nullable |
| `created_at` | TIMESTAMP WITH TIME ZONE | Order creation | DEFAULT NOW() |

**Pricing (Server-Side Fixed):**
- Digital: ₹10,000 (1000000 paise)
- App: ₹25,000 (2500000 paise)
- Fest: ₹50,000 (5000000 paise)

**Indexes:**
- `idx_sponsorship_orders_razorpay_order` ON `razorpay_order_id` (UNIQUE) - Prevent duplicate orders
- `idx_sponsorship_orders_razorpay_payment` ON `razorpay_payment_id` (UNIQUE) - Prevent duplicate payments
- `idx_sponsorship_orders_sponsor_email` ON `sponsor_email` - List sponsor's orders
- `idx_sponsorship_orders_event_id` ON `event_id` - List event's sponsors
- `idx_sponsorship_orders_fest_id` ON `fest_id` - List fest sponsors
- `idx_sponsorship_orders_status` ON `status` - Filter by payment status
- `idx_sponsorship_orders_created_at` ON `created_at` DESC - Recent orders

**Payment Flow:**
1. **Order Creation** (`POST /api/sponsorships/create-order`)
   - Backend validates sponsor, event, no duplicates
   - Creates Razorpay order with fixed pack price
   - INSERT sponsorship_orders with `status='created'`

2. **Payment Verification** (`POST /api/sponsorships/verify`)
   - Frontend calls with razorpay_ids and signature
   - Backend verifies HMAC-SHA256 signature (timing-safe)
   - Idempotent: Returns success if already paid (by razorpay_order_id)
   - UPDATE sponsorship_orders: `status='paid', visibility_active=true`
   - Logo immediately renders on tickets, certs, banners

**Security Features:**
- ✅ HMAC-SHA256 signature verification (prevents replay attacks)
- ✅ Timing-safe comparison (prevents timing attacks)
- ✅ Server-side price enforcement (clients cannot override amount)
- ✅ Duplicate detection (razorpay_order_id, razorpay_payment_id UNIQUE)
- ✅ Idempotent verification (safe for retries)

**Performance:** **Read-frequent** (display sponsors on tickets/certs/banners, sponsor dashboards). **Write-moderate** (Razorpay payments ~1-2/sec during fest).

**Why New Table?**
- Old `sponsorship_deals` was manual (offline bank transfer + admin verification)
- New `sponsorship_orders` is automated (instant Razorpay verification)
- Sponsors get instant visibility without admin bottleneck
- Eliminates manual payment proof uploads and delays

---

### `sponsorship_deals` (LEGACY - Deprecated)
**Status:** ⚠️ DEPRECATED as of February 2026. Use `sponsorship_orders` instead.  
**Purpose:** Old manual sponsorship agreements (_no longer actively used_)  
**Primary Key:** `id` (UUID)  
**Migrations:** 03, 10

_See documentation in PAYMENTS_AND_SPONSORSHIPS.md under "Legacy: Manual Sponsorship System"._

**Why Deprecated:**
- Slow: Required organizer + admin manual verification
- Non-instant: Logo display delayed until admin approval
- Replaced by: Razorpay flat-fee automatic system
- Backward Compatibility: Still exists for analytics/payout tracking

**Note:** Components like `SponsorshipPayout` and `AdminSponsorshipPayouts` still reference `sponsorship_deals` for organizer payout history. These continue as a separate ledger for financial tracking.

---
**Purpose:** Deliverables included in sponsorship packages  
**Primary Key:** `id` (UUID)  
**Migration:** 03

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | |
| `package_id` | UUID | FK → sponsorship_packages(id) ON DELETE CASCADE | |
| `type` | TEXT | Deliverable source | CHECK IN ('platform_default', 'organizer_defined') |
| `category` | TEXT | Deliverable type | CHECK IN ('certificate', 'ticket', 'app_banner', 'social', 'on_ground', 'stall', 'digital') |
| `title` | TEXT | Deliverable name | NOT NULL |
| `description` | TEXT | Details | |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |

**Indexes:**
- `idx_sponsorship_deliverables_package` ON `package_id`

---

### `platform_default_deliverables`
**Purpose:** Admin-managed default deliverables  
**Primary Key:** `id` (UUID)  
**Migration:** 03

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `category` | TEXT | Deliverable type |
| `title` | TEXT | Deliverable name |
| `description` | TEXT | Details |
| `min_tier` | TEXT | Minimum tier to get deliverable |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP WITH TIME ZONE | |

**Indexes:**
- `idx_platform_default_deliverables_active` ON `is_active`

**Seeded Defaults:**
- Certificate Logo Placement (bronze+)
- Ticket Logo Placement (bronze+)
- Event Page Sponsor Badge (bronze+)
- Homepage Banner Placement (gold+)

---

### `sponsorship_deals`
**Purpose:** Active sponsorship agreements (TWO-STAGE PAYMENT)  
**Primary Key:** `id` (UUID)  
**Migrations:** 03, 10

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | UUID | PRIMARY KEY | |
| `sponsor_id` | TEXT | FK → users(email) ON DELETE CASCADE | |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | |
| `package_id` | UUID | FK → sponsorship_packages(id) ON DELETE CASCADE | |
| `amount_paid` | NUMERIC | Total sponsorship amount | |
| `platform_fee` | NUMERIC | Platform commission (20%) | |
| `organizer_amount` | NUMERIC | Organizer's 80% share | |
| `status` | TEXT | Deal status | CHECK IN ('pending', 'confirmed', 'active', 'completed') |
| `razorpay_order_id` | TEXT | Razorpay order ID | ⚠️ May not be used in manual flow |
| `razorpay_payment_id` | TEXT | Razorpay payment ID | ⚠️ May not be used in manual flow |
| `facilitation_fee_percent` | NUMERIC | Platform fee % | DEFAULT 20 (migration 10) |
| `facilitation_fee_amount` | NUMERIC | Platform fee amount | Migration 10 |
| `payment_mode` | TEXT | Payment method | CHECK IN ('manual'), migration 10 |
| `facilitation_fee_paid` | BOOLEAN| Commission paid to platform? | DEFAULT FALSE (migration 10) |
| `payment_reference` | TEXT | Payment proof reference | Migration 10 |
| `marked_paid_by` | TEXT | FK → users(email) | Migration 10 |
| `marked_paid_at` | TIMESTAMP WITH TIME ZONE | Payment confirmation time | Migration 10 |
| `payment_proof_url` | TEXT | Uploaded payment proof | Migration 10 |
| `confirmed_by` | TEXT | FK → users(email) | Migration 10 |
| `confirmed_at` | TIMESTAMP WITH TIME ZONE | Confirmation time | Migration 10 |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | | |

**Two-Stage Payment Flow (Migration 10):**
1. **Stage 1:** Sponsor → Organizer (outside app) → Organizer marks `status='confirmed'` → Sponsorship features unlock
2. **Stage 2:** Organizer → Platform commission → `facilitation_fee_paid=true` → Analytics only

**Indexes:**
- `idx_sponsorship_deals_sponsor` ON `sponsor_id`
- `idx_sponsorship_deals_event` ON `event_id`
- `idx_sponsorship_deals_status` ON `status`
- `idx_sponsorship_deals_status` ON (`event_id`, `status`) (migration 10)
- `idx_sponsorship_deals_facilitation_paid` ON (`event_id`, `facilitation_fee_paid`) (migration 10)

**Functions:**
- `calculate_revenue_split(amount NUMERIC)` → TABLE (platform_fee, organizer_amount)

**Performance:** **Read-moderate** (display sponsors). **Write-light** (manual deal creation).

**⚠️ WARNING:** Razorpay integration for sponsorships may not be production-ready. Manual payment flow active.

---

### `organizer_bank_accounts`
**Purpose:** Bank details for sponsorship payouts  
**Primary Key:** `id` (UUID)  
**Migration:** 04

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `organizer_email` | TEXT | FK → users(email) ON DELETE CASCADE |
| `account_holder_name` | TEXT | Bank account holder |
| `bank_name` | TEXT | Bank name |
| `account_number` | TEXT | Bank account number |
| `ifsc_code` | TEXT | IFSC code |
| `upi_id` | TEXT | UPI ID |
| `is_verified` | BOOLEAN | Admin verification status |
| `created_at` | TIMESTAMP WITH TIME ZONE | |

**Constraints:** UNIQUE(`organizer_email`)

**RLS Policies:**
- Organizers can read/insert/update own unverified accounts
- Admins can read/update all accounts

---

### `organizers` (NEW - February 2026)
**Purpose:** Razorpay Route sub-merchant setup for event payout registration  
**Primary Key:** `id` (UUID)  
**Migration:** 27

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | Record ID | PRIMARY KEY |
| `organizer_type` | TEXT | Type | CHECK IN ('CLUB', 'FEST') |
| `user_email` | TEXT | Club organizer email | FK → users(email), NULL for FEST |
| `fest_id` | UUID | Fest organizer | FK → fests(id), NULL for CLUB |
| `display_name` | TEXT | Club/fest name | NOT NULL |
| `legal_name` | TEXT | PAN holder name | NOT NULL |
| `pan_number` | TEXT | Permanent Account Number | NOT NULL, UNIQUE |
| `bank_account_number` | TEXT | Bank account (9-18 digits) | NOT NULL |
| `ifsc_code` | TEXT | Indian Financial System Code | NOT NULL |
| `razorpay_account_id` | TEXT | Razorpay Route sub-merchant ID | UNIQUE, Nullable |
| `kyc_status` | TEXT | KYC verification status | CHECK IN ('pending', 'verified', 'rejected'), DEFAULT 'pending' |
| `kyc_rejection_reason` | TEXT | Reason if rejected | Nullable |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation time | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Update time | Updated by trigger |
| `kyc_verified_at` | TIMESTAMP WITH TIME ZONE | KYC approval time | Nullable |

**Constraints:**
- `CLUB`: `user_email NOT NULL, fest_id IS NULL`
- `FEST`: `fest_id NOT NULL, user_email IS NULL`
- `pan_number` UNIQUE across all organizers

**Indexes:**
- `idx_organizers_user_email` ON `user_email`
- `idx_organizers_fest_id` ON `fest_id`
- `idx_organizers_type` ON `organizer_type`
- `idx_organizers_kyc_status` ON `kyc_status`
- `idx_organizers_razorpay_account_id` ON `razorpay_account_id`
- `idx_organizers_pan` ON `pan_number`

**RLS Policies:**
- CLUB organizers can read/update own profile (if KYC pending)
- FEST members can read/update own fest profile (if KYC pending)
- Admins can read all profiles and update KYC status

**Integration Points:**
- `events.organizer_id` → FK to `organizers(id)` (added in migration 27)
- Ticket payments route to `organizers.razorpay_account_id` for payouts
- KYC status determines payout eligibility

**Business Logic:**
- **CLUB organizers:** Student PAN + personal bank account acceptable
- **FEST organizers:** College/faculty PAN + college/fest bank account required
- PAN holder name MUST match bank account holder name (Razorpay requirement)
- KYC: pending → verified/rejected (manual admin review of Razorpay status)

**Performance:** **Write-light** (organizer setup once). **Read-moderate** (event payout lookups).

---

### `sponsorship_payouts`
**Purpose:** Track commission payments to platform  
**Primary Key:** `id` (UUID)  
**Migration:** 04

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `sponsorship_deal_id` | UUID | FK → sponsorship_deals(id) ON DELETE CASCADE |
| `organizer_email` | TEXT | FK → users(email) ON DELETE CASCADE |
| `gross_amount` | NUMERIC | Total sponsorship amount |
| `platform_fee` | NUMERIC | Commission owed to platform |
| `payout_amount` | NUMERIC | Net to organizer |
| `payout_method` | TEXT | CHECK IN ('UPI', 'IMPS') |
| `payout_status` | TEXT | CHECK IN ('pending', 'paid') |
| `paid_at` | TIMESTAMP WITH TIME ZONE | Payment completion time |
| `admin_email` | TEXT | FK → users(email) |
| `created_at` | TIMESTAMP WITH TIME ZONE | |

**Constraints:** UNIQUE(`sponsorship_deal_id`)

**Indexes:**
- `idx_sponsorship_payouts_organizer` ON `organizer_email`
- `idx_sponsorship_payouts_status` ON `payout_status`

**RLS Policies:**
- Organizers can read own payouts
- Admins can read/insert/update all payouts

---

### `sponsorships` ⚠️
**Purpose:** Alternate sponsorship tracking (duplicate?)  
**Primary Key:** `id` (UUID)  
**Migration:** 19

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `sponsor_id` | UUID | FK → sponsors(id) ON DELETE SET NULL |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `fest_id` | UUID | Parent fest (⚠️ no FK defined) |
| `tier` | TEXT | CHECK IN ('title', 'gold', 'silver', 'partner') |
| `amount` | NUMERIC(10,2) | Sponsorship amount |
| `status` | TEXT | CHECK IN ('pending', 'approved', 'rejected', 'expired') |
| `created_by` | TEXT | Organizer email |
| `reviewed_by` | TEXT | Reviewer email |
| `reviewed_at` | TIMESTAMP | Review time |
| `created_at` | TIMESTAMP | |

**⚠️ WARNING:** This table may duplicate `sponsorship_deals`. Unclear which is actively used. Recommend consolidation.

**Indexes:**
- `idx_sponsorships_event` ON `event_id`
- `idx_sponsorships_sponsor` ON `sponsor_id`
- `idx_sponsorships_status` ON `status`

**RLS Policies (migration 19):**
- Public can read approved
- Admins/organizers can read all
- Admins/organizers can manage

---

### `sponsorship_assets`
**Purpose:** Sponsor logo/banner/CTA files  
**Primary Key:** `id` (UUID)  
**Migration:** 19

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `sponsorship_id` | UUID | FK → sponsorships(id) ON DELETE CASCADE |
| `asset_type` | TEXT | CHECK IN ('logo', 'banner', 'cta') |
| `asset_url` | TEXT | Storage URL |
| `placement` | TEXT | Placement location |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_assets_sponsorship` ON `sponsorship_id`

**RLS Policies (migration 19):**
- Public can read assets for approved sponsorships
- Admins can manage all
- Organizers can manage pending

---

### `festival_sponsorships`
**Purpose:** Fest-level sponsorships  
**Primary Key:** `id` (UUID)  
**Migration:** 14

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `fest_id` | UUID | FK → fests(id) ON DELETE CASCADE |
| `sponsor_name` | TEXT | Sponsor name |
| `sponsor_logo_url` | TEXT | Logo |
| `sponsor_website` | TEXT | Website |
| `tier` | TEXT | CHECK IN ('title', 'platinum', 'gold', 'silver', 'bronze', 'partner') |
| `amount` | DECIMAL(10,2) | Sponsorship amount |
| `benefits` | JSONB | Deliverables/benefits |
| `visibility_level` | INTEGER | Display priority |
| `created_at` | TIMESTAMP WITH TIME ZONE | |

**Indexes:**
- `idx_festival_sponsorships_fest` ON `fest_id`
- `idx_festival_sponsorships_tier` ON `tier`

**RLS:** Anyone can read; fest leaders can manage

---

## 6. Certificates

### `certificate_templates`
**Purpose:** Certificate design templates for events  
**Primary Key:** `id` (UUID)  
**Migrations:** 08, 21 (extended)

| Column | Type | Purpose | Notes |
|--------|------|---------|-------|
| `id` | UUID | PRIMARY KEY | |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | UNIQUE per event |
| `organizer_email` | VARCHAR(255) | Template creator | Migration 21 |
| `base_pdf_url` | TEXT | PDF template URL | Migration 08 |
| `base_pdf_storage_path` | TEXT | Supabase Storage path | Migration 08 |
| `certificate_image_url` | VARCHAR(500) | Image template URL | Migration 21 |
| `name_font` | TEXT | Font family | DEFAULT 'Playfair Display' (migration 08) |
| `name_font_family` | VARCHAR(255) | Font family | Migration 21 (duplicate?) |
| `name_font_size` | INTEGER | Font size | DEFAULT 48 (08), 32 (21) |
| `name_color` | TEXT | Font color (hex) | DEFAULT '#000000' |
| `name_font_color` | VARCHAR(7) | Font color (hex) | Migration 21 (duplicate?) |
| `name_align` | TEXT | Alignment | CHECK IN ('left', 'center', 'right'), migration 08 |
| `name_text_alignment` | VARCHAR(50) | Alignment | Migration 21 (duplicate?) |
| `name_pos_x` | NUMERIC(10,2) | X coordinate | Migration 08 |
| `name_position_x` | FLOAT | X coordinate | Migration 21 (duplicate?) |
| `name_pos_y` | NUMERIC(10,2) | Y coordinate | Migration 08 |
| `name_position_y` | FLOAT | Y coordinate | Migration 21 (duplicate?) |
| `recipient_type` | VARCHAR(50) | Certificate type | CHECK IN ('volunteer', 'participant', 'winner'), migration 21 |
| `template_status` | VARCHAR(50) | Template status | CHECK IN ('draft', 'ready', 'sent'), migration 21 |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | | |

**Constraints:** UNIQUE(`event_id`)

**Indexes:**
- `idx_certificate_templates_event_id` ON `event_id` (both migrations)
- `idx_certificate_templates_organizer` ON `organizer_email` (migration 21)

**⚠️ WARNING:** Migrations 08 and 21 create overlapping/duplicate columns. Schema needs consolidation.

**RLS Policies:**
- Organizers can only manage their own event templates

**Performance:** **Read-light** (template retrieval). **Write-light** (one-time setup per event).

---

### `certificate_recipients`
**Purpose:** Track certificate generation status  
**Primary Key:** `id` (UUID)  
**Migration:** 21

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `template_id` | UUID | FK → certificate_templates(id) ON DELETE CASCADE |
| `student_email` | VARCHAR(255) | Recipient |
| `student_name` | VARCHAR(255) | Name printed on certificate |
| `certificate_url` | VARCHAR(500) | Generated certificate URL |
| `generation_status` | VARCHAR(50) | CHECK IN ('pending', 'generating', 'generated', 'failed') |
| `sent_at` | TIMESTAMP | Email send time |
| `downloaded_at` | TIMESTAMP | Download time |
| `failed_reason` | TEXT | Error message if failed |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Indexes:**
- `idx_certificate_recipients_template` ON `template_id`
- `idx_certificate_recipients_email` ON `student_email`
- `idx_certificate_recipients_status` ON `generation_status`

**RLS Policies:**
- Organizers can see recipients for their templates

**Performance:** **Write-moderate** (bulk generation). **Read-moderate** (status tracking).

---

### `student_certificates`
**Purpose:** Student-viewable certificate gallery  
**Primary Key:** `id` (UUID)  
**Migration:** 21

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `student_email` | VARCHAR(255) | Certificate owner |
| `certificate_url` | VARCHAR(500) | Certificate file URL |
| `event_name` | VARCHAR(255) | Event name |
| `event_id` | UUID | FK → events(id) ON DELETE SET NULL |
| `certificate_type` | VARCHAR(50) | CHECK IN ('volunteer', 'participant', 'winning') |
| `certificate_title` | VARCHAR(255) | Certificate title |
| `issued_by` | VARCHAR(255) | Organizer email |
| `recipient_type` | VARCHAR(50) | Recipient type |
| `sent_date` | TIMESTAMP | Issue date |
| `downloaded_date` | TIMESTAMP | Download time |
| `template_id` | UUID | FK → certificate_templates(id) ON DELETE SET NULL |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_student_certificates_email` ON `student_email`
- `idx_student_certificates_type` ON `certificate_type`
- `idx_student_certificates_event` ON `event_id`

**RLS Policies:**
- Students can only see their own certificates

**Performance:** **Read-moderate** (student dashboard). **Write-light** (after event completion).

---

### `volunteer_certificates`
**Purpose:** User-uploaded volunteer certificates (legacy?)  
**Primary Key:** `id` (UUID)  
**Migration:** 18

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `student_email` | TEXT | FK → users(email) ON DELETE CASCADE |
| `type` | TEXT | CHECK IN ('volunteering', 'participation', 'winning') |
| `event_name` | TEXT | Event name |
| `role` | TEXT | Volunteer role |
| `organization` | TEXT | Issuing organization |
| `date` | DATE | Event date |
| `description` | TEXT | Description |
| `certificate_url` | TEXT | Certificate file |
| `issued_by` | TEXT | Issuer |
| `achievement` | TEXT | Achievement text |
| `verified` | BOOLEAN | Verification status |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_volunteer_certificates_student` ON `student_email`

**⚠️ WARNING:** May be redundant with `student_certificates`. Recommend consolidation.

---

### `achievement_badges`
**Purpose:** Gamification badges for milestones  
**Primary Key:** `id` (UUID)  
**Migration:** 21

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `student_email` | VARCHAR(255) | Badge owner |
| `badge_type` | VARCHAR(100) | Badge category (e.g., 'volunteer_5', 'event_winner') |
| `badge_name` | VARCHAR(255) | Badge name |
| `badge_description` | TEXT | Badge description |
| `badge_icon_url` | VARCHAR(500) | Badge icon |
| `earned_at` | TIMESTAMP | Earn date |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_achievement_badges_email` ON `student_email`
- `idx_achievement_badges_type` ON `badge_type`

**RLS Policies:**
- Students can only see their own badges

---

### `certificate_history`
**Purpose:** Audit trail for certificate operations  
**Primary Key:** `id` (UUID)  
**Migration:** 21

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `template_id` | UUID | FK → certificate_templates(id) ON DELETE CASCADE |
| `action` | VARCHAR(50) | Action type (e.g., 'created', 'generated', 'sent') |
| `actor_email` | VARCHAR(255) | User who performed action |
| `recipient_email` | VARCHAR(255) | Affected recipient |
| `details` | JSONB | Additional metadata |
| `created_at` | TIMESTAMP | Action timestamp |

**Indexes:**
- `idx_certificate_history_template` ON `template_id`
- `idx_certificate_history_action` ON `action`

---

## 7. Volunteers

### `volunteer_applications`
**Purpose:** Student applications to volunteer at events  
**Primary Key:** `id` (UUID)  
**Migrations:** 18, 21

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `student_email` | TEXT / VARCHAR(255) | Applicant |
| `role` | TEXT | Volunteer role (migration 18) |
| `volunteer_role_id` | UUID | Role ID (migration 21) |
| `message` | TEXT | Motivation message (migration 18) |
| `motivation_statement` | TEXT | Motivation message (migration 21) |
| `status` | TEXT / VARCHAR(50) | CHECK IN ('pending', 'approved', 'rejected') |
| `applied_at` | TIMESTAMP | Application time |
| `reviewed_at` | TIMESTAMP | Review time |
| `reviewed_by` | TEXT / VARCHAR(255) | FK → users(email) |
| `rejection_reason` | TEXT | Rejection reason |
| `certificate_id` | UUID | FK → student_certificates(id) (migration 21) |
| `created_at` | TIMESTAMP | |

**⚠️ WARNING:** Schema differs between migrations 18 and 21. Recommend reconciliation.

**Indexes:**
- `idx_volunteer_applications_event` ON `event_id`
- `idx_volunteer_applications_student` / `idx_volunteer_applications_email` ON `student_email`
- `idx_volunteer_applications_status` ON `status`

**RLS Policies:**
- Students can view own applications and create new
- Organizers can view/update applications for their events

**Performance:** **Write-moderate** (volunteer recruitment phase). **Read-moderate** (organizer review).

---

### `volunteer_assignments`
**Purpose:** Approved volunteers actively assigned to events  
**Primary Key:** `id` (UUID)  
**Migration:** 18

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `student_email` | TEXT | FK → users(email) ON DELETE CASCADE |
| `role` | TEXT | Volunteer role |
| `assigned_at` | TIMESTAMP | Assignment time |
| `assigned_by` | TEXT | FK → users(email) |
| `hours_contributed` | DECIMAL(5,2) | Hours worked |
| `feedback` | TEXT | Organizer feedback |
| `rating` | INTEGER | CHECK 1-5 |
| UNIQUE(event_id, student_email, role) | | No duplicate assignments |

**Indexes:**
- `idx_volunteer_assignments_event` ON `event_id`
- `idx_volunteer_assignments_student` ON `student_email`

**RLS Policies:**
- Public can view (for event pages)
- Organizers can create/update for their events

**Fest-Critical:** 🟡 **MODERATE** - Volunteer coordination during fest.

---

## 8. Fests (Festival Hierarchies)

### `fests`
**Purpose:** Multi-day festivals containing multiple events  
**Primary Key:** `id` (UUID)  
**Migration:** 13

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `title` | VARCHAR(255) | Fest name |
| `description` | TEXT | Fest description |
| `banner_image` | VARCHAR(500) | Banner URL |
| `start_date` | TIMESTAMP | Fest start |
| `end_date` | TIMESTAMP | Fest end |
| `location` | VARCHAR(255) | Fest location |
| `college_id` | UUID | FK → colleges(id) ON DELETE SET NULL |
| `core_team_leader_email` | VARCHAR(255) | Team leader |
| `status` | VARCHAR(50) | CHECK IN ('active', 'cancelled', 'archived') |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Indexes:**
- `idx_fests_college_id` ON `college_id`
- `idx_fests_leader_email` ON `core_team_leader_email`

**Performance:** **Read-heavy** (fest discovery). **Write-rare** (fest creation).

**Fest-Critical:** ✅ **CRITICAL** - Primary fest metadata.

---

### `fest_members`
**Purpose:** Fest core team members  
**Primary Key:** `id` (UUID)  
**Migration:** 13

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `fest_id` | UUID | FK → fests(id) ON DELETE CASCADE |
| `member_email` | VARCHAR(255) | Team member |
| `role` | VARCHAR(50) | CHECK IN ('leader', 'member') |
| `joined_at` | TIMESTAMP | Join date |
| UNIQUE(fest_id, member_email) | | No duplicate memberships |

**Indexes:**
- `idx_fest_members_fest_id` ON `fest_id`

---

### `fest_events`
**Purpose:** Events submitted to fests (junction table, DEPRECATED?)  
**Primary Key:** `id` (UUID)  
**Migration:** 13

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `fest_id` | UUID | FK → fests(id) ON DELETE CASCADE |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `submitted_by_email` | VARCHAR(255) | Submitter |
| `approval_status` | VARCHAR(50) | CHECK IN ('pending', 'approved', 'rejected') |
| `rejection_reason` | TEXT | Rejection reason |
| `requested_at` | TIMESTAMP | Submission time |
| `approved_at` | TIMESTAMP | Approval time |
| `approved_by_email` | VARCHAR(255) | Approver |
| `created_at` | TIMESTAMP | |
| UNIQUE(fest_id, event_id) | | No duplicate submissions |

**Indexes:**
- `idx_fest_events_fest_id` ON `fest_id`
- `idx_fest_events_event_id` ON `event_id`
- `idx_fest_events_status` ON `approval_status`

**⚠️ WARNING:** May be superseded by `festival_submissions` (migration 14). Recommend code audit.

---

### `festival_submissions`
**Purpose:** Event submissions to festivals (newer table?)  
**Primary Key:** `id` (UUID)  
**Migration:** 14

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `fest_id` | UUID | FK → fests(id) ON DELETE CASCADE |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `submitted_by_email` | TEXT | Submitter |
| `submission_status` | TEXT | CHECK IN ('pending', 'approved', 'rejected') |
| `rejection_reason` | TEXT | Rejection reason |
| `reviewed_by_email` | TEXT | Reviewer |
| `submitted_at` | TIMESTAMP WITH TIME ZONE | Submission time |
| `reviewed_at` | TIMESTAMP WITH TIME ZONE | Review time |
| UNIQUE(fest_id, event_id) | | |

**Indexes:**
- `idx_festival_submissions_fest` ON `fest_id`
- `idx_festival_submissions_event` ON `event_id`
- `idx_festival_submissions_status` ON `submission_status`

**RLS Policies:**
- Anyone can view approved submissions
- Users can submit events
- Fest leaders can review submissions

**⚠️ WARNING:** Appears to duplicate `fest_events`. One should be deprecated.

---

### `festival_analytics`
**Purpose:** Aggregate fest statistics  
**Primary Key:** `id` (UUID)  
**Migration:** 14

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `fest_id` | UUID | FK → fests(id) ON DELETE CASCADE |
| `total_events` | INTEGER | Event count |
| `total_registrations` | INTEGER | Registration count |
| `total_revenue` | DECIMAL(10,2) | Revenue total |
| `total_attendance` | INTEGER | Attendance count |
| `unique_participants` | INTEGER | Unique users |
| `calculated_at` | TIMESTAMP WITH TIME ZONE | Calculation timestamp |

**Indexes:**
- `idx_festival_analytics_fest` ON `fest_id`

**RLS:** Public read access

**Performance:** **Write-rare** (batch calculation). **Read-moderate** (fest dashboards).

---

## 9. Banners

### `banners`
**Purpose:** Promotional banners (fest/event/sponsor)  
**Primary Key:** `id` (UUID)  
**Migration:** 07

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | |
| `title` | TEXT | Banner title | NOT NULL |
| `type` | TEXT | Banner type | CHECK IN ('fest', 'event', 'sponsor') |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | NULLABLE |
| `sponsor_email` | TEXT | FK → sponsors_profile(email) ON DELETE CASCADE | NULLABLE |
| `image_url` | TEXT | Banner image | NOT NULL |
| `placement` | TEXT | Display location | CHECK IN ('home_top', 'home_mid', 'event_page') |
| `link_type` | TEXT | Link destination | CHECK IN ('internal_event', 'internal_sponsor') |
| `link_target_id` | UUID | Target resource ID | NOT NULL |
| `status` | TEXT | Approval status | CHECK IN ('pending', 'approved', 'rejected'), DEFAULT 'pending' |
| `priority` | INTEGER | Display order | DEFAULT 0 |
| `start_date` | TIMESTAMP WITH TIME ZONE | Banner start | |
| `end_date` | TIMESTAMP WITH TIME ZONE | Banner end | |
| `created_by` | TEXT | Creator | NOT NULL |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | | |
| `views_count` | INTEGER | View counter | DEFAULT 0 |
| `clicks_count` | INTEGER | Click counter | DEFAULT 0 |

**Indexes:**
- `idx_banners_status` ON `status`
- `idx_banners_type` ON `type`
- `idx_banners_placement` ON `placement`
- `idx_banners_created_by` ON `created_by`
- `idx_banners_event_id` ON `event_id`
- `idx_banners_sponsor_email` ON `sponsor_email`
- `idx_banners_start_date` ON `start_date`
- `idx_banners_active` ON (`status`, `start_date`, `end_date`)

**RLS Policies:**
- Organizers can insert/view banners for their events
- Sponsors can insert/view their banners
- Admins can view/update/delete all
- Public can view approved, active banners
- Creators can update/delete pending banners

**Functions:**
- `increment_banner_views(banner_id UUID)` - Increments view count
- `increment_banner_clicks(banner_id UUID)` - Increments click count

**Performance:** **Read-very-heavy** (homepage/event pages). **Write-light** (banner creation).

**Fest-Critical:** 🟡 **MODERATE** - Sponsor/fest promotion during fest.

---

### `banner_analytics`
**Purpose:** Banner interaction tracking  
**Primary Key:** `id` (UUID)  
**Migration:** 07

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `banner_id` | UUID | FK → banners(id) ON DELETE CASCADE |
| `event_type` | TEXT | CHECK IN ('view', 'click') |
| `user_email` | TEXT | User identifier |
| `created_at` | TIMESTAMP WITH TIME ZONE | Event timestamp |

**Indexes:**
- `idx_banner_analytics_banner_id` ON `banner_id`
- `idx_banner_analytics_event_type` ON `event_type`
- `idx_banner_analytics_created_at` ON `created_at`

---

## 10. Notifications

### `push_notifications`
**Purpose:** Push notifications to user devices (PWA/Firebase)  
**Primary Key:** `id` (UUID)  
**Migration:** 09

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `recipient_email` | VARCHAR(255) | Recipient |
| `recipient_role` | VARCHAR(50) | User role |
| `title` | VARCHAR(200) | Notification title |
| `body` | TEXT | Notification body |
| `action_url` | VARCHAR(500) | Click destination |
| `notification_type` | VARCHAR(50) | Type (registration, payment, reminder, update) |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `data` | JSONB | Extra context |
| `is_delivered` | BOOLEAN | Delivery status |
| `delivered_at` | TIMESTAMP | Delivery time |
| `is_read` | BOOLEAN | Read status |
| `read_at` | TIMESTAMP | Read time |
| `push_type` | VARCHAR(50) | Priority (urgent, normal, low_priority) |
| `scheduled_for` | TIMESTAMP | Scheduled send time (T-24h, T-2h) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

**Indexes:**
- `idx_push_notifications_recipient` ON `recipient_email`
- `idx_push_notifications_role` ON `recipient_role`
- `idx_push_notifications_created` ON `created_at DESC`
- `idx_push_notifications_scheduled` ON `scheduled_for` WHERE NOT NULL

**RLS Policies:**
- Users can read their own notifications
- Service role can insert (for notification service)

**Functions:**
- `mark_notification_delivered(notification_id UUID)`
- `mark_push_delivered(notification_id UUID, delivery_provider VARCHAR)`
- `get_user_preferences(user_email VARCHAR, user_role VARCHAR)` - Get notification preferences with defaults

**Performance:** **Write-heavy** during event reminders. **Read-moderate** (user notification center).

**Fest-Critical:** ✅ **CRITICAL** - Event reminders and updates during fest.

---

### `in_app_notifications`
**Purpose:** In-app notification history  
**Primary Key:** `id` (UUID)  
**Migration:** 09

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `recipient_email` | VARCHAR(255) | Recipient |
| `recipient_role` | VARCHAR(50) | User role |
| `title` | VARCHAR(200) | Title |
| `body` | TEXT | Body |
| `action_url` | VARCHAR(500) | Click destination |
| `notification_type` | VARCHAR(50) | Type |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `icon_type` | VARCHAR(50) | Icon (payment, certificate, volunteer) |
| `data` | JSONB | Extra context |
| `is_read` | BOOLEAN | Read status |
| `read_at` | TIMESTAMP | Read time |
| `expires_at` | TIMESTAMP | Auto-delete time |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_in_app_notifications_recipient` ON `recipient_email`
- `idx_in_app_notifications_read` ON `is_read`

**RLS Policies:**
- Users can read their own notifications
- Service role can insert

**Performance:** **Write-heavy** (notification logging). **Read-heavy** (notification center).

**Fest-Critical:** 🟡 **MODERATE** - In-app notifications during fest.

---

### `notification_preferences`
**Purpose:** User notification settings  
**Primary Key:** `id` (UUID)  
**Migration:** 09

| Column | Type | Purpose | Default |
|--------|------|---------|---------|
| `id` | UUID | PRIMARY KEY | |
| `user_email` | VARCHAR(255) | User identifier | UNIQUE |
| `user_role` | VARCHAR(50) | User role | |
| `push_enabled` | BOOLEAN | Push notifications | TRUE |
| `push_payment` | BOOLEAN | Payment notifications | TRUE |
| `push_reminders` | BOOLEAN | Event reminders | TRUE |
| `push_updates` | BOOLEAN | Event updates | TRUE |
| `push_milestone_registrations` | BOOLEAN | Organizer milestones | TRUE |
| `push_sponsorships` | BOOLEAN | Sponsorship notifications | TRUE |
| `push_admin_alerts` | BOOLEAN | Admin alerts | FALSE |
| `in_app_enabled` | BOOLEAN | In-app notifications | TRUE |
| `in_app_history` | BOOLEAN | Keep history | TRUE |
| `quiet_hours_enabled` | BOOLEAN | Quiet hours | FALSE |
| `quiet_start` | TIME | Quiet hours start | |
| `quiet_end` | TIME | Quiet hours end | |
| `fest_mode_enabled` | BOOLEAN | Batch during fest week | TRUE |
| `created_at` | TIMESTAMP | | |
| `updated_at` | TIMESTAMP | | |

**Indexes:**
- `idx_notification_preferences_email` ON `user_email`

**RLS Policies:**
- Users can view/update/insert their own preferences

---

### `notification_logs`
**Purpose:** Notification delivery audit trail  
**Primary Key:** `id` (UUID)  
**Migration:** 09

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `push_notification_id` | UUID | FK → push_notifications(id) ON DELETE CASCADE |
| `in_app_notification_id` | UUID | FK → in_app_notifications(id) ON DELETE CASCADE |
| `recipient_email` | VARCHAR(255) | Recipient |
| `recipient_role` | VARCHAR(50) | User role |
| `notification_type` | VARCHAR(50) | Type |
| `status` | VARCHAR(50) | sent, failed, pending |
| `error_message` | TEXT | Error details |
| `delivery_provider` | VARCHAR(50) | firebase, supabase_realtime, etc. |
| `attempt_count` | INT | Retry count |
| `created_at` | TIMESTAMP | |

**Indexes:**
- `idx_notification_logs_recipient` ON `recipient_email`

**RLS Policies:**
- Service role can insert

---

## 11. Access Control

### `event_access_control`
**Purpose:** Event access restrictions (college/year/branch)  
**Primary Key:** `id` (UUID)  
**Migration:** 11

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | UNIQUE |
| `organizer_email` | TEXT | Organizer | NOT NULL |
| `access_type` | VARCHAR(50) | Access mode | CHECK IN ('open', 'restricted'), DEFAULT 'open' |
| `restrictions` | JSONB | Restriction criteria | DEFAULT '{}' |
| `is_active` | BOOLEAN | Active status | DEFAULT TRUE |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | | |

**Restrictions JSONB Format:**
```json
{
  "college": ["MIT Chennai", "IITM"],
  "year_of_study": [3, 4],
  "branch": ["CSE", "ECE"],
  "club_membership": ["Tech Club"],
  "require_all_criteria": false
}
```

**Indexes:**
- `idx_access_control_event` ON `event_id`
- `idx_access_control_organizer` ON `organizer_email`

**Performance:** **Read-moderate** (access checks during registration). **Write-light** (organizer setup).

**Fest-Critical:** 🟡 **MODERATE** - Eligibility checks during registration.

---

### `access_control_restrictions`
**Purpose:** Normalized restriction breakdown  
**Primary Key:** `id` (UUID)  
**Migration:** 11

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `access_control_id` | UUID | FK → event_access_control(id) ON DELETE CASCADE |
| `restriction_type` | VARCHAR(50) | CHECK IN ('college', 'year_of_study', 'branch', 'club_membership') |
| `restriction_value` | VARCHAR(255) | Restriction value |
| `created_at` | TIMESTAMP WITH TIME ZONE | |
| UNIQUE(access_control_id, restriction_type, restriction_value) | | |

**Indexes:**
- `idx_access_restrictions_control` ON `access_control_id`
- `idx_access_restrictions_type` ON `restriction_type`

---

### `access_check_logs`
**Purpose:** Access eligibility audit trail  
**Primary Key:** `id` (UUID)  
**Migration:** 11

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `user_email` | TEXT | User checked |
| `access_eligible` | BOOLEAN | Check result |
| `check_reason` | TEXT | Reason (e.g., 'college_mismatch', 'passed') |
| `checked_at` | TIMESTAMP WITH TIME ZONE | Check time |

**Indexes:**
- `idx_access_logs_event` ON `event_id`
- `idx_access_logs_user` ON `user_email`

**Functions:**
- `is_user_eligible_for_event(p_event_id UUID, p_user_email TEXT, p_user_college TEXT, p_user_year_of_study INT, p_user_branch TEXT, p_user_club_memberships TEXT[])` → BOOLEAN

---

## 12. Recommendations & Analytics

### `user_event_interactions`
**Purpose:** Track user behavior for recommendations  
**Primary Key:** `id` (UUID)  
**Migration:** 20

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | PRIMARY KEY | |
| `user_email` | TEXT | User | NOT NULL |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE | NOT NULL |
| `interaction_type` | TEXT | Interaction | CHECK IN ('view', 'register', 'skip', 'like', 'share') |
| `interaction_weight` | INTEGER | Weight for algorithm | DEFAULT 1 |
| `created_at` | TIMESTAMP WITH TIME ZONE | | |
| UNIQUE(user_email, event_id, interaction_type) | | |

**Indexes:**
- `idx_interactions_user` ON `user_email`
- `idx_interactions_event` ON `event_id`
- `idx_interactions_type` ON `interaction_type`

**RLS Policies:**
- Users can view/insert their own interactions

**Performance:** **Write-heavy** (tracking). **Read-heavy** (recommendation engine).

---

### `user_preferences`
**Purpose:** User recommendation preferences  
**Primary Key:** `id` (UUID)  
**Migration:** 20

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `user_email` | TEXT | UNIQUE |
| `preferred_categories` | TEXT[] | Favorite categories |
| `preferred_colleges` | TEXT[] | Favorite colleges |
| `max_price` | DECIMAL(10,2) | Price filter |
| `max_distance_km` | INTEGER | Distance filter |
| `preferred_days` | TEXT[] | Weekday preferences |
| `notification_preferences` | JSONB | DEFAULT '{"email": true, "push": true}' |
| `updated_at` | TIMESTAMP WITH TIME ZONE | |

**Indexes:**
- `idx_preferences_user` ON `user_email`

**RLS Policies:**
- Users can view/manage their own preferences

---

### `event_similarity_cache`
**Purpose:** Precomputed event similarity scores  
**Primary Key:** `id` (UUID)  
**Migration:** 20

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `event_a_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `event_b_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `similarity_score` | DECIMAL(5,4) | Similarity score (0-1) |
| `calculated_at` | TIMESTAMP WITH TIME ZONE | Calculation timestamp |
| UNIQUE(event_a_id, event_b_id) | | |

**Indexes:**
- `idx_similarity_event_a` ON `event_a_id`
- `idx_similarity_event_b` ON `event_b_id`
- `idx_similarity_score` ON `similarity_score DESC`

**RLS:** Authenticated users can read

**Performance:** **Write-rare** (batch recalculation). **Read-heavy** (recommendations).

---

## 13. Admin & Logs

### `admin_logs`
**Purpose:** Admin action audit trail (immutable)  
**Primary Key:** `id` (UUID)  
**Migration:** 22

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `admin_email` | TEXT | Admin user, FK → users(email) ON DELETE CASCADE |
| `action` | TEXT | Action performed |
| `resource_type` | TEXT | Affected resource type |
| `resource_id` | UUID | Affected resource ID |
| `details` | JSONB | Additional metadata |
| `ip_address` | TEXT | Admin IP |
| `created_at` | TIMESTAMP | Action timestamp, NOT NULL |

**Indexes:**
- `idx_admin_logs_action` ON (`action`, `created_at DESC`)
- `idx_admin_logs_email` ON (`admin_email`, `created_at DESC`)

**RLS Policies:**
- Only admins can read/create logs

---

### `user_reports`
**Purpose:** User-reported abuse/violations  
**Primary Key:** `id` (UUID)  
**Migration:** 22

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `reported_by_email` | TEXT | FK → users(email) |
| `reported_user_email` | TEXT | FK → users(email) |
| `reason` | TEXT | Report reason |
| `description` | TEXT | Report details |
| `status` | TEXT | CHECK IN ('pending', 'reviewed', 'dismissed', 'action_taken') |
| `action_taken` | TEXT | Resolution details |
| `created_at` | TIMESTAMP | Report time |
| `resolved_at` | TIMESTAMP | Resolution time |

**Indexes:**
- `idx_user_reports_status` ON (`status`, `created_at DESC`)

**RLS Policies:**
- Only admins can read/update user reports

---

### `event_reports`
**Purpose:** Reported inappropriate events  
**Primary Key:** `id` (UUID)  
**Migration:** 22

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `reported_by_email` | TEXT | FK → users(email) |
| `event_id` | UUID | FK → events(id) ON DELETE CASCADE |
| `reason` | TEXT | Report reason |
| `description` | TEXT | Report details |
| `status` | TEXT | CHECK IN ('pending', 'reviewed', 'dismissed', 'action_taken') |
| `action_taken` | TEXT | Resolution details |
| `created_at` | TIMESTAMP | Report time |
| `resolved_at` | TIMESTAMP | Resolution time |

**Indexes:**
- `idx_event_reports_status` ON (`status`, `created_at DESC`)

**RLS Policies:**
- Only admins can read/update event reports

---

### `payment_disputes`
**Purpose:** Payment dispute tracking  
**Primary Key:** `id` (UUID)  
**Migration:** 22

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | PRIMARY KEY |
| `payment_id` | UUID | FK → payments(id) |
| `student_email` | TEXT | FK → users(email) |
| `reason` | TEXT | Dispute reason |
| `amount` | NUMERIC | Disputed amount |
| `status` | TEXT | CHECK IN ('open', 'investigating', 'resolved', 'refunded') |
| `admin_notes` | TEXT | Internal notes |
| `created_at` | TIMESTAMP | Dispute date |
| `resolved_at` | TIMESTAMP | Resolution date |

**Indexes:**
- `idx_payment_disputes_status` ON (`status`, `created_at DESC`)

**RLS Policies:**
- Only admins can read/update payment disputes

---

## 14. Storage Buckets

### Supabase Storage Buckets

⚠️ **WARNING:** Storage bucket creation not documented in migrations. Buckets inferred from code usage.

**Identified Buckets:**

1. **`profile-photos`**
   - **Purpose:** User profile pictures
   - **Usage:** Student/organizer profile photos
   - **Code References:** `lib/profileStorage.ts`
   - **Performance:** Read-moderate (profile displays)

2. **`event-media`**
   - **Purpose:** Event-related media files
   - **Usage:** Certificate template images, event banners
   - **Code References:** `components/CertificateTemplateEditor.tsx`
   - **Performance:** Read-moderate (event pages, certificate generation)

3. **`happenin-certificates`**
   - **Purpose:** Generated certificate PDFs/images
   - **Usage:** Certificate template uploads, generated certificates
   - **Code References:** 
     - `api/organizer/certificate-template/generate/route.ts`
     - `api/organizer/certificate-template/upload-image/route.ts`
   - **Performance:** Write-heavy during bulk generation, Read-moderate (downloads)
   - **Fest-Critical:** ✅ **CRITICAL** - Certificate generation post-event

4. **Potential Additional Buckets (Not Confirmed):**
   - Banner images (sponsor/fest banners)
   - Event brochures
   - Payment receipts

**Storage Configuration:** ⚠️ Not documented in migrations. Buckets likely created manually via Supabase dashboard or separate scripts.

---

## 15. Read-Heavy vs Write-Heavy Tables

### Read-Heavy Tables (High Query Volume)

| Table | Read Pattern | Critical During |
|-------|--------------|-----------------|
| `events` | Very High - Event listings, search, filters | All times |
| `colleges` | Very High - Autocomplete, nearby search | All times |
| `banners` | Very High - Homepage, event pages | Fest days |
| `registrations` | High - Attendance tracking, check-ins | Fest days |
| `certificates` (all tables) | Moderate - Dashboard displays | Post-event |
| `fests` | High - Fest discovery | Fest days |
| `sponsorship_deals` | Moderate - Display sponsors | Fest days |
| `event_locations` | High - Nearby discovery | All times |
| `user_event_interactions` | High - Recommendations | All times |
| `push_notifications` | High - Notification center | Fest days |

### Write-Heavy Tables (High Insert/Update Volume)

| Table | Write Pattern | Critical During |
|-------|---------------|-----------------|
| `payments` | High - Ticket purchases | 48h before events |
| `registrations` | High - New registrations | Pre-event window |
| `user_event_interactions` | Very High - Tracking clicks/views | All times |
| `push_notifications` | High - Event reminders | Event day - 24h |
| `in_app_notifications` | High - Notification logging | All times |
| `banner_analytics` | High - View/click tracking | All times |
| `access_check_logs` | Moderate - Eligibility checks | Registration window |
| `certificate_recipients` | High - Bulk generation | Post-event |
| `admin_logs` | Moderate - Admin actions | All times |

### Write-Rare Tables (Mostly Static)

- `colleges` (admin-managed)
- `event_categories` (seeded data)
- `platform_default_deliverables` (admin-managed)
- `users` (user creation only)
- `fests` (rare fest creation)

---

## 16. Fest-Critical Tables

**Tables MUST be performant and stable during fest days (10K+ concurrent users):**

### ✅ **CRITICAL PRIORITY**

1. **`events`** - Primary event data
2. **`registrations`** - Check-in/attendance tracking
3. **`payments`** - Ticket purchases (48h before event)
4. **`push_notifications`** - Event reminders (T-24h, T-2h)
5. **`fests`** - Fest metadata
6. **`bulk_tickets`** - Bulk ticket validation
7. **`happenin-certificates` (storage)** - Certificate generation post-event

### 🟡 **MODERATE PRIORITY**

8. **`colleges`** - College-based filtering
9. **`banners`** - Sponsor/fest banners
10. **`event_access_control`** - Eligibility checks
11. **`volunteer_assignments`** - Volunteer coordination
12. **`event_locations`** - Nearby event discovery
13. **`in_app_notifications`** - In-app notifications

### 🟢 **LOW PRIORITY (Post-Fest)**

- Certificate generation tables (post-event processing)
- Analytics tables (background processing)
- Admin logs (audit trail)

---

## 17. Missing Indexes & Risks

### ⚠️ CRITICAL MISSING INDEXES

1. **`payments` table:**
   - **MISSING:** Index on `student_email`
   - **MISSING:** Index on `event_id`
   - **MISSING:** Composite index on (`status`, `created_at DESC`)
   - **RISK:** Slow payment history queries, admin refund processing bottleneck

2. **`registrations` table:**
   - **MISSING:** Composite index on (`event_id`, `status`) for check-in queries
   - **RISK:** Slow check-in lookups during fest

3. **`events` table:**
   - **MISSING:** Index on `status` column (if status column exists)
   - **MISSING:** Composite index on (`college_id`, `start_datetime`) for college-filtered listings
   - **RISK:** Slow event discovery for college-specific feeds

### ⚠️ SCHEMA INCONSISTENCIES

1. **Duplicate Sponsor Tables:**
   - `sponsors_profile` (migration 03) vs `sponsors` (migration 19)
   - **RISK:** Data inconsistency, unclear which table is canonical

2. **Duplicate Fest Event Tables:**
   - `fest_events` (migration 13) vs `festival_submissions` (migration 14)
   - **RISK:** Duplicate submissions, inconsistent approval tracking

3. **Duplicate Certificate Template Columns:**
   - Migration 08 vs Migration 21 create overlapping columns (name_pos_x vs name_position_x)
   - **RISK:** Data corruption, unclear which columns to use

4. **Duplicate Sponsorship Tables:**
   - `sponsorship_deals` (migration 03) vs `sponsorships` (migration 19)
   - **RISK:** Unclear which is production-ready

### ⚠️ MISSING TABLE DEFINITIONS

1. **`student_profiles`** - Referenced but CREATE statement not in migrations
2. **`organizer_profiles`** - Referenced but CREATE statement not in migrations
3. **RISK:** Migration script may be incomplete or tables created manually

### ⚠️ RLS POLICY GAPS

1. **`users` table:** RLS not explicitly enabled
2. **`payments` table:** No RLS policies defined
3. **`event_access_control` table:** No RLS policies defined
4. **RISK:** Potential unauthorized data access

### ⚠️ STORAGE BUCKET RISKS

1. **No Storage Bucket Migrations:** Buckets not versioned, may be created manually
2. **No Bucket Policies Documented:** Access control not in migrations
3. **RISK:** Inconsistent bucket configuration across environments

### ⚠️ DATA INTEGRITY RISKS

1. **`payments.payment_id`** in `bulk_ticket_purchases` - FK not defined
2. **`sponsorships.fest_id`** - FK to `fests` not defined
3. **RISK:** Orphaned records, referential integrity violations

---

## Recommendations

### Database Performance (Pre-Fest)

1. **Add Missing Indexes:**
   ```sql
   -- Critical for fest days
   CREATE INDEX idx_payments_student ON payments(student_email);
   CREATE INDEX idx_payments_event ON payments(event_id);
   CREATE INDEX idx_payments_status_created ON payments(status, created_at DESC);
   CREATE INDEX idx_registrations_event_status ON registrations(event_id, status);
   CREATE INDEX idx_events_college_start ON events(college_id, start_datetime);
   ```

2. **Enable Query Monitoring:** Use Supabase slow query logs to identify bottlenecks during load testing.

3. **Connection Pooling:** Configure PgBouncer for 10K+ concurrent users.

### Schema Cleanup (Post-Fest)

1. **Consolidate Duplicate Tables:**
   - Decide between `sponsors_profile` vs `sponsors`
   - Decide between `fest_events` vs `festival_submissions`
   - Decide between `sponsorship_deals` vs `sponsorships`
   - Merge duplicate certificate template columns

2. **Document Profile Tables:**
   - Add CREATE TABLE migrations for `student_profiles` and `organizer_profiles`

3. **RLS Audit:**
   - Enable RLS on `users`, `payments`, `event_access_control`
   - Test policies in production-like environment

4. **Storage Bucket Documentation:**
   - Document all active storage buckets
   - Add bucket creation to migrations or setup scripts
   - Document bucket policies (public vs private)

---

**END OF DATABASE_SCHEMA.md**
