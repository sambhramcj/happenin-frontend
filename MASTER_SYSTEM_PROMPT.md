# 🔒 HAPPENIN — MASTER SYSTEM PROMPT

**Copy this prompt whenever generating code or asking for implementation help.**

---

## Core Principles

This app must **strictly follow**:

1. **Design Tokens** - No hardcoded colors, spacing, or animations
   - Colors: Use semantic tokens from `src/styles/tokens.css`
   - Motion: Use durations from `motion.config.ts` with `getMotionDuration()` for accessibility
   - Gestures: Use thresholds from `gesture-tokens.json`
   - Loading: Use presets from `loading-tokens.json`
   - Offline: Use rules from `offline-tokens.json`

2. **Motion & Accessibility** - Always respect `prefers-reduced-motion`
   - Check `window.matchMedia("(prefers-reduced-motion: reduce)").matches`
   - Use `getMotionDuration(base)` to scale all animations
   - Disable auto-looping animations if reduced motion enabled
   - Never animate text opacity below 0.7

3. **Offline Handling** - Assume worst-case connectivity
   - Save all forms to IndexedDB immediately (not localStorage)
   - Use `saveRegistrationIntent()` for critical flows
   - Never block UI waiting for network
   - Show `OfflineBanner` when offline
   - Retry with exponential backoff (3 attempts max)

4. **Retry Policies** - Configurable, never infinite
   - Max 3 attempts with exponential backoff
   - Initial delay: 1200ms, multiplier: 1.8x, max: 5000ms
   - Analytics/non-critical work: fire-and-forget (never block)
   - Payment verification: 3 attempts, then mark "pending_webhook"

5. **Payment Safety** - Sacred and immutable
   - Always verify Razorpay signature with timing-safe HMAC
   - Never lose payment data
   - Never create duplicate registrations
   - Always mark webhook-pending state immediately
   - Server handles all business logic, never trust client

6. **Error Messages** - Specific, not generic
   - ❌ "Error 400"
   - ✅ "Email must be valid"
   - ❌ "Network error"
   - ✅ "You're offline · Actions will retry automatically"
   - ❌ "Loading..."
   - ✅ "Verifying payment…"

7. **User Intent** - Always preserved
   - Forms saved to IndexedDB on every keystroke
   - Registration intents queued offline
   - Analytics tracked offline
   - Session recovery on re-login (form data restored)

8. **Haptic Feedback** - Sparingly, meaningfully
   - Payment verified: `triggerHaptic('success')`
   - Offline detected: `triggerHaptic('warning')`
   - Payment failed: `triggerHaptic('error')`
   - Never haptic on scroll
   - Never repeated vibrations

---

## File Structure & Rules

### `src/lib/`

| File | Purpose | Never Change |
|------|---------|--------------|
| `motion.config.ts` | All animation durations, easing, variants | Locked tokens |
| `accessibility-tokens.json` | WCAG compliance rules | minSize: 44px, contrast: 4.5 |
| `haptics-tokens.ts` | Mobile vibration patterns | success/warning/error durations |
| `offline.ts` | IndexedDB queue, online detection, retry logic | addToQueue, saveRegistrationIntent, processQueue |
| `analytics-queue.ts` | Event tracking (offline + online) | Dedup by eventId+type+timestamp |
| `api.ts` | Centralized API client | stale-while-revalidate for lists, retry logic |
| `validations.ts` | Zod schemas for all forms | Used before submission |
| `razorpay.ts` | Razorpay integration (unchanged) | Timing-safe verification |

### `src/components/`

| Component | Responsibility |
|-----------|-----------------|
| `OfflineBanner` | Global offline indicator + retry/verifying indicators |
| `Skeleton` | Loading state with shimmer (respects reduced motion) |
| `QueryProvider` | React Query setup with retry config |

### `src/app/api/`

All endpoints must:
- Validate input with Zod schema
- Return specific error messages
- Handle offline scenarios gracefully
- Never trust client data

Payment endpoint (`src/app/api/payments/verify/route.ts`):
- Verify Razorpay signature with timing-safe HMAC
- Mark registration as "pending_webhook"
- Webhook async updates to "confirmed"

---

## Implementation Checklist

When adding a feature:

- [ ] User journey defined (normal + offline)
- [ ] Form data saved to IndexedDB
- [ ] Validation uses Zod schema
- [ ] API calls use `api.ts` client
- [ ] Motion respects `getMotionDuration()`
- [ ] Reduced motion case handled
- [ ] Haptics used for key events (payment, error)
- [ ] Errors are specific, not generic
- [ ] No 500 errors shown to user
- [ ] Payment flow never blocks on webhook
- [ ] Tests pass (especially offline scenario)

---

## Disaster Scenarios

See `DISASTER_SCENARIOS.md` for:

