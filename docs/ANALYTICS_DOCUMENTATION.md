# Analytics Documentation - Happenin Platform

**Last Updated:** February 17, 2026  
**Version:** 1.0

This document provides a comprehensive overview of all analytics, metrics, and insights available to each role in the Happenin platform.

---

## Table of Contents

1. [Student Analytics](#student-analytics)
2. [Organizer Analytics](#organizer-analytics)
3. [Sponsor Analytics](#sponsor-analytics)
4. [Admin Analytics](#admin-analytics)
5. [Festival Analytics](#festival-analytics)
6. [Data Sources & Calculation Methods](#data-sources--calculation-methods)

---

## Student Analytics

**Access:** Student Dashboard → My Events Tab, Profile Tab, Certificates Tab

### 1. Certificates & Achievements Analytics

#### **Metrics Displayed:**

##### **Certificate Statistics**
- **Total Certificates:** Count of all certificates earned by the student
- **Volunteer Certificates:** Count of volunteer participation certificates
- **Participant Certificates:** Count of event participation certificates  
- **Winning Certificates:** Count of awards/winning certificates

##### **Badge Statistics**
- **Total Badges:** Count of achievement badges earned
- **Badge Breakdown:** Individual badges with:
  - Badge name
  - Badge type (bronze, silver, gold, platinum)
  - Earned date
  - Associated achievement

#### **Data Source:**
```
Tables: student_certificates, achievement_badges
API Endpoint: /api/student/certificates
```

#### **Filtering Options:**
- Filter by certificate type (volunteer, participant, winning)
- Sort by date earned (newest/oldest first)
- Search by event name or organization

#### **Visual Representation:**
- Summary stat cards for each certificate type
- Badge gallery with icons and earn dates
- Timeline view of certifications earned over time

---

### 2. Event Participation Analytics

#### **Metrics Displayed:**

##### **Registration History**
- **Total Events Registered:** Count of all event registrations
- **Upcoming Events:** Events registered but not yet occurred
- **Past Events:** Events already attended
- **Registration Status Breakdown:**
  - Confirmed registrations
  - Pending payments
  - Cancelled registrations

##### **Attendance Tracking**
- **Events Attended:** Count of events with confirmed attendance
- **Attendance Rate:** (Events Attended / Total Registrations) × 100%
- **No-show Count:** Registered but did not attend

##### **Financial Summary**
- **Total Spent:** Sum of all successful payments for event registrations
- **Pending Payments:** Sum of unpaid registrations
- **Average Cost per Event:** Total Spent / Events Attended

#### **Data Source:**
```
Tables: registrations, tickets, attendance, payments
API Endpoints: /api/registrations, /api/student/events
```

---

### 3. Volunteer Activity Analytics

#### **Metrics Displayed:**

##### **Volunteer Statistics**
- **Total Volunteer Applications:** Count of all applications submitted
- **Accepted Applications:** Applications approved by organizers
- **Pending Applications:** Applications awaiting review
- **Rejected Applications:** Applications declined
- **Acceptance Rate:** (Accepted / Total Applications) × 100%

##### **Volunteer Hours (if tracked)**
- **Total Hours Volunteered:** Sum of logged volunteer hours
- **Events Volunteered:** Count of unique events
- **Average Hours per Event:** Total Hours / Events Volunteered

#### **Data Source:**
```
Tables: volunteer_applications, volunteer_assignments
API Endpoint: /api/volunteer/applications
```

---

### 4. Engagement & Activity Analytics

#### **Metrics Displayed:**

##### **Platform Activity**
- **Events Favorited:** Count of events saved to favorites
- **Colleges Following:** Count of favorite colleges
- **Events Shared:** Count of events shared externally

##### **Interaction Metrics**
- **Sponsor Banner Clicks:** Times student clicked sponsor banners
- **Event Views:** Count of event detail pages viewed
- **Time on Platform:** Session duration tracking

#### **Data Source:**
```
Tables: favorite_events, favorite_colleges, banner_analytics, user_activity_logs
```

---

## Organizer Analytics

**Access:** Organizer Dashboard → Dashboard Tab, Analytics Tab

### 1. Live Snapshot (Real-time Dashboard)

#### **Metrics Displayed:**

##### **Live Event Metrics**
- **Live Events Today:** Count of events happening today
  - **Calculation:** Events where `date = today AND status = 'approved'`
  - **Updates:** Real-time when events start/end

##### **Today's Registrations**
- **Registrations Today:** Count of new registrations created today
  - **Calculation:** `COUNT(registrations WHERE DATE(created_at) = today)`
  - **Breakdown:** By event, by hour, payment status

##### **Revenue Today**
- **Revenue Collected Today:** Sum of successful payments made today
  - **Calculation:** `SUM(payments.amount WHERE status = 'success' AND DATE(created_at) = today)`
  - **Includes:** Event registrations, bulk registrations, late fees

##### **Total Events**
- **Total Events Created:** Lifetime count of all events created by organizer
  - **Breakdown:** Draft, pending approval, approved, completed, cancelled

#### **Data Source:**
```
Tables: events, registrations, payments
Functions: getTodayEvents(), getLiveEvents(), getTotalRegistrationsToday(), getTotalRevenue()
```

#### **Visual Representation:**
- 4 large stat cards with icons
- Hover effects showing trend indicators
- Quick access links to detailed views

---

### 2. Event-Specific Analytics

**Access:** Organizer Dashboard → Select Event → Analytics View

#### **Metrics Displayed:**

##### **Registration Analytics**
- **Total Registrations:** Count of all registrations for the event
- **Confirmed Registrations:** Paid and confirmed participants
- **Pending Payments:** Registrations awaiting payment
- **Cancellations:** Cancelled registrations with refund status
- **Registration Rate:** (Current Registrations / Max Participants) × 100%
- **Waitlist Count:** If event is at capacity

##### **Revenue Analytics**
- **Total Revenue:** Sum of all successful payments
  - **Formula:** `SUM(final_price WHERE payment_status = 'completed')`
- **Expected Revenue:** If all pending payments complete
  - **Formula:** `Total Revenue + SUM(pending payments)`
- **Average Revenue per Participant:** Total Revenue / Confirmed Registrations
- **Discount Usage:**
  - Total discounts given
  - Discount codes used (by type: club member, early bird, bulk)
  - Revenue lost to discounts

##### **Participant Demographics**
- **College Breakdown:** Count by college name
- **Year of Study:** Breakdown by academic year
- **Department/Major:** Breakdown by field of study (if collected)
- **Repeat Participants:** Students who registered for multiple organizer events

##### **Timeline Analytics**
- **Registration Velocity:** Registrations over time (daily/hourly chart)
- **Peak Registration Times:** Busiest hours/days
- **Early Bird vs Last Minute:** Registration timing analysis

#### **Data Source:**
```
Tables: registrations, payments, tickets, users, profiles
API Endpoint: /api/organizer/events/[eventId]/analytics
Function: getEventRegistrations(eventId)
```

---

### 3. Volunteer Management Analytics

**Access:** Organizer Dashboard → Event → Volunteers Tab

#### **Metrics Displayed:**

##### **Volunteer Application Statistics**
- **Total Applications Received:** Count of all volunteer applications
- **Applications by Status:**
  - Pending review
  - Accepted
  - Rejected
- **Response Rate:** (Processed / Total) × 100%

##### **Volunteer Assignments**
- **Total Volunteers Assigned:** Accepted applications with roles
- **Volunteers by Role:** Breakdown by assigned position
- **Volunteer Coverage:** (Assigned / Slots Needed) × 100%

##### **Volunteer Performance (if attendance tracked)**
- **Check-in Rate:** (Volunteers who showed up / Total assigned) × 100%
- **No-shows:** Count of volunteers who didn't attend

#### **Data Source:**
```
Tables: volunteer_applications, volunteer_assignments
API Endpoints: /api/volunteer/applications, /api/organizer/volunteers
```

---

### 4. Attendance & Check-in Analytics

**Access:** Organizer Dashboard → Event → Attendance Management

#### **Metrics Displayed:**

##### **Attendance Tracking**
- **Total Checked In:** Count of participants who scanned QR/checked in
- **Pending Check-ins:** Registered but not yet checked in
- **No-shows:** Registered but never checked in (post-event)
- **Attendance Rate:** (Checked In / Total Registrations) × 100%
- **Walk-ins:** Participants without prior registration (if allowed)

##### **Real-time Flow**
- **Current Attendees:** Live count during event
- **Check-in Rate:** Percentage checked in so far
- **Peak Check-in Time:** Hour with most check-ins

#### **Data Source:**
```
Tables: attendance, registrations, tickets
API Endpoint: /api/attendance
```

---

### 5. Certificate Issuance Analytics

**Access:** Organizer Dashboard → Event → Certificates Tab

#### **Metrics Displayed:**

##### **Certificate Statistics**
- **Certificates Issued:** Total count of certificates sent
- **Certificates by Type:**
  - Participant certificates
  - Volunteer certificates
  - Winner/Award certificates
- **Issuance Rate:** (Issued / Eligible Recipients) × 100%

##### **Certificate Template Usage**
- **Templates Created:** Count of certificate designs
- **Templates Used:** Times each template was used
- **Bulk Issuances:** Count of batch certificate creations

#### **Data Source:**
```
Tables: certificate_templates, student_certificates, certificate_recipients
API Endpoints: /api/organizer/certificate-template/*, /api/certificates/bulk-issue
```

---

### 6. Sponsorship Analytics (for Organizers)

**Access:** Organizer Dashboard → Sponsorships Tab

#### **Metrics Displayed:**

##### **Sponsorship Revenue**
- **Total Sponsorship Revenue:** Sum of all paid sponsorships for events
  - **Formula:** `SUM(sponsorship_orders.amount WHERE status = 'paid' AND event_id = organizer's events)`
- **Pending Sponsorships:** Unpaid sponsorship orders
- **Sponsorships by Pack Type:**
  - Digital packs sold
  - App packs sold  
  - Combo packs sold

##### **Sponsor Engagement**
- **Active Sponsors:** Count of sponsors with ongoing visibility
- **Banner Impressions:** Total views of sponsor banners on event pages
- **Banner Clicks:** Total clicks on sponsor banners
- **Click-through Rate (CTR):** (Clicks / Impressions) × 100%

##### **Payout Analytics**
- **Total Eligible for Payout:** Revenue after Happenin platform commission
  - **Formula:** `Sponsorship Revenue × (1 - platform_commission_rate)`
- **Pending Payouts:** Amount awaiting transfer
- **Paid Out:** Amount already transferred to organizer's bank account
- **Payout Schedule:** Next expected payout date

#### **Data Source:**
```
Tables: sponsorship_orders, sponsorship_payouts, banners, banner_analytics
API Endpoint: /api/sponsorships/track
```

---

### 7. Festival-Level Analytics (Festival Organizers)

**Access:** Festival Dashboard → Analytics Tab

#### **Metrics Displayed:**

##### **Festival Overview**
- **Total Approved Events:** Count of events approved for festival
- **Total Registrations:** Sum of all registrations across festival events
- **Total Revenue:** Sum of revenue from all festival events
- **Total Attendance:** Sum of attendance across all events
- **Unique Participants:** Count of distinct students participating

##### **Category Performance**
- **Category Breakdown:** Events and registrations by category
  - Cultural events
  - Technical events
  - Sports events
  - Other categories
- **Top Performing Category:** Category with highest registrations/revenue

##### **Financial Metrics**
- **Average Revenue per Event:** Total Revenue / Total Events
- **Conversion Rate:** (Total Attendance / Total Registrations) × 100%

##### **Daily Performance (during festival)**
- **Daily Stats:** Day-by-day breakdown of:
  - Events conducted
  - Total attendance
  - Revenue generated
  - Peak attendance times

#### **Data Source:**
```
Tables: festival_submissions, events, registrations, attendance, festival_analytics
API Endpoint: /api/fests/[festId]/analytics
```

#### **Visual Representation:**
- Multi-line chart showing registrations over time
- Category breakdown pie chart
- Revenue trend line graph
- Real-time attendance heatmap

---

## Sponsor Analytics

**Access:** Sponsor Dashboard → Analytics Tab

### 1. Overview Analytics (Default View)

#### **Metrics Displayed:**

##### **Aggregate Performance Metrics**

**Total Impressions:**
- **Definition:** Count of times sponsor banners were viewed
- **Calculation:** `COUNT(banner_analytics WHERE event_type = 'view' AND banner_id IN sponsor's banners)`
- **Breakdown:**
  - Home page banner impressions
  - Event page banner impressions
  - Search results impressions
- **Display:** Large stat card with trend indicator
- **Icon:** Eye icon, blue gradient background

**Total Clicks:**
- **Definition:** Count of times sponsor banners were clicked
- **Calculation:** `COUNT(banner_analytics WHERE event_type = 'click' AND banner_id IN sponsor's banners)`
- **Breakdown:**
  - Clicks by placement (home/event page)
  - Clicks by device type
  - Clicks by time of day
- **Display:** Large stat card with trend indicator
- **Icon:** Mouse pointer icon, purple gradient background

**Total Spent:**
- **Definition:** Sum of all paid sponsorships
- **Calculation:** `SUM(sponsorship_orders.amount WHERE status = 'paid' AND sponsor_email = current_user)`
- **Breakdown:**
  - By pack type (Digital, App, Combo)
  - By event/fest
  - Over time (monthly/yearly)
- **Display:** Large stat card with currency formatting
- **Icon:** Dollar sign icon, green gradient background

**Active Sponsorships:**
- **Definition:** Count of currently active sponsorships with visibility enabled
- **Calculation:** `COUNT(sponsorship_orders WHERE status = 'paid' AND visibility_active = true)`
- **Breakdown:**
  - By event status (upcoming, ongoing, completed)
  - By sponsorship duration remaining
- **Display:** Large stat card
- **Icon:** Trending up icon, orange gradient background

#### **Data Source:**
```
Tables: banners, banner_analytics, sponsorship_orders
API Endpoint: /api/sponsor/analytics
```

---

### 2. Performance Overview (7-Day Trend)

#### **Metrics Displayed:**

##### **Performance Line Chart**
- **X-axis:** Last 7 days (date labels)
- **Y-axis:** Count of events
- **Lines:**
  - **Impressions Line:** Daily impression count (blue line)
  - **Clicks Line:** Daily click count (green line)
- **Tooltips:** Hover to see exact values for each day
- **Legend:** Color-coded line labels

#### **Data Points:**
```javascript
performanceData: [
  { date: "2026-02-09", impressions: 245, clicks: 12 },
  { date: "2026-02-10", impressions: 312, clicks: 18 },
  { date: "2026-02-11", impressions: 289, clicks: 15 },
  { date: "2026-02-12", impressions: 401, clicks: 24 },
  { date: "2026-02-13", impressions: 367, clicks: 21 },
  { date: "2026-02-14", impressions: 428, clicks: 29 },
  { date: "2026-02-15", impressions: 391, clicks: 22 }
]
```

#### **Insights Provided:**
- **Trend Analysis:** Are impressions/clicks increasing or decreasing?
- **Day-of-Week Patterns:** Which days have highest engagement?
- **Click-to-Impression Ratio:** Engagement quality over time

---

### 3. Sponsorship History Timeline

#### **Metrics Displayed:**

##### **Chronological Sponsorship List**
For each sponsorship:
- **Event/Fest Name:** Title of sponsored entity
- **Pack Type:** Digital, App, or Combo
- **Amount Paid:** Total sponsorship cost
- **Date Purchased:** Timestamp of order creation
- **Status Badge:** 
  - Green: Paid & Active
  - Yellow: Paid & Completed
  - Gray: Pending Payment

##### **Timeline Visualization**
- Vertical timeline with dots
- Color-coded by status
- Newest sponsorships at top
- Click to view full sponsorship details

#### **Data Source:**
```
Tables: sponsorship_orders, events, fests
Query: All orders for sponsor, ordered by created_at DESC
```

---

### 4. Event-wise Analytics (Detailed Breakdown)

**Access:** Analytics Tab → Events Sub-tab

#### **Metrics Displayed:**

##### **Performance Table**
Columns displayed:
1. **Event Name:** Click to go to event details
2. **Pack Type:** Digital/App/Combo badge
3. **Impressions:** Total banner views for this event
4. **Clicks:** Total banner clicks for this event
5. **CTR (Click-Through Rate):** (Clicks / Impressions) × 100%
6. **Amount Paid:** Sponsorship cost (₹)

##### **Sample Data:**
```
Event Name                     | Pack   | Impressions | Clicks | CTR    | Amount
-------------------------------|--------|-------------|--------|--------|----------
TechFest 2026 Hackathon       | Combo  | 1,234       | 67     | 5.43%  | ₹15,000
Cultural Night 2026           | App    | 892         | 42     | 4.71%  | ₹10,000
Sports Fest Opening Ceremony  | Digital| 567         | 18     | 3.17%  | ₹5,000
```

##### **Sortable Columns:**
- Sort by impressions (highest to lowest)
- Sort by CTR (most engaging)
- Sort by amount (highest investment)

##### **Performance Indicators:**
- **High CTR (>5%):** Green highlight
- **Medium CTR (3-5%):** Yellow highlight
- **Low CTR (<3%):** Red highlight

#### **Data Source:**
```
Tables: sponsorship_orders, banners, banner_analytics, events, fests
API Endpoint: /api/sponsor/analytics
Query: Group analytics by event_id, aggregate impressions/clicks
```

---

### 5. Reports Generation (Custom Analytics)

**Access:** Analytics Tab → Reports Sub-tab

#### **Report Types Available:**

##### **1. Sponsorship Summary Report**
- **Date Range:** Custom from/to dates
- **Contents:**
  - Total orders placed
  - Total amount spent
  - Pack type breakdown
  - Status breakdown
  - Full order list with details
- **Export Formats:** PDF, CSV, JSON

##### **2. Performance Report**
- **Date Range:** Custom from/to dates
- **Contents:**
  - Total impressions in period
  - Total clicks in period
  - Average CTR
  - Day-by-day performance data
  - Peak performance days
  - Engagement trends
- **Export Formats:** PDF (with charts), CSV (raw data)

##### **3. Budget Report**
- **Date Range:** Custom from/to dates
- **Contents:**
  - Total spending
  - Breakdown by event
  - Breakdown by pack type
  - Cost per impression
  - Cost per click (CPC)
  - ROI indicators
- **Export Formats:** PDF, Excel

##### **4. Event Comparison Report**
- **Multiple Events:** Select 2+ events to compare
- **Contents:**
  - Side-by-side performance metrics
  - Impressions comparison
  - Clicks comparison
  - CTR comparison
  - Cost comparison
  - Engagement quality scores
- **Export Formats:** PDF (with comparison charts)

#### **Data Source:**
```
API Endpoint: /api/sponsor/reports?from=YYYY-MM-DD&to=YYYY-MM-DD
Tables: sponsorship_orders, banners, banner_analytics
Return Format: JSON or file download (PDF/CSV)
```

#### **Report Generation Flow:**
1. User selects report type
2. User specifies date range or events
3. System queries database for relevant data
4. System aggregates and calculates metrics
5. System generates formatted report
6. User downloads or views report

---

### 6. Return on Investment (ROI) Metrics

#### **Metrics Displayed:**

##### **Cost Efficiency**
- **Cost per Impression (CPM):** (Total Spent / Total Impressions) × 1000
  - Industry benchmark comparison
- **Cost per Click (CPC):** Total Spent / Total Clicks
  - Indication of engagement value
- **Engagement Quality Score:** Weighted score based on CTR and interaction depth

##### **Visibility Score**
- **Reach:** Total unique users who saw banners
- **Frequency:** Average impressions per user
- **Placement Performance:** Which placements performed best (home vs event page)

##### **Conversion Potential**
- **Click Rate:** Likelihood of impression leading to click
- **Referral Traffic:** Users who visited sponsor website from banner (if tracked)
- **Brand Recall:** Survey-based metric (if available)

---

## Admin Analytics

**Access:** Admin Dashboard → Analytics Section

### 1. Platform Dashboard Metrics

#### **Metrics Displayed:**

##### **Financial Overview**

**Total Revenue:**
- **Definition:** Sum of all successful payments across platform
- **Calculation:** `SUM(payments.amount WHERE status = 'success')`
- **Breakdown:**
  - Student event registrations
  - Bulk team registrations
  - Late registration fees
  - DOES NOT include sponsorship revenue (tracked separately)
- **Time Period:** Lifetime total with monthly/yearly filters
- **Display:** Large stat card with trend graph

**Total Sponsorship Revenue:**
- **Definition:** Sum of all paid sponsorship orders
- **Calculation:** `SUM(sponsorship_orders.amount WHERE status = 'paid')`
- **Breakdown:**
  - By pack type (Digital, App, Combo)
  - By event vs fest sponsorships
  - By organizer/college
- **Commission Tracking:** Platform's share vs organizer's share

**Total Platform Earnings:**
- **Definition:** Platform's commission from sponsorships
- **Calculation:** `SUM(sponsorship_payouts.platform_fee)`
- **Commission Rate:** Typically 10-20% of sponsorship amount
- **Display:** Highlighted card showing platform profit

**Total Paid to Organizers:**
- **Definition:** Amount transferred to organizers from sponsorships
- **Calculation:** `SUM(sponsorship_payouts.payout_amount WHERE payout_status = 'paid')`
- **Pending vs Paid:** Visual breakdown
- **Payment Methods:** Bank transfer, UPI breakdown

##### **Transaction Metrics**

**Total Transactions:**
- **Definition:** Count of all successful payment transactions
- **Calculation:** `COUNT(payments WHERE status = 'success')`
- **Average Transaction Value:** Total Revenue / Total Transactions
- **Transaction Types:**
  - Individual registrations
  - Bulk/team registrations
  - Sponsorship payments

##### **User Metrics**

**Total Users:**
- **Definition:** Count of all registered users across all roles
- **Calculation:** `COUNT(users)`
- **Role Breakdown:**
  - Students
  - Organizers
  - Sponsors
  - Admins
- **Active vs Inactive:** Users who logged in within last 30 days

**Total Events:**
- **Definition:** Count of all events created on platform
- **Calculation:** `COUNT(events)`
- **Status Breakdown:**
  - Draft
  - Pending approval
  - Approved
  - Completed
  - Cancelled
- **Category Distribution:** Events by category type

##### **Pending Actions**

**Pending Payouts Count:**
- **Definition:** Count of organizer payouts awaiting processing
- **Calculation:** `COUNT(sponsorship_payouts WHERE payout_status = 'pending')`
- **Total Pending Amount:** Sum of unprocessed payouts
- **Urgency Indicators:** Color-coded by how long pending
- **Quick Action:** Link to process payouts

#### **Data Source:**
```
Library Function: getDashboardMetrics()
Tables: payments, sponsorship_orders, sponsorship_payouts, users, events
API Endpoint: /api/admin/dashboard
File: frontend/src/lib/admin.ts
```

---

### 2. User Growth Analytics

**Access:** Admin Dashboard → Analytics → User Growth

#### **Metrics Displayed:**

##### **Growth Trends (30/60/90 Day Views)**

**Daily New Users:**
- **Chart Type:** Line graph
- **X-axis:** Date
- **Y-axis:** Count of new users
- **Data Points:** User signups grouped by date
- **Calculation:** `COUNT(users WHERE DATE(created_at) = specific_date)`

##### **Growth Rate Calculation**
- **Week-over-Week Growth:** % change in signups
- **Month-over-Month Growth:** % change in signups
- **Growth Acceleration:** Whether growth is speeding up or slowing

##### **User Acquisition Channels (if tracked)**
- **Direct Signups:** Users who found platform directly
- **Referrals:** Users referred by existing users
- **Social Media:** If signed up via social login
- **College Partnerships:** Bulk onboarding from colleges

##### **Demographic Insights**
- **Top Colleges:** Colleges with most user signups
- **Geographic Distribution:** Users by location/region
- **Role Distribution Over Time:** How role mix is changing

#### **Data Source:**
```
Library Function: getUserGrowthAnalytics(days: number)
Tables: users, profiles
Query: SELECT created_at FROM users WHERE created_at >= (current_date - days)
```

---

### 3. Event Performance Metrics

**Access:** Admin Dashboard → Analytics → Event Performance

#### **Metrics Displayed:**

##### **Top Performing Events Table**

For each event:
1. **Event Title:** Name of event
2. **Organizer:** Who created the event
3. **Registration Count:** Total registrations
4. **Max Registrations:** Capacity limit
5. **Registration Rate:** (Registrations / Max) × 100%
6. **Revenue:** Total revenue generated (₹)
7. **Avg Revenue per Registration:** Revenue / Registrations
8. **Performance Score:** Calculated ranking metric

##### **Performance Indicators**
- **Sold Out Events:** 100% registration rate
- **High Performers:** >80% registration rate
- **Underperforming:** <30% registration rate
- **Revenue Champions:** Highest total revenue

##### **Sorting & Filtering**
- Sort by revenue (highest earners first)
- Sort by registrations (most popular)
- Sort by registration rate (most successful)
- Filter by date range
- Filter by category
- Filter by college

##### **Insights Generated**
- **Average Registration Rate Across Platform:** Benchmark metric
- **Revenue Per Event Average:** Platform-wide average
- **Most Popular Event Categories:** Categories with highest engagement
- **Seasonal Trends:** Event performance by time of year

#### **Data Source:**
```
Library Function: getEventPerformanceMetrics()
Tables: events, registrations, payments
Query: Complex join with aggregations
Return: Array of event metrics sorted by revenue
```

---

### 4. Revenue Analytics (Date Range)

**Access:** Admin Dashboard → Analytics → Revenue

#### **Metrics Displayed:**

##### **Revenue Over Time Chart**
- **Chart Type:** Area chart or line graph
- **X-axis:** Date (daily, weekly, or monthly buckets)
- **Y-axis:** Revenue amount (₹)
- **Multiple Series:**
  - Event registration revenue (blue)
  - Sponsorship revenue (green)
  - Total revenue (purple, combined)

##### **Revenue Breakdown**
- **By Event Category:**
  - Cultural events revenue
  - Technical events revenue
  - Sports events revenue
  - Other categories
- **By College:** Revenue generated by organizers from each college
- **By Payment Method:** UPI, Cards, Net Banking, etc.

##### **Economic Indicators**
- **Average Daily Revenue:** Total / Days in period
- **Peak Revenue Day:** Date with highest revenue
- **Revenue Growth Rate:** % change over periods
- **Revenue Forecast:** Projected future revenue based on trends

##### **Comparative Analysis**
- **Year-over-Year Comparison:** Current vs previous period
- **Month-over-Month Trends:** Seasonal patterns
- **Event Impact:** Revenue spikes correlated with major events

#### **Data Source:**
```
Library Function: getRevenueAnalytics(startDate: Date, endDate: Date)
Tables: payments
Query: SELECT amount, created_at WHERE status = 'success' AND created_at BETWEEN startDate AND endDate
```

---

### 5. Admin Action Logs & Audit Trail

**Access:** Admin Dashboard → System → Logs

#### **Metrics Displayed:**

##### **Action Log Table**
Columns:
1. **Timestamp:** When action occurred
2. **Admin User:** Email of admin who performed action
3. **Action Type:** What was done
   - Event approved/rejected
   - User role changed
   - Payout processed
   - Banner moderated
   - System setting changed
4. **Resource Type:** What was affected (event, user, payout, etc.)
5. **Resource ID:** Specific ID of affected resource
6. **Details:** JSON object with action specifics
7. **IP Address:** Admin's IP for security audit

##### **Action Categories**
- **Content Moderation:** Event approvals, banner reviews
- **Financial:** Payout processing, refunds
- **User Management:** Role changes, account actions
- **System:** Configuration changes, feature toggles

##### **Audit Features**
- **Immutable Logs:** Cannot be deleted or modified
- **Full History:** All admin actions preserved
- **Search & Filter:** Find specific actions
- **Export:** Download logs for compliance

##### **Security Monitoring**
- **Unusual Activity Detection:** Flagged suspicious actions
- **Access Patterns:** Which admins are most active
- **High-Risk Actions:** Sensitive operations highlighted

#### **Data Source:**
```
Library Function: getAdminLogs(limit: number, offset: number)
Tables: admin_logs
Query: SELECT * ORDER BY created_at DESC LIMIT/OFFSET
Note: Immutable table, no updates or deletes allowed
```

---

### 6. Platform Health Metrics

#### **Metrics Displayed:**

##### **System Performance**
- **Total Active Users (Last 30 Days):** Users who logged in
- **Average Session Duration:** Time spent on platform
- **Bounce Rate:** Users who left immediately
- **Page Load Times:** Performance metrics
- **API Response Times:** Backend health

##### **Content Metrics**
- **Total Events (Lifetime):** All events created
- **Events This Month:** Recent activity
- **Average Events per Organizer:** Engagement depth
- **Event Approval Rate:** % of events approved vs rejected
- **Event Completion Rate:** % of events that actually happened

##### **Financial Health**
- **Payment Success Rate:** % of payment attempts that succeed
- **Average Transaction Value:** Platform spending per user
- **Revenue per User:** Total revenue / Total users
- **Sponsorship Conversion Rate:** % of sponsorship inquiries that convert

##### **User Engagement**
- **Daily Active Users (DAU):** Unique logins per day
- **Monthly Active Users (MAU):** Unique logins per month
- **Stickiness Ratio:** DAU / MAU (engagement quality)
- **User Retention Rate:** % of users who return after signup

---

## Festival Analytics

**Access:** Festival Dashboard → Analytics Tab (Festival Members Only)

### Comprehensive Festival Metrics

#### **Metrics Displayed:**

##### **1. Festival Overview**

**Total Approved Events:**
- **Definition:** Count of events approved to be part of festival
- **Calculation:** `COUNT(festival_submissions WHERE fest_id = X AND submission_status = 'approved')`
- **Categories:** Breakdown by event category (cultural, technical, sports)
- **Status:** Ongoing vs completed events

**Total Registrations:**
- **Definition:** Sum of all registrations across all festival events
- **Calculation:** `SUM(registrations WHERE event_id IN festival_event_ids)`
- **Trend:** Registration velocity over festival submission period
- **Peak Days:** Days with highest registration activity

**Total Revenue:**
- **Definition:** Sum of revenue from all festival events
- **Calculation:** Sum of all successful payments for festival events
- **Per-Event Breakdown:** Revenue by each event
- **Top Revenue Generators:** Events contributing most revenue

**Total Attendance:**
- **Definition:** Sum of all attendance records across festival
- **Calculation:** `SUM(attendance WHERE event_id IN festival_event_ids)`
- **Real-time (during festival):** Live attendance counts
- **Attendance Rate:** (Total Attendance / Total Registrations) × 100%

**Unique Participants:**
- **Definition:** Count of distinct students participating in festival
- **Calculation:** `COUNT(DISTINCT user_email FROM registrations WHERE event_id IN festival_events)`
- **Engagement Depth:** How many events each participant attended
- **Repeat Participation:** Students attending multiple events

##### **2. Category Performance**

**Category Breakdown:**
```
Category        | Events | Registrations | Revenue   | Attendance | Avg per Event
----------------|--------|---------------|-----------|------------|---------------
Cultural        | 8      | 450           | ₹67,500   | 412        | 56 reg/event
Technical       | 6      | 320           | ₹96,000   | 298        | 53 reg/event
Sports          | 5      | 280           | ₹28,000   | 265        | 56 reg/event
Workshop        | 4      | 180           | ₹54,000   | 175        | 45 reg/event
Other           | 2      | 85            | ₹8,500    | 78         | 42 reg/event
```

**Top Performing Category:**
- **By Registrations:** Category with most participants
- **By Revenue:** Category generating most money
- **By Attendance Rate:** Category with best turnout

##### **3. Financial Metrics**

**Average Revenue per Event:**
- **Calculation:** Total Revenue / Total Approved Events
- **Benchmark:** Compare against individual event averages
- **High/Low Performers:** Events above/below average

**Conversion Rate:**
- **Definition:** Percentage of registrations that led to actual attendance
- **Calculation:** (Total Attendance / Total Registrations) × 100%
- **Target:** Aim for >80% conversion rate
- **Factors Affecting:** Weather, scheduling conflicts, satisfaction

**Festival ROI (for organizers):**
- **Investment:** Cost to organize festival (if tracked)
- **Returns:** Total revenue generated
- **Net Profit:** Revenue - Costs
- **Sponsorship Contribution:** How much from sponsors vs registrations

##### **4. Daily Performance Stats (During Festival)**

**Day-by-Day Breakdown:**
```
Date       | Events | Attendance | Revenue   | Peak Hour
-----------|--------|------------|-----------|------------
Feb 10     | 3      | 215        | ₹32,250   | 2:00 PM
Feb 11     | 5      | 387        | ₹58,050   | 10:00 AM
Feb 12     | 4      | 298        | ₹44,700   | 3:00 PM
Feb 13     | 6      | 425        | ₹63,750   | 11:00 AM
Feb 14     | 7      | 510        | ₹76,500   | 1:00 PM
```

**Insights:**
- **Busiest Day:** Day with most events/attendance
- **Highest Revenue Day:** Day generating most income
- **Peak Times:** Hours with maximum activity
- **Event Scheduling Optimization:** Best times for events

##### **5. Participant Analytics**

**Engagement Metrics:**
- **Single-Event Participants:** Attended only 1 event
- **Multi-Event Participants:** Attended 2+ events
- **Super Participants:** Attended 5+ events
- **Average Events per Participant:** Total Attendance / Unique Participants

**Demographics:**
- **College-wise Participation:** Top participating colleges
- **Year-wise Breakdown:** Which academic years participated most
- **Department Distribution:** Participation by field of study

##### **6. Festival Health Score**

**Composite Score (0-100):**
- **Registration Health (30%):** % of events with good registrations
- **Attendance Quality (30%):** Conversion rate score
- **Revenue Performance (20%):** Compared to targets
- **Event Variety (10%):** Diversity of event categories
- **Participant Satisfaction (10%):** Based on engagement metrics

**Performance Indicators:**
- **90-100:** Excellent festival performance
- **70-89:** Good performance, minor improvements needed
- **50-69:** Average performance, needs attention
- **<50:** Poor performance, major issues

#### **Data Source:**
```
Tables: festival_submissions, events, registrations, attendance, festival_analytics
API Endpoint: /api/fests/[festId]/analytics
Query: Multi-table joins with complex aggregations
Caching: Results saved to festival_analytics table
```

#### **Analytics Refresh:**
- **Real-time During Festival:** Updates every 5 minutes
- **Pre/Post Festival:** Updates once daily
- **Manual Refresh:** Admin can trigger recalculation

---

## Data Sources & Calculation Methods

### Database Tables Used

#### **Primary Analytics Tables:**

1. **banner_analytics**
   - Tracks: Banner impressions and clicks
   - Fields: banner_id, event_type (view/click), user_email, created_at
   - Used by: Sponsor analytics, Organizer sponsorship analytics

2. **festival_analytics**
   - Tracks: Aggregated festival metrics
   - Fields: fest_id, total_events, total_registrations, total_revenue, calculated_at
   - Used by: Festival analytics dashboard

3. **admin_logs**
   - Tracks: All admin actions (immutable)
   - Fields: admin_email, action, resource_type, resource_id, details, ip_address
   - Used by: Admin audit trail

#### **Transactional Tables:**

4. **payments**
   - Records: All payment transactions
   - Fields: id, amount, status, created_at, event_id, user_email
   - Used by: Revenue calculations across all roles

5. **registrations**
   - Records: Event registrations
   - Fields: id, event_id, user_email, payment_status, final_price, created_at
   - Used by: Registration counts, attendance rates

6. **attendance**
   - Records: Actual event attendance (check-ins)
   - Fields: id, event_id, user_email, checked_in_at
   - Used by: Attendance analytics, conversion rates

7. **sponsorship_orders**
   - Records: Sponsorship purchases
   - Fields: id, sponsor_email, event_id, amount, status, pack_type
   - Used by: Sponsor analytics, Organizer revenue, Admin metrics

8. **sponsorship_payouts**
   - Records: Payouts to organizers from sponsorships
   - Fields: id, order_id, gross_amount, platform_fee, payout_amount, payout_status
   - Used by: Admin financial tracking, Organizer earnings

9. **student_certificates**
   - Records: Certificates issued to students
   - Fields: id, student_email, certificate_type, event_id, sent_date
   - Used by: Student achievement analytics

10. **volunteer_applications**
    - Records: Volunteer applications
    - Fields: id, event_id, student_email, status (pending/accepted/rejected)
    - Used by: Organizer volunteer analytics, Student volunteer stats

---

### Calculation Formulas Reference

#### **Rate & Percentage Calculations:**

**Registration Rate:**
```
(Current Registrations / Max Participants) × 100%
```

**Attendance Rate:**
```
(Actual Attendance / Total Registrations) × 100%
```

**Click-Through Rate (CTR):**
```
(Total Clicks / Total Impressions) × 100%
```

**Conversion Rate:**
```
(Desired Action Count / Total Opportunity Count) × 100%
```

**Volunteer Acceptance Rate:**
```
(Accepted Applications / Total Applications) × 100%
```

#### **Financial Calculations:**

**Total Revenue:**
```
SUM(payments.amount WHERE status = 'success')
```

**Average Revenue per Participant:**
```
Total Revenue / Total Confirmed Registrations
```

**Platform Commission:**
```
Sponsorship Amount × Commission Rate (typically 10-20%)
```

**Organizer Payout:**
```
Sponsorship Amount - Platform Commission
```

**Cost per Impression (CPM):**
```
(Total Spent / Total Impressions) × 1000
```

**Cost per Click (CPC):**
```
Total Spent / Total Clicks
```

#### **User Engagement Calculations:**

**Stickiness Ratio:**
```
Daily Active Users / Monthly Active Users
```

**User Retention Rate:**
```
(Users who returned / Total new signups) × 100%
```

**Average Events per Participant:**
```
Total Attendance Records / Unique Participants
```

**Average Session Duration:**
```
SUM(logout_time - login_time) / Total Sessions
```

---

### Real-time vs Cached Analytics

#### **Real-time Analytics (Query on Demand):**
- Live event counts (today's events, live events)
- Current attendance during events
- Real-time registration counts
- Banner click/impression tracking
- Admin dashboard quick stats

**Performance:** Sub-second query times
**Update Frequency:** Instant (on page load)

#### **Cached/Pre-calculated Analytics:**
- Festival analytics (saved to festival_analytics table)
- Complex event performance metrics
- Historical revenue trends
- User growth charts

**Performance:** Instant (read from cache)
**Update Frequency:** Daily or triggered manually
**Benefit:** Faster load times for complex calculations

---

### API Response Formats

#### **Standard Analytics Response:**

```json
{
  "success": true,
  "analytics": {
    "totalClicks": 234,
    "totalImpressions": 5678,
    "performanceData": [
      { "date": "2026-02-09", "impressions": 245, "clicks": 12 },
      { "date": "2026-02-10", "impressions": 312, "clicks": 18 }
    ],
    "eventAnalytics": [
      {
        "eventName": "TechFest 2026",
        "packType": "combo",
        "impressions": 1234,
        "clicks": 67,
        "amount": 15000
      }
    ]
  },
  "timestamp": "2026-02-15T10:30:00Z"
}
```

#### **Error Response:**

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to view analytics",
  "status": 401
}
```

---

### Data Privacy & Access Control

#### **Role-Based Access:**

**Students:**
- Can only see their own data
- No access to other students' analytics
- Cannot see platform-wide metrics

**Organizers:**
- Can see analytics for their own events
- Can see aggregated participant data (not individual)
- Can see sponsorship analytics for their events
- Cannot see other organizers' data

**Sponsors:**
- Can see analytics for their own sponsorships
- Can see banner performance data
- Cannot see individual user behavior (only aggregates)
- Cannot see other sponsors' data

**Admins:**
- Can see all platform-wide analytics
- Can view aggregated data for all roles
- Can access audit logs
- Cannot see sensitive personal data without reason

#### **Data Anonymization:**

- **User Emails:** Hashed in analytics exports
- **IP Addresses:** Logged for admins only (security)
- **Personal Info:** Not included in analytics APIs
- **Aggregation Threshold:** Minimum 10 records before showing breakdowns

---

## Summary

This analytics system provides comprehensive insights across all roles:

- **Students:** Track participation, achievements, and event history
- **Organizers:** Monitor event performance, revenue, registrations, and attendance
- **Sponsors:** Measure sponsorship ROI through impressions, clicks, and engagement
- **Admins:** Oversee platform health, revenue, growth, and system performance
- **Festivals:** Aggregate multi-event analytics for festival-wide insights

All analytics are:
- **Real-time or near-real-time** for operational decisions
- **Role-based** for privacy and security
- **Exportable** for external analysis and reporting
- **Actionable** with clear insights and benchmarks

---

**Document Version:** 1.0  
**Last Updated:** February 17, 2026  
**Maintained By:** Happenin Engineering Team  
**Questions?** Contact: dev@happenin.in
