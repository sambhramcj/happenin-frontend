# Organizer Role Smoke Test (Flawless Flow)

Date: 2026-02-23  
Scope: Organizer dashboard tabs + organizer APIs + required DB migrations

## 1) Pre-check

1. Ensure backend migrations include:
   - `24_enable_rls_student_profiles.sql`
   - `25_add_student_profiles_updated_at_trigger.sql`
   - `26_add_organizer_contact_name.sql`
   - `27_create_attendance_table.sql` ✅ required for QR attendance flow
2. Apply migrations from `backend`:
   - `supabase db push`
3. Start app:
   - backend as usual
   - frontend: `npm run dev`
4. Login as organizer user.

## 2) Organizer Dashboard Tab

### Expected
- Page opens without crash.
- 4 snapshot cards render.
- Live/Upcoming table loads.
- No infinite spinner or console errors.

### Verify
- Open `/dashboard/organizer`.
- Confirm event counts and revenue are visible.

## 3) Events Tab (Card View)

### Expected
- Events are shown as cards (not table).
- Card click opens full event details page-state.
- No missing image/layout break.

### Verify
- Click at least 2 event cards.
- Switch between cards quickly.

## 4) Event Detail → Overview

### Expected
- Edit button works.
- Save updates title/description/location/price/dates/max_attendees/sponsorship.
- Participants table loads with status + timestamps.
- CSV and Excel export download successfully.

### Verify
1. Click `Edit Event`.
2. Change title and price; save.
3. Confirm updated value appears in card + detail.
4. Export CSV and Excel; open files and verify columns:
   - Student Email
   - Amount Paid
   - Registration Status
   - Timestamp (ISO)
   - Timestamp (Local)

## 5) Event Detail → Attendance QR

### Expected
- Scanner accepts valid QR.
- Attendance row appears immediately.
- Registration status becomes `checked_in`.

### Verify
1. Scan one valid registration QR.
2. Confirm attendee appears in attendance list.
3. Confirm participant status reflects `checked_in`.

## 6) Event Detail → Volunteers

### Expected
- Volunteer applications load.
- Accept/Reject actions persist.
- Accepted volunteers appear in Certificates tab selection.

### Verify
1. Open Volunteers tab.
2. Accept one pending application.
3. Re-open Certificates tab and confirm accepted volunteer listed.

## 7) Event Detail → Certificates

### Expected
- Certificate wizard opens for participant/volunteer modes.
- Direct issue flow works for accepted volunteer.
- Certificate count updates in events list.

### Verify
1. Toggle `Participants` and `Volunteers` in wizard.
2. Issue one volunteer certificate.
3. Confirm success toast + count increment.

## 8) Event Detail → Sponsorship + Boost

### Expected
- Sponsorship block visible when event has sponsorship enabled.
- Boost request accepts amount + days.
- Status changes to pending and no API crash.

### Verify
1. Enter boost amount and duration.
2. Submit `Pay & Push Event`.
3. Confirm pending status label/message.

## 9) Analytics Tab

### Expected
- Registrations table loads for organizer events.
- No unauthorized or 500 errors for organizer-owned events.

## 10) Sponsorships Tab

### Expected
- Sponsorship summary cards render.
- Payout component renders (including graceful empty state).

## 11) Profile Tab

### Expected
- Account / Help / Guidelines sections switch cleanly.
- No blank or broken panel.

## 12) API Spot Checks (optional, strict)

Validate `200/401/403` behavior for:
- `/api/organizer/events/certificate-counts`
- `/api/organizer/events/[eventId]` (PATCH)
- `/api/organizer/events/[eventId]/boost-request`
- `/api/organizer/attendance/[eventId]`
- `/api/organizer/events/[eventId]/registrations`
- `/api/organizer/volunteers`
- `/api/organizer/volunteers/[eventId]`
- `/api/organizer/volunteers/application/[applicationId]`

## 13) Pass Criteria

Mark as **PASS** only if all are true:
- No tab crashes.
- No blocking 4xx/5xx in organizer happy path.
- Edit/save reflects immediately in UI.
- Attendance scan writes and status updates.
- CSV/Excel export files are valid.
- Certificate issue flow succeeds.
- Boost request succeeds and status updates.
- Sponsorship + payout sections render without breaking.

## 14) Fast Fallback if failure occurs

Capture and share:
- failing tab
- event ID
- API path
- status code
- response JSON
- browser console error

This gives a one-shot reproducible bug report for immediate patching.
