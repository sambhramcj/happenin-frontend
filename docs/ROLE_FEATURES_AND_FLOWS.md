# ROLE_FEATURES_AND_FLOWS.md

> **Status:** Production System Documentation  
> **Last Updated:** March 3, 2026  
> **Purpose:** End-to-end role coverage for testing and verification (tabs, pages, buttons, and flows)

## Implementation Delta (Mar 3, 2026)

- Mobile event/fest cards are compacted globally using shared classes:
  - `.mobile-card-compact` → card width ~10.5rem on mobile
  - `.mobile-card-compact-content` → reduced card body padding on mobile
- Compact card behavior applies to both pre-login pages (home/events) and authenticated pages (student dashboard home/fests sections).
- Landing header branding uses logo + wordmark asset instead of plain text title.
- Landing footer links are: About, Privacy, Terms, Contact.
- Installed PWA startup uses a single white branded splash screen.

---

## 1. Global Header Layout

**Header Components (Present on all authenticated pages):**
- **Left Side**: Happenin full logo (clickable, navigates to role dashboard).
- **Right Side**:
  - **Theme Toggle**: Light/Dark mode toggle button.
  - **Notification Bell**: Shows unread notification count badge; opens notification panel on click.

---

## 2. Roles Overview

**Roles in app:**
- **Student**: Discover, register, attend events, volunteer, and manage profile.
- **Organizer**: Create/manage events, volunteers, certificates, registrations, analytics, sponsorships.
- **Admin**: Platform analytics, payments, users, sponsorship approvals, payouts, reports, disputes.
- **Sponsor**: Discover events, purchase visibility packs (Razorpay), upload banners.

**Role routing:**
- Logged-in users are routed to their dashboard by role (student/organizer/admin/sponsor).
- Access is enforced via server APIs (not only UI).

---

## 3. Student Role

### Dashboard Route
- **Path:** `/dashboard/student`
- **Tabs:** `Home`, `Explore`, `My Events`, `Volunteer`, `Profile`
- **Mobile:** Bottom navigation mirrors the same tabs.

### Home Tab
**Purpose:** Quick discovery of hot events and immediate registration.

**Header Elements:**
- **College Selector Dropdown**: Displays logged-in student's college name (selected during registration). **Dropdown action**: Click to change college and see events filtered by selected college. Can switch colleges anytime.

**Event Card Structure (All Sections):**
- **Poster Image**: Event banner/cover image (clickable)
- **Event Name**: Title of the event
- **Organized By**: College/Organizer name
- **Date**: Event date and time
- **Register Now Button**: Trigger registration flow

*(All other details (description, price, prize pool, timeline, etc.) are shown in the Event Details Page)*

**Sections:**

#### Top Banner Carousel (Hero)
- **Placement**: First section below the navbar.
- **Layout**: Full-width carousel, each slide is one complete banner image.
- **Data Source**: `home_banners` table (Supabase).
- **Filter Rules**:
  - `is_active = true`
  - `start_date <= today <= end_date` (if dates exist)
  - Order by `priority` ascending
- **Behavior**:
  - Autoplay every 4 seconds
  - Smooth slide transition
  - Left/Right arrows
  - Pagination dots
  - Pause on hover (desktop only)
- **Click Behavior**:
  - If `redirect_url` exists -> open link
  - Otherwise -> no-op
- **Visual Specs**:
  - Mobile: height 200px, full width, radius 16px, object-fit cover
  - Desktop: height 380px, max width 1280px centered, radius 20px
  - Overlay gradient: black/40 to transparent at bottom (for future text)

#### Trending Now – Top 5 Events by Registrations
- **Section Title**: "🔥 Trending in Your College"
- **Data Source**: `events` + `registrations` (Supabase)
- **Query Rules**:
  - Only `events.is_published = true`
  - Count `registrations` with `status = confirmed`
  - Group by `event_id`
  - Sort by registration count DESC
  - Limit 5
  - Filter by selected college (current college selector)
- **Layout**:
  - **Top Row (Logo Strip)**: 5 circular logos (event logo thumbnail)
  - **Bottom Row (Carousel)**: Horizontal scrollable event cards
- **Top Row Behavior**:
  - Logos are horizontally scrollable on mobile
  - Clicking a logo scrolls to its matching event card
- **Event Card Design**:
  - Banner image (16:9)
  - Event title (max 2 lines, truncate)
  - Date (formatted)
  - Price badge: Free or ₹X
  - **Register Now** button
- **Mobile Specs**:
  - Logo size: 56px x 56px, fully rounded
  - Card width: 280px, snap scroll, gap 16px
  - Card radius: 20px, shadow-md
- **Desktop Specs**:
  - Container max width: 1280px centered
  - Logo size: 64px
  - Card width: 320px
- **Interactions**:
  - Card click -> `/events/[id]`
  - Smooth scroll on logo click
  - Hover lift effect on desktop (200ms ease)
- **Empty State**:
  - If no events, hide section

#### Sponsor Spotlight
- **Section Title**: "✨ Sponsored Events"
- **Visibility شرط**: Render only if a sponsor has 3+ active sponsored events
- **Data Source**: `sponsors_profile`, `sponsorship_deals`, `events` (Supabase)
- **Qualification Rules**:
  - `sponsorship_deals.payment_status = verified`
  - `sponsorship_deals.visibility_active = true`
  - `visibility_end_date >= now`
  - Group by `sponsor_id`, count sponsored events
  - Show sponsor with highest event count first (if multiple)
- **Layout**:
  - **Top Banner**: Sponsor banner with logo + "Sponsored by {company_name}"
  - **Bottom Carousel**: Horizontal scroll of the sponsored events
- **Banner Specs**:
  - Aspect ratio 16:6 (wide)
  - Border radius 24px
  - Overlay gradient: dark-left → transparent-right
  - Subtle shimmer animation on banner
- **Event Card Specs**:
  - Banner image, title, date, price badge
  - Small "Sponsored" tag
  - **Register** button
  - Mobile width 280px, desktop width 320px
  - Rounded-xl, shadow-md, hover lift on desktop
- **Behavior**:
  - Carousel snap scroll
  - If no sponsor qualifies, section hidden
- **Security**:
  - Never show unpaid sponsors
  - Never show sponsors outside active date range

#### 🔥 Featured Events (Boosted Visibility)
- **Section Title**: "🔥 Featured Events"
- **Placement**: Below Sponsor Spotlight, above category sections
- **Business Logic**: Organizer-paid visibility boost (not sponsorship)
- **Data Source**: `events` (Supabase)
- **Filter Rules**:
  - `is_published = true`
  - `boost_visibility = true`
  - `boost_payment_status = paid`
  - `boost_end_date >= today`
- **Sort Order**:
  - `boost_priority` DESC
  - `start_date` ASC
- **Limit**: 10 events max
- **Layout**:
  - Horizontal premium carousel
  - Title row includes a small **View All** link
- **Mobile Specs**:
  - Card width 260px, gap 16px, snap scroll
  - No arrows
- **Desktop Specs**:
  - Card width 300px, gap 24px
  - Arrows enabled
- **Card Design**:
  - Rounded-2xl, shadow-lg, subtle glow border
  - Banner image (4:5)
  - Gold gradient **FEATURED** badge (top-left)
  - Event title, date, price
  - **Register** button
