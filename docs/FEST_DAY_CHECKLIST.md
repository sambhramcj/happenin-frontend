# FEST_DAY_CHECKLIST.md

> **Status:** Operational Checklist  
> **Last Updated:** February 17, 2026  
> **Purpose:** Step-by-step checklist for fest day operations

---

## Overview

This is a **tactical checklist** for the tech team and organizers to follow **before, during, and after** fest days. Use this to ensure zero critical failures during peak load (10,000+ concurrent users).

---

## Table of Contents

1. [7 Days Before Fest](#1-seven-days-before-fest)
2. [3 Days Before Fest](#2-three-days-before-fest)
3. [1 Day Before Fest](#3-one-day-before-fest)
4. [Fest Day Morning (6 AM)](#4-fest-day-morning-6-am)
5. [During Fest (Operations)](#5-during-fest-operations)
6. [Post-Fest (Wind Down)](#6-post-fest-wind-down)
7. [Emergency Response Plan](#7-emergency-response-plan)

---

## 1. Seven Days Before Fest

### ✅ Technical Infrastructure

- [ ] **Load Testing Completed**
  - Run load test with 10,000 concurrent users for 1 hour
  - Test ticket purchase flow: 100 purchases/min sustained
  - Test check-in flow: 33 check-ins/min sustained
  - Monitor: CPU, memory, database connections, API response times
  - Document results (all green or identified bottlenecks fixed)

- [ ] **Database Optimizations**
  - All 17 migrations applied to production
  - RLS enabled on `users`, `payments`, `registrations`, `student_profiles` (**CRITICAL**)
  - UNIQUE constraint on `registrations(event_id, user_email)` (**CRITICAL**)
  - Indexes added (see DATABASE_SCHEMA.md recommendations)
  - PgBouncer enabled for connection pooling
  - Hourly backups configured

- [ ] **Environment Variables Verified**
  - Razorpay keys switched to **LIVE MODE** (not test mode)
  - `RAZORPAY_KEY_ID` → live key
  - `RAZORPAY_KEY_SECRET` → live key (server-only)
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID` → live key (client-side)
  - `NEXTAUTH_SECRET` → strong random string (32+ chars)
  - `NEXTAUTH_URL` → production URL (https://happenin.vercel.app)
  - Google OAuth credentials → production credentials

- [ ] **Payment Testing**
  - Complete 1 real payment (₹1 or ₹10) end-to-end
  - Verify payment succeeds in Razorpay dashboard
  - Verify ticket created in database
  - Verify ticket appears in student dashboard
  - Test payment failure scenario (declined card) → clear error message

- [ ] **Monitoring Setup**
  - Sentry or error tracking tool configured
  - Uptime monitoring active (Uptime Robot, Pingdom)
  - Alerts configured: email + SMS for critical issues
  - Vercel/hosting dashboard accessible
  - Supabase dashboard accessible
  - Razorpay dashboard accessible

---

### ✅ Content & Data Preparation

- [ ] **Event Data Verified**
  - All fest events created and published
  - Event start times, venues, descriptions accurate
  - Event banners uploaded
  - Max attendee limits set (if applicable)
  - Registration close times set

- [ ] **Volunteer Roles Defined**
  - All volunteer roles documented in events
  - Volunteer applications reviewed and approved
  - Volunteers notified of their assignments

- [ ] **Sponsorships Finalized**
  - All sponsor logos uploaded
  - Sponsorship tiers assigned
  - Sponsor banners submitted and approved
  - Sponsor deliverables documented

- [ ] **Certificate Templates Created**
  - Certificate templates designed for key events
  - Name positioning tested with sample names
  - Templates approved by organizers

---

### ✅ Communication

- [ ] **Attendee Communications**
  - Send email reminder: "Fest in 7 days! Register now"
  - Push notification (if app installed): "Don't miss [fest name]"
  - Social media posts with event schedule

- [ ] **Organizer Training**
  - Train organizers on check-in process (QR scan or manual entry)
  - Train organizers on handling check-in errors (duplicate, invalid ticket)
  - Document manual check-in process (backup if app fails)
  - Share organizer dashboard credentials

- [ ] **Tech Team Readiness**
  - Designate on-call person for fest days (24/7 availability)
  - Share emergency contact numbers (tech lead, hosting support)
  - Ensure laptop + mobile hotspot available (backup internet)

---

## 2. Three Days Before Fest

### ✅ Code Freeze

- [ ] **No New Features**
  - Only critical bug fixes allowed
  - All changes require manual QA before deploying

- [ ] **Final Build Deployed**
  - Last deployment to production at least 72 hours before fest
  - Deployment successful (green build status)
  - Smoke test: Login → Browse events → Purchase ticket → Check-in

---

### ✅ Full System Test

- [ ] **End-to-End User Journeys**
  - **Student Journey:**
    1. Create account (email/password + Google OAuth)
    2. Complete profile
    3. Browse events
    4. Search events by keyword
    5. Register for free event → ticket generated
    6. Purchase paid event ticket → payment succeeds → ticket generated
    7. View tickets in dashboard
  - **Organizer Journey:**
    1. Login as organizer
    2. Create event
    3. Upload event banner
    4. Create certificate template
    5. Approve volunteer applications
    6. Test check-in (scan QR or enter ticket ID)
  - **Admin Journey:**
    1. Login as admin
    2. Approve banner
    3. View analytics dashboard

- [ ] **Multi-Device Testing**
  - Desktop Chrome, Firefox, Safari
  - Mobile Chrome (Android), Safari (iOS)
  - Tablet (iPad, Android tablet)
  - Slow 3G network simulation (Chrome DevTools)

- [ ] **Concurrent User Simulation**
  - 10 friends/teammates simultaneously:
    - Register accounts
    - Purchase tickets
    - Check-in to same event
  - Verify no duplicate registrations
  - Verify check-in count accurate

---

### ✅ Backup Preparation

- [ ] **Data Exports**
  - Export all events to CSV (event_id, title, start_datetime, venue, organizer_email)
  - Export all registrations to CSV (registration_id, event_id, student_email, status)
  - Export all payments to CSV (payment_id, event_id, student_email, amount, status)
  - Store exports in Google Drive or secure location

- [ ] **Manual Fallback Plan**
  - Print physical tickets for VIP/critical attendees (if needed)
  - Document manual check-in process:
    1. Attendee shows ticket (email or screenshot)
    2. Organizer checks email against list (printed CSV)
    3. Mark checked-in on paper
    4. Manually update database later
  - Prepare paper attendance sheets (backup if app fails)

---

### ✅ Capacity Planning

- [ ] **Server Auto-Scaling Enabled**
  - Vercel: Ensure Pro plan (if needed for more concurrent executions)
  - Database: Verify Supabase plan supports expected load
  - Razorpay: Verify no rate limits on payment volume

- [ ] **Database Connection Pool Sized**
  - Expected: 10K users × 5 requests/min = ~833 requests/sec
  - PgBouncer pool size: 100-200 connections (adjust based on load test)

---

## 3. One Day Before Fest

### ✅ Final Checks

- [ ] **System Status Green**
  - Vercel dashboard: Last deployment successful (green)
  - Supabase dashboard: Database online, disk space > 50% free
  - Razorpay dashboard: Account active, no alerts

- [ ] **Live Environment Test**
  - Test login from 3 different devices
  - Test event listing page load time < 2 seconds
  - Test payment flow with ₹1 real payment (withdraw after test)
  - Test check-in with test ticket

- [ ] **Data Verification**
  - All fest events visible on homepage
  - Event schedule page populated
  - Volunteer assignments visible to volunteers
  - Certificates templates ready (not yet generated)

---

### ✅ Communication Blitz

- [ ] **Attendee Reminders**
  - Email: "Tomorrow is the fest! Here's your schedule"
  - Push notification: "Fest starts tomorrow at [time]"
  - SMS (if applicable): "Download tickets before fest"
  - Social media: "See you tomorrow at [venue]!"

- [ ] **Organizer Final Brief**
  - Send check-in guide to all organizers
  - Verify organizer accounts active
  - Share tech support hotline number

- [ ] **On-Call Readiness**
  - On-call person confirms availability (24/7 for fest duration)
  - Laptop charged, backup power bank ready
  - Mobile hotspot available (backup internet)
  - Access to all dashboards verified (Vercel, Supabase, Razorpay)

---

### ✅ Pre-Fest Announcement

- [ ] **In-App Announcements**
  - Banner: "Fest starts tomorrow! Download your tickets"
  - Push notification: "Reminder: [Event Name] at [Time] tomorrow"

- [ ] **Website Homepage Update**
  - Countdown timer: "Fest starts in X hours"
  - Featured events carousel
  - Emergency contact number displayed

---

## 4. Fest Day Morning (6 AM)

### ✅ System Wake-Up Call

- [ ] **Dashboard Checks (6:00 AM)**
  - **Vercel:** Last deployment green, no errors in logs
  - **Supabase:** Database online, 0 connection errors, disk space OK
  - **Razorpay:** No payment failures overnight
  - **Uptime Monitor:** 100% uptime in last 24 hours

- [ ] **Smoke Test (6:10 AM)**
  - Login from mobile phone
  - Browse events page (loads in < 2s)
  - Test payment flow (₹1 real payment)
  - Test check-in (scan test QR code)
  - All systems go? ✅

- [ ] **Real-Time Monitoring Active (6:15 AM)**
  - Open Vercel Analytics in browser tab (keep open all day)
  - Open Supabase Database Dashboard (monitor connection count)
  - Open Razorpay Dashboard (monitor payment success rate)
  - Open Sentry (monitor error rate)

- [ ] **On-Call Confirmed (6:20 AM)**
  - On-call person online and monitoring
  - Laptop open, mobile hotspot tested
  - All access credentials verified

---

### ✅ Pre-Event Setup (1 Hour Before First Event)

- [ ] **Organizer Check-In Stations Ready**
  - Organizers logged into dashboard
  - QR scanner working (or manual entry ready)
  - Test check-in with dummy ticket
  - Paper attendance sheet (backup) printed

- [ ] **Network Connectivity**
  - Venue Wi-Fi tested (speed, stability)
  - Mobile data hotspot available (backup)
  - Consider: Load balancing between organizers' devices

- [ ] **Communication Channels Open**
  - WhatsApp group: Tech Team + Organizers
  - Slack/Discord (if used): #fest-day-support channel active
  - Phone numbers shared: Tech Lead, Hosting Support, On-Call

---

## 5. During Fest (Operations)

### ⚡ Real-Time Monitoring (Every 30 Minutes)

- [ ] **Traffic Metrics**
  - Concurrent users: _____ / 10,000 (target)
  - Page views/min: _____
  - API requests/min: _____
  - Errors/min: _____ (should be < 0.1%)

- [ ] **Performance Metrics**
  - Event listing page load time (p95): _____ (target < 2s)
  - API response time (p95): _____ (target < 500ms)
  - Database query time (p95): _____ (target < 100ms)

- [ ] **Payment Monitoring**
  - Payments attempted: _____
  - Payments succeeded: _____ (target > 95%)
  - Payments failed: _____ (investigate if > 5%)
  - Average payment time: _____ (target < 5s)

- [ ] **Check-In Monitoring**
  - Total check-ins: _____ / _____
  - Check-ins/min: _____ (target < 33/min)
  - Errors: _____ (duplicate, invalid ticket)

---

### 🚨 Incident Response (If Issues Occur)

**If Error Rate > 1%:**
1. Check Sentry for error details
2. Identify failing endpoint
3. Check if isolated to 1 user or widespread
4. If widespread: Alert team, investigate immediately
5. Consider rollback if critical

**If Payment Success Rate < 90%:**
1. Check Razorpay dashboard for issues
2. Check if Razorpay API down (status.razorpay.com)
3. If Razorpay issue: Announce temporary payment pause
4. If app issue: Check signature verification, database writes

**If Check-In Fails:**
1. Fall back to manual check-in (paper list)
2. Check database connection (Supabase dashboard)
3. Check if organizer internet down (switch to mobile hotspot)
4. Manually update database after event

**If Database Connection Pool Exhausted:**
1. Check Supabase connection count (should be < 80% of limit)
2. If > 80%: Consider restarting unhealthy connections
3. If persistent: Upgrade Supabase plan immediately
4. Enable PgBouncer (if not already enabled)

**If Complete System Failure (App Down):**
1. **Stay Calm** → Follow emergency plan
2. Check Vercel status (status.vercel.com)
3. Rollback to previous deployment (< 1 minute on Vercel)
4. Announce downtime via social media
5. Activate manual fallback (paper tickets, manual check-in)
6. Fix issue offline, redeploy when stable

---

### 📞 Communication During Fest

- [ ] **Attendee Support**
  - Monitor support WhatsApp/email
  - Common issues:
    - "Can't login" → Check credentials, reset password
    - "Payment failed" → Check Razorpay, verify refund
    - "Ticket not showing" → Check registration in database, manually add if needed
  - Response time target: < 5 minutes

- [ ] **Organizer Support**
  - Monitor organizer WhatsApp group
  - Common issues:
    - "Check-in not working" → Fallback to manual
    - "QR scanner not scanning" → Manual entry of ticket ID
    - "Attendee not in list" → Verify payment in database
  - Response time target: < 2 minutes (critical)

---

## 6. Post-Fest (Wind Down)

### ✅ Immediate Post-Fest (Same Day)

- [ ] **Final Check-Ins Synced**
  - If manual check-ins used (paper): Update database with check-in statuses
  - Verify all check-in counts match attendance

- [ ] **Payment Reconciliation**
  - Export all payments from Razorpay dashboard
  - Compare with database payments table
  - Identify: Payments succeeded in Razorpay but no ticket created → manually create registrations
  - Document discrepancies for refund/support

- [ ] **System Health Check**
  - Vercel: No errors in logs
  - Supabase: Connection count back to normal, no lingering connections
  - Razorpay: All payments settled

- [ ] **Thank You Communications**
  - Email attendees: "Thank you for attending [fest name]!"
  - Push notification: "We hope you enjoyed the fest!"
  - Social media: Post highlights, photos

---

### ✅ Next Day Post-Fest

- [ ] **Certificate Generation**
  - Organizers generate certificates for participants
  - Bulk certificate generation for all checked-in attendees
  - Send certificates via email
  - Ensure certificates appear in student dashboards

- [ ] **Volunteer Certificates**
  - Generate volunteer certificates
  - Send to all approved volunteers who attended

- [ ] **Feedback Collection**
  - Send feedback form to all attendees
  - Collect ratings for events
  - Use for future improvements

---

### ✅ 1 Week Post-Fest

- [ ] **Analytics Report**
  - Total attendees: _____
  - Total registrations: _____
  - Total revenue: ₹_____
  - Most popular events: _____
  - Peak concurrent users: _____
  - Average page load time: _____
  - Error rate: _____%

- [ ] **Retrospective Meeting**
  - What went well?
  - What broke or had issues?
  - What should we improve for next year?
  - Document lessons learned

- [ ] **Database Cleanup**
  - Archive old events (if needed)
  - Delete test data (if any)
  - Optimize database (VACUUM, ANALYZE)

- [ ] **Code Improvements**
  - Fix any bugs discovered during fest
  - Implement features requested by organizers
  - Update documentation based on lessons learned

---

## 7. Emergency Response Plan

### 🚨 Critical Failure: App Completely Down

**Symptoms:**
- Website returns 5xx errors
- Users cannot access app
- No pages loading

**Immediate Actions (< 5 minutes):**
1. **Check Hosting Status**
   - Vercel: status.vercel.com
   - If Vercel down: Wait for recovery (announced on status page)
   
2. **Rollback Deployment**
   - Vercel Dashboard → Deployments → Find last stable deploy → "Promote to Production"
   - Time: < 1 minute
   
3. **Announce Downtime**
   - Social media: "We're experiencing technical issues. Working to resolve ASAP."
   - WhatsApp/email: "App temporarily down. Use backup check-in process."
   
4. **Activate Manual Fallback**
   - Organizers use paper attendance sheets
   - Accept physical tickets (email screenshots)
   - Manual check-in: Mark on paper, sync database later

5. **Fix + Redeploy**
   - Identify issue in logs (Vercel, Sentry)
   - Fix bug in separate branch
   - Test locally
   - Redeploy to production
   - Verify app online

**Target Recovery Time:** < 15 minutes

---

### 🚨 Critical Failure: Database Offline

**Symptoms:**
- API routes return database connection errors
- Event listing page shows errors
- Check-ins fail

**Immediate Actions:**
1. **Check Supabase Status**
   - Supabase Dashboard → Database
   - If offline: Contact Supabase support immediately
   
2. **Restore from Backup (if needed)**
   - Supabase Dashboard → Database → Backups → Restore latest
   - Time: 5-10 minutes
   
3. **Announce Issue**
   - "Database temporarily offline. Check-ins will be manual."
   
4. **Activate Manual Fallback**
   - Organizers use paper lists (exported earlier)
   - Sync manual check-ins to database when online

**Target Recovery Time:** < 30 minutes

---

### 🚨 Critical Failure: Payment System Down

**Symptoms:**
- Payment create-order fails
- Razorpay modal doesn't open
- All payments failing

**Immediate Actions:**
1. **Check Razorpay Status**
   - status.razorpay.com
   - If Razorpay down: Wait for recovery + announce
   
2. **Check Razorpay Keys**
   - Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET correct
   - Verify not in test mode (should be live keys)
   
3. **Announce Payment Pause**
   - "Payments temporarily unavailable. Register now, pay at venue."
   - Alternative: Accept UPI payments manually (organizer's phone)
   
4. **Manual Payment Collection (if needed)**
   - Organizer collects UPI at venue
   - Records payment reference manually
   - Updates database later

**Target Recovery Time:** < 10 minutes (or switch to manual)

---

### 📞 Emergency Contacts

| Role | Name | Phone | Email | Availability |
|------|------|-------|-------|--------------|
| Tech Lead | __________ | +91-__________ | __________ | 24/7 during fest |
| On-Call Engineer | __________ | +91-__________ | __________ | 24/7 during fest |
| Vercel Support | - | - | support@vercel.com | Submit ticket |
| Supabase Support | - | - | support@supabase.com | Submit ticket |
| Razorpay Support | - | 1800-XXX-XXXX | support@razorpay.com | 24/7 |
| Fest Coordinator | __________ | +91-__________ | __________ | On-site |

---

**REMEMBER: Breathe. Stay calm. Follow the plan. You've tested this. It will work.**

---

**END OF FEST_DAY_CHECKLIST.md**
