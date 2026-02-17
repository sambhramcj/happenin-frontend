# Ultra-Detailed Testing Checklist - Implemented Features Only

> **Last Updated:** February 17, 2026

Granular pixel-perfect testing of every visual element, animation, interaction, button state, color, spacing, and micro-interaction for features YOU HAVE IMPLEMENTED ONLY.

**Features Included:**
- Landing page, event cards, college selector, navigation
- Trending events section (with #1, #2, #3 numbering)
- Event details page, registration form, payment
- Student/Organizer/Admin dashboards
- Saved events (favorites with heart icon)
- Prize pool, organizer contact details, brochure upload
- Attendance QR code check-in
- Advanced analytics dashboard
- Banners (homepage/event), banner approvals
- Sponsorships (packages, deals, payouts)
- Certificates (templates, bulk generation, preview)
- Bulk ticket packs and access control
- Event cancellation/reschedule
- Notifications center and push notifications
- Fests (create, list, detail, submit events)
- Nearby discovery + radius filters
- Categories discovery + advanced search filters
- Voice search and social sharing
- PWA install prompt + offline banners
- All animations, colors, buttons, forms

**Features EXCLUDED (Not yet implemented):**
- Comments/reviews system
- Likes on comments  
- Event moderation/approval

---

## Landing Page - Complete Visual & Animation Testing

### 1. Hero Section (Top Banner)

**Visual Elements:**
- [ ] Background color matches design spec
- [ ] Background image loads and displays properly
- [ ] Image fits entire viewport height
- [ ] Overlay gradient appears (if any) with correct opacity
- [ ] "What's happening in your campus?" text color is correct (white/dark)
- [ ] Text size is readable on all screen sizes
- [ ] Text alignment is centered
- [ ] Text shadow effect applied (if any)
- [ ] Spacing from top equals design spec

**Animations on Page Load:**
- [ ] Background image fades in smoothly (0.3s)
- [ ] Text slides/fades in from top/bottom
- [ ] Hero section loads before other elements
- [ ] No jarring jumps or repositioning after load

**Search Bar Styling:**
- [ ] Search input background color correct
- [ ] Search input border color matches design
- [ ] Search input text color correct
- [ ] Placeholder text visible and correct color
- [ ] Search icon positioned correctly
- [ ] Input height/padding matches design
- [ ] Input border-radius matches (rounded corners)
- [ ] Font size and font-family correct

**Search Bar Interactions:**
- [ ] Click input → Border color changes to highlight
- [ ] Type text → Text appears correctly
- [ ] Hover input → Background color changes subtly
- [ ] Focus state shows outline/glow effect
- [ ] Typing triggers search results below
- [ ] Results appear with fade-in animation
- [ ] Click outside → Input loses focus, returns to normal style

**College Selector Button (Next to Search):**
- [ ] Button background color correct
- [ ] Button text color correct
- [ ] Button border (if any) correct color/width
- [ ] Button text alignment centered
- [ ] Button height/width proportional to search bar
- [ ] Button padding looks balanced
- [ ] Button border-radius matches design
- [ ] Font weight and size correct

**College Selector Interactions:**
- [ ] Hover button → Background color darkens/changes
- [ ] Click button → Dropdown opens with smooth animation
- [ ] Dropdown appears below button (no overlap issues)
- [ ] Dropdown has shadow effect for depth
- [ ] Search within dropdown works (input appears, filters list)
- [ ] Items in dropdown have light hover effect
- [ ] Click item → Button text updates to selected college
- [ ] Selected item shows checkmark or highlight
- [ ] Click outside → Dropdown closes smoothly
- [ ] Animation when dropdown opens: slides down or fades in
- [ ] Animation when dropdown closes: slides up or fades out

---

### 2. Event Cards Section - "Happening Today"

**Container Layout:**
- [ ] Section title "Happening Today" displays
- [ ] Title color matches design
- [ ] Title font size appropriately large
- [ ] Title has margin/padding above
- [ ] Cards arranged in grid/horizontal scroll
- [ ] Grid gap between cards consistent
- [ ] No cards overlapping
- [ ] Responsive: 4 cards on desktop, 2 on tablet, 1 on mobile

**Individual Event Card Visual:**
- [ ] Card background color correct (white/light gray)
- [ ] Card border/outline present if in design
- [ ] Card border-radius (rounded corners) smooth
- [ ] Card shadow present (gives 3D depth effect)
- [ ] Card height/width proportional
- [ ] Card padding inside consistent

**Event Card Image:**
- [ ] Image loads fully within card
- [ ] Image aspect ratio maintained (not stretched)
- [ ] Image has border-radius matching card
- [ ] Image covers correct area of card (usually 60-70% height)
- [ ] Image has overlay color/opacity effect
- [ ] No white space around image edges
- [ ] On slow network, placeholder shows before image loads

**Event Card Content (Text):**
- [ ] Event title visible below image
- [ ] Title font size readable
- [ ] Title color appropriate (dark on light background)
- [ ] Title truncated if too long (shows "...")
- [ ] Date/time visible
- [ ] Date/time text color lighter than title (hierarchy)
- [ ] Date/time font smaller than title
- [ ] Location text visible
- [ ] Price visible and prominent
- [ ] Price color different from other text (red/green/accent)
- [ ] Prize pool badge appears if available
- [ ] Prize pool badge color distinct
- [ ] Organizer name visible (small text)
- [ ] All text has adequate spacing/padding

**Event Card Interactions:**
- [ ] Hover card → Card shadow increases (lifts up effect)
- [ ] Hover card → Card background color changes slightly
- [ ] Hover card → No text color changes
- [ ] Hover card transition smooth (0.2s)
- [ ] Click card → Navigate to event details
- [ ] Click register button → Navigate to registration form
- [ ] Card appears clickable (cursor changes to pointer on hover)

**Event Card Buttons:**
- [ ] "Register" button visible on card
- [ ] Button background color correct
- [ ] Button text color correct (white on button)
- [ ] Button font size readable
- [ ] Button padding balanced
- [ ] Button border-radius smooth
- [ ] Button positioned at bottom of card
- [ ] Button spans appropriate width (full or 80%)
- [ ] Hover button → Background color darkens
- [ ] Click button → Navigate to registration page

---

### 3. Trending Section - "Trending in Your College"

**Section Layout:**
- [ ] "Trending in Your College" title displays
- [ ] Title color matches "Happening Today" title
- [ ] Title font size appropriately large
- [ ] Cards arranged in same grid/scroll as above
- [ ] Grid gap between cards consistent
- [ ] Responsive: 4 cards on desktop, 2 on tablet, 1 on mobile

**Trending Numbers (Netflix-style):**
- [ ] Number "1" visible on first card
- [ ] Number "2" visible on second card
- [ ] Number "3" visible on third card (and so on)
- [ ] Numbers positioned top-left of card image
- [ ] Numbers font size large and bold (48px+)
- [ ] Numbers color white/light for visibility
- [ ] Numbers have text shadow for readability over image
- [ ] Numbers increase sequentially (1, 2, 3, 4...)
- [ ] Numbers not overlapping card content

**Trend Indicator:**
- [ ] Up arrow icon visible if trending up
- [ ] Arrow color green (positive trend)
- [ ] Down arrow icon visible if trending down
- [ ] Arrow color red (negative trend)
- [ ] Arrow positioned near number or in corner
- [ ] Arrow size proportional (16-24px)

**Trend Percentage:**
- [ ] Trend percentage displayed (e.g., "+15%")
- [ ] Percentage color matches arrow color (green/red)
- [ ] Percentage positioned next to arrow
- [ ] Font size readable (12-14px)
- [ ] "Updated X hours ago" text visible
- [ ] Update time positioned below percentage

**Card Content (Same as "Happening Today"):**
- [ ] Event title visible
- [ ] Date/time visible
- [ ] Location visible
- [ ] Price visible
- [ ] Card interactions same as above (hover, click)

**Card Ordering:**
- [ ] Card #1 positioned first in section
- [ ] Card numbers in ascending order
- [ ] Top 10 correctly sorted by trend metric
- [ ] No duplicate numbers
- [ ] Order updates in real-time

---

### 4. Navigation Bar - Complete Details

**Navbar Container:**
- [ ] Navbar background color correct
- [ ] Navbar height appropriate (50-65px)
- [ ] Navbar padding/spacing balanced
- [ ] Navbar fixed at top or scrolls with page
- [ ] Navbar shadow visible (separates from content)
- [ ] Navbar responsive on mobile

**Logo:**
- [ ] Logo image loads
- [ ] Logo size appropriate
- [ ] Logo positioned left
- [ ] Logo text/icon visible and readable
- [ ] Logo color correct
- [ ] Hover logo → Cursor changes to pointer
- [ ] Click logo → Navigate to homepage

**College Selector (Navbar Version):**
- [ ] Selector visible next to logo
- [ ] Selector background color correct
- [ ] Selector text shows current college
- [ ] Selector width consistent
- [ ] Hover selector → Color changes
- [ ] Click selector → Dropdown opens below
- [ ] Dropdown doesn't cover page content
- [ ] Selected value persists on navigate + back

**Dark Mode Toggle:**
- [ ] Toggle button visible on right
- [ ] Toggle icon (sun/moon) visible
- [ ] Hover toggle → Color changes
- [ ] Click toggle → Theme switches
- [ ] All page colors update immediately
- [ ] Toggle state persists on reload
- [ ] Toggle animation smooth (0.3s)

**Login Button:**
- [ ] Login button visible (if not logged in)
- [ ] Button background color correct
- [ ] Button text "Login" or "Sign In" clear
- [ ] Hover button → Background darkens
- [ ] Click button → Modal/page opens

**User Profile Menu (If Logged In):**
- [ ] Avatar visible and circular
- [ ] Avatar image loads correctly
- [ ] Hover avatar → Cursor pointer
- [ ] Click avatar → Dropdown menu opens
- [ ] Dropdown shows user name and email
- [ ] Logout option visible in dropdown
- [ ] Click outside → Dropdown closes

---

### 4. Animations on Page Load

**Page Load Sequence:**
- [ ] Background image loads first
- [ ] Search bar appears after (fade or slide)
- [ ] College selector appears after search bar
- [ ] Cards section title appears
- [ ] First row of cards fades in together
- [ ] Second row fades in after (staggered timing)
- [ ] Total load animation takes 0.8-1.2 seconds
- [ ] No jank or stuttering during animations
- [ ] Animations complete before user can interact

**Scroll Animations:**
- [ ] Cards fade in as user scrolls to them
- [ ] "Happening Today" section fades in on scroll
- [ ] Scroll is smooth (no jumping)
- [ ] Scroll performance good (60 FPS)

---

### 5. Event Filters & Search

**Filter Panel Styling:**
- [ ] Filter button/dropdown visible
- [ ] Filter icon correct color and size
- [ ] Filter panel background color correct

**Price Filter:**
- [ ] "Free Events" checkbox visible
- [ ] "Paid Events" checkbox visible
- [ ] Click checkbox → Selection toggles
- [ ] Filter count updates immediately

**College Filter:**
- [ ] College list visible in filters
- [ ] Select college → Results filter immediately
- [ ] Multiple colleges can be selected
- [ ] Selected colleges show with highlight

**Results Update:**
- [ ] Filter applied → Cards disappear with fade-out
- [ ] New results load with fade-in
- [ ] Loading spinner appears while fetching
- [ ] No results state shows message
- [ ] Results count displays ("Showing 12 events")

---

## Event Details Page

### 6. Event Header Section

**Hero Image:**
- [ ] Event image loads fully
- [ ] Image covers full width
- [ ] Image height appropriate (300-400px)
- [ ] Image aspect ratio maintained
- [ ] Image has overlay for text readability

**Event Title:**
- [ ] Event title positioned on image
- [ ] Title text color white/readable
- [ ] Title font size large and prominent
- [ ] Title text centered or left-aligned per design

**Back Button:**
- [ ] Back button visible top-left
- [ ] Back button background color correct
- [ ] Back button icon visible (left arrow)
- [ ] Hover button → Background darkens
- [ ] Click button → Navigate back to previous page

---

### 7. Event Information Section

**Event Details Grid:**
- [ ] Event date visible with icon
- [ ] Event time visible
- [ ] Location visible with icon
- [ ] Price visible and highlighted in accent color
- [ ] Price font size larger than other text
- [ ] Organizer name visible
- [ ] Organizer avatar visible
- [ ] Organizer name clickable
- [ ] College name visible
- [ ] All details properly spaced vertically

**Prize Pool Section:**
- [ ] Prize pool amount visible if available
- [ ] Prize amount highlighted in color
- [ ] Prize description visible
- [ ] Prize icon/badge present
- [ ] Hidden if no prize pool

**Organizer Contact Details:**
- [ ] Phone number visible (if provided)
- [ ] Phone icon present
- [ ] Click phone → Call dialog opens
- [ ] Phone number clickable on mobile
- [ ] Email visible (if provided)
- [ ] Email icon present
- [ ] Click email → Email compose opens
- [ ] Email format validated
- [ ] Hidden if organizer didn't provide

**Brochure Section:**
- [ ] Brochure section visible (if uploaded)
- [ ] Download button present
- [ ] Brochure file name displayed
- [ ] File size displayed
- [ ] Click download → Brochure downloads
- [ ] Button disabled if no brochure
- [ ] Section hidden if no brochure

---

### 8. Event Description Section

**Description Text:**
- [ ] Full event description visible
- [ ] Description text color correct
- [ ] Description font size readable (14-16px)
- [ ] Description line-height appropriate (1.5-1.6)

**Read More Button (If Truncated):**
- [ ] "Read More" button visible if text truncated
- [ ] Click button → Text expands
- [ ] Button text changes to "Read Less"
- [ ] Expand/collapse animation smooth

---

### 9. Event Schedule Section

**Schedule Header:**
- [ ] "Schedule" header visible
- [ ] Header font size and weight correct

**Single Day Event:**
- [ ] Date displayed clearly
- [ ] Start time visible
- [ ] End time visible
- [ ] Time format consistent (12-hour or 24-hour)

**Multi-Day Event:**
- [ ] Multiple days listed
- [ ] Each day in separate row/card
- [ ] Day name or number visible
- [ ] Times for each day correct
- [ ] Days in chronological order

---

### 10. Event Registration Button

**Button Styling:**
- [ ] Register button visible and prominent
- [ ] Button background color correct (primary color)
- [ ] Button text color white (clear contrast)
- [ ] Button width full or 80% (responsive)
- [ ] Button height appropriate (44-48px)
- [ ] Button has shadow (depth effect)

**Button Interactions:**
- [ ] Hover button → Background color darkens
- [ ] Hover button shadow → Increases
- [ ] Transition smooth (0.2s)
- [ ] Click button → Navigate to registration form
- [ ] Button cursor changes to pointer

**Button States:**
- [ ] Disabled state if event full (grayed)
- [ ] Disabled button text "Event Full"
- [ ] Disabled button cursor default
- [ ] Registered state shows "Already Registered"
- [ ] Registered button color different (gray)

---

## Registration Page

### 11. Registration Form

**Form Container:**
- [ ] Form background color correct
- [ ] Form padding balanced
- [ ] Form width responsive (full on mobile, 600px on desktop)
- [ ] Form title visible above

**Name Field:**
- [ ] Label "Name" visible
- [ ] Input background color correct
- [ ] Input border color correct
- [ ] Placeholder text visible
- [ ] Focus input → Border highlights (blue/accent)
- [ ] Hover input → Background changes
- [ ] Type name → Text appears correctly
- [ ] Name validation error shows if empty
- [ ] Error message color red, positioned below

**Email Field:**
- [ ] Label "Email" visible
- [ ] Input field present
- [ ] Email validation on submit
- [ ] Error message shows if invalid format
- [ ] Error shows if email already registered

**College Selector in Form:**
- [ ] College selector visible (dropdown)
- [ ] Dropdown opens on click
- [ ] Colleges listed and searchable
- [ ] Select college → Field updates
- [ ] Error shows if college not selected

**Phone Field:**
- [ ] Label "Phone" visible
- [ ] Input field present
- [ ] Numeric keyboard on mobile
- [ ] Placeholder shows format
- [ ] Validation checks phone format

**Payment Options:**
- [ ] Payment option visible if event paid
- [ ] Free registration visible if event free
- [ ] Razorpay button visible for paid events
- [ ] Click payment → Opens Razorpay modal
- [ ] Free register button visible
- [ ] Click free → Direct registration

**Submit Button:**
- [ ] "Register" button visible at bottom
- [ ] Button background color correct
- [ ] Button text white or contrasting
- [ ] Full width or 80%
- [ ] Hover button → Color darkens
- [ ] Click button → Shows loading spinner
- [ ] After submission → Confirmation message
- [ ] After registration → Navigate to confirmation

---

## Payment Modal (Razorpay)

### 12. Payment Modal

**Modal Container:**
- [ ] Modal appears centered
- [ ] Modal background overlay dark/semi-transparent
- [ ] Modal content visible and readable
- [ ] Modal close button (X) visible top-right
- [ ] Close button clickable → Modal closes

**Order Summary:**
- [ ] Event name displayed
- [ ] Event date displayed
- [ ] Price displayed large
- [ ] Currency displayed (₹)
- [ ] Organizer name visible

**Payment:**
- [ ] Razorpay payment button visible
- [ ] Click payment → Razorpay opens
- [ ] After successful payment → Confirmation shows
- [ ] After failed payment → Error message displays
- [ ] Retry button visible after failed payment

---

## Student Dashboard

### 13. Dashboard Layout

**Sidebar Navigation:**
- [ ] Sidebar background color correct
- [ ] Sidebar width appropriate
- [ ] Sidebar items list visible
- [ ] Active tab highlighted (different background)
- [ ] Hover tab → Background color changes
- [ ] Tab icons visible next to text
- [ ] Scroll sidebar if content overflows

**Main Content Area:**
- [ ] Content takes up remaining space
- [ ] Content padding balanced
- [ ] Content header with page title
- [ ] Content background color correct (white/light)
- [ ] Responsive: Sidebar collapses to hamburger on mobile

---

### 14. My Events Tab

**Registered Events Card:**
- [ ] Event image loads
- [ ] Event title visible
- [ ] Event date visible
- [ ] Event time visible
- [ ] Event status visible ("Registered", "Attended", "Upcoming")
- [ ] Status badge color different for each state
- [ ] Card shadow visible
- [ ] Hover card → Shadow increases
- [ ] Click card → Navigate to event details

**Event Actions:**
- [ ] "View Details" button visible
- [ ] "Unregister" button visible
- [ ] Hover unregister → Color changes (red)
- [ ] Click unregister → Confirmation dialog appears
- [ ] Confirm unregister → Event removed from list

**Empty State:**
- [ ] If no events: "No events registered" message visible
- [ ] "Browse Events" link present
- [ ] Click link → Navigate to discovery page

**Sorting:**
- [ ] "Sort by" dropdown visible
- [ ] Options: "Upcoming", "Past", "Date", "Title"
- [ ] Select option → List reorders
- [ ] Default sort is by date (upcoming first)

---

### 15. Saved Events Tab

**Saved Events Display:**
- [ ] Saved/favorited events show in grid
- [ ] Heart icon visible on each card (red/filled when saved)
- [ ] Event image displays
- [ ] Event title visible
- [ ] Event date visible
- [ ] Event price visible
- [ ] Card layout similar to My Events
- [ ] Card shadow visible
- [ ] Hover card → Shadow increases
- [ ] Click card → Navigate to event details

**Heart Icon Interactions:**
- [ ] Heart icon visible on card (top-right or bottom-right)
- [ ] Heart color red (filled) when event saved
- [ ] Heart color gray (outline) when not saved
- [ ] Click heart → Fill state toggles
- [ ] Heart animation on click (briefly enlarge then return)
- [ ] Unsave animation smooth (0.2s)
- [ ] Heart persists state on reload
- [ ] Heart count updates in real-time

**Empty State:**
- [ ] If no saved events: "No saved events" message visible
- [ ] Message centered and readable
- [ ] "Browse Events" link present
- [ ] Click link → Navigate to discovery page
- [ ] Icon/image shown for empty state

**Sorting/Filtering:**
- [ ] "Sort by" dropdown visible
- [ ] Options: "Saved Date", "Event Date", "Title", "Price"
- [ ] Select option → List reorders
- [ ] Default sort is by saved date (most recent first)

---

### 16. Notifications Tab

**Notifications List:**
- [ ] Notifications displayed chronologically (newest first)
- [ ] Each notification has icon
- [ ] Notification title visible
- [ ] Notification timestamp visible ("2 hours ago")
- [ ] Notification text visible
- [ ] Unread notifications have different background
- [ ] Read notifications have lighter background
- [ ] Hover notification → Highlight effect

**Notification Actions:**
- [ ] Click notification → Navigate to related content
- [ ] Mark as read icon visible on hover
- [ ] Click mark as read → Background becomes lighter
- [ ] Delete icon visible on hover
- [ ] Click delete → Notification removed
- [ ] "Mark all as read" button visible

---

### 16A. Notification Center (Bell)

**Bell + Badge:**
- [ ] Bell icon visible in header
- [ ] Unread badge shows count
- [ ] Badge shows "9+" when over 9
- [ ] Badge disappears when all read

**Dropdown List:**
- [ ] Click bell → Dropdown opens
- [ ] Notifications show icon, title, body
- [ ] Timestamp shown per notification
- [ ] Unread items have highlighted background
- [ ] Click item → Marks read and navigates (if action URL)
- [ ] Delete icon removes notification
- [ ] "Mark all as read" marks all
- [ ] "View all notifications" link opens notifications page

---

### 16B. Voice Search

**Mic Control:**
- [ ] Mic button visible
- [ ] Click mic → Browser permission prompt
- [ ] Grant permission → Listening starts
- [ ] Listening state UI changes
- [ ] Stop listening → Mic toggles off

**Command Parsing:**
- [ ] Say "nearby" → Nearby filter applied
- [ ] Say "free" → Price filter set to free
- [ ] Say "paid" → Price filter set to paid
- [ ] Say "today" → Date filter set to today
- [ ] Say a category (tech/cultural/sports/social) → Category filter applied
- [ ] Say college name → College filter applied
- [ ] Transcript text shown while listening

**Errors:**
- [ ] No speech → Error toast
- [ ] Permission denied → Error toast
- [ ] Unsupported browser → Error toast

---

### 16C. Advanced Search Filters

**Search Bar:**
- [ ] Search input visible
- [ ] Typing updates results
- [ ] Placeholder text visible

**Filter Panel:**
- [ ] Filters toggle button visible
- [ ] Date filter input works
- [ ] Location input accepts text
- [ ] Price range buttons toggle
- [ ] Team size buttons toggle
- [ ] Clear filters resets state

---

### 16D. Categories Discovery

**Category Grid:**
- [ ] Categories load from API
- [ ] Each card shows icon or fallback
- [ ] Category name visible
- [ ] Description visible (if enabled)
- [ ] Color theme applied per category

**Selection:**
- [ ] Click category → Selected state
- [ ] Checkmark appears on selected
- [ ] Click again → Deselected
- [ ] Multiple categories selectable

---

### 16E. Nearby Discovery + Radius

**Nearby Tab:**
- [ ] Nearby sub-tab visible in Explore
- [ ] Location permission prompt appears
- [ ] Deny permission → Fallback message
- [ ] Nearby events list renders
- [ ] Nearby colleges list renders

**Radius Selector:**
- [ ] Radius options: 5/10/25/50 km
- [ ] Selected radius highlighted
- [ ] Radius change updates results

---

### 16F. Favorites (Events + Colleges)

**Favorite Events:**
- [ ] Favorites sub-tab visible
- [ ] Favorite events list loads
- [ ] Remove favorite → Event removed
- [ ] Empty state shown when none

**Favorite Colleges:**
- [ ] Favorite colleges list loads
- [ ] Remove college from favorites
- [ ] Empty state shown when none

---

### 16G. Social Share Buttons

**Share Actions:**
- [ ] WhatsApp share opens with text
- [ ] Twitter share opens new window
- [ ] Facebook share opens new window
- [ ] Snapchat share opens new window
- [ ] Instagram shows copy-link toast
- [ ] Event link copied to clipboard

---

### 16H. PWA Install Prompt

**Install Banner:**
- [ ] Install prompt appears when eligible
- [ ] "Install" triggers prompt
- [ ] Accept install → Success toast
- [ ] "Later" hides prompt
- [ ] Prompt does not appear when already installed

---

### 16I. Offline Banners

**Offline States:**
- [ ] Offline banner appears when offline
- [ ] Banner hides when back online
- [ ] Retry indicator animates
- [ ] Offline message is readable

---

## Organizer Dashboard

### 17. Organizer Dashboard

**Organizer Dashboard Layout:**
- [ ] Top navigation bar visible
- [ ] Organizer name shown in top-right
- [ ] Tabs present: "Events", "Registrations", "Attendance", "Analytics"
- [ ] Sidebar navigation visible
- [ ] Dark mode toggle visible (if enabled)
- [ ] Logout button visible
- [ ] Logo clickable → Return to home

**Events Tab (Organizer):**
- [ ] List of organized events visible
- [ ] Each event card shows: title, date, location, attendees
- [ ] Event image visible
- [ ] Status badge: "Active", "Draft", "Completed"
- [ ] Edit button visible per event
- [ ] Delete button visible per event
- [ ] View event details button visible

**Registrations Tab:**

**Dashboard Stats (Top Section):**
- [ ] Total events created count visible
- [ ] Total registrations count visible
- [ ] Active events count visible
- [ ] Each stat in separate card with icon
- [ ] Stat cards have subtle background color
- [ ] Numbers large and prominent (font-size 32+px)
- [ ] Labels below numbers
- [ ] Stat cards responsive (stacked on mobile)

**Create Event Button:**
- [ ] Button visible and prominent (top-right)
- [ ] Button background color primary/accent
- [ ] Button text "Create Event"
- [ ] Button icon visible (+ or pencil)
- [ ] Hover button → Color darkens
- [ ] Click button → Navigate to event creation form

**Events Table/Grid (if applicable):**
- [ ] Column headers visible: "Event Name", "Date", "Registrations", "Status", "Actions"
- [ ] Header background color different
- [ ] Header text bold and uppercase

**Event Row:**
- [ ] Event name visible
- [ ] Event date visible (DD/MM/YYYY format)
- [ ] Registration count visible
- [ ] Status badge visible ("Active", "Draft", "Cancelled", "Past")
- [ ] Status badge colors different for each state
- [ ] Row hover → Subtle background color change
- [ ] All columns properly aligned

**Event Actions (Organizer):**
- [ ] "View" button visible
- [ ] "Edit" button visible
- [ ] "Delete" button visible
- [ ] Button colors distinct
- [ ] Hover buttons → Color changes
- [ ] Click view → Event details opens
- [ ] Click edit → Event edit form opens
- [ ] Click delete → Confirmation dialog appears
- [ ] Confirm delete → Event removed

**Sorting:**
- [ ] Click column header → Sort by that column (ascending)
- [ ] Click again → Sort descending
- [ ] Sort arrow visible in header (↑ or ↓)

**Filtering:**
- [ ] Filter dropdown visible
- [ ] Options: "Active", "Draft", "Past", "Cancelled"
- [ ] Select filter → Table reorders
- [ ] Default shows all or active

**Pagination (if applicable):**
- [ ] Page numbers visible at bottom
- [ ] Current page highlighted
- [ ] Previous/Next buttons visible
- [ ] Click page number → Table shows that page
- [ ] Rows per page selector visible


### 17. Event Creation Form

**Form Layout:**
- [ ] Form sections clearly separated
- [ ] Section headers visible
- [ ] Each section responsive

**Basic Information:**
- [ ] Event name input with label
- [ ] Event description textarea
- [ ] Event category dropdown
- [ ] All inputs have proper validation
- [ ] Error messages appear below invalid inputs
- [ ] Error text color red

**Date & Time:**
- [ ] Event date input (calendar picker)
- [ ] Start time input
- [ ] End time input
- [ ] Multi-day event checkbox
- [ ] Date format consistent (DD/MM/YYYY)
- [ ] Time format consistent (HH:MM)

**Prize Pool:**
- [ ] Prize pool amount input
- [ ] Prize description textarea
- [ ] Prize pool toggle (enable/disable)
- [ ] When disabled, fields gray out

**Organizer Contact Details:**
- [ ] Phone number input with label
- [ ] Email input with label
- [ ] Phone validation (10-13 digits)
- [ ] Email validation
- [ ] Country code option (+91)

**Brochure Upload:**
- [ ] File upload area visible
- [ ] Drop zone styled properly
- [ ] "Choose file" button visible
- [ ] File name shows after upload
- [ ] Delete/clear button visible
- [ ] File size limit shown (e.g., "Max 5MB")
- [ ] Progress bar shows during upload
- [ ] Error message if file too large

**Location:**
- [ ] Location input with map picker
- [ ] Map shows on click
- [ ] Place marker on map → Address fills
- [ ] Type address → Map updates

**Pricing:**
- [ ] Free event toggle visible
- [ ] If free: toggle OFF, no price shown
- [ ] If paid: toggle ON, price input appears
- [ ] Price input number format
- [ ] Price validation (positive number)

**Save & Publish:**
- [ ] "Save Draft" button visible
- [ ] "Publish" button visible (different color)
- [ ] Hover buttons → Color changes
- [ ] Click save → Success message shows
- [ ] Click publish → Event becomes live

---

### 18. Event Edit Form

**Form Content:**
- [ ] All fields pre-populated with current values
- [ ] Layout matches create form
- [ ] All sections present
- [ ] All interactions same as create form

**Status Changes:**
- [ ] Change event status (Active/Draft/Cancelled)
- [ ] Status button visible
- [ ] Click status → Shows status options

**Save Changes:**
- [ ] "Save Changes" button visible
- [ ] Click save → Update confirmation message
- [ ] Changes persist on reload


### 18. Attendance QR Check-in

**QR Code Generation:**
- [ ] QR code generates for each event
- [ ] QR code visible on event details page (organizer view)
- [ ] QR code visible on organizer dashboard
- [ ] QR code black and white (high contrast)
- [ ] QR code size adequate (at least 100x100px)
- [ ] QR code centered on page/card
- [ ] Download QR code option available
- [ ] Print QR code option available

**QR Code Display:**
- [ ] QR code displays on event page
- [ ] Event title visible above QR
- [ ] Event date visible below QR
- [ ] Organizer can see attendance stats next to QR
- [ ] Static QR code (unique per event)

**Check-in via QR:**
- [ ] Camera icon visible on attendance page
- [ ] Click camera → Open device camera
- [ ] Point camera at QR → Scan event code
- [ ] Scan successful → Attendee marked as checked-in
- [ ] Confirmation message shown ("Attendee checked in")
- [ ] Scanned attendee added to attendance list
- [ ] Duplicate scan → Warning message shown
- [ ] Multiple attendees can be scanned in sequence

**Manual Check-in:**
- [ ] Manual check-in option visible (if no QR)
- [ ] Search attendee by name/email
- [ ] Click attendee → Mark as present
- [ ] Bulk check-in option visible
- [ ] Select multiple → Mark all as present

**Attendance Records:**
- [ ] Attendance list displays (name, email, phone, time)
- [ ] Check-in time visible for each attendee
- [ ] Present/Absent status visible
- [ ] Attendee count at top (X attended out of Y registered)
- [ ] Export attendance as CSV available
- [ ] Export attendance as PDF available
- [ ] Search attendee in list
- [ ] Filter: Present/Absent/All
- [ ] Sort: Name, Check-in time, Email

**Attendance Statistics:**
- [ ] Total registrations shown
- [ ] Total checked-in shown
- [ ] No-show count shown
- [ ] Attendance percentage shown
- [ ] Statistics update in real-time

---

### 18A. Event Access Control

**Access Type:**
- [ ] Open vs Restricted toggles
- [ ] Restricted shows criteria panel
- [ ] Match ANY/ALL toggles

**Restrictions:**
- [ ] Add restriction type + value
- [ ] Duplicate restriction blocked
- [ ] Remove restriction works
- [ ] Save without restrictions shows error
- [ ] Save settings success toast

---

### 18B. Event Cancellation / Reschedule

**Cancel Event:**
- [ ] Cancel button opens modal
- [ ] Reason required validation
- [ ] Refund toggle available
- [ ] Confirm cancel sends notification

**Reschedule Event:**
- [ ] Reschedule button opens modal
- [ ] New date required
- [ ] Optional time/venue fields
- [ ] Confirmation toast on success

---

### 18C. Bulk Ticket Packs

**Pack Creation:**
- [ ] Create bulk pack form opens
- [ ] Quantity/base/bulk price validation
- [ ] Bulk price cannot exceed base price
- [ ] Offer title/expiry optional
- [ ] Pack created successfully

**Pack Management:**
- [ ] Pack list loads
- [ ] Edit/update pack works
- [ ] Delete pack confirmation
- [ ] Sold/available counts visible

---

### 18D. Certificate Generation Wizard

**Step 1: Upload Image:**
- [ ] JPG/PNG upload works
- [ ] Upload success message
- [ ] Invalid file shows error

**Step 2: Customize:**
- [ ] Name field draggable
- [ ] Font size, color, alignment applied
- [ ] Preview updates live

**Step 3: Recipients:**
- [ ] Excel upload accepts file
- [ ] Valid/invalid recipients counted
- [ ] Errors shown for invalid rows

**Step 4: Generate:**
- [ ] Generate button creates certificates
- [ ] Progress indicator shown
- [ ] Success toast shows count

**Step 5: Review & Send:**
- [ ] Preview gallery renders
- [ ] Send button triggers email send
- [ ] Success message and reset

---

### 18E. Sponsorship System (Organizer)

**Organizer Packages:**
- [ ] Enable sponsorships toggle
- [ ] Create tiered packages
- [ ] Add deliverables per tier
- [ ] Save package success

**Admin Review + Payouts:**
- [ ] Admin can approve/reject deals
- [ ] Payout request visible
- [ ] Mark payout as paid

---

### 18F. Fests (Organizer)

**Fests List:**
- [ ] Fest cards load
- [ ] Status badges (Active/Ended/Upcoming)
- [ ] Click fest → Detail view

**Create Fest:**
- [ ] Create form opens
- [ ] Required fields validated
- [ ] New fest appears in list

**Submit Event to Fest:**
- [ ] Submit modal opens
- [ ] Select fest and submit
- [ ] Success toast shown

---

## Admin Dashboard

### 19. Advanced Analytics (Admin Dashboard)

**Analytics Overview:**
- [ ] Analytics tab visible in admin dashboard
- [ ] Date range selector visible (From Date, To Date)
- [ ] Preset options: "Today", "Last 7 days", "Last 30 days", "Custom"
- [ ] Select date range → Charts update
- [ ] Export button visible (CSV, PDF)

**User Growth Chart:**
- [ ] Line chart displays
- [ ] X-axis: Dates
- [ ] Y-axis: User count
- [ ] Data points connected by lines
- [ ] Area under line slightly shaded
- [ ] Hover data point → Tooltip shows exact value
- [ ] Tooltip includes date and user count
- [ ] Legend visible (color-coded)

**Event Trends Chart:**
- [ ] Bar chart displays
- [ ] X-axis: Event categories
- [ ] Y-axis: Number of events
- [ ] Each bar different color
- [ ] Hover bar → Tooltip shows value
- [ ] Bars have rounded corners
- [ ] Y-axis grid lines visible

**Revenue Metrics:**
- [ ] Total revenue amount displayed (large font)
- [ ] Revenue breakdown by category (pie chart)
- [ ] Pie slices different colors
- [ ] Hover slice → Highlights and shows percentage
- [ ] Legend shows slice labels
- [ ] Total value shown in pie center

**Attendance Analytics:**
- [ ] Average attendance percentage displayed
- [ ] Highest attended event shown
- [ ] Lowest attended event shown
- [ ] Attendance trend (line chart)
- [ ] Hover line → Shows tooltip with details

**User Activity Summary:**
- [ ] Total registrations count
- [ ] Total events created count
- [ ] Most popular event shown
- [ ] Cards display stats with icons
- [ ] Numbers prominent (large font)

**Filter & Sort:**
- [ ] Filter by event category
- [ ] Filter by college
- [ ] Filter by organizer
- [ ] Select filter → Charts update

**Chart Interactions:**
- [ ] Click legend item → Toggle series visibility
- [ ] Tooltip smooth fade-in (0.2s)
- [ ] Charts responsive (resize with container)
- [ ] No jank when scrolling through charts

**Export Functionality:**
- [ ] Download as CSV button
- [ ] Download as PDF button
- [ ] Export includes date range
- [ ] Export file names include date

---

### 20. Admin Dashboard (Users & Events Management)

**Dashboard Overview:**
- [ ] Total users count visible
- [ ] Total events count visible
- [ ] Stats cards update in real-time
- [ ] Cards have icon, label, number
- [ ] Cards have subtle shadow

**User Management:**
- [ ] User list/table visible
- [ ] Columns: "Name", "Email", "Role", "Status"
- [ ] Header background color distinct
- [ ] User rows with alternating background colors
- [ ] Hover row → Highlight effect
- [ ] User avatar visible on left
- [ ] User status badge (Active/Inactive) with color
- [ ] Search user by name/email visible
- [ ] Filter by role (Student, Organizer, Admin)
- [ ] Sort by column header

**Events Overview:**
- [ ] List of events visible
- [ ] Event name visible
- [ ] Event status visible
- [ ] Event creation date visible
- [ ] Event organizer visible

---

### 20A. Banner Management (Admin)

**Review Queue:**
- [ ] Pending/All filter tabs toggle
- [ ] Banner cards show thumbnail
- [ ] Banner status visible
- [ ] Views/clicks shown
- [ ] Approve button works
- [ ] Reject button works
- [ ] Delete removes banner

---

## Mobile & Animations

### 20. Mobile-Specific Testing (< 768px)
### 21. Mobile-Specific Testing (< 768px)
**Navigation:**
- [ ] Hamburger menu visible on mobile
### 22. Animations & Transitions
- [ ] Click hamburger → Sidebar slides in from left
- [ ] Sidebar has dark overlay behind
### 23. Registration Form Validation
- [ ] Animation smooth (0.3s)

**Layout:**
- [ ] All sections stack vertically
- [ ] Event cards display 1 per row
- [ ] Images scale properly
- [ ] Text remains readable (16px+)
- [ ] No horizontal scroll
- [ ] Buttons full width
- [ ] Modals scale to 95% vw

**Touch Interactions:**
- [ ] Buttons large enough to tap (44px height minimum)
- [ ] Spacing between tappable areas (8px+)
- [ ] Scrolling smooth (no lag)
- [ ] No jank when scrolling

**Performance:**
- [ ] Image lazy loading works
- [ ] Page load time < 3 seconds on 3G
- [ ] No jank when scrolling
- [ ] No unnecessary animations

---

### 21. Animations & Transitions

**Page Transitions:**
- [ ] Navigate page → Fade or slide animation
- [ ] Animation duration 0.2-0.3s
- [ ] Loading spinner appears if page slow

**Scroll Animations:**
- [ ] Scroll down → Elements fade in
- [ ] Scroll is smooth (no jumping)
- [ ] Scroll to top button appears at bottom
- [ ] Click scroll to top → Smooth scroll (0.5s)

**Button Animations:**
- [ ] Click button → Button briefly darkens
- [ ] Feedback immediate (< 100ms)
- [ ] Animation smooth, not stuttering

**Hover Animations:**
- [ ] Hover element → Color changes smoothly (0.2s)
- [ ] Hover button → Shadow increases
- [ ] Hover card → Card lifts up
- [ ] All transitions use ease-out timing

**Loading States:**
- [ ] Loading spinner visible when fetching
- [ ] Spinner animates smoothly (continuous rotation)
- [ ] Spinner color matches theme
- [ ] Loading text visible if long operation

**Success/Error Messages:**
- [ ] Success message fades in
- [ ] Toast positioned top-right
- [ ] Auto-dismisses after 4 seconds
- [ ] Error message appears in red
- [ ] Error stays 6-8 seconds
- [ ] Close button visible on toast

**Modal Animations:**
- [ ] Modal appears with fade-in + scale
- [ ] Overlay fades in
- [ ] Animation duration 0.3s
- [ ] Close modal → Fade-out
- [ ] Smooth ease-in-out timing

---

## Form Validation

### 22. Registration Form Validation

**Empty Field Submission:**
- [ ] Submit empty form → Validation errors show
- [ ] Each invalid field shows error below
- [ ] Error messages red, positioned below input
- [ ] Invalid fields have red border

**Name Field:**
- [ ] Empty name → Error "Name required"
- [ ] Name < 3 characters → Error "Name too short"

**Email:**
- [ ] Empty email → Error "Email required"
- [ ] Invalid format → Error "Invalid email format"
- [ ] Email already registered → Error "Email already in use"

**Phone:**
- [ ] Empty phone → Error "Phone required"
- [ ] Non-numeric → Error "Phone must have numbers"
- [ ] < 10 digits → Error "Phone must be 10+ digits"

**College:**
- [ ] No college selected → Error "Please select college"

**Payment (Paid Events):**
- [ ] Payment method not selected → Error shown
- [ ] Payment processing → Button disabled, spinner shows
- [ ] Payment failed → Error with retry option
- [ ] Payment successful → Confirmation message

---

## Design Consistency

### 23. Color & Typography

**Color Palette:**
- [ ] Primary color consistent throughout
- [ ] Secondary color consistent
- [ ] Success color (green) for success states
- [ ] Error color (red) for errors
- [ ] Text color readable (contrast > 4.5:1)
- [ ] Background colors consistent
- [ ] No random colors used

**Typography:**
- [ ] Heading hierarchy: H1 > H2 > H3 > Body
- [ ] Body text 14-16px
- [ ] Line-height consistent (1.5-1.6)
- [ ] Button text 14-16px
- [ ] Label text 12-14px
- [ ] All fonts load properly
- [ ] Font weights consistent (300, 400, 600, 700)

**Spacing & Layout:**
- [ ] Padding/margins follow 8px grid
- [ ] All elements aligned to grid
- [ ] Vertical rhythm maintained
- [ ] Horizontal alignment consistent
- [ ] White space used effectively

---

## Performance

### 24. Performance Metrics

**Page Load Speed:**
- [ ] Hero visible < 2 seconds
- [ ] Full page load < 4 seconds
- [ ] Lighthouse performance > 80
- [ ] Lighthouse accessibility > 80
- [ ] No console errors
- [ ] No console warnings

**Rendering:**
- [ ] 60 FPS during scroll
- [ ] No jank when animations play
- [ ] Large lists virtualized
- [ ] Images lazy-loaded

**Browser Compatibility:**
- [ ] Chrome desktop ✓
- [ ] Firefox desktop ✓
- [ ] Safari desktop ✓
- [ ] Edge desktop ✓
- [ ] Chrome mobile ✓
- [ ] Safari mobile ✓

**Device Testing:**
- [ ] iPhone SE (375px) ✓
- [ ] iPhone 14 (390px) ✓
- [ ] iPad (768px) ✓
- [ ] Desktop 1920px ✓
- [ ] Desktop 1440px ✓

---

## Accessibility

### 25. Accessibility (A11y)

**Keyboard Navigation:**
- [ ] Tab through all interactive elements
- [ ] Order is logical (left-to-right, top-to-bottom)
- [ ] Focus visible (outline or highlight)
- [ ] Focus color high contrast
- [ ] No keyboard traps
- [ ] Enter key activates buttons
- [ ] Escape closes modals

**Screen Reader:**
- [ ] Page title announced
- [ ] Headings announced with level
- [ ] Images have alt text
- [ ] Buttons have aria-label if no text
- [ ] Form labels associated with inputs
- [ ] Error messages announced
- [ ] Success messages announced

**Color Contrast:**
- [ ] Text contrast > 4.5:1 (WCAG AA)
- [ ] Large text contrast > 3:1
- [ ] Form labels visible (not just placeholder)

---

## Security & Data

### 26. Security Checks

**Input Validation:**
- [ ] SQL injection blocked
- [ ] XSS blocked
- [ ] CSRF token present on forms
- [ ] No sensitive data in localStorage
- [ ] Tokens expire and refresh properly

**Authentication:**
- [ ] Login required for protected pages
- [ ] Logout clears session
- [ ] Refresh token works
- [ ] Unauthorized access redirects to login
- [ ] Cannot access admin pages as student
- [ ] Cannot access organizer features as student

**API:**
- [ ] API endpoints protected with auth
- [ ] Rate limiting works
- [ ] CORS configured correctly
- [ ] HTTPS enforced

---

### 27. Data Persistence

**Registration:**
- [ ] Register for event → Data saved in DB
- [ ] Refresh page → Registration persists
- [ ] Logout and login → Registration still there
- [ ] Organizer can see registration
- [ ] Event attendee count increments
- [ ] Cannot register twice for same event

**Form Data:**
- [ ] Fill form partially → Data saved (draft)
- [ ] Navigate away → Data retained
- [ ] Come back → Form pre-filled
- [ ] Submit form → Data clears after success

---

## Error Handling

### 28. Error Scenarios

**Network Errors:**
- [ ] No internet → Error message shows
- [ ] Slow network → Spinner visible
- [ ] Connection drops during registration → Error + retry
- [ ] Connection drops during payment → Shows pending

**Database Errors:**
- [ ] Database unavailable → "Service unavailable"
- [ ] No search results → Empty state with message
- [ ] Event deleted by organizer → "Event no longer available"

**User Errors:**
- [ ] Try register for full event → "Event full"
- [ ] Try register twice → "Already registered"
- [ ] Try access organizer page as Student → Redirect
- [ ] Try access admin page as non-admin → Redirect

**File Upload:**
- [ ] File > max size → Error message
- [ ] Wrong file type → Error message
- [ ] Progress bar shows during upload
- [ ] Cancel upload → Progress bar disappears

**Payment:**
- [ ] Payment declined → Error with retry
- [ ] Payment timeout → Error with retry
- [ ] Invalid card → Error explaining issue
- [ ] Successful payment → Confirmation email

---

## Summary

Total test cases: 300+ (implemented features only)

**Critical (Must Pass):**
- [ ] Page loads without errors
- [ ] All buttons clickable and functional
- [ ] Form validation works
- [ ] Payment processes successfully
- [ ] No red console errors
- [ ] Responsive on mobile/desktop
- [ ] Authentication/authorization working
- [ ] Data persists after refresh

**High Priority (Should Pass):**
- [ ] All animations smooth
- [ ] All colors consistent
- [ ] 60 FPS during scroll
- [ ] Load time < 4 seconds
- [ ] Keyboard navigation works
- [ ] Accessibility features working

**Nice to Have:**
- [ ] Lighthouse score > 90
- [ ] Performance optimizations

---

**Testing Status**: ___ / 300+ tests passed

**Last Updated**: February 7, 2026
**Tested By**: ___________
**Date**: ___________