- **Animations**:
  - Fade-in on load
  - Hover scale 1.03 (desktop only)
  - 200ms smooth transition
- **Empty State**:
  - If no boosted events, hide section
- **Constraints**:
  - Do not show unpaid boosts
  - Do not show expired boosts

#### Fest Discovery Block
- **Purpose**: Promote a single active fest with category filtering.
- **Placement**: Below Featured Events, above Handpicked/Recommended sections
- **Data Sources**: `fests`, `events` (Supabase)
- **Fest Query Rules**:
  - `fests.is_active = true`
  - `start_date <= today <= end_date`
  - If no active fest, hide section
- **Event Query Rules**:
  - `events.fest_id = active_fest.id`
  - `events.is_published = true`
  - Sort by `start_date` ASC
  - If fest has no events, hide section
- **Layout**:
  - **Fest Logo Area**:
    - Centered PNG logo (transparent)
    - Max height: 80px mobile, 120px desktop
    - Fest name below logo (bold, large)
  - **Category Filters**:
    - Buttons: Hackathon, Cultural, Games, Competitions, Seminar
    - Mobile: horizontal scroll, height 40px, rounded-full
    - Desktop: inline row, gap 16px
    - Active: primary background + white text
    - Inactive: light gray background + dark text
  - **Event Grid (filtered)**:
    - Mobile: 2 columns, gap 12px
    - Desktop: 4 columns, gap 24px
    - Cards: aspect 4:5, rounded-xl, shadow-sm
    - Hover: scale 1.02 on desktop
    - Card content: banner, title, date, price, **Register** button
- **State Management**:
  - Client component handles category switching
  - Default category = first category with events
  - Smooth fade transition on category change
  - No full page reload
- **Design Rules**:
  - Clean white background
  - Premium fest logo presentation
  - Event-focused, no marketplace styling

#### Global Event Category Strip
- **Purpose**: Quick access to broad event categories across all colleges and fests.
- **Placement**: Below Fest Discovery Block, above Upcoming Events section
- **Data Source**: `events` (Supabase)
- **Categories**: hackathon, cultural, competitions, seminar, sports, workshop, tech
- **Section Header**:
  - Left: "Browse by Category"
  - Right: "See All" -> `/explore?category=all`
- **Layout**:
  - Mobile: horizontal scroll row, 100px container height, gap 12px, px-4
  - Desktop: grid with 4-6 items per row, gap 24px
- **Card Design**:
  - Mobile width 120px, height 100px
  - Rounded-xl, shadow-sm
  - Hover: shadow-md + scale 1.03 (desktop only)
  - Subtle light accent gradient background per category (no harsh gradients)
  - Icon/image placeholder + category name text
- **Interaction**:
  - Click category -> navigate to `/explore?category={selectedCategory}`
  - No inline filtering on homepage
- **Animation**:
  - Fade-in on section load
  - Subtle hover motion (desktop only)
- **Empty State**:
  - Always show category cards, even if no events currently exist

#### Upcoming Events (Horizontal Scroll)
- **Purpose**: Show next 10 upcoming events for the selected college.
- **Placement**: Below Global Event Category Strip, above Recommended sections
- **Data Source**: `events` (Supabase)
- **Filter Rules**:
  - `college_id = selected_college`
  - `is_published = true`
  - `start_date >= today`
  - Exclude events already ended
- **Sort**: `start_date` ASC
- **Limit**: 10 events
- **Section Header**:
  - Left: "Upcoming Events"
  - Right: "View All" -> `/explore?filter=upcoming`
- **Layout**:
  - Mobile: horizontal scroll, card width 260px, height 320px, gap 16px, px-4, snap scroll
  - Desktop: horizontal scroll, card width 300px, gap 24px
- **Card Design**:
  - Rounded-2xl, shadow-sm, white background
  - Hover: shadow-lg + scale 1.02 (desktop only)
  - Banner image (top 65%), rounded top corners, object-cover, height 200px
  - Category badge (top-right, small pill, light background, uppercase)
  - Title (font-semibold, clamp 2 lines, primary text)
  - Date: format "12 Feb 2026 · 5:00 PM"
  - Price row: FREE (green) or ₹X (bold)
  - **Register** button (primary, rounded-lg)
- **Register Button Behavior**:
  - Not logged in -> redirect `/auth`
  - Logged in -> trigger existing registration/payment flow
  - Already registered -> show "Registered" badge
- **Animation**:
  - Cards fade + slide up on first load
  - Stagger animation
- **Empty State**:
  - "No upcoming events yet" + Explore button
- **Performance**:
  - Fetch only 10 events
  - No heavy client-side filtering

#### Recommended For You
- **Purpose**: Personalized event recommendations based on memberships, past registrations, and college trends.
- **Placement**: Below Upcoming Events, above Top 10 Events
- **Visibility**:
  - Hide section if user not logged in
  - Hide section if no recommendations found
- **Data Sources**: `memberships`, `registrations`, `events` (Supabase)
- **Priority Logic (rule-based)**:
  1. Events from clubs student is a member of
  2. Events matching categories of past registrations
  3. Trending events in selected college
  4. Fallback: upcoming events
- **Limit**: 8 events
- **Section Header**:
  - Left: "Recommended For You"
  - Right: "See More" -> `/explore?filter=recommended`
- **Layout**:
  - Mobile: horizontal scroll, card width 260px, gap 16px, snap scroll
  - Desktop: grid layout, 4 columns, gap 24px
- **Card Design**:
  - Rounded-xl, shadow-sm, hover shadow-md, subtle hover lift
  - Banner image (height 180px), rounded top corners, object-cover
  - Title (2-line clamp)
  - Organized by club name (muted text)
  - Date (formatted)
  - Price row + **Register** button
- **Register Behavior**:
  - If already registered -> show "Registered" badge (green)
  - Else -> primary **Register** button
- **Animation**:
  - Fade-in stagger on first render only
  - No heavy motion
- **Constraints**:
  - No new tables
  - Server-side ranking (no AI)
  - Keep component modular

#### Sponsored & Fest Visibility Blocks
- **Purpose**: Show paid digital sponsorship placements in a premium, non-intrusive format.
- **Data Sources**: `sponsorship_deals`, `events` (Supabase)
- **Eligibility Rules**:
  - `visibility_active = true`
  - `pack_type` in `digital | app | fest`
  - Do not show more than 3 sponsored blocks total
  - Do not duplicate banners
- **Placement Rules**:
  - After **Happening Today** -> show **Fest Banner** if active fest exists
  - After **Trending in Your College** -> show **Sponsored Banner** if App/Fest sponsor exists
  - After **Top 10 Events** -> show **Fest Takeover** if Fest sponsor exists
- **Banner Types**:
  - **Type 1: Fest Banner**
    - Height: 180px mobile / 260px desktop
    - Full width, rounded-xl, clickable
    - Left overlay: fest name, fest dates, CTA "Explore Fest"
    - Right: small sponsor logo badge (if exists)
  - **Type 2: Event Sponsor Banner (Digital Pack)**
    - Height: 120px mobile / 140px desktop
    - Horizontal strip
    - Left: sponsor logo
    - Center: short message
    - Right: "Learn More" button
  - **Type 3: App Visibility Pack Banner**
    - Height: 160px mobile / 220px desktop
    - Full width, clickable, large banner image
    - Subtle sponsor badge top-right
  - **Type 4: Fest Takeover**
    - Height: 240px mobile / 300px desktop
    - Premium design, minimal text, strong brand presence
    - Clickable with tracked clicks
