# SQL Migration Checklist for Supabase

> **Last Updated:** February 17, 2026  
> **Total Migrations:** 17 (consolidated from 34 originals)

This file documents all **17 SQL migration files** required to set up the complete Happenin database schema.

## Migration Summary

| Category | Count | Migration Files | Status |
|----------|-------|-----------------|--------|
| **Core Features** | 17 | All consolidated migrations | ✅ Required |
| **TOTAL** | 17 | Complete, optimized stack | ✅ Production-ready |

### When to Use Each Tier:

- **Core Only (12)**: MVP launch, basic event platform → ✅ Run these
- **Core + Recommended (23)**: Full-featured platform → ✅ Run all

## File Locations

All migration files are in: `backend/supabase/migrations/`

**Core migrations (12):**
- 01_core_events_and_registrations.sql, 02_create_colleges_table.sql, 03_create_sponsorship_system.sql, 04_add_sponsorship_payouts_and_bank_accounts.sql, 05_add_event_schedule.sql, 06_add_event_enhancements.sql, 07_create_banners_table.sql, 08_create_certificate_templates.sql, 09_add_notifications_system.sql, 10_add_sponsorship_gating.sql, 11_add_bulk_tickets_and_access_control.sql, 12_add_college_references.sql

**Advanced/optional migrations (11):**
- 13_create_fest_system.sql, 14_festival_enhancements.sql, 15_geolocation_features.sql, 16_postgis_spatial_indexing.sql, 17_favorite_events_system.sql, 18_extended_volunteer_system.sql, 19_extended_sponsorships.sql, 20_event_recommendations.sql, 21_extended_certificates.sql, 22_admin_analytics_and_logs.sql, 23_event_categories_cancellation_reschedule.sql

## How to Run Migrations
```bash
cd backend
supabase db push
```

### Method 2: Using Supabase Dashboard (Manual)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy-paste each SQL file content
5. Click **Run**

---

## Complete SQL Migration List (23 Total)

### ✅ 1. **01_core_events_and_registrations.sql** (BASE)
**Purpose**: Core events and registrations foundation - must run first!  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/01_core_events_and_registrations.sql`  
**Tables Created**:
- `events` (main events table)
- `registrations` (student registrations)
- Indexes for performance

**Run Order**: 1st (Dependencies: None - BASE TABLE)

---

### ✅ 2. **02_create_colleges_table.sql**
**Purpose**: Create colleges table with location data  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/02_create_colleges_table.sql`  
**Tables Created**:
- `colleges` (main table)
- Related indexes for searching

**Run Order**: 1st (Dependencies: None)

---

### ✅ 3. **03_create_sponsorship_system.sql**
**Purpose**: Create sponsorship and deals infrastructure  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/03_create_sponsorship_system.sql`  
**Tables Created**:
- `sponsorship_packages`
- `sponsorship_deals`
- `payout_sources`
- `organizer_bank_accounts`

**Run Order**: 2nd (Dependencies: None)

---

### ✅ 4. **04_add_sponsorship_payouts_and_bank_accounts.sql**
**Purpose**: Add payout system for organizers  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/04_add_sponsorship_payouts_and_bank_accounts.sql`  
**Tables Modified**:
- `sponsorship_deals` (adds payout fields)
- `organizer_bank_accounts`

**Run Order**: 4th (Dependencies: 03_create_sponsorship_system.sql)

---

### ✅ 5. **05_add_event_schedule.sql**
**Purpose**: Add multi-day event scheduling support  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/05_add_event_schedule.sql`  
**Tables Modified**:
- `events` (adds schedule columns)
- `event_schedule_sessions` (new table)

**Run Order**: 4th (Dependencies: None)

---

### ✅ 6. **06_add_event_enhancements.sql**
**Purpose**: Add prize pool, contact details, brochure support  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/06_add_event_enhancements.sql`  
**Tables Modified**:
- `events` (adds:)
  - `prize_pool_amount`
  - `prize_pool_description`
  - `organizer_contact_phone`
  - `organizer_contact_email`
  - `brochure_url`

**Run Order**: 5th (Dependencies: events table must exist)

---

### ✅ 7. **07_create_banners_table.sql**
**Purpose**: Create promotional banner system  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/07_create_banners_table.sql`  
**Tables Created**:
- `banners` (homepage/event promotional banners)

**Run Order**: 6th (Dependencies: None)

---

### ✅ 8. **08_create_certificate_templates.sql**
**Purpose**: Create digital certificate generation system  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/08_create_certificate_templates.sql`  
**Tables Created**:
- `certificate_templates`
- `issued_certificates`

