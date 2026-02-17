# DEPLOYMENT.md

> **Status:** Production System Documentation  
> **Last Updated:** February 17, 2026  
> **Purpose:** Deployment process, environment configuration, and hosting setup

---

## Overview

This document details how to **build, configure, and deploy** the Happenin application to production. Includes environment variables, hosting platforms, build steps, and monitoring.

---

## Table of Contents

1. [Tech Stack & Hosting](#1-tech-stack--hosting)
2. [Environment Variables](#2-environment-variables)
3. [Build Process](#3-build-process)
4. [Deployment Steps](#4-deployment-steps)
5. [Database Migrations](#5-database-migrations)
6. [Monitoring & Logging](#6-monitoring--logging)
7. [Pre-Fest Deployment Checklist](#7-pre-fest-deployment-checklist)

---

## 1. Tech Stack & Hosting

### Frontend

**Framework:** Next.js 16 (App Router)  
**Hosting:** Vercel (recommended) or any Node.js hosting  
**Build Command:** `npm run build`  
**Start Command:** `npm start`  
**Node Version:** 20+

**Key Features:**
- Server-Side Rendering (SSR) for SEO
- API routes for backend logic (`/api/...`)
- Progressive Web App (PWA) with service worker
- Edge runtime for middleware (auth checks)

---

### Backend

**Purpose:** Minimal Express server for seed data or additional services  
**Location:** `/backend` directory  
**Hosting:** Not actively deployed (frontend API routes handle most backend logic)  
**Status:** Seeds colleges data, may be deprecated

⚠️ **NOTE:** Most "backend" logic is in Next.js API routes (`frontend/src/app/api/...`), not the `/backend` folder.

---

### Database

**Service:** Supabase (PostgreSQL + PostGIS)  
**Hosting:** Supabase Cloud (supabase.com)  
**Connection:** Via REST API and JavaScript client (`@supabase/supabase-js`)  
**Storage:** Supabase Storage buckets for media files

**Buckets:**
- `profile-photos`: User profile pictures
- `event-media`: Event images, banners
- `happenin-certificates`: Generated certificates

---

### Payments

**Service:** Razorpay  
**Integration:** Razorpay SDK + REST API  
**Checkout:** Razorpay Checkout (modal)  
**Webhooks:** ⚠️ Not implemented (client-side handler only)

---

### Authentication

**Service:** NextAuth v4  
**Session Type:** JWT (stateless)  
**Providers:** Credentials, Google OAuth  
**Storage:** JWT in HTTP-only cookie

---

## 2. Environment Variables

### Required for Production

#### Frontend (.env or Vercel Environment Variables)

```bash
# --- NextAuth ---
NEXTAUTH_SECRET="<strong-random-string-32-chars>"
NEXTAUTH_URL="https://happenin.vercel.app"  # Production URL

# --- Supabase (Server) ---
SUPABASE_URL="https://xyzabc.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"  # Server-only, full access

# --- Supabase (Client) ---
NEXT_PUBLIC_SUPABASE_URL="https://xyzabc.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-public-key>"  # Client-side, RLS protected

# --- Razorpay ---
RAZORPAY_KEY_ID="<live-key-id>"  # Server-only
RAZORPAY_KEY_SECRET="<live-key-secret>"  # Server-only, NEVER expose
NEXT_PUBLIC_RAZORPAY_KEY_ID="<live-key-id>"  # Client-side, safe to expose

# --- Google OAuth ---
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"

# --- Upstash Redis (Rate Limiting) ---
UPSTASH_REDIS_REST_URL="<upstash-redis-url>"  # Optional
UPSTASH_REDIS_REST_TOKEN="<upstash-redis-token>"  # Optional

# --- Optional ---
NODE_ENV="production"
```

---

### Variable Descriptions

| Variable | Purpose | Required | Security |
|----------|---------|----------|----------|
| `NEXTAUTH_SECRET` | JWT signing secret (32+ chars) | ✅ YES | ❌ NEVER expose |
| `NEXTAUTH_URL` | Canonical site URL | ✅ YES (prod) | 🟢 Safe |
| `SUPABASE_URL` | Supabase project URL | ✅ YES | 🟢 Safe |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side full DB access | ✅ YES | ❌ NEVER expose |
| `NEXT_PUBLIC_SUPABASE_URL` | Client-side Supabase URL | ✅ YES | 🟢 Safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side anon key (RLS) | ✅ YES | 🟢 Safe |
| `RAZORPAY_KEY_ID` | Server-side Razorpay key | ✅ YES | ❌ NEVER expose |
| `RAZORPAY_KEY_SECRET` | Server-side Razorpay secret | ✅ YES | ❌ NEVER expose |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client-side Razorpay key | ✅ YES | 🟢 Safe |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ YES (OAuth) | 🟢 Safe |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ YES (OAuth) | ❌ NEVER expose |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | 🟡 OPTIONAL | 🟢 Safe |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | 🟡 OPTIONAL | ❌ NEVER expose |

---

### Environment Variable Naming Convention

**`NEXT_PUBLIC_*`:** Exposed to browser (client-side), safe to share  
**No prefix:** Server-only, NEVER exposed to client

**Example:**
```typescript
// Server-side (API route)
const secret = process.env.RAZORPAY_KEY_SECRET; // ✅ Works, not in client bundle

// Client-side (React component)
const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; // ✅ Works, exposed to browser
const secret = process.env.RAZORPAY_KEY_SECRET; // ❌ Undefined in browser
```

---

### How to Set Environment Variables

#### Local Development
```bash
# Create .env.local in /frontend directory
touch frontend/.env.local

# Add variables (never commit this file)
echo "NEXTAUTH_SECRET=..." >> frontend/.env.local
```

#### Vercel Deployment
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable with scope: Production, Preview, Development
3. Redeploy to apply changes

#### Other Hosting (Netlify, AWS, etc.)
- Set environment variables in hosting platform dashboard
- Ensure `NEXT_PUBLIC_*` variables are set at build time
- Server-only variables can be set at runtime

---

## 3. Build Process

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

---

### Step 2: Type Check (Optional but Recommended)

```bash
npm run type-check
```

**Purpose:** Catch TypeScript errors before build  
**Command:** `tsc --noEmit` (no output, just validation)

---

### Step 3: Build Next.js App

```bash
npm run build
```

**What Happens:**
1. Compiles TypeScript → JavaScript
2. Bundles client-side code (with tree-shaking)
3. Generates optimized pages (SSR, SSG, ISR)
4. Creates `.next` folder with production build
5. Generates service worker (`public/sw.js`) for PWA

**Build Output:**
```
.next/
├── server/               # Server-side code (API routes, SSR)
├── static/               # Static assets (images, fonts)
├── standalone/           # Standalone server (if enabled)
└── BUILD_ID              # Unique build identifier
```

**Build Time:** ~2-5 minutes (depends on machine)

---

### Step 4: Start Production Server

```bash
npm start
```

**Command:** `next start`  
**Port:** 3000 (default, customizable with `-p` flag)  
**Server:** Node.js HTTP server serving `.next` folder

---

### Build Configuration

#### next.config.ts

```typescript
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  // PWA configuration
  pwa: {
    dest: "public",
    register: true,
    skipWaiting: true,
  },
  
  // Image domains (if external images loaded)
  images: {
    domains: ["supabase.co", "razorpay.com"],
  },
  
  // Experimental features
  experimental: {
    // serverActions: true,  // If Server Actions used
  },
};

export default withPWA(nextConfig);
```

⚠️ **NOTE:** Actual config may vary. Check [next.config.ts](../frontend/next.config.ts) for current settings.

---

### vercel.json Configuration

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript; charset=utf-8"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

**Purpose:** Configure headers for PWA service worker and manifest.

---

## 4. Deployment Steps

### Option A: Vercel (Recommended)

**Why Vercel?**
- Built for Next.js (same company)
- Zero-config deployment
- Auto HTTPS + CDN
- Git integration (auto-deploy on push)
- Generous free tier

---

#### Initial Setup

1. **Connect Git Repository:**
   ```bash
   # Push code to GitHub/GitLab/Bitbucket
   git remote add origin https://github.com/yourusername/happenin.git
   git push -u origin main
   ```

2. **Import on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select GitHub repo
   - Vercel auto-detects Next.js

3. **Configure Build Settings:**
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (Next.js default)
   - Install Command: `npm install` (auto-detected)

4. **Add Environment Variables:**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from [Environment Variables](#2-environment-variables)
   - Scope: Production + Preview

5. **Deploy:**
   - Click "Deploy"
   - Vercel builds and deploys to `https://your-project.vercel.app`
   - Custom domain: Settings → Domains → Add domain

---

#### Continuous Deployment

**Auto-Deploy on Git Push:**
- Push to `main` branch → Production deploy
- Push to other branches → Preview deploy (preview URL)

**Preview Deployments:**
- Each PR gets unique preview URL
- Test changes before merging to main

---

### Option B: Other Hosting Platforms

#### Netlify

```bash
# Build command
npm run build

# Publish directory
.next
```

**Note:** Netlify requires [Netlify Plugin for Next.js](https://www.netlify.com/with/nextjs/)

---

#### AWS (EC2, ECS, Amplify)

1. Build Docker image:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY frontend/package*.json ./
   RUN npm install --production
   COPY frontend/ ./
   RUN npm run build
   CMD ["npm", "start"]
   EXPOSE 3000
   ```

2. Deploy to ECS or EC2
3. Set environment variables in AWS console

---

#### Self-Hosted (VPS, DigitalOcean)

```bash
# Clone repo
git clone https://github.com/yourusername/happenin.git
cd happenin/frontend

# Install dependencies
npm install --production

# Build
npm run build

# Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "happenin" -- start
pm2 save
pm2 startup  # Auto-start on boot
```

**Reverse Proxy (Nginx):**
```nginx
server {
  listen 80;
  server_name happenin.example.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

---

## 5. Database Migrations

### Supabase Migrations

**Location:** `backend/supabase/migrations/`  
**Format:** SQL files (`01_*.sql`, `02_*.sql`, ...)  
**Total:** 23 migration files

---

### Running Migrations

#### Option 1: Supabase Dashboard (Manual)

1. Go to Supabase Dashboard → SQL Editor
2. Paste SQL from migration file
3. Click "Run"
4. Repeat for each migration in order

⚠️ **IMPORTANT:** Run migrations **in numerical order** (01, 02, 03, ...)

---

#### Option 2: Supabase CLI (Automated)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to remote project
supabase link --project-ref xyzabc

# Run all pending migrations
supabase db push
```

**How it Works:**
- CLI tracks which migrations have run via `supabase_migrations` table
- Only runs new migrations
- Order preserved automatically

---

### Migration Checklist

Before deploying:
- [ ] All 23 migrations applied to production DB
- [ ] No migration errors in Supabase logs
- [ ] Indexes created (check with `\d+ table_name` in Supabase SQL Editor)
- [ ] RLS policies enabled (check with `SELECT * FROM pg_policies`)
- [ ] Storage buckets created (profile-photos, event-media, happenin-certificates)

⚠️ **CRITICAL:** Storage buckets not in migrations. Create manually via Supabase Dashboard → Storage.

---

## 6. Monitoring & Logging

### Application Monitoring

**Recommended Tools:**
- **Vercel Analytics:** Built-in on Vercel (Web Vitals, Core Web Vitals)
- **Sentry:** Error tracking + performance monitoring
- **LogRocket:** Session replay for debugging user issues

---

### Uptime Monitoring

**Tools:**
- Uptime Robot (free)
- Pingdom
- Better Uptime

**Setup:**
```
Monitor URL: https://happenin.vercel.app/api/health
Interval: 1 minute
Alert: Email/SMS if down > 1 minute
```

⚠️ **TODO:** Create `/api/health` endpoint for uptime checks.

---

### Database Monitoring

**Supabase Dashboard:**
- Database → Logs → View query performance
- Database → Database → Disk usage
- Database → Database → Connection count

**Alerts:**
- Connection pool > 80% → Add PgBouncer
- Disk usage > 80% → Upgrade plan
- Slow queries > 1s → Add indexes

---

### Payment Monitoring

**Razorpay Dashboard:**
- Payments → Transactions → View all payments
- Payments → Failed → Investigate failed payments
- Settlements → View payouts to bank account

**Alerts:**
- Payment failure rate > 5% → Investigate Razorpay issues
- Signature verification failures → Check RAZORPAY_KEY_SECRET

---

### Performance Metrics (Target for 10K Users)

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Page Load Time (p95) | < 2s | > 5s |
| API Response Time (p95) | < 500ms | > 2s |
| Database Query Time (p95) | < 100ms | > 500ms |
| Uptime | 99.9% | < 99% |
| Error Rate | < 0.1% | > 1% |

---

## 7. Pre-Fest Deployment Checklist

### 1 Week Before Fest

- [ ] **Load Test:**
  - Run load test with 10K concurrent users
  - Test ticket purchase flow (100 payments/min)
  - Test check-in flow (1000 check-ins in 30 min)
  - Monitor database connection pool, CPU, memory

- [ ] **Environment Variables:**
  - Switch Razorpay from test mode to live mode
  - Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to live keys
  - Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` to live key
  - Verify `NEXTAUTH_SECRET` is strong (32+ chars)
  - Verify `NEXTAUTH_URL` is production URL

- [ ] **Database:**
  - Run all 23 migrations
  - Enable RLS on users and payments tables (**CRITICAL**)
  - Add UNIQUE constraint on registrations(event_id, user_email) (**CRITICAL**)
  - Add missing indexes (see DATABASE_SCHEMA.md)
  - Enable PgBouncer for connection pooling
  - Set up hourly backups

- [ ] **Monitoring:**
  - Set up Sentry for error tracking
  - Set up uptime monitoring (Uptime Robot)
  - Configure alerts (Slack, email, SMS)
  - Create on-call rotation

- [ ] **Security:**
  - Audit all RLS policies
  - Test that students can't see other students' data
  - Verify payment signature verification works
  - Force HTTPS on all pages
  - Rate limit auth endpoints (Upstash Redis)

---

### 3 Days Before Fest

- [ ] **Code Freeze:**
  - No new features
  - Only critical bug fixes
  - All changes require manual QA

- [ ] **Full System Test:**
  - Test complete user journey: signup → event discovery → ticket purchase → check-in
  - Test organizer journey: event creation → volunteer approval → check-in
  - Test admin journey: banner approval → analytics

- [ ] **Backup Plan:**
  - Export all events to CSV (backup)
  - Export all registrations to CSV (backup)
  - Document manual check-in process (if app fails)
  - Print physical tickets as fallback

---

### Fest Day Morning

- [ ] **Final Checks:**
  - Check Supabase dashboard: database online, disk space OK
  - Check Vercel dashboard: last deploy successful
  - Check Razorpay dashboard: account active, no issues
  - Test login on multiple devices (desktop, mobile)
  - Test payment flow end-to-end (₹1 test payment)

- [ ] **Communication:**
  - Announce fest schedule via app notifications
  - Send reminder emails to registered attendees
  - Post on social media with app link

- [ ] **On-Call:**
  - Designate tech lead for fest day support
  - Monitor error logs in real-time (Sentry)
  - Monitor Vercel/Supabase/Razorpay dashboards
  - Have laptop ready for emergency fixes

---

## Deployment Rollback Plan

### If Critical Bug Found in Production:

1. **Immediate Rollback (Vercel):**
   ```
   Vercel Dashboard → Deployments → Find previous stable deploy → "Promote to Production"
   ```
   **Time:** < 1 minute

2. **Database Rollback (if migration broke things):**
   ```sql
   -- Restore from Supabase backup
   -- Supabase Dashboard → Database → Backups → Restore
   ```
   **Time:** 5-10 minutes

3. **Fix + Redeploy:**
   - Fix bug in separate branch
   - Test locally
   - Deploy to preview environment
   - Test again
   - Merge to main → auto-deploy

---

## Common Deployment Issues

### Issue: Build Fails with TypeScript Errors

**Solution:**
```bash
npm run type-check  # Find errors locally
# Fix errors
npm run build  # Test build locally before pushing
```

---

### Issue: Environment Variables Not Working

**Symptoms:**
- `process.env.VARIABLE_NAME` is undefined
- API calls to Supabase/Razorpay fail

**Solution:**
1. Check Vercel Dashboard → Environment Variables → Ensure variables are set
2. Redeploy (environment changes require rebuild)
3. For `NEXT_PUBLIC_*` variables: Ensure set at build time, not runtime

---

### Issue: Database Connection Errors

**Symptoms:**
- "Connection pool exhausted"
- "Too many connections"

**Solution:**
1. Enable PgBouncer in Supabase
2. Reduce connection pool size in app
3. Upgrade Supabase plan (more connections)

---

### Issue: Razorpay Test Mode in Production

**Symptoms:**
- Payments succeed but no money received
- Razorpay Dashboard shows "Test Mode" transactions

**Solution:**
1. Switch to live keys: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
2. Update `NEXT_PUBLIC_RAZORPAY_KEY_ID` to live key
3. Redeploy
4. Test with ₹1 payment (real transaction)

---

**END OF DEPLOYMENT.md**