- **Click Behavior**:
  - If `sponsor.website_url` exists -> open in new tab
  - Track impression + click
  - Insert into `sponsor_analytics`:
    - sponsor_id, event_id, type (impression | click), created_at
- **Design Rules**:
  - No blinking, no autoplay video, no flashing
  - No spammy colors, must look integrated
  - Fade-in only (no slide-in)
- **Responsive**:
  - Mobile: stacked, full width, 16px margin
  - Desktop: max-width container, centered, consistent spacing

#### Infinite Smart Event Feed (Final Section)
- **Purpose**: Keep users scrolling with a personalized, non-repetitive infinite feed.
- **Placement**: Final section of the homepage (after all curated blocks)
- **Data Source**: Public events via existing API layer (Supabase)
- **Priority Logic**:
  1. Same college
  2. Nearby colleges
  3. Popular across city
  4. Events matching categories user clicked earlier
  5. Future events first
- **Pagination**:
  - Cursor-based pagination
  - Load 10 events initially
  - Load 10 more on scroll near bottom
  - Stop when no more events
  - Prevent duplicates across pages
- **Component**: `InfiniteEventFeed.tsx`
- **Layout**:
  - Mobile: single column
  - Tablet: 2-column grid
  - Desktop: 3-column grid
- **Card Design**:
  - Height ~130px
  - Left: square poster image (100x100)
  - Right: title (bold), organized by, date, price badge, small **Register** button
  - Gap between cards: 16px
  - Desktop hover: shadow-md + scale 1.02
- **Load States**:
  - While loading: skeleton list
  - End state: "You're all caught up" (muted text)
- **Personalization Boosts**:
  - Similar categories to past registrations
  - Favorited colleges
  - Volunteer history
- **Performance**:
  - Cache previous pages (React Query)
  - Do not refetch all pages on scroll
  - Smooth on low-end devices
- **Animation**:
  - Fade-in on new batch only (no slide/bounce)
- **Accessibility**:
  - Keyboard accessible cards
  - Visible focus ring
  - Tap targets >= 44px
- **Footer CTA**:
  - "Discover more events across India" -> Explore tab

**Key actions:**
- **Event Card Click** -> Navigate to Event Details Page
- **Register Now Button** -> Triggers registration flow (paid or free).
- **College Selector** -> Changes college filter and updates event display.

### Explore Tab
**Sub-tabs:** `Events`, `Nearby`, `Favorites`

**Events Sub-tab:**
- **Search bar** with rotating placeholder text.
- **Filters**: 
  - **Date**: Today / This Week / All
  - **Price Type**: Free / Paid
  - **Prize Pool**: No Prize / ₹0-₹5K / ₹5K-₹25K / ₹25K-₹1L / ₹1L+
- **Event Card Structure**: Poster, Name, Organized By, Date, **Register** button.
- *(Click card to view full details in Event Details Page)*

**Nearby Sub-tab:**
- **Nearby Events** component.
- **Nearby Colleges** component.

**Favorites Sub-tab:**
- **Favorite Colleges** list with **Remove Favorite** button.

### Event Details Page
**Purpose:** Complete event information with all details, timeline, and registration options.

**Page Layout:**
- **Event Poster/Banner**: Large featured image at top.
- **Event Title** and **Organized By** (with college/organizer link).
- **Key Information Section**:
  - Date & Time (with calendar icon)
  - Venue/Location (with map icon)
  - Price (Free/Paid amount)
  - Organizer Contact Details (phone, email)
- **Description**: Full event description/rules/guidelines.
- **Prize Pool & Rewards** (if applicable): Prize details with monetary amounts.
- **Sponsored By** (if applicable): List of sponsors with logos and sponsorship details.
- **Event Timeline** (multi-day events):
  - Day-wise breakdown with dates
  - Session timings per day
  - Event schedule for multi-day events
- **Registration Status**: 
  - Number of registered students
  - Available seats (if capacity limited)
  - Registration deadline (if applicable)
- **WhatsApp Group Link** (if enabled by organizer).
- **Brochure/PDF** (if uploaded by organizer).
- **Register Button**: Primary CTA for event registration (supports individual and team/bulk registration).
- **Share Button**: Share event on social media or copy link.

**Key actions:**
- **Register Button** -> Triggers registration flow with options for Individual Registration or Team Registration (Bulk).
- **Back Button** -> Return to previous page (Home/Explore).
- **Share Button** -> Share options (WhatsApp, Copy Link, etc.).

### My Events Tab
**Sub-tabs:** `Upcoming`, `Past`, `Certificates`

**Upcoming Sub-tab:**
- Events the student has registered for with event dates in the future.
- Sorted by date (nearest first).
- Ticket cards with event details.
- **Join WhatsApp Group** button (if enabled).
- Actions: View Details, View Tickets, Cancel Registration, Share.

**Past Sub-tab:**
- Events the student has attended or event dates have passed.
- Sorted by date (most recent first).
- Ticket cards with completion status.
- Actions: View Details, View Tickets, Leave Review/Rating.
- Empty state includes **Explore Events** button.

**Certificates Sub-tab:**
- **Participation Certificates**: Certificates awarded for attending/participating in events.
  - Certificate cards with event name, participation date, issuance date.
  - Download button for each certificate.
- **Winning Certificates**: Certificates awarded for winning competitions/prizes.
  - Competition name, prize/position (1st Place, 2nd Place, etc.).
  - Certificate cards with award details.
  - Download button for each certificate.
- Empty state: "No certificates yet" with **Explore Events** button.

**Content (all tabs):**
- Ticket cards rendered via `TicketComponent`.
- **Join WhatsApp Group** button appears when enabled for the event.

**Key actions:**
- **Join WhatsApp Group** -> opens link after registration verification.
- **View Tickets** -> Display ticket/pass for the event (QR code, ticket number, entry details).
- **View Details** -> Navigate to Event Details Page.
- **Cancel Registration** -> Remove registration from event.
- **Download Certificate** -> Download certificate as PDF.

### Volunteer Tab
**Sub-tabs:** `Opportunities`, `Applications`, `Certificates`

**Opportunities Sub-tab:**
- **Purpose:** Discover events hiring volunteers with filtering and search.
- **Search Bar**: Search by event name, organization, or work category.
- **Filters**:
  - **College**: Filter by college/institution
  - **Club**: Filter by specific club(s)
  - **Event Category**: Cultural, Technical, Sports, Fests, etc.
  - **Work Category**: Design, Logistics, Marketing, Coordination, Technical Support, Social Media, Event Planning, etc.
- **Event List**: Cards showing:
  - Event name
  - Organization/College name
  - Event date
  - Volunteer positions available (e.g., "3 Design roles needed")
  - Work categories (tags: Design, Logistics, etc.)
  - **Apply to Volunteer** button
  - Empty state: "No opportunities match your filters" with **Reset Filters** button