**Run Order**: 7th (Dependencies: None)

---

### ✅ 9. **09_add_notifications_system.sql**
**Purpose**: Complete notification system (in-app + push + preferences)  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/09_add_notifications_system.sql`  
**Tables Created**:
- `push_notifications`
- `in_app_notifications`
- `notification_preferences`
- `notification_logs`

**Functions Created**:
- `notify_student_payment_success()`
- `schedule_event_reminders()`
- `schedule_event_reminders_2h()`
- `notify_organizer_first_registration()`
- `notify_organizer_registration_milestone()`
- `notify_organizer_event_day()`
- `notify_organizer_volunteer_application()`
- `notify_admin_sponsor_payment()`
- `send_notification()`
- `get_user_preferences()`
- `create_default_notification_preferences()`
- `archive_old_notifications()`
- `mark_push_delivered()`

**Run Order**: 8th (Dependencies: events, registrations tables)

---

### ✅ 10. **10_add_sponsorship_gating.sql**
**Purpose**: Feature access control based on sponsor payment  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/10_add_sponsorship_gating.sql`  
**Features Gated**:
- QR code attendance scanning
- Certificate generation
- Sponsor logo display
- Event reports

**Run Order**: 10th (Dependencies: sponsorship tables)

---

### ✅ 11. **11_add_bulk_tickets_and_access_control.sql**
**Purpose**: Bulk ticket generation and event access control  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/11_add_bulk_tickets_and_access_control.sql`  
**Tables Created**:
- `tickets` (bulk ticket system)

**Tables Modified**:
- `events` (adds access control fields)

**Run Order**: 10th (Dependencies: events, registrations tables)

---

### ✅ 12. **12_add_college_references.sql**
**Purpose**: Link colleges to events and students  
**Status**: Required ✓  
**File Location**: `backend/supabase/migrations/12_add_college_references.sql`  
**Tables Modified**:
- `events` (adds college_id)
- `profiles` (adds college references)

**Run Order**: 12th (Dependencies: 02_create_colleges_table.sql)

---

## ADDITIONAL ADVANCED FEATURES (Optional but Recommended)

### ✅ 13. **13_create_fest_system.sql**
**Purpose**: Create festival/competition management system  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/13_create_fest_system.sql`  
**Tables Created**:
- `fests` (festivals/competitions)
- `fest_events` (event-to-fest relationships)

**Why needed**: Supports organizing events into festivals/competitions with approval workflow  
**Run Order**: 13th (Dependencies: events, colleges tables)

---

### ✅ 14. **14_festival_enhancements.sql**
**Purpose**: Festival submissions and analytics  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/14_festival_enhancements.sql`  
**Tables Created**:
- `festival_submissions` (event submissions to festivals)
- `festival_analytics` (fest performance metrics)

**Why needed**: Tracks event submissions to fests and provides analytics  
**Run Order**: 14th (Dependencies: 13_create_fest_system.sql)

---

### ✅ 15. **15_geolocation_features.sql**
**Purpose**: Geolocation and nearby events features  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/15_geolocation_features.sql`  
**Tables Modified**:
- `colleges` (adds latitude/longitude for geolocation)

**Why needed**: Enables "nearby events" feature and location-based discovery  
**Run Order**: 15th (Dependencies: 02_create_colleges_table.sql)

---

### ✅ 16. **16_postgis_spatial_indexing.sql**
**Purpose**: PostGIS extension for advanced spatial queries  
**Status**: Optional ✓  
**File Location**: `backend/supabase/migrations/16_postgis_spatial_indexing.sql`  
**Features**:
- PostGIS extension enabled
- Geometry columns for fast distance queries
- Spatial indexes

**Why needed**: Enables efficient location-based searches (5-10x faster than coordinate math)  
**Run Order**: 16th (Dependencies: 15_geolocation_features.sql)

---

### ✅ 17. **17_favorite_events_system.sql**
**Purpose**: Allow students to save/bookmark events  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/17_favorite_events_system.sql`  
**Tables Created**:
- `favorite_events` (student bookmarks)

**Why needed**: Improves UX (save for later), enables remarketing, increases conversion  
**Run Order**: 16th (Dependencies: events, users tables)

---

### ✅ 18. **18_extended_volunteer_system.sql**
**Purpose**: Extended volunteer management with roles and tracking  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/18_extended_volunteer_system.sql`  
**Tables Modified/Created**:
- `events` (adds volunteer fields)
- `volunteer_applications` (application tracking)
- `volunteer_roles` (role definitions)

