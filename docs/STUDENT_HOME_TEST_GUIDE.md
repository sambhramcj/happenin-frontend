# Student Home Page - Quick Test Guide

> **Last Updated:** February 17, 2026

### 1. Run Migrations
```bash
# PowerShell (Windows)
cd backend
.\scripts\run-home-migrations.ps1

# Bash (Linux/Mac)
cd backend
chmod +x scripts/run-home-migrations.sh
./scripts/run-home-migrations.sh
```

### 2. Verify Database Schema
Check Supabase dashboard for:
- [x] `home_banners` table exists
- [x] `sponsor_analytics` table exists
- [x] `events` table has new columns: `boost_visibility`, `boost_payment_status`, `boost_priority`, `boost_end_date`, `banner_url`, `ticket_price`, `start_date`, `category`
- [x] `sponsors_profile` table has `banner_url` column
- [x] SQL function `get_top_events_by_registrations` exists

### 3. Seed Test Data

#### Home Banners
```sql
INSERT INTO home_banners (image_url, redirect_url, title, is_active, priority, start_date, end_date)
VALUES 
  ('https://your-storage.supabase.co/banner1.jpg', 'https://example.com/event1', 'Featured Event', true, 1, NOW(), NOW() + INTERVAL '30 days'),
  ('https://your-storage.supabase.co/banner2.jpg', 'https://example.com/fest1', 'Upcoming Fest', true, 2, NOW(), NOW() + INTERVAL '30 days'),
  ('https://your-storage.supabase.co/banner3.jpg', NULL, 'Annual Tech Summit', true, 3, NOW(), NOW() + INTERVAL '30 days');
```

#### Boost Events
```sql
UPDATE events 
SET 
  boost_visibility = true,
  boost_payment_status = 'verified',
  boost_priority = 1,
  boost_end_date = NOW() + INTERVAL '15 days'
WHERE id = 'your-event-id-1';

UPDATE events 
SET 
  boost_visibility = true,
  boost_payment_status = 'verified',
  boost_priority = 2,
  boost_end_date = NOW() + INTERVAL '15 days'
WHERE id = 'your-event-id-2';
```

#### Event Categories
```sql
UPDATE events SET category = 'Technical' WHERE title ILIKE '%hack%' OR title ILIKE '%code%';
UPDATE events SET category = 'Cultural' WHERE title ILIKE '%dance%' OR title ILIKE '%music%';
UPDATE events SET category = 'Sports' WHERE title ILIKE '%cricket%' OR title ILIKE '%football%';
UPDATE events SET category = 'Workshop' WHERE title ILIKE '%workshop%' OR title ILIKE '%training%';
```

#### Sponsor Banners
```sql
UPDATE sponsors_profile 
SET banner_url = 'https://your-storage.supabase.co/sponsor-banner.jpg'
WHERE company_name = 'Your Sponsor Company';
```

#### Active Sponsorship Deals
```sql
UPDATE sponsorship_deals
SET 
  visibility_active = true,
  payment_status = 'verified',
  visibility_priority = 1,
  visibility_end_date = NOW() + INTERVAL '20 days'
WHERE sponsor_email = 'sponsor@example.com' AND event_id = 'event-id-with-sponsor';
```

### 4. Test Each Section

#### ✅ Hero Carousel
- [ ] Visit `/dashboard/student`
- [ ] Verify carousel shows 3 banners
- [ ] Check auto-advance (every 5 seconds)
- [ ] Test manual navigation (left/right arrows)
- [ ] Click banner with redirect_url (should open in new tab)
- [ ] Verify pagination dots work