**Applications Sub-tab:**
- **Applications list** with status badges (Pending, Accepted, Rejected).
- Application cards showing:
  - Event name
  - Applied work category
  - Application date
  - Status with timestamp
  - Actions: View Event, Withdraw Application (if pending)
- Empty state: "No applications yet" with **Browse Opportunities** button.

**Certificates Sub-tab:**
- **Volunteer Certificates**: Certificates issued for volunteer work completed.
  - Certificate cards with event name, volunteer role, work category, completion date.
  - Download button for each certificate.
- Empty state: "No certificates yet" with **Browse Opportunities** button.

**Key actions:**
- **Apply to Volunteer** -> Submit volunteer application for an event.
- **View Event** -> Navigate to Event Details Page.
- **Withdraw Application** -> Cancel pending volunteer application.
- **Download Certificate** -> Download certificate as PDF.

### Profile Tab
**Content:**
- Profile summary with completion progress.
- Editable form fields: Full Name, DOB, College Name, College Email, Phone, Personal Email.
- Club membership management: select club, enter member ID, **Add**.
- **Logout**.

**Key actions:**
- **Edit** / **Cancel** toggles.
- **Save Profile** button when editing.
- **Logout** button.

---

## 4. Organizer Role

### Dashboard Route
- **Path:** `/dashboard/organizer`
- **Tabs:** `Dashboard`, `Events`, `Analytics`, `Sponsorships`, `Profile`
- **Mobile:** Bottom navigation mirrors the same tabs.

### Dashboard Tab
**Purpose:** Live stats and quick access to registrations.

**Sections:**
- **Live Snapshot**: live events, today registrations, total revenue, total events.
- **Today’s Events** list: each with **View Registrations** button.

**Key actions:**
- **View Registrations** -> opens registrations modal.

### Events Tab
**Purpose:** Create events and manage existing events.

**Create Event Form (toggle with + Create Event):**
- Event title, description, location.
- **Schedule Builder** (single/multi-day with sessions):
  - Add day-wise schedule
  - Add sessions per day with times and descriptions
- **Timeline Section**:
  - Event start date & time
  - Event end date & time
  - Registration start date
  - Registration end date
  - Volunteer application deadline (if applicable)
- Price.
- **Enable Club Discount** (club name, discount amount, CSV upload).
- **Enable Bulk Registration (Team) Discount** (optional):
  - Toggle to enable/disable bulk registration offers
  - Add bulk discount tiers:
    - Team size 2-3: Discount amount or percentage (e.g., ₹50 off or 10% off)
    - Team size 4-5: Discount amount or percentage
    - Team size 5+: Discount amount or percentage
  - Optionally define coupon code for bulk registrations (e.g., "TEAM25" for 25% off)
- **Enable Sponsorship Visibility** (platform-managed).
- **WhatsApp Group for Participants** (optional):
  - Toggle to enable/disable WhatsApp group
  - Input field for WhatsApp group invite link
  - Students will receive the link after successful registration
- **Add Prize Pool & Rewards** (amount + description).
- **Add Organizer Contact Details** (phone + email).
- **Brochure upload** (PDF/Image).
- **Custom Registration Form Fields**:
  - **Add Field** button to create custom fields
  - Field types: Text, Email, Phone, Dropdown, Checkbox, File Upload, Textarea
  - For each field: Field name, field type, required/optional toggle, field description
  - Fields display in registration form in the order organizer creates them
  - Examples: T-shirt size, Dietary preferences, Experience level, Portfolio link, etc.
- **Create Event** button.

**Event List (cards):**
- **Manage Event** button.
- **Submit to Fest** button.

### Event Detail View
**Sub-tabs:** `Overview`, `Timeline`, `Banners`, `Volunteers`, `Certificates`

**Overview Sub-tab:**
- Sponsorship visibility section (if enabled).
- **OrganizerSponsorshipDeals** list (read-only for visibility status).
- WhatsApp group settings with **Enable** toggle, link input, **Save WhatsApp Settings** button.
- Stats cards: registrations, revenue, ticket price.
- **View All Registrations** button -> Opens registrations table/modal with:
  - Student name, email, phone, college, registration date
  - **Default Fields**: Full Name, Email, Phone, College (auto-collected)
  - **Custom Fields**: All fields created by organizer (Student T-shirt size, Dietary preferences, Portfolio link, etc.)
  - Search and filter by student name, email, registration status
  - **Download Registrations** button (CSV/Excel export with all fields)
- **Scan Attendance** button.

**Timeline Sub-tab:**
- **Event Schedule**: Day-wise breakdown for multi-day events.
  - Each day showing:
    - Date and day of week
    - Sessions/activities scheduled for that day
    - Time slots and duration
    - Venue/location for each session
    - Session descriptions
  - Single-day events: Show start time, end time, sessions, and breaks.
- **Event Workflow Timeline** (if applicable):
  - Event creation date
  - Registration start/end dates
  - Event start date
  - Event end date
  - Important milestones (deadline for volunteer applications, certificate issuance date, etc.)
- **Edit Timeline** button: Modify schedule details and session information.

**Banners Sub-tab:**
- **BannerUploadForm** for event banners (approval flow).

**Volunteers Sub-tab:**
- Volunteer applications list with filters: All/Pending/Accepted/Rejected.
- **Accept** / **Reject** actions on pending applications.

**Certificates Sub-tab:**
- **Certificate Editor Section**:
  - **Step 1: Choose Recipients**
    - Two options: Issue to Volunteers / Issue to Registrants (Attendees)
    - For Volunteers: List of approved volunteer applications with select checkboxes
    - For Attendees: List of event registrants with select checkboxes (bulk select available)
  - **Step 2: Upload/Create Certificate Template**
    - **Upload Custom Template** button (supports image formats: PNG, JPG, PDF)
    - **Use Pre-designed Template** option (pre-made designs: Participation Certificate, Winner Certificate, Volunteer Certificate, etc.)
  - **Step 3: Certificate Customization Editor**
    - **Template Preview Area**: Large preview of uploaded/selected template
    - **Name Placement**:
      - Click on template to select where student name will be placed
      - Drag to reposition name placement
      - Visual indicator showing the placement point
    - **Font Customization Panel** (on right side):
      - **Font Family**: Dropdown with list of fonts (Arial, Times New Roman, Georgia, Roboto, OpenSans, Playfair, Montserrat, etc.)
      - **Font Size**: Slider or input field (range: 12px - 100px)
      - **Font Color**: Color picker to select text color
      - **Font Style**: Options for Bold, Italic, Underline
      - **Text Alignment**: Left, Center, Right alignment options
    - **Certificate Content Options**:
      - Student Name (auto-filled from selected recipients)
      - Certificate Title (e.g., "Certificate of Participation")
      - Event Name (auto-filled)
      - Issue Date (auto or custom)
      - Additional Text (e.g., "Awarded for Outstanding Performance")
      - Organizer Name/Signature (text or image upload)
  - **Step 4: Preview & Generate**
    - **Preview Button**: Shows how each student's certificate will look with their name
    - **Generate Certificates Button**: Creates certificates for all selected recipients
    - Shows generation progress/status
  - **Step 5: Issue Certificates**
    - **Issue Certificates Button**: Sends generated certificates to all selected students
    - Students receive certificates in their profile (Certificates tab)
    - **Email Notification**: Automatically sends email with certificate attachment/download link
  - **Issued Certificates History**: 
    - List of all issued certificate batches with date, recipient count, type (Participation/Volunteer/Winner)
    - **Download All** option to get certificates as ZIP
    - **View Details**: See list of recipients for each batch