**Why needed**: Enables robust volunteer recruitment for events  
**Run Order**: 18th (Dependencies: events, 09_add_notifications_system.sql)

---

### ✅ 19. **19_extended_sponsorships.sql**
**Purpose**: Extended sponsorship features with tiered packages  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/19_extended_sponsorships.sql`  
**Tables Created**:
- `sponsors` (sponsor profiles)
- `sponsorships` (sponsorship deals with tiers)

**Why needed**: More granular sponsorship control (title, gold, silver tiers)  
**Run Order**: 19th (Dependencies: 03_create_sponsorship_system.sql)

---

### ✅ 20. **20_event_recommendations.sql**
**Purpose**: AI/ML foundation for event recommendations  
**Status**: Optional ✓  
**File Location**: `backend/supabase/migrations/20_event_recommendations.sql`  
**Tables Created**:
- `user_event_interactions` (view/register/like tracking)
- `user_preferences` (saved user preferences)
- `event_similarity_scores` (computed recommendations)

**Why needed**: Personalized recommendations increase engagement by 20-40%  
**Run Order**: 19th (Dependencies: events, users tables)

---

### ✅ 21. **21_extended_certificates.sql**
**Purpose**: Extended certificate template system with bulk generation  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/21_extended_certificates.sql`  
**Tables Created**:
- `certificate_templates` (extended templates)
- `certificate_recipients` (bulk recipient tracking)
- `student_certificates` (issued certificates)

**Why needed**: Supports bulk certificate issuance and advanced templating  
**Run Order**: 21st (Dependencies: 08_create_certificate_templates.sql)

---

### ✅ 22. **22_admin_analytics_and_logs.sql**
**Purpose**: Admin activity logging and user analytics  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/22_admin_analytics_and_logs.sql`  
**Tables Created**:
- `admin_logs` (all admin actions)
- `user_reports` (abuse reports)
- `analytics_events` (user behavior tracking)

**Why needed**: Audit trail for compliance, detect fraud, understand user behavior  
**Run Order**: 21st (Dependencies: events, users tables)

---

### ✅ 23. **23_event_categories_cancellation_reschedule.sql**
**Purpose**: Event categories, cancellation, and rescheduling system  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/23_event_categories_cancellation_reschedule.sql`  
**Tables Created**:
- `event_categories` (event type categories)
- `event_category_mapping` (many-to-many relationships)
- `event_changelog` (history of status changes)
- `event_reschedules` (reschedule tracking)

**Why needed**: Enables event categorization, cancellation handling, and rescheduling with history  
**Run Order**: 22nd (Dependencies: events table)

---

### ✅ 24. **24_sponsorship_visibility_system.sql**
**Purpose**: Platform-managed visibility packages for sponsors  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/24_sponsorship_visibility_system.sql`  
**Tables Modified**:
- `sponsorship_deals` (adds visibility fields)

**Why needed**: Enables sponsors to purchase visibility packages (Digital/App/Fest) with platform-managed deliverables  
**Run Order**: 23rd (Dependencies: 03_create_sponsorship_system.sql)

---

### ✅ 25. **25_whatsapp_group_feature.sql**
**Purpose**: Optional WhatsApp group feature for events  
**Status**: Recommended ✓  
**File Location**: `backend/supabase/migrations/25_whatsapp_group_feature.sql`  
**Tables Modified**:
- `events` (adds `whatsapp_group_enabled`, `whatsapp_group_link`)

**Tables Created**:
- `whatsapp_group_joins` (tracks join clicks for analytics)

**Why needed**: Allows organizers to optionally create WhatsApp groups for registered participants (opt-in only)  
**Run Order**: 24th (Dependencies: events, registrations tables)

---

## Recommended Execution Order

```
CORE MIGRATIONS (Essential - Must Run First):
1. 01_core_events_and_registrations.sql      (base tables)
2. 02_create_colleges_table.sql              (core reference)
3. 03_create_sponsorship_system.sql          (sponsorship base)
4. 04_add_sponsorship_payouts_and_bank_accounts.sql
5. 05_add_event_schedule.sql
6. 06_add_event_enhancements.sql
7. 07_create_banners_table.sql
8. 08_create_certificate_templates.sql
9. 09_add_notifications_system.sql
10. 10_add_sponsorship_gating.sql
11. 11_add_bulk_tickets_and_access_control.sql
12. 12_add_college_references.sql

