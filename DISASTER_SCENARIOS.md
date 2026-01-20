# 🚨 DISASTER SCENARIOS — FEST-DAY READY

This document defines how the app behaves when things go wrong. **This app must never break trust during a festival.**

---

## ⚠️ Scenario A: Fest Day Traffic Spike

**Symptoms**
- API responses slow (>2s)
- Database overwhelmed
- Users refreshing repeatedly
- Payment timeouts

### ✅ Current Implementation

1. **Event list caching** (`api.ts`)
   - Uses `stale-while-revalidate` strategy
   - Serves cached data during traffic spikes
   - Fetches fresh data in background
   - TTL: 5 minutes

2. **Registration form persistence** (`offline.ts`)
   - Form data saved to IndexedDB immediately
   - User never loses their input
   - Can retry silently once online

3. **Payment handling**
   - Mark payment as "Pending verification" immediately
   - Never show loading spinners >5 seconds
   - Always show `Verifying payment…` not generic spinner
   - Webhook confirms in background

### ❌ What We Never Do

- ❌ Show 500 error screens
- ❌ Force reload page
- ❌ Block on API responses
- ❌ Show generic "Loading..." spinners for >5 seconds
- ❌ Ask user to retry manually

---

## ⚠️ Scenario B: Razorpay Delay / Webhook Lag

**Symptoms**
- Payment verification takes >10 seconds
- Webhook arrives 30+ seconds later
- User doesn't know if payment succeeded

### ✅ Correct Flow