### Analytics Tab
**Purpose:** Event-wise metrics and trends.

**Sections:**
- Summary cards (total events, registrations, revenue, avg registration/event).
- Event-wise analytics table.
- Monthly revenue trend.
- Registrations by month.
- Top performing events list.

### Sponsorships Tab
**Purpose:** Organizer payouts.

**Content:**
- Sponsorship earnings section.
- **SponsorshipPayout** component for payout requests and history.

### Profile Tab
**Content:**
- Organizer profile summary.
- Stats: total events, total registrations.
- Settings: Help & Support (placeholder), Organizer Guidelines (placeholder), **Logout**.

---

## 5. Admin Role

### Dashboard Route
- **Path:** `/dashboard/admin`
- **Tabs:** `Dashboard`, `Analytics`, `Events & Users`, `Payments`, `Reports`
- **Mobile:** Bottom navigation mirrors the same tabs.

### Dashboard Tab
**Purpose:** Platform snapshot, critical alerts, and quick stats.

**Sections:**
- Analytics overview cards (revenue, transactions, users, events).
- Sponsorship payouts summary cards.
- Global snapshot (colleges live, events today, registrations today, revenue today, failed payments).
- Recent activity list (events created in last 24h).
- Critical alerts status.

### Analytics Tab
**Sub-tabs:** `Metrics`, `Revenue`, `User Growth`, `Event Performance`, `Admin Logs`

**Metrics Sub-tab:** Platform metrics overview, sponsorship payout stats, quick counts.
**Revenue Sub-tab:** Chart of revenue over last 30 days, monthly trends.
**User Growth Sub-tab:** Chart of user growth over time, registration trends.
**Event Performance Sub-tab:** Table of top performing events (registrations, fill rate, revenue).
**Admin Logs Sub-tab:** List of all admin actions with timestamps and details.

### Events & Users Tab
**Sub-tabs:** `Events`, `Students`, `Organizers`

**Events Sub-tab:**
- Filters: All / Today / This Week.
- Event list with summary stats (registrations, revenue).

**Students Sub-tab:**
- Search by email.
- Student list with registration count, events attended, stats.

**Organizers Sub-tab:**
- Search by email/organizer name.
- Organizer list with event count, total registrations, revenue stats.

### Payments Tab
**Sub-tabs:** `Transactions`, `Sponsorships`, `Payouts`

**Transactions Sub-tab:**
- Revenue summary cards.
- Transactions table (student, event, amount, date, status).
- Filters by date range, payment status, event.

**Sponsorships Sub-tab:**
- Sponsorship orders list with status (created/paid/failed).
- Pack type (Digital/App/Fest) and payment amount.
- Visibility status (active/inactive).
- Payout settlement status (pending/settled).
- Actions: Toggle visibility, Mark payout as settled.

**Payouts Sub-tab:**
- Sponsorship payout processing and status management.
- Payout requests with approval/rejection workflow.
- Settlement history and bank transfer details.

### Reports Tab
**Sub-tabs:** `Reports`, `Disputes`

**Reports Sub-tab:**
- User reports (flagged accounts, content violations) with status and action controls.
- Event reports (suspicious activity, cancellations) with status updates.
- Bulk actions: Resolve, Reject, Mark as Reviewed.

**Disputes Sub-tab:**
- Payment disputes list with details (student, organizer, amount, reason).
- Dispute status (open/resolved/refunded) with timeline.
- Actions: Review, Approve Refund, Reject Dispute, Add Notes.

---

## 6. Sponsor Role

### Dashboard Route
- **Path:** `/dashboard/sponsor`
- **Tabs:** `Discover`, `Sponsorships`, `Analytics`, `Profile`
- **Mobile:** Bottom navigation mirrors the same tabs.

### Discover Tab
**Purpose:** Discover events available for sponsorship.

**Content:**
- **Search Bar**: Search by event name, organization, or college.
- **Filters**:
  - **College**: Filter by college/institution
  - **Event Category**: Cultural, Technical, Sports, Fests, etc.
  - **Min Budget**: Minimum sponsorship budget for event
  - **Max Budget**: Maximum sponsorship budget for event
- **Event Cards** showing:
  - Event name and date
  - College/Organizer
  - Event category badge
  - Expected registrations (if available)
  - Sponsorship opportunities available
  - Budget range
- **View Packs** button -> Shows available sponsorship pack options (Digital/App/Fest) with pricing.

### Sponsorships Tab
**Purpose:** Manage active and past sponsorships.

**Sub-sections:**
- **Active Sponsorships**:
  - Sponsorship orders list with:
    - Event name
    - Pack type (Digital/App/Fest)
    - Payment status (created/paid/failed) with amount
    - Visibility status (active/inactive)
    - Start and end dates
  - Actions: **Manage Banner** (upload/edit), **View Details**, **Toggle Visibility**
- **Banner Management** (for each sponsorship):
  - Banner upload enabled only after payment verification
  - Allowed placements determined by pack type:
    - **Digital:** Event page banner
    - **App:** Event page + homepage rotating banner (during fest)
    - **Fest:** Multiple placements (event pages, homepage, featured)
  - Logo upload capability
  - **Upload/Edit Banner** button -> Opens editor to upload and configure banner
  - **Preview Banner** button
- **Past Sponsorships**:
  - Completed sponsorships with performance metrics (impressions, clicks, if available)

### Analytics Tab
**Purpose:** Track sponsorship performance, ROI, and generate reports.

**Sub-tabs:** `Overview`, `Event Analytics`, `Reports`

**Overview Sub-tab:**
- **Summary Cards**: Active sponsorships count, total spent, visibility status, total ROI.
- **Performance Metrics by Sponsorship**:
  - Table showing each sponsorship with:
    - Event name
    - Pack type
    - Banner impressions (if trackable)
    - Clicks/interactions (if trackable)
    - Engagement rate
    - Date range
    - **View Detailed Analytics** button
- **Sponsorship History**:
  - Timeline of all sponsorships with payment dates, completion dates.
- **Budget Overview**: Total spent vs. budget allocated, spending trends.

**Event Analytics Sub-tab:**
- **Event-wise Detailed Analytics**:
  - Searchable/filterable list of sponsored events
  - For each event, detailed metrics:
    - Event name, date, college/organizer
    - Sponsorship pack type
    - **Impressions**: Total banner views/exposure
    - **Clicks**: Number of banner clicks/interactions
    - **Engagement Rate**: Click-through rate percentage
    - **Event Registrations**: Total registrations for the event
    - **Event Performance**: Fill rate, revenue (if available)
    - **Banner Performance**: Placement-wise performance (if multiple placements)
    - **Duration**: Sponsorship start and end dates
  - **Download Report** button (PDF/CSV for individual event)
  - Charts: Impressions trend, clicks over time, engagement timeline

