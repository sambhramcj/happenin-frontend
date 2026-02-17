# External Services Setup Guide

> **Last Updated:** February 17, 2026

Complete step-by-step guide for configuring all external services required for the Happenin app.

---

## Table of Contents

1. [Supabase Setup](#supabase-setup) - Database, Authentication, and Storage
2. [Google Cloud Setup](#google-cloud-setup) - OAuth Only (Storage is Supabase)
3. [Razorpay Setup](#razorpay-setup) - Payment Processing
4. [Upstash Redis Setup](#upstash-redis-setup) - Caching & Rate Limiting
5. [Vercel Setup](#vercel-setup) - Hosting & Deployment
6. [GitHub Setup](#github-setup) - Version Control & CI/CD

---

## Supabase Setup

**Purpose**: PostgreSQL database, real-time capabilities, authentication, and file storage

### Prerequisites
- GitHub account (for OAuth)
- Email address

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start Your Project" or "Sign Up"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in details:
   - **Project Name**: `happenin` (or your choice)
   - **Database Password**: Generate strong password (save securely)
   - **Region**: Choose closest to your users (e.g., `Asia Pacific (Singapore)` for India)
6. Click "Create New Project"
7. Wait for project setup (5-10 minutes)

### Step 2: Get Connection Credentials

1. Go to Project Settings → Database
2. Note the following:
   - **Host**: `[project-id].supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Your DB password
3. In "Connection Info" section, copy the Full Connection String (PostgreSQL)
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`

### Step 3: Get API Keys

1. Go to Settings → API
2. Copy:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon Key**: Public key (safe to expose in frontend)
   - **Service Role Key**: Secret key (NEVER expose, backend only)

### Step 4: Apply Database Migrations

Database migrations must be applied in order. They create all tables, indexes, functions, and triggers needed for the platform.

**Option A: Using Supabase Dashboard SQL Editor (RECOMMENDED for first setup)**

This is the easiest and safest way to apply migrations:

1. Open Supabase Dashboard in browser: `https://app.supabase.com/projects`
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New query"** button (top right)
5. Open the first migration file: `backend/supabase/migrations/01_core_events_and_registrations.sql`
6. Copy the entire file content (Ctrl+A, Ctrl+C)
7. Paste into the Supabase query editor
8. Click **"Run"** button (⌘+Enter on Mac, Ctrl+Enter on Windows)
9. Wait for completion—you should see: `Query executed successfully in 1.52s`
10. Repeat steps 3-9 for each migration file in order:

| # | File Name | Tables/Features Created |
|---|-----------|---------------------|
| 01 | `01_core_events_and_registrations.sql` | events, registrations, profiles, tickets |
| 02 | `02_event_fields_consolidation.sql` | event field enhancements |
| 03 | `03_sponsorship_system_consolidated.sql` | sponsors, packages, deals, payouts |
| 04 | `04_create_banners_table.sql` | banners, home_banners |
| 05 | `05_add_notifications_system.sql` | notifications, preferences |
| 06 | `06_add_bulk_tickets_and_access_control.sql` | bulk tickets, access control |
| 07 | `07_add_college_references.sql` | colleges table with references |
| 08 | `08_create_fest_system.sql` | fests, fest_events |
| 09 | `09_festival_enhancements.sql` | festival features |
| 10 | `10_geolocation_and_spatial_indexing.sql` | geolocation, PostGIS, spatial indexes |
| 11 | `11_engagement_system.sql` | favorites, recommendations, user preferences |
| 12 | `12_volunteer_and_certificate_system.sql` | volunteers, certificates, badges |
| 13 | `13_admin_analytics_and_logs.sql` | analytics, admin logs |
| 14 | `14_event_categories_cancellation_reschedule.sql` | categories, cancellation |
| 15 | `15_organizer_razorpay_route.sql` | organizer payouts, Razorpay Route |
| 16 | `16_event_registration_rankings.sql` | registration rankings |
| 17 | `17_sponsor_analytics_and_profile.sql` | sponsor analytics, profiles |

**Troubleshooting while running migrations:**

- **Error: "relation ... already exists"** → Migration already applied. Skip it and continue to next.
- **Error: "function ... does not exist"** → A previous migration failed. Check for error messages, fix, and retry.
- **Query hangs for > 30 seconds** → Check your internet connection. Retry in a few moments.
- **Success but tables don't appear** → Refresh the browser or reload the Tables section.

After applying all migrations, verify:
1. Go to **Table Editor** (left sidebar)
2. Should see ~58 tables listed
3. Click one table to verify it has columns

**Option B: Using Supabase CLI (Advanced, for automation)**

Use this if you're setting up a development environment locally:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to your Supabase account
supabase login

# Link to your project
supabase link --project-id [your-project-id]

# Push all migrations
supabase db push
```

**Option C: Using psql (Direct database connection)**

For production deployments or if dashboard is unreliable:

```bash
# Install psql (PostgreSQL client)
# On macOS: brew install postgresql
# On Windows: https://www.postgresql.org/download/windows/
# On Ubuntu: sudo apt-get install postgresql-client

# Connect and run migrations
psql "postgresql://postgres:[password]@[host]:5432/postgres" < migrations/01_core_events_and_registrations.sql
psql "postgresql://postgres:[password]@[host]:5432/postgres" < migrations/02_create_colleges_table.sql
# ... repeat for all migrations in order
```

### Step 5: Configure Authentication

1. Go to Authentication → Providers
2. Enable "Email" provider:
   - Already enabled by default
   - Confirm "Confirm email" is ON

3. Enable "Google" provider:
   - Click Google
   - Copy "Redirect URL": `https://[project-id].supabase.co/auth/v1/callback`
   - Go to [Google Cloud Console](#google-cloud-setup)
   - Create OAuth credentials
   - Copy Google Client ID & Secret
   - Paste into Supabase
   - Click "Save"

4. (Optional) Enable "GitHub" provider:
   - Similar process to Google
   - Create GitHub OAuth app
   - Add Client ID & Secret

### Step 6: Enable Row Level Security (RLS)

Already configured in migrations, but verify:

1. Go to SQL Editor
2. Run verification query:
   ```sql
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
   ORDER BY tablename;
   ```
3. Verify ~58 tables exist
4. Go to Authentication → Policies
5. Verify policies exist for tables:
   - `users` - Student read own data
   - `events` - Everyone read public, organizer manage own
   - `registrations` - Students manage own
   - `certificates` - Users read own
   - `sponsorships` - Sponsors/organizers manage own

### Step 7: Configure Storage Buckets

1. Go to Storage → Buckets
2. Click "New Bucket"
3. Create bucket: `event-images`
   - Make **Public** (allow direct access)
   - Confirm creation
4. Create bucket: `brochures`
   - Make **Public**
5. Create bucket: `certificates`
   - Make **Public**
6. Create bucket: `banners`
   - Make **Public**

### Step 8: Set Storage Policies

1. For each bucket, go to Policies (RLS)
2. Set policy to allow:
   - Public read access
   - Authenticated users upload
   - Users delete own files

### Environment Variables for Frontend

Create/update `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### Environment Variables for Backend

Create/update `.env`:
```
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Verification Checklist

- [ ] Project created successfully
- [ ] Can login to dashboard
- [ ] All 11 migrations applied (check SQL Editor)
- [ ] All tables created (run verification query)
- [ ] Authentication configured (Google OAuth added)
- [ ] Email provider enabled
- [ ] 4 storage buckets created
- [ ] RLS policies in place
- [ ] Credentials saved securely

---

## Google Cloud Setup

**Purpose**: Google OAuth only (all file storage is handled by Supabase)

> **Note**: Storage buckets (event images, brochures, certificates, banners) are configured in Supabase, not Google Cloud. See [Supabase Setup → Step 7](#step-7-configure-storage-buckets).

### Prerequisites
- Google account
- Credit card (for billing, won't be charged if free tier used)

### Step 1: Create Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Look for **Project Selector** (top left, shows current project)
3. Click it → "New Project" button (top right of popup)
4. **Project name**: Enter `happenin`
5. **Organization**: Select your organization (or skip if none)
6. Click **"Create"** button
7. Wait 30-60 seconds while Google creates the project
8. You'll see a notification: "Project creation in progress"
9. Once complete, click the notification or go back to Project Selector
10. Select your `happenin` project

> **Note**: After creation, you'll be in the project dashboard. Stay here for the next steps.

### Step 2: Enable Required APIs

APIs must be enabled before you can use Google OAuth:

1. In the top search bar, search for: `Google+ API`
2. Click the result (first one)
3. Click **"Enable"** button (blue, large)
4. Wait for it to finish (you'll see "Enabling API..." then "API Enabled")
5. Go back to search bar and search for: `Google Identity Services API`
6. Click the result
7. Click **"Enable"** button
8. Wait for completion

**Verify**: Go to **APIs & Services** (left sidebar) → **Enabled APIs and services**
- Should see at least these two APIs listed with blue checkmarks

### Step 3: Setup OAuth Credentials (Detailed)

This creates the OAuth app that allows users to sign in with Google:

1. In Google Cloud Console, go to **APIs & Services** (left sidebar)
2. Click **"Credentials"** tab (second tab)
3. Click **"+ Create Credentials"** button (blue, top)
4. Choose **"OAuth 2.0 Client ID"** from dropdown
5. You'll see a prompt: "To create an OAuth client ID, you must first set a user consent screen"
   - Click **"Configure Consent Screen"** button
   - This opens OAuth consent screen setup

**Create OAuth Consent Screen:**
1. Choose **"External"** (for development/testing)
2. Click **"Create"**
3. Fill the form:
   - **App name**: `Happenin`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. On "Scopes" page, click **"Save and Continue"** (default scopes are fine)
6. On "Test users" page, add your email as a test user
7. Click **"Save and Continue"**
8. Click **"Back to Dashboard"**

**Create OAuth Application:**
1. Go back to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
3. **Application type**: Choose **"Web application"**
4. **Name**: `happenin-web` (or any name)
5. Under **"Authorized redirect URIs"**, click **"Add URI"** and add these:
   ```
   http://localhost:3000/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   https://yourapp.vercel.app/auth/callback/google
   https://yourapp.vercel.app/api/auth/callback/google
   https://yourdomain.com/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
   > **Note**: Replace `yourapp.vercel.app` with your actual Vercel domain (found in Vercel project settings)
   > **Note**: Replace `yourdomain.com` with your custom domain (if you have one)

6. Click **"Create"**
7. A popup appears with your credentials:
   - **Client ID** (long string starting with numbers)
   - **Client Secret** (sensitive, starts with `gcp-...` or similar)
8. **IMPORTANT**: Save both credentials securely:
   - Open your notes or a secure file
   - Copy and paste both values
   - **DO NOT** commit these to git or share with others
   - You can retrieve them later by clicking the credential in the Credentials list

9. Click **"Copy"** button next to each to copy individually, or download the JSON file (safer)

**Next**: Connect these to Supabase in [Step 5](#step-5-configure-authentication) of Supabase Setup

### Environment Variables

Frontend (`.env.local`):

No Google Cloud storage variables needed. Storage is handled by Supabase.

Backend (`.env`):

No Google Cloud storage variables needed. Storage is handled by Supabase.

### Verification Checklist

- [ ] Google Cloud project created
- [ ] Google+ API and Identity Services API enabled
- [ ] OAuth credentials created
- [ ] Redirect URIs configured correctly
- [ ] Client ID and Secret copied and saved

---

## Razorpay Setup

**Purpose**: Payment processing for event registration

### Prerequisites
- Razorpay account (free to create)
- Business email

### Step 1: Create Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Click **"Sign Up"** button (top right)
3. Fill the form:
   - **Email address**: Your business email
   - **Password**: Min 12 characters, mix of uppercase, lowercase, numbers, symbols
   - **Phone number**: With country code (e.g., `+91 9876543210` for India)
4. Accept terms and conditions checkbox
5. Click **"Create Account"** button
6. You'll receive a verification email
7. Click the link in the email to verify your email address
8. You'll be prompted to set your account type:
   - Choose **"Business"** (this is for event platform organizers)
9. Verify your phone number:
   - You'll receive an SMS with a code
   - Enter the 6-digit OTP from SMS
10. You're now in your Razorpay dashboard

> **IMPORTANT**: Razorpay starts in **Test Mode** by default (good for development). You'll see this badge in the top right. Use test keys for now—switch to Live mode only when going to production.

### Step 2: Complete KYC (Business Verification)

KYC verifies you're a legitimate business. Usually takes 24-48 hours:

1. In Razorpay Dashboard, click **"Account Settings"** or your profile (top right)
2. Go to **"Compliance"** or **"KYC"** section
3. Click **"Complete Your KYC"**
4. Fill in Business Details:
   - **Business Name**: Your company/organization name
   - **Business Address**: Full business address
   - **Business Phone**: Contact number
   - **Contact Person**: Your name
5. Upload Documents (can be photos or scans in JPG/PNG):
   - **Business Proof**: GST certificate, PAN registration, or business license
   - **Address Proof**: Electricity/water bill, lease agreement, or rent receipt dated within last 3 months
   - **ID Proof**: Passport, Aadhar, PAN card, or Driving License
6. Click **"Submit for Approval"**
7. You'll see: "KYC submitted for review"
8. Check your email for approval (usually 24-48 hours)

> **Note**: You can still use Test Mode to develop your payment flow while KYC is pending. Only Live Mode requires KYC approval.

> **Note**: You can still use Test Mode to develop your payment flow while KYC is pending. Only Live Mode requires KYC approval.

### Step 3: Get API Keys

Test Mode and Live Mode have separate API keys. For development, use Test Mode:

1. In Razorpay Dashboard, click **"Settings"** (left sidebar)
2. Go to **"API Keys"**
3. You'll see two tabs:
   - **Test**: For development (uses test cards)
   - **Live**: For production (processes real payments)
4. Make sure you're on the **"Test"** tab (should be default)
5. You'll see two keys:
   - **Key ID**: Long alphanumeric string (public, safe to use on frontend)
   - **Key Secret**: Another string (KEEP PRIVATE, backend only)
6. Click **"Copy"** next to each to copy them
7. **IMPORTANT**: Save both securely in your notes (you'll add them to `.env` later)

> **Security**: Never commit Key Secret to git. Never expose it in frontend code.

### Step 4: Setup Test Environment

Before processing real payments, test with fake cards:

**Test Payment Cards** (use any future expiry date and any 3-digit CVV):

| Card Type | Number | Status |
|-----------|--------|--------|
| Visa | `4111 1111 1111 1111` | **Success** ✓ |
| Mastercard | `5555 5555 5555 4444` | **Success** ✓ |
| Amex | `3782 822463 10005` | **Success** ✓ |
| Visa | `4000 0000 0000 0002` | **Decline** ✗ |
| Visa | `4111 1111 1111 6666` | **Decline** ✗ |

**How to test a payment:**
1. In your app (localhost:3000), try registering for an event with a price
2. Enter test card number (e.g., `4111 1111 1111 1111`)
3. Expiry: Any future date (e.g., `12/25`)
4. CVV: Any 3 digits (e.g., `123`)
5. Click Pay
6. You'll be asked for OTP—enter any 6 digits
7. Payment should succeed
8. Check Razorpay Dashboard → Payments to see the transaction

**Troubleshooting test payments:**
- **"Card declined" error**: Check you're using a test card from the table above
- **"Webhook not processing" message**: Webhooks are optional for test mode, can ignore
- **Payment shows in Razorpay but not in your database**: Wait 5-10 seconds (webhook delay), then refresh

### Step 5: Configure Webhooks

Webhooks notify your server when a payment is successful. Optional but recommended:

1. In Razorpay Dashboard, go to **"Settings"** → **"Webhooks"**
2. Click **"Add New Webhook"** button
3. **Webhook URL**:
   ```
   https://[your-domain]/api/webhooks/razorpay
   ```
4. **Events to Subscribe**:
   - `payment.authorized`
   - `payment.failed`
   - `payment.captured`
   - `refund.created`
   - `refund.processed`
   - `refund.failed`
5. **Active**: Toggle ON
6. Click "Create Webhook"
7. Copy **Webhook Secret** (for verification)

### Step 6: Test Webhook Delivery

1. In webhook settings, click your webhook
2. Go to "Deliveries" tab
3. Make a test payment
4. Check if webhook is delivered
5. Delivery should show status "Success (200)"

### Environment Variables

Frontend (`.env.local`):
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=[test-key-id]
```

Backend (`.env`):
```
RAZORPAY_KEY_ID=[test-key-id]
RAZORPAY_KEY_SECRET=[test-key-secret]
RAZORPAY_WEBHOOK_SECRET=[webhook-secret]
```

### Migration to Live Keys

Once app is in production:

1. Complete KYC (Step 2)
2. Request live keys from Razorpay support
3. Go to Settings → API Keys
4. Switch to "Live" tab
5. Copy live keys
6. Update environment variables with live keys
7. Update webhook URL to production domain
8. Test with small transactions first

### Verification Checklist

- [ ] Razorpay account created
- [ ] Email verified
- [ ] Phone verified
- [ ] KYC submitted
- [ ] API keys generated (test keys)
- [ ] Webhook configured
- [ ] Test payment successful
- [ ] Webhook delivery successful
- [ ] Credentials saved securely

---

## Razorpay Route Setup (Sub-Merchant Management)

**Purpose**: Enable organizers to directly receive event registration payouts

**⚠️ NOTE**: Razorpay Route is a separate product from standard Razorpay. Must be explicitly enabled by Razorpay support.

### Prerequisites

- Razorpay Business Account (completed KYC)
- Contact Razorpay support to enable **Route** product
- Route API should have access

### Step 1: Verify Route is Enabled

1. Go to Razorpay Dashboard
2. Contact **Razorpay Support** and request:
   - "Please enable Route for my account"
   - Provide your account email
3. Wait for confirmation (24-48 hours)
4. Test API access:
   ```bash
   curl -H "Authorization: Basic <base64(keyid:keysecret)>" \
     https://api.razorpay.com/v1/accounts
   ```
   Should return `[]` (empty array) or list of sub-merchants

### Step 2: Environment Variables are Same as Razorpay

Use the same `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from Step 3 of standard Razorpay setup.

The Route API uses HTTP Basic Auth, which is implemented in:
- `src/lib/razorpay-route.ts` - Creates sub-merchants
- `src/app/api/razorpay/onboard-organizer/route.ts` - Organizer onboarding

### Step 3: Apply Migration 15

Database migration for organizer sub-merchant setup:

```bash
supabase db push  # Applies migration 15_organizer_razorpay_route.sql
```

This creates:
- `organizers` table (stores sub-merchant info)
- Links to `events.organizer_id` (for payout routing)
- RLS policies for organizer/admin access

### Step 4: Test Organizer Onboarding

1. Login as organizer
2. POST to `/api/razorpay/onboard-organizer`:
   ```json
   {
     "organizer_type": "CLUB",
     "display_name": "Test Club",
     "legal_name": "John Doe",
     "pan_number": "AAAPA5055K",
     "bank_account_number": "1234567890123",
     "ifsc_code": "SBIN0001234"
   }
   ```
3. Response should include `razorpay_account_id` and `kyc_status: pending`

### Step 5: Test Sub-Merchant Creation in Razorpay

1. Go to Razorpay Dashboard
2. Go to **Route** (if you see it in sidebar)
3. Should see newly created sub-merchant account
4. Click account → View KYC status
5. Status might still be `pending` (Razorpay validates data)

### Step 6: Monitor KYC Verification

Admin endpoint to check KYC status:

```bash
GET /api/admin/organizers?kyc_status=pending
```

Once Razorpay approves (might be auto), manually update in database:

```bash
PATCH /api/admin/organizers
{
  "organizer_id": "uuid",
  "kyc_status": "verified"
}
```

### Step 7: Implement Automatic Transfer (Future)

Once organizer is KYC-verified, automate payouts:

In `src/app/api/payments/verify/route.ts`:

```typescript
// After payment verified, create transfer to organizer's sub-merchant
const transfer = await razorpay.transfers.create({
  account: organizer.razorpay_account_id,
  amount: organizerShareAmount,
  currency: "INR",
  on_hold: false,
});
```

### Verification Checklist

- [ ] Razorpay Route enabled by support
- [ ] Route API access confirmed (test curl)
- [ ] All migrations (01-17) applied
- [ ] Organizer onboarding tested
- [ ] Sub-merchant visible in Razorpay dashboard
- [ ] KYC status syncs correctly
- [ ] Admin can update KYC status
- [ ] Automatic transfers implemented (future)

**Detailed Setup Guide**: See [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md)

---

## Upstash Redis Setup

**Purpose**: Caching, rate limiting, session management

### Prerequisites
- Upstash account (free tier available)
- Credit card (only if using beyond free limits)

### Step 1: Create Upstash Account

1. Go to [upstash.com](https://upstash.com)
2. Click "Sign Up"
3. Enter email
4. Create password
5. Click "Sign Up"
6. Verify email

### Step 2: Create Redis Database

1. Go to Upstash Console
2. Click "Create Database"
3. **Database Name**: `happenin-cache`
4. **Region**: Choose close to your server (e.g., `ap-south-1` for India)
5. **Type**: `Redis`
6. **Primary DB**: Select Free tier for testing
7. Click "Create"

### Step 3: Get Connection Details

1. Go to Database → click your database
2. Copy the following:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**

Alternatively, if using Redis client library:
- **Redis URL**: `redis://default:[password]@[host]:[port]`

### Step 4: Configure Rate Limiting

These are implemented in your API routes already, just needs Redis.

1. Verify rate limiting is working by:
   - Making multiple rapid requests to API
   - Should get 429 (Too Many Requests) after limit

### Step 5: Configure Caching

Different caching strategies in your app:

**Database Query Caching**:
- Event list cached for 5 minutes
- User data cached for 10 minutes
- College list cached for 1 hour

**Session Caching** (if not using JWT):
- User sessions stored in Redis
- 30-day expiry
- Cleared on logout

### Environment Variables

Backend (`.env`):
```
UPSTASH_REDIS_REST_URL=https://[your-id].upstash.io
UPSTASH_REDIS_REST_TOKEN=[your-token]

# OR if using Redis client:
REDIS_URL=redis://default:[password]@[host]:[port]
```

### Verification Checklist

- [ ] Upstash account created
- [ ] Redis database created
- [ ] Connection details copied
- [ ] Rate limiting working (test with rapid requests)
- [ ] Caching working (check response headers)
- [ ] Session data stored in Redis
- [ ] Credentials saved securely

---

## Vercel Setup

**Purpose**: Production hosting and deployment

### Prerequisites
- GitHub account with repository
- Project code pushed to GitHub

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access GitHub
5. Click "Import Project"
6. Find your `happenin` repository
7. Click "Import"

### Step 2: Configure Build Settings

1. **Project Name**: `happenin` (can be changed)
2. **Framework**: `Next.js`
3. **Root Directory**: `./frontend`
4. Build command: `npm run build`
5. Output directory: `.next`
6. Install command: `npm install`

### Step 3: Add Environment Variables

1. Go to Settings → Environment Variables
2. Add all frontend variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
   NEXT_PUBLIC_RAZORPAY_KEY_ID=[razorpay-key]
   NEXT_PUBLIC_APP_URL=https://[vercel-domain]
   ```
3. Click "Save"

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Once complete, get URL: `https://happenin-xxxxx.vercel.app`
4. Visit URL to confirm deployment

### Step 5: Configure Custom Domain (Optional)

1. Go to Settings → Domains
2. Click "Add"
3. Enter your domain: `happenin.com`
4. Choose option:
   - **Transfer domain** (if you own it)
   - **Point existing domain** (if registered elsewhere)
5. Follow DNS configuration steps
6. Wait for DNS propagation (can take 24-48 hours)

### Step 6: Setup Automatic Deployments

1. Go to Deployments
2. Confirm "GitHub Integration" is enabled
3. Every push to main branch:
   - Automatic build triggered
   - Deployed if build succeeds
   - Previous version still accessible (can rollback)

### Step 7: Configure Cron Jobs (Optional)

For scheduled tasks (like certificate batch generation):

1. Create file: `vercel.json` in project root
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/batch-certificates",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```
2. Create endpoint: `/api/cron/batch-certificates`
3. Verify cron runs daily at 2 AM (UTC)

### Step 8: Monitor Deployments

1. Go to Deployments tab
2. See build logs for each deploy
3. Check for errors/warnings
4. Rollback to previous version if needed

### Step 9: Setup Analytics (Optional)

1. Go to Analytics
2. View:
   - Real User Monitoring (RUM)
   - Page performance
   - API response times
   - Error tracking

### Environment Variables Checklist

Verify all these are set:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] NEXT_PUBLIC_RAZORPAY_KEY_ID
- [ ] NEXT_PUBLIC_GOOGLE_CLOUD_STORAGE_BUCKET
- [ ] NEXT_PUBLIC_APP_URL

### Verification Checklist

- [ ] Repository connected
- [ ] Build successful
- [ ] App deployed
- [ ] Can visit public URL
- [ ] All pages load correctly
- [ ] APIs respond properly
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)

---

## GitHub Setup

**Purpose**: Version control, CI/CD, secrets management

### Step 1: Create Repository

1. Go to [github.com](https://github.com)
2. Click "New" → "New repository"
3. **Repository name**: `happenin`
4. **Description**: `Event management platform`
5. **Visibility**: `Private` (recommended)
6. Click "Create repository"

### Step 2: Clone Repository Locally

```bash
git clone https://github.com/[your-username]/happenin.git
cd happenin
```

### Step 3: Configure Git

```bash
git config user.name "Your Name"
git config user.email "your@email.com"
```

### Step 4: Push Code to GitHub

```bash
# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Happenin event platform"

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 5: Configure Repository Settings

1. Go to Settings → General
2. Set:
   - **Default branch**: `main`
   - **Automatically delete head branches**: ON (cleanup after PR merge)

### Step 6: Create Branches

Create development branches:
```bash
git checkout -b develop
git push -u origin develop
```

Recommended branch structure:
- `main` - Production code
- `develop` - Staging/testing
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Step 7: Setup GitHub Secrets

Store sensitive credentials (never commit to repo):

1. Go to Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Add secrets:
   ```
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   RAZORPAY_KEY_SECRET=[razorpay-secret]
   GOOGLE_CLOUD_KEYFILE_JSON=[service-account-json]
   UPSTASH_REDIS_REST_TOKEN=[upstash-token]
   DATABASE_URL=[database-connection-string]
   ```

### Step 8: Create GitHub Actions Workflow (Optional)

Create file: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
```

### Step 9: Configure Branch Protection

1. Go to Settings → Branches
2. Click "Add rule"
3. **Branch name pattern**: `main`
4. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date
5. Click "Create"

### Step 10: Setup Codeowners (Optional)

Create file: `.github/CODEOWNERS`

```
# Everyone
* @you

# Frontend
/frontend/ @you

# Backend
/backend/ @you

# CI/CD
/.github/ @you
```

### Verification Checklist

- [ ] Repository created
- [ ] Code pushed to GitHub
- [ ] Default branch set to `main`
- [ ] Repository secrets configured
- [ ] Branch protection rules enabled
- [ ] GitHub Actions workflow created
- [ ] CI/CD pipeline working

---

## Quick Reference: All Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_RAZORPAY_KEY_ID=[razorpay-key]
NEXT_PUBLIC_APP_URL=https://[your-domain]
```

### Backend (`.env`)
```
# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Payment
RAZORPAY_KEY_ID=[key-id]
RAZORPAY_KEY_SECRET=[secret]
RAZORPAY_WEBHOOK_SECRET=[webhook-secret]

# Cache
UPSTASH_REDIS_REST_URL=https://[id].upstash.io
UPSTASH_REDIS_REST_TOKEN=[token]
```

---

## Deployment Checklist

Before going live, verify:

### 1. All Environments Configured
- [ ] Supabase project created and migrations applied (all 17 migrations)
- [ ] Google Cloud OAuth credentials configured
- [ ] Razorpay account verified (use test keys first)
- [ ] Upstash Redis database created
- [ ] Vercel project deployed
- [ ] GitHub repository created

### 2. All API Keys Secured
- [ ] No sensitive keys in code
- [ ] Keys only in `.env` files
- [ ] `.env` files in `.gitignore`
- [ ] Vercel environment variables configured
- [ ] GitHub secrets configured
- [ ] Keys rotated periodically

### 3. Database Ready
- [ ] All 11 migrations applied
- [ ] Tables created and indexed
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Test data loaded

### 4. Testing Complete
- [ ] Run full test checklist (TESTING_CHECKLIST.md)
- [ ] Payment flow tested with test keys
- [ ] Email notifications tested
- [ ] All user roles tested
- [ ] Performance acceptable

### 5. Security Verified
- [ ] HTTPS enforced
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF tokens present

### 6. Monitoring Setup
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring
- [ ] Log aggregation
- [ ] Uptime monitoring

---

## Troubleshooting

### Supabase Connection Issues
```
Error: "Cannot reach Supabase"
Solution: 
1. Verify SUPABASE_URL and ANON_KEY
2. Check internet connection
3. Verify database is running
4. Check RLS policies aren't blocking access
```

### Payment Not Processing
```
Error: "Razorpay payment failed"
Solution:
1. Verify using test keys (not live)
2. Use test card: 4111 1111 1111 1111
3. Check API keys haven't changed
4. Verify webhook URL configured
```

### Images Not Uploading
```
Error: "Failed to upload image"
Solution:
1. Verify Google Cloud credentials
2. Check bucket name correct
3. Verify bucket is public
4. Check file size < 5MB
```

### Rate Limiting Too Aggressive
```
Error: "429 Too Many Requests"
Solution:
1. Adjust rate limit thresholds in code
2. Verify Redis connection
3. Check Upstash quota
```

---

## Maintenance & Monitoring

### Daily Tasks
- [ ] Check error logs
- [ ] Monitor payment processing
- [ ] Verify webhooks delivering
- [ ] Check uptime status

### Weekly Tasks
- [ ] Review analytics
- [ ] Check database growth
- [ ] Update dependencies
- [ ] Review security logs

### Monthly Tasks
- [ ] Database backup verification
- [ ] Performance optimization review
- [ ] Cost review across services
- [ ] Security audit
- [ ] API quota review

---

**Document Version**: 1.0
**Last Updated**: February 2026
**Maintained By**: Development Team