1. **Fest Day Traffic Spike** → Use stale-while-revalidate caching
2. **Razorpay Delay** → Mark "pending_webhook", auto-refresh
3. **Internet Drop Mid-Registration** → Queue intent, resume on reconnect
4. **Duplicate Payment Prevention** → Idempotent orderId
5. **Form Validation Errors** → Specific error messages
6. **Session Expiry** → Redirect to login, preserve form

---

## Code Example: Adding a Form

```typescript
// ✅ CORRECT PATTERN

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { membershipSchema } from '@/lib/validations';
import { saveRegistrationIntent } from '@/lib/offline';
import { triggerHaptic } from '@/lib/haptics-tokens';
import { motion } from 'framer-motion';
import { getMotionDuration, buttonVariants } from '@/lib/motion.config';

export function MembershipForm({ eventId }: { eventId: string }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(membershipSchema),
  });

  const onSubmit = async (data) => {
    try {
      // Save intent offline first
      await saveRegistrationIntent({
        eventId,
        ticketType: data.type,
        metadata: data,
      });

      // Then submit
      const result = await api.createOrder({
        eventId,
        finalPrice: data.price,
      });

      triggerHaptic('payment');
      // Show success UI
    } catch (error) {
      triggerHaptic('error');
      // Error already specific from Zod or API client
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <motion.button
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        transition={{ duration: getMotionDuration(0.12) }}
      >
        Register
      </motion.button>
    </form>
  );
}
```

---

## Code Example: Handling Offline

```typescript
// ✅ CORRECT PATTERN

import { useOnlineStatus } from '@/lib/offline';

export function RegistrationForm() {
  const isOnline = useOnlineStatus();

  return (
    <form>
      {!isOnline && (
        <div className="p-3 bg-warningSoft text-warning text-sm">
          You're offline. Form will submit automatically when online.
        </div>
      )}
      <input ... />
    </form>
  );
}
```

---

## Forbidden Patterns

❌ **Never do these:**

```typescript
// ❌ Hardcoded animation duration
animate={{ x: 100 }}
transition={{ duration: 0.2 }}

// ✅ Use tokens instead
animate={{ x: 100 }}
transition={{ duration: getMotionDuration(motionConfig.transition.medium.duration) }}

---

// ❌ localStorage for persistent data
localStorage.setItem('queue', JSON.stringify(actions))

// ✅ Use IndexedDB via offline.ts
await addToQueue(action)

---

// ❌ Generic error message
throw new Error('Failed to save')

// ✅ Specific, user-facing message
throw new APIError('Email must be valid', 400)

---

// ❌ Blocking on webhook
async function completeRegistration() {
  await verifyPaymentWebhook(); // BLOCKS!
  showSuccess();
}

// ✅ Mark pending, auto-refresh on webhook
// Payment verified immediately
markRegistrationPending();
showSuccess();
// Webhook updates in background, React Query refetches

---

// ❌ Infinite retries
while (true) {
  try { ... }
  catch { retry() }
}

// ✅ Max 3 retries with backoff
await retryWithBackoff(fn, 'Action', 3)

---

// ❌ No reduced motion support
const variants = {
  animate: { opacity: [0.5, 1, 0.5], transition: { duration: 1.2 } }
}

// ✅ Respect accessibility
const variants = {
  animate: { 
    opacity: [0.5, 1, 0.5], 
    transition: { duration: getMotionDuration(1.2) } 
  }
}
// If reduced motion enabled: duration becomes 0.36s (1.2 * 0.3)
```

---

## Testing Before Deployment

```typescript
// Test offline scenario
1. Disable WiFi mid-form
2. Form data should persist
3. Turn WiFi back on
4. Form should auto-submit

// Test payment webhook delay
1. Create payment
2. Don't call webhook for 30s
3. UI should show "pending" state
4. After webhook, UI auto-updates

// Test reduced motion
1. Enable "Reduce motion" in OS settings
2. Verify animations reduced to 30% speed
3. Verify auto-loop animations disabled

// Test haptics
1. Enable haptics on phone
2. Complete payment → vibrate (success)
3. Fail payment → vibrate (error)
```

---

## Command Reference

```bash
# Run development
npm run dev

# Check build
npm run build

# Type check
npx tsc --noEmit

# Check accessibility
# (Manual: test with keyboard + screen reader)
```

---

## When in Doubt

Ask yourself:

1. **Will this work offline?** (If no → use IndexedDB)
2. **Is this error message specific?** (If no → use Zod + API validation)
3. **Does this respect reduced motion?** (If no → wrap in reduced motion check)
4. **Could this lose user data?** (If yes → persist to IndexedDB)
5. **Could this break payment flow?** (If yes → ask lead first)

---

## Support Resources

- **Motion**: See `src/lib/motion.config.ts` for all variants
- **Validation**: See `src/lib/validations.ts` for all schemas
- **Offline**: See `src/lib/offline.ts` for queue API
- **Disasters**: See `DISASTER_SCENARIOS.md` for edge cases
- **Colors**: See `src/styles/tokens.css` for semantic tokens

---

**This system ensures your app doesn't break trust during festival day.**