**Reports Sub-tab:**
- **Generate Custom Reports**:
  - Date range selector (From date, To date)
  - Filter options: By event, by pack type, by sponsorship status
  - Report types to generate:
    - **Sponsorship Summary Report**: All sponsorships in date range with metrics
    - **Performance Report**: Detailed engagement metrics and ROI
    - **Budget Report**: Spending breakdown by event and pack type
    - **Event Comparison Report**: Compare performance across multiple events
- **Download Report Options**:
  - **Export as PDF** button: Formatted report document
  - **Export as CSV** button: Raw data for spreadsheet analysis
- **Saved Reports**:
  - List of previously generated reports with dates
  - View, download, or delete saved reports
  - Schedule reports (optional): Auto-generate weekly or monthly reports

### Profile Tab
**Purpose:** Manage sponsor profile and company details.

**Content:**
- **Sponsor Profile Summary**:
  - Company name, website URL, contact person name
  - Company logo display
  - Contact email and phone
  - Verification status
- **Edit Profile**:
  - Editable form fields: Company name, website, logo URL, contact name, contact phone, contact email
  - **Save Profile** button
- **Payment Method**:
  - Saved payment methods list
  - Add new payment method option
- **Settings**: 
  - Notifications preferences
  - **Logout** button

---

## 7. System Architecture & Invariants

> **Purpose:** Define non-negotiable rules for production system safety, compliance, and security.

### 🔒 System Invariants (Non-Negotiable Rules)

These rules must NEVER break in production.

#### Tickets (Razorpay Payment)
- **Ticket is issued ONLY after:**
  - Successful Razorpay payment
  - Server-side signature verification (HMAC-SHA256)
  - No client-side success callbacks trigger ticket generation
- **Payment verification must happen:**
  - Server-side only (never client-side)
  - Before ticket creation
  - Before registration confirmation
- **Ticket QR Code must contain:**
  - registration_id
  - event_id
  - signed hash (HMAC or JWT)
  - expiration timestamp (expires after event date)
- **Ticket security:**
  - QR expires after event completion
  - Screenshot reuse prevented via QR signing
  - Attendance verified server-side before marking entry

#### Sponsorship (ZERO Razorpay)
- **Digital sponsorship visibility:**
  - Only activated by Admin manually (never auto-activation)
  - Requires admin confirmation of deal
  - Status must be confirmed before visibility activates
- **Offline sponsorship:**
  - Handled entirely outside platform
  - Direct sponsor ↔ organizer negotiation
  - Platform does NOT process payments
  - Platform does NOT guarantee deliverables
- **Sponsor logos:**
  - Cannot appear without:
    - Admin approval
    - Deal status = confirmed
  - Public visibility only after approval
- **Payment responsibility:**
  - Offline/direct between sponsor and organizer
  - No platform commission on offline deals
  - Digital packs: Sponsor clicks "Interested" → offline deal → manual activation

#### Volunteers
- **Volunteer certificates issued ONLY after:**
  - Volunteer marked as "completed" by organizer
  - Event end date has passed
  - Never issued during event
- **Volunteer data:**
  - Role and responsibilities recorded
  - Attendance tracked if applicable
  - Performance details optional but recommended

#### WhatsApp Group Links
- **Visibility restrictions:**
  - Only visible to verified paid ticket holders
  - Never exposed on public pages
  - Never in email outside authenticated flow
  - Link stored securely in DB, not cached
- **Delivery:**
  - Sent via notification after registration confirmation
  - Re-sendable from My Events tab

#### Role Protection
- **All role-based access:**
  - Validated on server APIs (not just frontend routing)
  - Server checks auth token for role claim
  - Unauthorized access returns 403 Forbidden
  - All sensitive actions require role verification

#### College Model (Strict Governance)
- **Approved colleges only:**
  - Students can select only from approved college list
  - Organizers must select from approved colleges
  - Admin approves new college additions
  - Prevents spam and fake college registrations
- **College fields:**
  - college_id (UUID)
  - college_name
  - domain (email domain for verification)
  - approved (boolean)

---

### 💳 Razorpay Payment Flow (Tickets Only)

**Secure Architecture Required:**

#### 1. Order Creation
- **Endpoint:** `POST /api/payments/create-order`
- **Request:** 
  - event_id
  - student_id
  - registration_data (for bulk: team_members array)
- **Response:**
  - Razorpay order_id
  - amount
  - currency
- **Database:**
  - Store order with status = "created"
  - store_order_id (Razorpay ID)
  - registration_id (pending)

#### 2. Client Opens Razorpay
- Pass order_id to Razorpay SDK
- Collect payment
- Razorpay returns payment_id + signature

#### 3. Payment Verification
- **Endpoint:** `POST /api/payments/verify`
- **Request:**
  - order_id
  - payment_id
  - signature
- **Server:**
  - Validates HMAC-SHA256 signature with Razorpay key
  - If invalid: Return 400 "Invalid payment signature"
  - If valid:
    - Create registration record
    - Issue ticket(s)
    - Update order status = "verified"
    - Return ticket details

#### 4. Razorpay Webhook
- **Endpoint:** `POST /api/webhooks/razorpay`
- **Validates:** Webhook signature
- **Actions:**
  - Checks if order_id exists in DB
  - If status = "created", updates to "verified"
  - If status already "verified", skips (idempotency)
  - If status = "failed", marks for investigation
- **Purpose:** Catches cases where frontend callback fails

**Idempotency Guard:**
```
IF order_id already has status = "verified":
  SKIP ticket generation
  RETURN success (already processed)
```

### Error Handling & Failure Scenarios

#### Payment Failed
- Registration not created
- No ticket issued
- Order marked as status = "failed"
- Student sees "Payment failed, retry" button

#### Webhook Delayed/Missing
- Keep order in status = "pending_verification"
- Cron job runs every 5 minutes:
  - Checks for pending_verification orders older than 5 min
  - Queries Razorpay API for payment status
  - Updates DB accordingly
- Student can retry payment if cron detects failure

#### Event Cancelled After Tickets Sold
- Admin marks event status = "cancelled"
- All tickets marked invalid
- Students notified
- Refund policy enforced (see below)

#### Organizer Deletes Event After Tickets Sold
- Event soft-deleted only (never hard delete)
- Admin approval required for deletion
- Tickets remain valid
- Event accessible via archived state

#### Concurrency Issues (Bulk Registration)
- Use database transaction
- Lock registration table for team registration
- Prevent double-charging for same team
- Return error if duplicate payment attempted

---

### 🧾 Refund Policy (Legal Protection)

**Add to Terms of Service:**

- **Platform does not guarantee refunds.**
- Refund eligibility defined by event organizer.
- Organizer can set refund deadline (e.g., 7 days before event).
- Platform may assist but is NOT liable.
- Processing fees (our 5% commission) are NON-REFUNDABLE.
- Sponsor payment disputes outside platform scope.
- **Example policy:** "50% refund up to 7 days before event, 0% after."

---

### 📁 Storage Architecture (File Security)

**Define S3/storage buckets clearly:**