1. **User completes payment** → Razorpay returns orderId + signature
2. **Client verifies immediately** → Show success animation (haptics: success)
3. **Mark registration "Pending verification"**
4. **Show success page but grey out actions** (can't download ticket yet)
5. **Background: Server receives webhook** → Updates to "Confirmed"
6. **Auto-refresh UI** → Ticket becomes live
7. **User never wonders** "Did it work?"

### Implementation Details (`src/app/api/payments/verify/route.ts`)

```typescript
// Current behavior (CORRECT):
1. Client sends: { orderId, signature, eventId }
2. Server verifies signature timing-safe (HMAC comparison)
3. Mark registration status: "pending_webhook"
4. Return: { success: true, status: 'pending_webhook' }
5. Webhook arrives → Updates to "confirmed"
6. React Query refetch → UI updates automatically
```

### ❌ What We Never Do

- ❌ Block user waiting for webhook
- ❌ Ask "retry payment?"
- ❌ Show error if webhook is slow
- ❌ Let user create duplicate registration
- ❌ Delete registration if webhook takes time

---

## ⚠️ Scenario C: Internet Drop Mid-Registration

**Symptoms**
- User filling form → Internet cut
- Or: Payment initiated → Connection lost
- Or: Page refresh during offline state

### ✅ Correct Flow

1. **Form data saved** → Every keystroke → IndexedDB (not localStorage)
2. **User sees offline banner** → "You're offline · Actions will retry automatically"
3. **Payment intent queued** → IndexedDB queue (not lost)
4. **Connection returns** → Silently retry queued actions
5. **User gets confirmation** → No re-filling forms

### Implementation Files

**Form persistence** (`offline.ts`)
```typescript
// addToQueue() saves registration intent
// Includes: eventId, ticketType, metadata
// Persists even if user closes browser
```

**Analytics tracking** (`analytics-queue.ts`)
```typescript
// Track "registration_intent" offline
// When online: flush queue in order
// Dedup by eventId + timestamp
```

**Offline detection** (`offline.ts`)
```typescript
// useOnlineStatus hook pings every 5s
// Shows banner if offline
// Retries queued actions on reconnect
```

### ❌ What We Never Do

- ❌ Lose registration intent
- ❌ Force user to re-enter form
- ❌ Show error modal for offline state
- ❌ Use localStorage (bad for long-term storage)
- ❌ Ask "Retry?" (should be automatic)

---

## ⚠️ Scenario D: Duplicate Payment Prevention

**Symptoms**
- User clicks pay multiple times
- Network lag makes user panic
- Or: Browser refresh on payment page

### ✅ Implementation

**Idempotent payment creation** (`api.ts`)
```typescript
// Each registration gets unique payment ID
// Razorpay orderId tied to single registration
// Client-side: disable button during payment
// Server-side: reject duplicate orderId
```

**Action queue deduplication** (`analytics-queue.ts`)
```typescript
// Dedup events by: eventId + type + timestamp (1s window)
// If user refreshes during payment, same event tracked once
```

### ❌ What We Never Do

- ❌ Allow user to pay twice
- ❌ Create duplicate registrations
- ❌ Miss payment in database
- ❌ Lose receipt

---

## ⚠️ Scenario E: Form Validation Errors

**Symptoms**
- Invalid email format
- Missing required fields
- Server-side validation failure

### ✅ Correct Behavior

1. **Client validation** (Zod schemas)
   - Immediate feedback
   - No server round-trip
   - Accessible error messages

2. **Server validation** (backend)
   - Double-check all inputs
   - Business logic validation
   - Return specific errors (not "Invalid")

3. **User sees**
   - Red highlight on field
   - Clear error: "Email must be valid"
   - Not: "Error 400"

### Files

- `src/lib/validations.ts` - Zod schemas for all forms
- `src/app/api/*/route.ts` - Server validation on receive

---

## ⚠️ Scenario F: Authentication Expiry

**Symptoms**
- Session expires during registration
- User logged out silently
- Or: Trying to access protected endpoint

### ✅ Implementation

**NextAuth handling**
- Session refresh automatic (slides on each request)
- If truly expired → redirect to login
- Preserve user's form data before redirect
- Resume after login

### ❌ What We Never Do

- ❌ Silently fail to save data
- ❌ Lose work in progress
- ❌ Generic "Unauthorized" error

---

## 🔒 LOCKED RULES (NEVER CHANGE)

### ✅ ALWAYS

```
1. Show system state
   - "You're offline" (not "Network error")
   - "Verifying payment…" (not "Loading...")
   - "Retry #2 of 3" (when retrying)

2. Preserve user intent
   - Save form data offline
   - Queue registration intents
   - Remember last action

3. Retry silently where safe
   - API calls → retry 3x with backoff
   - Registration intent → retry offline
   - Analytics → fire-and-forget (never block)

4. Defer non-critical work
   - Analytics doesn't block payment
   - Image upload doesn't block registration
   - Webhook doesn't block success UI

5. Keep payments sacred
   - Never lose payment data
   - Never create duplicates
   - Always verify signature timing-safe
   - Always mark webhook-pending state
```

### ❌ NEVER

```
1. Generic error messages
   - ❌ "Error 400"
   - ✅ "Email must be valid"

2. Blocking modals for network
   - ❌ Modal that can't be dismissed
   - ✅ Banner that dismisses on reconnect

3. More than 3 retries
   - ❌ Infinite retry loops
   - ✅ 3 attempts then alert user

4. Double payment possibility
   - ❌ Allow clicking pay twice
   - ✅ Disable button during payment

5. Reload to fix issues
   - ❌ "Reload to retry"
   - ✅ Auto-retry silently

6. Show 500 errors to users
   - ❌ "Internal Server Error"
   - ✅ "Verification delayed · Trying again"

7. Ask user to retry payment
   - ❌ "Your payment failed, retry?"
   - ✅ Queue intent, retry automatically

8. Lose form data offline
   - ❌ Form resets
   - ✅ Form persists in IndexedDB
```

---

## 📊 Monitoring These Scenarios

### What to watch in production

1. **Offline banner shown >1%** → WiFi issues in venue
2. **Retry attempts >2x** → Server load spike
3. **Payment pending >30s** → Razorpay lag (expected during peak)
4. **Form resets** → Check IndexedDB persistence
5. **Duplicate registrations** → Check idempotency
6. **Analytics queue >100** → Network quality issues

### Log locations

- **Offline events**: `offline.ts` → `useOnlineStatus`
- **Retries**: `offline.ts` → `retryWithBackoff`
- **Payment verification**: `src/app/api/payments/verify/route.ts`
- **Analytics**: `analytics-queue.ts` → `flushAnalyticsQueue`

---

## 🎯 Test Checklist Before Fest Day

- [ ] Turn off WiFi mid-form → form data persists
- [ ] Turn off WiFi during payment → shows offline, queues action
- [ ] Slow 3G connection → no timeouts, uses cache
- [ ] Click pay button 5 times → only charges once
- [ ] Webhook delayed 30s → UI shows pending, auto-refreshes
- [ ] Close browser during registration → data survives on re-open
- [ ] Reduced motion enabled → no animations
- [ ] Haptics enabled on phone → successful payment vibrates
- [ ] Form validation fails → specific error shown
- [ ] Session expires → redirect to login, form preserved

---

## 📝 Master System Prompt

When implementing any feature, paste this:

> "This app must strictly follow defined design tokens, motion tokens, offline handling rules, retry policies, accessibility constraints, and payment safety rules.
> No generic errors.
> No blocking offline modals.
> No breaking payment flow.
> Preserve user intent at all times.
> Never lose data.
> Never show 500 errors.
> Always verify payments securely."

---

## 🚀 You Built This Correctly

If you follow these rules:

✅ Fest day won't break the app
✅ Users will trust the payment system
✅ Organizers will recommend it
✅ You can scale to 10,000 registrations/hour
✅ You'll sleep during the festival

This is **production-grade**, not just functional.