ADVANCED FEATURES (Recommended):
13. 13_create_fest_system.sql
14. 14_festival_enhancements.sql
15. 15_geolocation_features.sql
16. 16_postgis_spatial_indexing.sql          (optional for performance)
17. 17_favorite_events_system.sql
18. 18_extended_volunteer_system.sql
19. 19_extended_sponsorships.sql
20. 20_event_recommendations.sql             (optional - for ML)
21. 21_extended_certificates.sql
22. 22_admin_analytics_and_logs.sql
23. 23_event_categories_cancellation_reschedule.sql
```

24. 24_sponsorship_visibility_system.sql
25. 25_whatsapp_group_feature.sql
```

**Total Migrations**: 25
**Estimated Time**: 5-10 minutes
**Core Only**: 12 migrations (~3-5 minutes)
**Full Stack**: All 25 migrations (~5-10 minutes)

---

## Verification Checklist

After running all migrations, verify the setup:

### Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables: ~25+

### Check Functions
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

Expected functions: ~15+

### Check Triggers
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;
```

Expected triggers: ~8+

### Check Indexes
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

Expected indexes: ~30+

---

## Rollback Instructions

If you need to undo migrations (careful!):

```sql
-- Drop all notification system tables
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS in_app_notifications CASCADE;
DROP TABLE IF EXISTS push_notifications CASCADE;

-- Drop sponsorship tables
DROP TABLE IF EXISTS sponsorship_deals CASCADE;
DROP TABLE IF EXISTS sponsorship_packages CASCADE;
DROP TABLE IF EXISTS organizer_bank_accounts CASCADE;
DROP TABLE IF EXISTS payout_sources CASCADE;

-- Drop certificate tables
DROP TABLE IF EXISTS issued_certificates CASCADE;
DROP TABLE IF EXISTS certificate_templates CASCADE;

-- Drop ticket tables
DROP TABLE IF EXISTS tickets CASCADE;

-- Drop banner tables
DROP TABLE IF EXISTS banners CASCADE;

-- Drop college tables
DROP TABLE IF EXISTS colleges CASCADE;

-- Drop schedule tables
DROP TABLE IF EXISTS event_schedule_sessions CASCADE;

-- Remove columns from events (instead of dropping entire table)
ALTER TABLE events DROP COLUMN IF EXISTS prize_pool_amount CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS prize_pool_description CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS organizer_contact_phone CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS organizer_contact_email CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS brochure_url CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS schedule_sessions CASCADE;
ALTER TABLE events DROP COLUMN IF EXISTS college_id CASCADE;
```

---

## Troubleshooting

### Error: "Table already exists"
**Solution**: The migration has already been run. Check if table exists:
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'table_name' 
AND table_schema = 'public';
```

### Error: "Foreign key constraint fails"
**Solution**: Run migrations in the correct order (see above)

### Error: "Function already exists"
**Solution**: Use `CREATE OR REPLACE FUNCTION` instead of `CREATE FUNCTION`

### Missing columns after migration
**Solution**: Run the migration again or manually add columns using ALTER TABLE

---

## External Setup Required for Optional/Advanced Migrations

### ✅ Most Advanced Migrations - SQL Only (No External Setup)

**Just paste SQL in Supabase - that's all you need:**
- ✅ 13_create_fest_system.sql - No external setup needed
- ✅ 14_festival_enhancements.sql - No external setup needed
- ✅ 15_geolocation_features.sql - No external setup needed
- ✅ 17_favorite_events_system.sql - No external setup needed
- ✅ 18_extended_volunteer_system.sql - No external setup needed
- ✅ 19_extended_sponsorships.sql - No external setup needed
- ✅ 21_extended_certificates.sql - No external setup needed
- ✅ 22_admin_analytics_and_logs.sql - No external setup needed
- ✅ 23_event_categories_cancellation_reschedule.sql - No external setup needed

### 🔧 Migrations That Need External Setup

**1. 16_postgis_spatial_indexing.sql - PostgreSQL Extension Required**
   ```
   What it does: Enables spatial queries for "nearby events" feature
   
   External setup needed:
   ✓ Enable PostGIS extension in Supabase:
     1. Go to Supabase Dashboard → SQL Editor
     2. Run: CREATE EXTENSION postgis;
     3. Then run the migration SQL
   
   Why: PostGIS is an extension that adds geometric/geographic types to PostgreSQL
   Alternative: If PostGIS not available, location features work with basic math (slower)
   ```