| Bucket | Public Read | Auth Write | Purpose |
|--------|------------|-----------|---------|
| profile-pictures | Yes | Auth user only | Student profile avatars |
| event-banners | Yes | Organizer | Event poster images |
| sponsor-logos | Yes | Sponsor (post-approval) | Sponsor branding |
| certificates | No (signed URL) | System only | Student certificates |
| brochures | Yes | Organizer | Event brochure PDFs |
| registrations-data | No | Admin only | Exported registration CSVs |

**Security Rules:**
- Max file size: 10MB (except certificates 2MB)
- Allowed MIME types: image/jpeg, image/png, application/pdf
- Virus scanning: Integrate ClamAV (future)
- Delete files on event deletion (organizer privacy)

---

### 🔔 Notification System

**Triggers and Recipients:**

#### Student Notifications
- **Registration success:** Ticket QR, event details, WhatsApp link (if enabled)
- **Event reminder:** 24 hours before event start
- **Volunteer accepted:** Role details, requirements
- **Certificate issued:** Download link, congratulations message
- **Team invitation:** When added to a team registration (optional)

#### Organizer Notifications
- **New registration:** Student name, count, payment received
- **Volunteer application:** Applicant name, role applied for
- **Event nearing capacity:** "80% registrations filled"
- **Bulk registration:** Team size notification

#### Sponsor Notifications
- **Interest acknowledged:** Organizer notified of sponsorship interest
- **Deal confirmed:** Admin activates visibility (manual trigger)
- **Visibility activated:** Logos now live on event page

#### Admin Notifications
- **Large volume spike:** ">1000 registrations in 24h"
- **Payment failures:** Orders in "failed" status
- **Disputes raised:** Payment chargebacks or refund requests
- **Manual actions pending:** Events awaiting college approval

**Implementation:**
- Use DB notifications table with status (unread/read)
- Client polls every 30 seconds (no websocket needed yet)
- Email sends for critical notifications (registration, certificates)

---

### 📊 Caching Strategy (Load Protection)

**Cache these (safe):**
- Event lists: 60 seconds
- Homepage banners: 120 seconds
- College filtered events: 60 seconds
- Category lists: 300 seconds (5 min)

**Do NOT cache (critical):**
- Registration status
- Payment verification
- Ticket generation
- Attendance tracking
- Certificate data

**Peak Load Protection (Fest Mode):**
- Disable heavy analytics queries during peak hours
- Use read replicas for reporting
- Paginate registration lists (50 per page)
- Lazy-load event details

---

### 🧠 Attendance Security (QR Verification)

**QR Code Payload (encoded as JWT):**
```json
{
  "registration_id": "uuid",
  "event_id": "uuid",
  "student_email": "student@college.com",
  "exp": 1708123200,
  "iat": 1707123200,
  "iss": "happenin.app"
}
Signature: HMAC-SHA256(payload, secret)
```

**Validation at Entry:**
- Scan QR → Decode JWT
- Verify signature
- Check registration_id exists
- Check event_id matches
- Check expiration (must be > today)
- Check not already scanned (idempotency)
- Mark attendance: scanned_at, scanned_by (organizer ID)

**Prevents:**
- Screenshot reuse (signature invalidates on modification)
- Wrong event entry
- Post-event scanning
- Double-entry

---

### 🧾 Certificate Security

**Store in DB:**
- certificate_id (UUID)
- batch_id (for bulk issues)
- recipient_id (student/volunteer ID)
- certificate_type (participation/volunteer/winner)
- pdf_hash (SHA256 of PDF file)
- issued_at (timestamp)
- issued_by (organizer ID or system)
- event_id (reference)

**Verification:**
- Student downloads certificate
- System validates hash matches stored hash
- Prevents tampered certificates

**Delivery:**
- Server generates PDF server-side
- Send via secure signed URL (expires 24h)
- Email notification with download link
- Stored in certificates bucket (private, signed URLs only)

---

### 🛡 Legal Protection Clauses (Terms of Service)

**Add to T&C:**

- **Technology Facilitator:** "Happenin is a technology platform. We do not organize events or guarantee event execution."
- **Organizer Responsibility:** "Event organizers are solely responsible for event execution, safety, and compliance with local laws."
- **Sponsorship Negotiation:** "Sponsorship deals are negotiated between Sponsor and Organizer. Platform does not guarantee deliverables or enforce offline commitments."
- **Offline Sponsorship:** "Offline sponsorship negotiations and payments are outside platform scope. Platform not liable."
- **Payment Commission:** "5% commission on tickets is non-refundable and covers platform costs."
- **Limitation of Liability:** "Happenin's total liability is limited to refund of ticket price only."
- **Force Majeure:** "Event cancellations due to govt restrictions, natural disasters are organizer's decision. Platform not liable."

---

### 🏗 Rate Limiting (Abuse Prevention)

**Implement limits:**
- **Login:** 5 attempts per 5 minutes per IP
- **Registration:** 20 registrations per user per day
- **Payment attempts:** 5 attempts per order per 24 hours
- **Volunteer apply:** 5 applications per student per day
- **API calls:** 100 requests per 10 seconds per user
- **File upload:** 10 files per organizer per day

**Response:** Returns 429 (Too Many Requests) with retry-after header

---

### 📈 Scalability Model

**Fest Load Scenario:** 10,000+ registrations in 2 days

**Database Optimization:**
- Index on: event_id
- Index on: student_email
- Index on: payment_status
- Index on: created_at (for time-based queries)
- Composite index: (event_id, payment_status)

**Application Optimization:**
- Paginate registration lists (50 per page max)
- Use cursor-based pagination (not offset)
- Disable heavy report queries during peak
- Use CDN for images (event banners, sponsor logos)
- Cache database queries

**Traffic Scaling:**
- Load balance API servers
- Use read replicas for analytics
- Queue payment verifications (if spikes)
- Monitor payment success rate

---

### ✅ What You Are Doing RIGHT

By removing these from scope:

- ❌ Face recognition (regulatory minefield)
- ❌ Auto sponsorship activation (compliance)
- ❌ Complex Razorpay splits for sponsors (GST + PCI)
- ❌ Marketplace for sponsorships (regulatory)

You've reduced:
- 80% compliance risk
- 90% GST complexity
- Audit burden
- Chargeback risk
- Chargeability issues

This is **smart architecture**.

---

### 🎯 Final Architecture Summary

| Feature | Payment | Activation | Security |
|---------|---------|-----------|----------|
| **Tickets** | Razorpay (5% commission) | Auto (server after verify) | HMAC signature, server-side |
| **Offline Sponsorship** | Direct (sponsor ↔ organizer) | Manual (none, offline deal) | Contract outside platform |
| **Digital Sponsorship** | Direct (offline) | Manual (admin approval) | No auto, admin control |
| **Certificates** | N/A | Auto (after organizer action) | SHA256 hash verification |
| **Attendance** | N/A | QR scan (organizer scans) | JWT signed QR, server verify |
| **WhatsApp** | N/A | Auto (after payment) | Auth-only, not public |

---

## 8. Public Pages and Flows

