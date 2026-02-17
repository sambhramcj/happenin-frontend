# FILE_INVENTORY.md

> **Complete File Inventory for Happenin Project**  
> **Last Updated:** February 17, 2026  
> **Purpose:** Comprehensive documentation of every file and folder in the project

---

## Table of Contents

1. [Root Directory](#root-directory)
2. [Documentation Files (docs/)](#documentation-files-docs)
3. [Backend (backend/)](#backend-backend)
4. [Frontend (frontend/)](#frontend-frontend)
5. [Configuration Files](#configuration-files)
6. [File Count Summary](#file-count-summary)

---

## Root Directory

```
happenin/
├── backend/                          # Backend services and database migrations
├── docs/                             # System documentation
├── frontend/                         # Next.js frontend application
├── EXTERNAL_SERVICES_SETUP.md       # Setup guide for external services
├── FEATURE_STATUS.md                # Feature implementation tracking
├── SQL_MIGRATION_CHECKLIST.md       # Database migration checklist
├── TESTING_CHECKLIST.md             # Testing checklist for QA
└── TESTING_CHECKLIST_DETAILED.md    # Detailed testing procedures
```

---

### Root Level Files

#### EXTERNAL_SERVICES_SETUP.md
**Purpose:** Guide for setting up external service integrations  
**Contains:**
- Supabase project setup instructions
- Razorpay account configuration
- Google OAuth credentials setup
- Environment variable configuration
- Service connection testing steps

---

#### FEATURE_STATUS.md
**Purpose:** Track implementation status of all features  
**Contains:**
- ✅ Completed features list
- 🚧 In-progress features
- 📋 Planned features
- Feature priority matrix
- Dependencies between features

---

#### SQL_MIGRATION_CHECKLIST.md
**Purpose:** Checklist for running database migrations safely  
**Contains:**
- Pre-migration backup steps
- Migration execution order (01-23)
- Post-migration verification steps
- Rollback procedures
- Testing requirements

---

#### TESTING_CHECKLIST.md
**Purpose:** High-level testing checklist for QA team  
**Contains:**
- Manual testing scenarios
- User flow validation
- Key functionality checks
- Browser compatibility testing
- Performance testing criteria

---

#### TESTING_CHECKLIST_DETAILED.md
**Purpose:** Detailed step-by-step testing procedures  
**Contains:**
- Granular test cases for each feature
- Expected vs actual results templates
- Bug reporting format
- Regression testing scenarios
- Edge case testing

---

## Documentation Files (docs/)

```
docs/
├── ARCHITECTURE.md                  # System architecture overview
├── AUTH_AND_ROLES.md               # Authentication and authorization
├── CRITICAL_FLOWS.md               # Critical user journeys
├── DATABASE_SCHEMA.md              # Complete database schema
├── DEPLOYMENT.md                   # Deployment procedures
├── FEST_DAY_CHECKLIST.md          # Operational checklist for fest day
├── FUTURE_FEATURES.md             # Planned features and improvements
├── NON_NEGOTIABLES.md             # Critical requirements
└── PAYMENTS_AND_SPONSORSHIPS.md   # Payment processing documentation
```

---

### docs/ARCHITECTURE.md
**Purpose:** System architecture and design documentation  
**Contains:**
- High-level architecture diagram
- Client-server responsibilities
- Authentication flow (NextAuth + JWT)
- API route structure
- Database usage patterns (server vs client)
- Critical paths and dependencies
- PWA architecture
- Performance considerations for 10K+ users

---

### docs/AUTH_AND_ROLES.md
**Purpose:** Authentication and authorization system documentation  
**Contains:**
- NextAuth v4 configuration
- Role system (student, organizer, admin, sponsor)
- Credentials provider (email/password with bcrypt)
- Google OAuth integration
- JWT token structure and callbacks
- Session management
- Middleware (proxy.ts) for role-based routing
- Row-Level Security (RLS) patterns
- Security gaps and recommendations
- Role-specific access matrix

---

### docs/CRITICAL_FLOWS.md
**Purpose:** End-to-end critical user journeys  
**Contains:**
- 9 critical flows documented:
  1. Student registration & event discovery
  2. Ticket purchase flow (Razorpay)
  3. Event check-in flow (QR codes)
  4. Organizer event creation
  5. Certificate generation & distribution
  6. Volunteer application & approval
  7. Fest submission & approval
  8. Sponsorship deal flow
  9. Banner management flow
- Dependencies for each flow
- Failure scenarios and mitigation
- Performance bottlenecks (10K+ users)
- Cross-flow dependencies

---

### docs/DATABASE_SCHEMA.md
**Purpose:** Complete database schema documentation  
**Contains:**
- 50+ tables across 13 domains
- Column definitions with types and constraints
- Indexes and performance optimizations
- Row-Level Security (RLS) policies
- PostgreSQL functions and triggers
- Supabase Storage buckets
- Relationships between tables
- 17 warnings for schema issues
- Fest-critical tables highlighted
- Missing indexes recommendations

---

### docs/DEPLOYMENT.md
**Purpose:** Deployment process and configuration  
**Contains:**
- Tech stack & hosting (Vercel, Supabase, Razorpay)
- Environment variables (required + optional)
- Build process (npm run build)
- Deployment steps (Vercel, AWS, self-hosted)
- Database migration procedures
- Monitoring & logging setup
- Pre-fest deployment checklist (60+ items)
- Rollback procedures
- Common deployment issues & solutions

---

### docs/FEST_DAY_CHECKLIST.md
**Purpose:** Operational checklist for fest day execution  
**Contains:**
- 7 days before fest: Load testing, DB optimization, monitoring setup
- 3 days before fest: Code freeze, full system test, backup preparation
- 1 day before fest: Final checks, communication blitz
- Fest day morning: System wake-up call, pre-event setup
- During fest: Real-time monitoring (every 30 min), incident response
- Post-fest: Check-in sync, certificates, feedback collection
- Emergency response plan (app down, DB offline, payment failure)
- Emergency contact table

---

### docs/FUTURE_FEATURES.md
**Purpose:** Planned and partially implemented features  
**Contains:**
- Partially implemented features (8 features documented)
- Database schema ready but UI not built (10 features)
- Future feature ideas (social, gamification, analytics)
- Technical debt & improvements
- Priority matrix (critical, high, medium, low)
- Post-fest roadmap (3 sprints)

---

### docs/NON_NEGOTIABLES.md
**Purpose:** Absolute must-work requirements for fest  
**Contains:**
- Core auth & access requirements
- Event browsing & discovery must-haves
- Ticket purchase & registration critical path
- Check-in & attendance requirements
- Data integrity (no duplicate registrations, no lost payments)
- Performance targets (99.9% uptime, <3s response time, 10K concurrent users)
- Security requirements (RLS, bcrypt, payment data protection)
- Payment processing guarantees
- Pre-fest checklist (70+ items)
- Red lines (absolute failures that stop fest)

---

### docs/PAYMENTS_AND_SPONSORSHIPS.md
**Purpose:** Payment and sponsorship system documentation  
**Contains:**
- Razorpay SDK integration
- Ticket purchase flow (create-order → checkout → verify)
- Signature verification (HMAC SHA256)
- Bulk ticket purchases
- Sponsorship system (manual + online)
- Two-stage sponsorship payment
- Platform fee calculation (10-15% vs 20% conflict)
- Refunds and disputes
- Revenue split tracking
- Environment variables
- Security checklist

---

## Backend (backend/)

```
backend/
├── data/
│   └── colleges-seed.json          # College data for seeding
├── scripts/
│   └── seed-colleges.js            # Script to seed colleges into DB
├── supabase/
│   └── migrations/                 # Database migration files (01-23)
├── index.js                        # Express server entry point
├── package.json                    # Backend dependencies
└── package-lock.json              # Locked dependency versions
```

---

### backend/index.js
**Purpose:** Minimal Express server for backend services  
**Contains:**
- Express app setup
- CORS configuration
- Basic routes (may be deprecated)
- College seeding endpoint
**Note:** Most backend logic is in Next.js API routes, not here

---

### backend/package.json
**Purpose:** Backend Node.js dependencies  
**Contains:**
- Dependencies: express, cors, dotenv
- Scripts: test placeholder
- Version: 1.0.0
**Note:** Minimal dependencies (backend mostly deprecated)

---

### backend/data/colleges-seed.json
**Purpose:** Seed data for colleges table  
**Contains:**
- Array of college objects
- Fields: name, city, state, type, website, etc.
- Used to populate colleges table on first run
**Size:** ~1000+ colleges for India

---

### backend/scripts/seed-colleges.js
**Purpose:** Script to import colleges into Supabase  
**Contains:**
- Reads colleges-seed.json
- Connects to Supabase
- Batch inserts colleges
- Error handling for duplicates
**Usage:** `node scripts/seed-colleges.js`

---

### backend/supabase/migrations/
**Purpose:** Database schema migrations (PostgreSQL)  
**Contains:** 23 migration files in order:

1. **01_core_events_and_registrations.sql**
   - Events table, registrations, users, student_profiles, organizer_profiles
   - Core schema for event management

2. **02_create_colleges_table.sql**
   - Colleges table with name, city, state, type
   - Used for college selection in profiles

3. **03_create_sponsorship_system.sql**
   - Sponsorship packages, deals, sponsors table
   - Revenue tracking for sponsorships

4. **04_add_sponsorship_payouts_and_bank_accounts.sql**
   - Payout tracking for organizers
   - Bank account details for settlements

5. **05_add_event_schedule.sql**
   - Event schedule table (time slots, sessions)
   - Multi-day event support

6. **06_add_event_enhancements.sql**
   - Additional event fields (tags, categories, visibility)
   - Event enhancements for discovery

7. **07_create_banners_table.sql**
   - Banners table for promotional banners
   - Admin approval workflow

8. **08_create_certificate_templates.sql**
   - Certificate templates, recipients
   - Customizable certificate design

9. **09_add_notifications_system.sql**
   - Notifications table
   - Email, push, in-app notification support

10. **10_add_sponsorship_gating.sql**
    - Sponsorship approval gates
    - Deliverables tracking

11. **11_add_bulk_tickets_and_access_control.sql**
    - Bulk ticket allocations
    - Event access control (college/year restrictions)

12. **12_add_college_references.sql**
    - Foreign key relationships to colleges
    - College verification

13. **13_create_fest_system.sql**
    - Fests table (multi-event festivals)
    - Fest submissions, core team

14. **14_festival_enhancements.sql**
    - Festival categories, visibility
    - Fest homepage features

15. **15_geolocation_features.sql**
    - PostGIS extension
    - Location columns for events, colleges

16. **16_postgis_spatial_indexing.sql**
    - Spatial indexes for fast nearby search
    - get_nearby_events() function

17. **17_favorite_events_system.sql**
    - Favorite events table
    - User preferences tracking

18. **18_extended_volunteer_system.sql**
    - Volunteer applications, assignments
    - Volunteer certificates

19. **19_extended_sponsorships.sql**
    - Expanded sponsorship features
    - Additional sponsor metadata

20. **20_event_recommendations.sql**
    - Recommendations table
    - Collaborative filtering function

21. **21_extended_certificates.sql**
    - Student certificates table
    - Certificate workflow improvements

22. **22_admin_analytics_and_logs.sql**
    - Admin analytics table
    - Event logs for all actions

23. **23_event_categories_cancellation_reschedule.sql**
    - Event categories system
    - Event cancellation tracking
    - Event reschedule history

24. **24_sponsorship_visibility_system.sql** (NEW)
    - Platform-managed visibility packages
    - Digital/App/Fest pack system
    - Fixed pricing for sponsor visibility

25. **25_whatsapp_group_feature.sql** (NEW)
    - Optional WhatsApp group for events
    - `events.whatsapp_group_enabled` and `events.whatsapp_group_link`
    - `whatsapp_group_joins` table for analytics

23. **23_event_categories_cancellation_reschedule.sql**
    - Event categories table
    - Event cancellations, reschedules, refunds

---

## Frontend (frontend/)

```
frontend/
├── public/                         # Static assets
├── src/                            # Source code
│   ├── app/                        # Next.js App Router
│   ├── components/                 # React components
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility libraries
│   ├── styles/                     # CSS/styling
│   ├── types/                      # TypeScript type definitions
│   ├── middleware.disabled.ts      # Disabled Next.js middleware
│   └── proxy.ts                    # NextAuth middleware (active)
├── .env.example                    # Example environment variables
├── .env.local                      # Local environment (gitignored)
├── .gitignore                      # Git ignore rules
├── eslint.config.mjs              # ESLint configuration
├── next-env.d.ts                  # Next.js TypeScript definitions
├── next.config.ts                 # Next.js configuration
├── package.json                   # Frontend dependencies
├── postcss.config.js              # PostCSS configuration
├── setup-security.sh              # Security setup script
├── tailwind.config.js             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── vercel.json                    # Vercel deployment config
```

---

## Frontend Configuration Files

### frontend/.env.example
**Purpose:** Template for environment variables  
**Contains:**
- All required environment variables with placeholders
- Comments explaining each variable
- No actual secrets (safe to commit)

---

### frontend/.env.local
**Purpose:** Local development environment variables  
**Contains:**
- Actual secrets (Supabase keys, Razorpay keys, etc.)
- Development-specific overrides
**Security:** Gitignored, never committed

---

### frontend/.gitignore
**Purpose:** Files to exclude from Git  
**Contains:**
- node_modules/, .next/, .env.local
- Build artifacts, logs
- IDE-specific files (.vscode/, .idea/)

---

### frontend/eslint.config.mjs
**Purpose:** ESLint linting configuration  
**Contains:**
- TypeScript linting rules
- React/Next.js specific rules
- Code style enforcement
- Import order rules

---

### frontend/next.config.ts
**Purpose:** Next.js framework configuration  
**Contains:**
- PWA configuration (@ducanh2912/next-pwa)
- Image optimization domains
- Experimental features
- Webpack customizations
- Build optimizations

---

### frontend/package.json
**Purpose:** Frontend dependencies and scripts  
**Contains:**
- **Scripts:**
  - `dev`: Start development server
  - `build`: Production build
  - `start`: Start production server
  - `lint`: Run ESLint
  - `type-check`: TypeScript validation
  - `pre-deploy`: Type check + build
- **Dependencies (40+):**
  - Next.js 16, React 19
  - NextAuth 4 (authentication)
  - Supabase client
  - Razorpay SDK
  - TanStack React Query
  - Framer Motion (animations)
  - Recharts (analytics charts)
  - PDF-lib, HTML2Canvas (certificates)
  - QRCode, html5-qrcode (tickets/check-in)
  - Zod (validation)
  - bcrypt (password hashing)
  - And more...

---

### frontend/postcss.config.js
**Purpose:** PostCSS configuration for CSS processing  
**Contains:**
- Tailwind CSS plugin
- CSS optimizations
- Autoprefixer

---

### frontend/setup-security.sh
**Purpose:** Bash script to configure security settings  
**Contains:**
- Environment variable validation
- Security header setup
- HTTPS enforcement checks
- RLS policy verification commands
**Usage:** `bash setup-security.sh`

---

### frontend/tailwind.config.js
**Purpose:** Tailwind CSS framework configuration  
**Contains:**
- Custom color palette
- Theme customization (dark mode)
- Custom spacing, fonts, animations
- Plugin configuration
- Content paths for purging

---

### frontend/tsconfig.json
**Purpose:** TypeScript compiler configuration  
**Contains:**
- Compiler options (strict mode, ES2020)
- Path aliases (@/* → src/*)
- Include/exclude patterns
- Next.js specific settings

---

### frontend/vercel.json
**Purpose:** Vercel hosting configuration  
**Contains:**
- Custom headers for service worker
- Cache control for manifest.json
- PWA-specific configurations
- Content-Type overrides

---

## Frontend Public Assets (frontend/public/)

```
public/
├── favicon.ico                     # Browser tab icon
├── manifest.json                   # PWA manifest
├── sw.js                          # Service worker (PWA)
├── icon-192.png                   # PWA icon (192x192)
├── icon-512.png                   # PWA icon (512x512)
├── icon-maskable.svg              # Maskable icon (Android)
├── icon.svg                       # Primary app icon
├── file.svg                       # File icon
├── globe.svg                      # Globe icon
├── next.svg                       # Next.js logo
├── vercel.svg                     # Vercel logo
└── window.svg                     # Window icon
```

### public/manifest.json
**Purpose:** Progressive Web App manifest  
**Contains:**
- App name: "Happenin"
- Icons (192, 512, maskable)
- Theme color, background color
- Display mode: standalone
- Start URL, scope
- Enables "Add to Home Screen"

---

### public/sw.js
**Purpose:** Service worker for PWA  
**Contains:**
- Cache strategies (offline support)
- Background sync
- Push notification handling
- Asset caching for offline mode
**Generated by:** @ducanh2912/next-pwa

---

## Frontend Source Code (frontend/src/)

### frontend/src/middleware.disabled.ts
**Purpose:** Disabled Next.js middleware  
**Status:** Not active (filename extension disables it)  
**Contains:** Middleware logic that was disabled in favor of proxy.ts

---

### frontend/src/proxy.ts
**Purpose:** NextAuth middleware for route protection  
**Contains:**
- `withAuth` wrapper from next-auth/middleware
- Role-based redirects (student/organizer/admin)
- Protected /dashboard/* routes
- Authorized callback checks session token
**Active:** Yes, protects all authenticated routes

---

## Frontend App Router (frontend/src/app/)

```
app/
├── about/                          # About page
├── admin/                          # Admin dashboard pages
├── api/                            # API routes (backend logic)
├── auth/                           # Auth pages (login/signup)
├── colleges/                       # College listing pages
├── contact/                        # Contact page
├── dashboard/                      # User dashboards (student/organizer/admin)
├── events/                         # Event listing and detail pages
├── fests/                          # Fest pages
├── privacy/                        # Privacy policy
├── sponsor/                        # Sponsor pages
├── terms/                          # Terms of service
├── favicon.ico                     # Site favicon
├── globals.css                     # Global CSS styles
├── layout.tsx                      # Root layout (HTML wrapper)
├── page.tsx                        # Homepage
└── providers.tsx                   # React context providers
```

---

### app/layout.tsx
**Purpose:** Root layout component (wraps all pages)  
**Contains:**
- HTML structure (<html>, <body>)
- NextAuth SessionProvider
- TanStack Query Provider
- Theme provider (dark mode)
- Global fonts (Geist Sans, Geist Mono)
- Metadata (title, description, Open Graph)

---

### app/page.tsx
**Purpose:** Homepage (landing page)  
**Contains:**
- Hero section with CTA
- Featured events carousel
- Upcoming fests section
- Sponsor banners
- Event categories discovery
- Search bar with voice search
- PWA install prompt

---

### app/providers.tsx
**Purpose:** React context providers wrapper  
**Contains:**
- NextAuth SessionProvider
- TanStack QueryProvider
- Theme Provider (next-themes)
- Toast notifications (Sonner)
- Wraps entire app for global state

---

### app/globals.css
**Purpose:** Global CSS styles and Tailwind imports  
**Contains:**
- Tailwind directives (@tailwind base, components, utilities)
- Custom CSS variables (colors, spacing)
- Dark mode color scheme
- Global animations
- Typography styles
- Custom scrollbar styles

---

## Frontend API Routes (frontend/src/app/api/)

```
api/
├── access-control/                 # Event access control API
├── admin/                          # Admin-specific endpoints
├── auth/                           # NextAuth endpoints
├── badges/                         # Badge system API
├── banners/                        # Banner management API
├── bulk-tickets/                   # Bulk ticket API
├── calendar/                       # Calendar export API
├── categories/                     # Event categories API
├── certificates/                   # Certificate generation API
├── colleges/                       # College data API
├── debug/                          # Debug endpoints
├── event-history/                  # Event history tracking
├── events/                         # Event CRUD API
├── fests/                          # Fest management API
├── health/                         # Health check endpoint
├── interactions/                   # User interactions tracking
├── notifications/                  # Notifications API
├── organizer/                      # Organizer-specific endpoints
├── payments/                       # Payment processing (Razorpay)
├── recommendations/                # Event recommendations API
├── sponsor/                        # Sponsor dashboard API
├── sponsorship/                    # Sponsorship deals API
├── sponsorships/                   # Sponsorship management
├── student/                        # Student profile API
├── team-registrations/             # Team registration API
├── upload-image/                   # Image upload API
└── volunteers/                     # Volunteer management API
```

**Note:** Each API directory contains route.ts files with GET/POST/PUT/DELETE handlers

---

### Key API Routes

#### api/auth/[...nextauth]/route.ts
**Purpose:** NextAuth authentication endpoint  
**Contains:**
- Credentials provider (email/password with bcrypt)
- Google OAuth provider
- JWT callbacks (attach role to token)
- Session callbacks (expose email + role to client)
- User creation logic (auto-role assignment)

---

#### api/payments/create-order/route.ts
**Purpose:** Create Razorpay order for ticket purchase  
**Contains:**
- Profile validation (full_name, dob, college_name required)
- Duplicate registration check
- Event availability check
- Razorpay order creation (amount × 100 paise)
- Returns order_id for frontend checkout

---

#### api/payments/verify/route.ts
**Purpose:** Verify Razorpay payment signature  
**Contains:**
- HMAC SHA256 signature verification
- Timing-safe comparison (crypto.timingSafeEqual)
- Update payments.status = 'success'
- Create registration record
- Return ticket details

---

#### api/sponsorships/create-order/route.ts
**Purpose:** Create Razorpay order for sponsorship packs  
**Contains:**
- Pack validation (digital/app/fest)
- Event sponsorship eligibility checks
- Razorpay order creation (amount × 100 paise)
- Insert sponsorship_orders record (status = created)

---

#### api/organizer/checkin/route.ts
**Purpose:** Check-in attendees at event  
**Contains:**
- Registration lookup by ID or email+eventId
- Duplicate check-in prevention
- Organizer authorization check
- Update registrations.status = 'checked_in'
- Real-time stats update

---

#### api/student/profile/route.ts
**Purpose:** Student profile CRUD  
**Contains:**
- GET: Fetch profile by email
- POST: Create/update profile
- Validation: Required fields (full_name, dob, college_name, college_email)
- Profile completeness check (required before registration)

---

## Frontend Components (frontend/src/components/)

**Total:** 50+ React components

### Key Components

#### AdminSponsorshipPayouts.tsx
**Purpose:** Admin dashboard for sponsorship payouts  
**Contains:** Table view of all sponsorships, payout tracking, approval buttons

#### AppSplash.tsx
**Purpose:** App loading splash screen  
**Contains:** Logo animation, loading spinner, shown on initial load

#### AttendanceModal.tsx
**Purpose:** Modal to view event attendance  
**Contains:** List of checked-in attendees, search/filter, export CSV

#### BannerCarousel.tsx
**Purpose:** Homepage banner carousel  
**Contains:** Auto-rotating banners, swipe gestures, pause on hover

#### BulkCertificateGenerator.tsx
**Purpose:** Generate certificates for multiple recipients  
**Contains:** CSV upload, batch generation, progress bar, download all

#### CategoriesDiscovery.tsx
**Purpose:** Event categories filter section  
**Contains:** Category chips (Music, Sports, Tech, etc.), visual icons

#### CertificateComponent.tsx
**Purpose:** Display single certificate  
**Contains:** Certificate rendering, name overlay, download button

#### CertificateTemplateEditor.tsx
**Purpose:** Visual editor for certificate templates  
**Contains:** Drag-and-drop text positioning, font/color picker, preview

#### Charts.tsx
**Purpose:** Analytics charts for admin dashboard  
**Contains:** Recharts components (line, bar, pie charts), revenue tracking

#### CollegeAutoSuggest.tsx
**Purpose:** Autocomplete for college selection  
**Contains:** Search colleges, dropdown with suggestions, keyboard navigation

#### DashboardHeader.tsx
**Purpose:** Dashboard navigation header  
**Contains:** User info, role badge, logout button, theme toggle

#### EventSponsors.tsx
**Purpose:** Display sponsors on event page  
**Contains:** Sponsor logos, tier badges (gold/silver/bronze), links

#### FestCreate.tsx
**Purpose:** Create new fest form  
**Contains:** Multi-step form (name, dates, description, colleges), validation

#### NotificationCenter.tsx
**Purpose:** Notification dropdown  
**Contains:** Bell icon with unread count, notification list, mark as read

#### OfflineBanner.tsx
**Purpose:** Show banner when app is offline  
**Contains:** Detects navigator.onLine, shows warning, hides when online

#### PWAInstallPrompt.tsx
**Purpose:** Prompt user to install PWA  
**Contains:** "Add to Home Screen" banner, detects beforeinstallprompt event

#### QRScanner.tsx
**Purpose:** Scan QR codes for check-in  
**Contains:** Camera feed, QR detection (html5-qrcode), parse registration ID

#### SearchFilters.tsx
**Purpose:** Event search and filter UI  
**Contains:** Keyword search, category filter, price range, date picker

#### TicketComponent.tsx
**Purpose:** Display event ticket with QR code  
**Contains:** Ticket design, QR code (registration ID), download/print

#### VoiceSearch.tsx
**Purpose:** Voice-based event search  
**Contains:** Microphone button, Web Speech API, convert speech to text, filter events

---

## Frontend Hooks (frontend/src/hooks/)

### useDeviceType.ts
**Purpose:** Detect device type (mobile/tablet/desktop)  
**Returns:** { isMobile, isTablet, isDesktop }

### useEventSchedule.ts
**Purpose:** Fetch and manage event schedule  
**Returns:** { schedule, loading, error, refetch }

### useGeolocation.ts
**Purpose:** Get user's current location  
**Returns:** { latitude, longitude, error, loading, getCurrentPosition }

### useRealtime.ts
**Purpose:** Supabase Realtime subscriptions  
**Returns:** { subscribe, unsubscribe, data } for live updates

### useReducedMotion.ts
**Purpose:** Detect user's motion preference  
**Returns:** { prefersReducedMotion } for accessibility

---

## Frontend Libraries (frontend/src/lib/)

### accessibility-tokens.json
**Purpose:** Accessibility configuration tokens  
**Contains:** Color contrast ratios, focus ring styles, ARIA labels

### admin.ts
**Purpose:** Admin utility functions  
**Contains:** Admin role checks, permissions, analytics helpers

### analytics-queue.ts
**Purpose:** Queue analytics events  
**Contains:** Event batching, offline queue, sync when online

### api.ts
**Purpose:** API client functions  
**Contains:** Fetch wrappers, error handling, type-safe API calls

### certificate-fonts.ts
**Purpose:** Certificate font configurations  
**Contains:** Font family definitions, font loading, custom fonts

### certificate-helpers.ts
**Purpose:** Certificate generation utilities  
**Contains:** Image overlay, text positioning, PDF generation

### colleges.ts
**Purpose:** College data utilities  
**Contains:** College search, autocomplete, validation

### fonts.ts
**Purpose:** Custom font loading  
**Contains:** Next.js font optimization, Geist Sans/Mono

### geolocation.ts
**Purpose:** Geolocation utilities  
**Contains:** Distance calculation (Haversine formula), nearby search

### haptics-tokens.ts
**Purpose:** Haptic feedback configuration  
**Contains:** Vibration patterns (success, error, warning)

### load-management.ts
**Purpose:** Load balancing and rate limiting  
**Contains:** Queue management, request throttling

### load-middleware.ts
**Purpose:** Load management middleware  
**Contains:** Middleware for load shedding during high traffic

### motion.config.ts
**Purpose:** Framer Motion animation configuration  
**Contains:** Global animation settings, variants, transitions

### offline.ts
**Purpose:** Offline functionality  
**Contains:** IndexedDB storage, offline detection, sync logic

### password.ts
**Purpose:** Password utilities  
**Contains:** Bcrypt hashing, password strength validation

### pdf-utils.ts
**Purpose:** PDF generation utilities  
**Contains:** PDF-lib helpers, certificate PDF creation

### profileStorage.ts
**Purpose:** Profile data caching  
**Contains:** LocalStorage helpers, profile persistence

### razorpay.ts
**Purpose:** Razorpay SDK initialization  
**Contains:** Razorpay client with key_id and key_secret

### sponsorshipAccess.ts
**Purpose:** Sponsorship access control  
**Contains:** Check sponsor permissions, feature gates

### supabase.ts
**Purpose:** Supabase client initialization  
**Contains:**
- Server-side client (service role key, full access)
- Client-side client (anon key, RLS protected)
- Conditional initialization based on environment

### utils.ts
**Purpose:** General utility functions  
**Contains:** Date formatting, string helpers, object manipulation

### validations.ts
**Purpose:** Form validation schemas  
**Contains:** Zod schemas for forms, validation helpers

---

## Frontend Types (frontend/src/types/)

### bulk-tickets-access-control.ts
**Purpose:** TypeScript types for bulk tickets and access control  
**Contains:** BulkTicket, AccessControl interfaces

### certificate.ts
**Purpose:** TypeScript types for certificates  
**Contains:** CertificateTemplate, CertificateRecipient interfaces

### features.ts
**Purpose:** Feature flag types  
**Contains:** FeatureFlag interface, feature configuration

### next-auth.d.ts
**Purpose:** NextAuth type augmentation  
**Contains:** Extend Session and JWT types to include role field

### sponsorship.ts
**Purpose:** TypeScript types for sponsorships  
**Contains:** SponsorshipDeal, SponsorshipPackage, Sponsor interfaces

---

## File Count Summary

### By Directory

```
Root Level:                 5 markdown files
docs/:                      9 markdown files
backend/:                   
  - Source files:           2 files (index.js, package.json)
  - Data:                   1 file (colleges-seed.json)
  - Scripts:                1 file (seed-colleges.js)
  - Migrations:             23 SQL files
  - Total:                  27 files

frontend/:
  - Configuration:          10 files (.env, configs, tsconfig, etc.)
  - Public assets:          11 files (icons, manifest, sw.js)
  - Source code:            
    - App router:           ~50 files (pages, layouts)
    - API routes:           ~80 files (27 endpoint groups)
    - Components:           55+ files
    - Hooks:                5 files
    - Libraries:            23 files
    - Types:                5 files
  - Total:                  ~230+ files
```

---

## Project Statistics

- **Total TypeScript/JavaScript Files:** ~300+
- **Total Lines of Code:** ~50,000+ (estimated)
- **Total Dependencies:** 60+ packages
- **Database Tables:** 50+
- **API Endpoints:** ~80+
- **React Components:** 55+
- **Documentation Pages:** 14 markdown files

---

## Key Technology Decisions

### Why Next.js 16 (App Router)?
- Server-side rendering for SEO
- API routes eliminate separate backend
- Built-in optimization (images, fonts)
- Edge runtime for fast middleware
- Vercel deployment (zero config)

### Why Supabase?
- PostgreSQL (robust, SQL)
- Row-Level Security (built-in auth)
- Real-time subscriptions
- Storage buckets (no S3 needed)
- Generous free tier

### Why NextAuth v4?
- JWT authentication (stateless)
- Multiple providers (Credentials, OAuth)
- Built for Next.js
- Secure session management
- Easy role-based auth

### Why Razorpay?
- India-focused payment gateway
- All payment methods (UPI, Cards, NetBanking)
- Good documentation
- Reasonable fees
- Test mode for development

### Why TypeScript?
- Type safety (catch errors early)
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring
- Industry standard

### Why Tailwind CSS?
- Utility-first (fast development)
- No CSS file bloat
- Responsive by default
- Dark mode built-in
- Easy customization

---

**END OF FILE_INVENTORY.md**

---

## Maintenance Notes

**How to Update This File:**
1. When adding new files, document them in the appropriate section
2. Include purpose (why it exists) and contents (what's inside)
3. Update file count summary
4. Keep alphabetical order within sections
5. Use consistent formatting

**Last Updated By:** AI Documentation Assistant  
**Next Review:** After next major feature addition