**2. 20_event_recommendations.sql - Recommendation Algorithm Code Required**
   ```
   What it does: Creates tables for storing user interactions and event similarities
   
   External setup needed:
   ✓ Implement recommendation algorithm in application code:
     Location: src/lib/recommendations/
     Files to create:
       - calculateUserPreferences.ts (infer from user history)
       - calculateEventSimilarity.ts (compare events)
       - getRecommendations.ts (get top N recommendations)
   
   How it works:
     1. Track user interactions (views, registrations, likes)
     2. Calculate which categories/colleges user prefers
     3. Calculate similarity between events
     4. Return personalized recommendations
   
   Why: Cannot be done in SQL alone - needs algorithmic computation
   
   Alternative: Skip this migration if not implementing recommendations yet
   
   Complexity: Medium (3-4 days of development)
   Impact: Increases event discovery by 20-40%
   ```

---

## Additional Configuration Required (After Migrations)

1. **Enable RLS** (Row Level Security) on all tables
   - Already configured in migration files
   - Verify in Table Editor → Security Policies

2. **Set up Replication** (for backups)
   - Supabase Dashboard → Databases → Replication

3. **Configure Backups**
   - Supabase Dashboard → Settings → Backups

4. **Set up Environment Variables**
   - See EXTERNAL_SERVICES_SETUP.md

---

## Complete Migration Matrix (All 23 Files)

| # | Migration File | Tier | Purpose | Key Tables | Dependencies |
|---|----------------|------|---------|-----------|--------------|
| 1 | 01_core_events_and_registrations.sql | CORE | Base events/registrations | events, registrations | None |
| 2 | 02_create_colleges_table.sql | CORE | Colleges reference | colleges | None |
| 3 | 03_create_sponsorship_system.sql | CORE | Sponsorship base | sponsorship_packages, sponsorship_deals | None |
| 4 | 04_add_sponsorship_payouts_and_bank_accounts.sql | CORE | Organizer payouts | organizer_bank_accounts | #3 |
| 5 | 05_add_event_schedule.sql | CORE | Multi-day events | event_schedule_sessions | #1 |
| 6 | 06_add_event_enhancements.sql | CORE | Prize pool, contact | events (adds cols) | #1 |
| 7 | 07_create_banners_table.sql | CORE | Promotional banners | banners | None |
| 8 | 08_create_certificate_templates.sql | CORE | Certificates | certificate_templates, issued_certificates | None |
| 9 | 09_add_notifications_system.sql | CORE | Notifications | push_notifications, in_app_notifications | #1 |
| 10 | 10_add_sponsorship_gating.sql | CORE | Feature access control | (adds to events) | #3 |
| 11 | 11_add_bulk_tickets_and_access_control.sql | CORE | Bulk tickets | tickets | #1 |
| 12 | 12_add_college_references.sql | CORE | Link colleges to events | (references) | #2 |
| 13 | 13_create_fest_system.sql | ADVANCED | Festival management | fests, fest_events | #1, #2 |
| 14 | 14_festival_enhancements.sql | ADVANCED | Fest submissions/analytics | festival_submissions, festival_analytics | #13 |
| 15 | 15_geolocation_features.sql | ADVANCED | Location-based events | (adds to colleges) | #2 |
| 16 | 16_postgis_spatial_indexing.sql | ADVANCED | Spatial queries (OPTIONAL) | geometry columns | #15 |
| 17 | 17_favorite_events_system.sql | ADVANCED | Saved events | favorite_events | #1 |
| 18 | 18_extended_volunteer_system.sql | ADVANCED | Volunteer management | volunteer_applications, volunteer_roles | #1, #9 |
| 19 | 19_extended_sponsorships.sql | ADVANCED | Sponsor profiles | sponsors, sponsorships | #3 |
| 20 | 20_event_recommendations.sql | ADVANCED | AI recommendations (OPTIONAL) | user_event_interactions, user_preferences | #1 |
| 21 | 21_extended_certificates.sql | ADVANCED | Bulk certificate generation | certificate_recipients, certificate_templates | #8 |
| 22 | 22_admin_analytics_and_logs.sql | ADVANCED | Admin logging & analytics | admin_logs, user_reports, analytics_events | #1 |
| 23 | 23_event_categories_cancellation_reschedule.sql | ADVANCED | Categories & cancellation | event_categories, event_changelog, event_reschedules | #1 |

**Legend:**
- **CORE**: Essential for production (12 migrations)
- **ADVANCED**: Additional features, recommended (11 migrations)
- **OPTIONAL**: Performance or experimental features (marked in Purpose)

---

## Notes

- All migrations use `IF NOT EXISTS` to safely handle re-runs
- Each migration is self-contained and can be rerun
- Migrations preserve existing data
- RLS policies are automatically applied
- Foreign key constraints are properly set up

---

**Last Updated**: February 2026