### Landing Page
- **Path:** `/`
- **Audience:** Not logged-in users.
- **Goal:** Conversion-focused public entry point for students and clubs.
- **Structure (Top → Logic → Urgency):**
  1. **Hero Section (Above the Fold)**
    - Headline: "Discover Every College Event. In One Place."
    - Subheading: "Book tickets, explore fests, and never miss campus action again."
    - Primary CTAs: **Download App**, **Explore Events**
    - Secondary CTA: **For Clubs → Host Your Event**
    - Visual: Phone mockup with event feed + floating event/fest cards
  2. **Problem Section** (3 columns with icons)
    - Events scattered across WhatsApp
    - Missed registrations
    - Complicated ticket systems
    - Statement: "College life is chaotic. Event discovery shouldn’t be."
  3. **Solution Section (What Happenin Does)**
    - **Discover**: Browse inter-college and intra-college events
    - **Register Instantly**: Secure ticket booking with seamless payments
    - **For Clubs**: Manage registrations, analytics, and payments in one place
  4. **How It Works** (3-step timeline)
    - Open Happenin → Find an Event → Book & Attend
  5. **Social Proof / Trust**
    - Early stage: "Partnering with 10+ clubs", "Used by 1000+ students"
    - College logos / testimonials / event photos (as available)
  6. **For Clubs Section** (Revenue driver)
    - Headline: "Running a Fest? We Handle Everything."
    - Points: Sell tickets, track registrations, sponsorship visibility, 5% flat commission
    - CTA: **List Your Event**
  7. **Rewards / Referral / Discounts**
    - Student referral rewards
    - Early user benefits
    - Fest discounts
  8. **FAQ Section**
    - Is it free? How does payment work? Can any college join? Refund policy?
  9. **Final CTA (Strong Close)**
    - Dark background section
    - Copy: "Ready to Experience Campus Like Never Before?"
    - CTAs: **Download Happenin Now**, **Host Your First Event**
  10. **Footer**
    - About, Contact, Privacy Policy, Terms, Social links
- **Behavior:** Landing page focuses on marketing; event browsing remains in Explore/Events pages.

### Events Listing
- **Path:** `/events`
- **Tabs:** All Events, Nearby.
- **Filters:** All / Free / Paid.
- **Buttons:** **Register** (redirects to student dashboard register flow).

### Event Details
- **Path:** `/events/[eventId]`
- **Tabs:** Overview, Volunteer.
- **Buttons:** Volunteer apply (role + message).
- **Content:** Banner, description, date, location, price, organizer.

### Event Registration
- **Entry points:**
  - Landing page cards navigate to `/events/[eventId]/register`.
  - Events listing uses `/dashboard/student?register={eventId}`.
  - Student dashboard Register buttons trigger the internal payment + registration flow.
- **Note:** Registration is handled by the student dashboard flow and payment APIs.

### Auth
- **Path:** `/auth`
- **Modes:** Login and Sign up (toggle in same page).
- **Providers:** Google OAuth, Apple OAuth (if configured), Email/Password.

### Sponsor Event Page
- **Path:** `/sponsor/events/[eventId]`
- **Purpose:** Purchase sponsorship packs with instant Razorpay checkout.
- **Packages Available:** Digital (₹10k), App (₹25k), Fest (₹50k if fest_id exists)
- **Flow:**
  1. Select package → Click **Sponsor Now**
  2. Razorpay Checkout modal opens (UPI/Card/NetBanking)
  3. Complete payment
  4. Signature verification (HMAC-SHA256)
  5. Logo instantly displayed on tickets, certificates, banners
  6. Success message shown

---

## 8. Core User Flows (Verification Checklist)

### Student Registration Flow
1. Discover event (Landing, Explore, Events list).
2. Click **Register**.
3. **Registration Mode Selection**:
   - **Individual Registration**: Register only yourself
   - **Team Registration (Bulk)**: Register with a team
4. Payment flow (Razorpay for paid events).
5. Registration created and ticket issued.
6. Ticket appears in **My Events**.
7. Optional: **Join WhatsApp Group** if enabled.

### Bulk Registration Flow (Team Registration)
**Purpose:** Students can team up, register together, and one person pays for the whole team.

**Registration Process:**
1. Student clicks **Register** on an event.
2. Selects **Team Registration** option during registration.
3. **Team Registration Form**:
   - Dropdown: **Select Team Size** (2, 3, 4, 5+ members)
   - For each team member:
     - **Email Address** field (auto-filled for primary registrant, others manual entry)
     - **Full Name** field (auto-filled for primary registrant, others manual entry)
     - **College** field (auto-filled for primary registrant, others auto-filled from system)
   - **Lead Organizer** toggle: Mark one person as team lead (for team-based competitions)
   - **Offer/Coupon Code** (optional, applies to total team registration)
4. **Payment Calculation**:
   - Price per person × Team size = Total amount
   - Display: ₹500 × 3 members = ₹1500 (or **₹1200 with 20% team discount** if offer applied)
   - Only the primary registrant (purchaser) pays the full amount
5. **Razorpay Payment**: Complete payment for entire team.
6. **Post-Registration**:
   - Tickets generated for all team members
   - Tickets sent to registered email addresses of all team members
   - WhatsApp group link (if enabled) sent to all members
   - Team information stored and visible to organizer in registrations
   - All team members can access ticket in their **My Events** tab

**Bulk Registration Offers:**
- Organizers can create/enable bulk registration discounts:
  - "₹50 Off for Teams of 3+"
  - "20% Off for Teams of 5+"
  - "TEAM25" coupon code: 25% off for team registrations
- Customers see discount applied automatically or via coupon code
- Discount applies to total team amount, one person pays it

**Organizer View (Registrations):**
- In **View All Registrations**, show:
  - Team details with primary registrant marked
  - Team member list with emails
  - Single payment transaction for the team
  - Individual tickets/attendance tracking for each member

### Volunteer Flow (Student)
1. Open Event Detail page.
2. Select role and submit application.
3. Organizer reviews and approves/rejects.
4. Approved volunteers receive certificates.

### Organizer Event Creation Flow
1. Open **Events** tab and click **Create Event**.
2. Fill required fields and save.
3. Manage event details via **Manage Event**.
4. Use Overview to see registrations and scan attendance.

### Sponsorship Visibility Flow
1. Organizer enables sponsorship visibility on event.
2. Sponsor discovers event on `/sponsor/events/[eventId]`.
3. Sponsor selects pack type (Digital/App/Fest).
4. Clicks **Sponsor Now** → Razorpay Checkout modal.
5. Sponsor completes payment (UPI/Card/NetBanking).
6. Backend verifies HMAC-SHA256 signature.
7. Visibility activates automatically (status='paid', visibility_active=true).
8. Logo appears instantly on:
   - Event tickets
   - Certificates
   - Event page banner
   - Homepage banner (if App/Fest pack)
9. Sponsor can upload custom logo and manage banners from My Sponsorships tab.

### WhatsApp Group Flow
1. Organizer enables WhatsApp group and adds invite link.
2. Registered students see **Join WhatsApp Group**.
3. Link opens in new tab after verification.

---

## 9. Testing Notes

- Use **student**, **organizer**, **admin**, and **sponsor** accounts to verify tab visibility and access control.
- Verify every CTA leads to correct flow (Register, Submit for Verification, Manage Event, Scan Attendance).
- Confirm WhatsApp links are never exposed publicly and are available only to registered students.
- Verify sponsorship visibility list and fees appear in sponsor dashboard.

---

**END OF ROLE_FEATURES_AND_FLOWS.md**