#### ✅ Trending Events
- [ ] Should show top 5 events by registration count
- [ ] Verify college filtering works (if logged in)
- [ ] Check trending badge shows ranking (#1, #2, etc.)
- [ ] Verify registration count displays

#### ✅ Sponsor Spotlight
- [ ] Verify sponsor banner displays
- [ ] Check company logo and info overlay
- [ ] Test auto-rotation (every 8 seconds)
- [ ] Click "View Event" button
- [ ] Verify industry tag displays

#### ✅ Featured Events
- [ ] Should show only boosted events
- [ ] Verify "Featured" badge displays
- [ ] Check gradient border styling
- [ ] Verify payment_status = 'verified' filter works
- [ ] Check boost_end_date enforcement

#### ✅ Fest Discovery
- [ ] Should show only active fests (current date between start/end)
- [ ] Verify LIVE badge animates
- [ ] Check college logo displays
- [ ] Verify category tags show
- [ ] Test "Explore Events" CTA

#### ✅ Category Strip
- [ ] Verify all unique categories display
- [ ] Check event count badges
- [ ] Test category filtering (click different categories)
- [ ] Verify "All Events" shows everything
- [ ] Check active state highlighting

#### ✅ Upcoming Events
- [ ] Should show future events chronologically
- [ ] Verify horizontal scrolling works
- [ ] Check college events prioritized (if logged in)
- [ ] Test organizer attribution displays

#### ✅ Recommended For You
- [ ] Login required - should show empty for guests
- [ ] Verify club events appear first
- [ ] Check college events with preferred categories
- [ ] Test recommendation deduplication
- [ ] Verify 10 event limit

#### ✅ Infinite Event Feed
- [ ] Scroll to bottom
- [ ] Verify more events load automatically
- [ ] Test "Loading more events..." indicator
- [ ] Check "You've reached the end!" message
- [ ] Test category filtering integration
- [ ] Verify 70/30 college/other mix (if logged in)

### 5. API Endpoint Tests

```bash
# Test each API route (replace with your localhost or deployment URL)
BASE_URL="http://localhost:3000"

# Banners
curl "$BASE_URL/api/home/banners"

# Trending
curl "$BASE_URL/api/home/trending"

# Featured
curl "$BASE_URL/api/home/featured"

# Sponsored
curl "$BASE_URL/api/home/sponsored"

# Fest Discovery
curl "$BASE_URL/api/home/fest-discovery"

# Upcoming
curl "$BASE_URL/api/home/upcoming"

# Recommended (requires auth cookie)
curl -H "Cookie: next-auth.session-token=YOUR_TOKEN" "$BASE_URL/api/home/recommended"

# Feed (test pagination)
curl "$BASE_URL/api/home/feed"
curl "$BASE_URL/api/home/feed?cursor=2024-03-15T10:00:00Z"
curl "$BASE_URL/api/home/feed?category=Technical"

# Categories
curl "$BASE_URL/api/home/categories"
```

### 6. Performance Checks

- [ ] **Time to First Byte (TTFB):** < 200ms per API route
- [ ] **Total Page Load:** < 3 seconds on 3G
- [ ] **Lighthouse Score:** > 90 (Performance + Accessibility)
- [ ] **Largest Contentful Paint (LCP):** < 2.5 seconds
- [ ] **Cumulative Layout Shift (CLS):** < 0.1
- [ ] **First Input Delay (FID):** < 100ms

### 7. Mobile Responsive Test

Test on these viewports:
- [ ] Mobile (375x667) - iPhone SE
- [ ] Mobile (390x844) - iPhone 12/13/14
- [ ] Tablet (768x1024) - iPad
- [ ] Desktop (1440x900)
- [ ] Large Desktop (1920x1080)

Check:
- [ ] Grid layouts adapt (1/2/3 columns)
- [ ] Horizontal scrolling works on mobile
- [ ] Cards are touch-friendly (min 44x44px)
- [ ] Text remains readable (min 16px)
- [ ] Images don't overflow

### 8. Authentication States

Test both scenarios:
- [ ] **Logged Out:** Generic recommendations, no college filtering
- [ ] **Logged In:** Personalized recommendations, college-prioritized events

### 9. Error Handling

Test:
- [ ] Empty states for each section (no data)
- [ ] Loading states display correctly
- [ ] Network error handling (disconnect wifi)
- [ ] Invalid cursor in feed (should start fresh)
- [ ] Missing images (should show placeholder)

### 10. Browser Compatibility

Test on:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## 🚨 Common Issues & Fixes

### Issue: "No banners showing"
**Fix:** Verify `home_banners` table has active entries with valid date ranges

### Issue: "Trending events empty"
**Fix:** Ensure events have registrations. Run:
```sql
SELECT e.title, COUNT(er.id) as reg_count
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.title
ORDER BY reg_count DESC
LIMIT 5;
```

### Issue: "Featured events not showing"
**Fix:** Check events have:
- `boost_visibility = true`
- `boost_payment_status = 'verified'`
- `boost_end_date >= NOW()`

### Issue: "Infinite scroll not loading more"
**Fix:** Check browser console for errors. Verify API returns `nextCursor` and `hasMore` fields.

### Issue: "Recommendations empty for logged in user"
**Fix:** User needs club memberships or past event registrations. Seed test data:
```sql
INSERT INTO club_members (club_id, student_email, status)
VALUES ('club-uuid', 'student@example.com', 'approved');
```

## 📊 Success Criteria

All tests pass when:
- ✅ All 9 sections render without errors
- ✅ All API routes return 200 status
- ✅ Database migrations applied successfully
- ✅ Images load properly (no broken images)
- ✅ Infinite scroll works smoothly
- ✅ Category filtering updates feed instantly
- ✅ Mobile responsive on all viewports
- ✅ No console errors
- ✅ Network tab shows < 5s total load time
- ✅ All interactive elements work (carousel, buttons, links)

## 🎉 Ready for Production

Before deploying:
1. ✅ All tests pass
2. ✅ Production database migrations run
3. ✅ Environment variables set
4. ✅ Image CDN configured
5. ✅ Analytics tracking implemented
6. ✅ Database indexes added (performance)
7. ✅ Error monitoring setup (Sentry/LogRocket)
8. ✅ A/B testing framework ready (optional)

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Ready for Testing
