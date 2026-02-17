<!-- docs/ORGANIZER_PAYOUT_IMPLEMENTATION.md -->
# Organizer Payout Onboarding - Implementation Summary

> **Status:** Fully Implemented (February 9, 2026)  
> **Feature:** Razorpay Route Sub-Merchant Integration for Event Payouts  
> **Scope:** CLUB and FEST organizer support with KYC verification

---

## Overview

The Organizer Payout feature enables event organizers (both student clubs and fest committees) to receive direct payouts from ticket sales through Razorpay Route sub-merchant accounts. Payment collection happens to Happenin's main account, which then routes organizer shares to individual sub-merchant accounts.

**Key Principles:**
- PAN is REQUIRED for all sub-merchants
- PAN holder name MUST match bank account holder name
- CLUB organizers: Student PAN + personal bank acceptable
- FEST organizers: College/faculty PAN + college bank required
- KYC verification is manual (admin reviews and approves)

---

## Files Created

### 1. Database Migration
**File:** `backend/supabase/migrations/15_organizer_razorpay_route.sql`

**Purpose:** Create organizer payout infrastructure

**Contains:**
- `organizers` table (uuid PK, organizer_type, pan_number, bank details, razorpay_account_id)
- Indexes on user_email, fest_id, kyc_status, pan_number
- RLS policies (organizers can read/update own, admins can manage KYC)
- Trigger for automatic `updated_at` timestamp
- Foreign key: `events.organizer_id` → `organizers.id`

**Key Constraints:**
- CLUB organizers linked to `users.email`
- FEST organizers linked to `fests.id`
- Mutually exclusive: cannot be both CLUB and FEST
- PAN must be unique across all organizers

---

### 2. Razorpay Route Helper Library
**File:** `frontend/src/lib/razorpay-route.ts`

**Purpose:** Razorpay Route API wrapper and validation utilities

**Exports:**
- `createRazorpaySubMerchant(payload)` - Create sub-merchant account
- `getRazorpaySubMerchantStatus(accountId)` - Check KYC status
- `validatePANFormat(pan)` - Validate PAN string
- `validateIFSCFormat(ifsc)` - Validate IFSC code
- `validateBankAccountFormat(account)` - Validate account number
- `validatePanBankNameMatch(panName, bankName)` - Fuzzy name matching

**Authentication:** HTTP Basic Auth with RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

**Error Handling:** Returns clear, actionable error messages for validation failures

---

### 3. Organizer Onboarding API Route
**File:** `frontend/src/app/api/razorpay/onboard-organizer/route.ts`

**Method:** POST  
**Auth Required:** Organizer role  
**Rate Limit:** Standard API limits

**Input Validation:**
1. Organizer type (CLUB or FEST)
2. PAN format (10 chars: AAAPA5055K)
3. IFSC format (11 chars: SBIN0001234)
4. Bank account format (9-18 digits)
5. FEST ID verification (if FEST)
6. Prevent duplicate organizer for user (CLUB)

**Process:**
1. Validate all input fields
2. Verify user is fest member (if FEST)
3. Check for existing organizer
4. Call Razorpay Route API to create sub-merchant
5. Store in `organizers` table with `kyc_status = pending`
6. Return organizer ID and Razorpay account ID

**Error Responses:**
- 400: Invalid input (PAN, IFSC, account format)
- 400: KYC validation failed (name mismatch)
- 403: User not fest member (for FEST type)
- 409: Organizer already exists
- 500: Razorpay API error or DB error

---

### 4. Organizer Status Check API
**File:** `frontend/src/app/api/razorpay/organizer-status/route.ts`

**Method:** GET  
**Query Params:** `?organizer_id=uuid` (optional)  
**Auth Required:** Organizer or Admin

**Features:**
- Check current organizer profile
- Sync KYC status from Razorpay
- Auto-update database if status changed
- Show KYC rejection reasons if rejected

**Returns:**
- Organizer details
- Current KYC status (pending/verified/rejected)
- Created date and verified date
- Razorpay account ID

---

### 5. Admin Organizers Management API
**File:** `frontend/src/app/api/admin/organizers/route.ts`

**Methods:**
- **GET**: List all organizers (with optional filters)
- **PATCH**: Update organizer KYC status

**GET Filters:**
- `?kyc_status=pending|verified|rejected`
- `?organizer_type=CLUB|FEST`

**GET Response:**
```json
{
  "success": true,
  "organizers": [...],
  "total": 42
}
```

**PATCH Request:**
```json
{
  "organizer_id": "uuid",
  "kyc_status": "verified",
  "kyc_rejection_reason": "string (if rejected)"
}
```

**Admin-Only Access:** Verified via `role = 'admin'` check

---

### 6. TypeScript Types
**File:** `frontend/src/types/organizer.ts`

**Types:**
- `OrganizerType` = "CLUB" | "FEST"
- `KYCStatus` = "pending" | "verified" | "rejected"
- `Organizer` interface
- `OnboardingFormData` interface
- `OnboardingErrors` interface
- `OrganizerStatus` interface
- API response types

**Purpose:** Type-safe organizer operations throughout frontend

---

### 7. Organizer Helper Functions
**File:** `frontend/src/lib/organizer-helpers.ts`

**Functions:**
- `validateOrganizerForm()` - Client-side form validation
- `getOrganizerTypeHelperText()` - UI copy for CLUB vs FEST
- `getKYCStatusMessage()` - User-friendly KYC status messages
- `formatPAN()`, `formatIFSC()` - Display formatting
- `maskBankAccount()` - Hide account for security
- `canReceivePayouts()` - Check payout eligibility
- `buildOnboardingPayload()` - API request builder

**Purpose:** Reusable organizer-related utilities for UI/forms

---

## Documentation Created

### 1. Razorpay Route Setup Guide
**File:** `docs/RAZORPAY_ROUTE_SETUP.md`

**Contents:**
- Prerequisites and setup steps
- Environment variable configuration
- Business logic for CLUB vs FEST
- Payment flow architecture
- API endpoint documentation
- Validation rules with examples
- Testing checklist
- Common errors and solutions
- Security notes

**Target Audience:** DevOps engineers and backend developers

### 2. External Services Setup (Updated)
**File:** `docs/EXTERNAL_SERVICES_SETUP.md`

**Added Section:** "Razorpay Route Setup (Sub-Merchant Management)"

**Contains:**
- Prerequisites
- 7-step setup process
- Verification checklist
- Link to detailed setup guide

### 3. Database Schema (Updated)
**File:** `docs/DATABASE_SCHEMA.md`

**Updates:**
- Consolidated migrations from 34 to 17 files
- Added `organizers` table documentation
- Added table of contents entry for new section
- Documented RLS policies
- Listed integration points with events table

---

## Database Schema

### `organizers` Table

| Column | Type | Purpose | Constraints |
|--------|------|---------|-------------|
| `id` | UUID | Primary key | PK, auto-generated |
| `organizer_type` | TEXT | CLUB or FEST | NOT NULL, CHECK |
| `user_email` | TEXT | Club organizer | FK → users(email), nullable |
| `fest_id` | UUID | Fest organizer | FK → fests(id), nullable |
| `display_name` | TEXT | Club/fest name | NOT NULL |
| `legal_name` | TEXT | PAN holder name | NOT NULL |
| `pan_number` | TEXT | Tax ID | NOT NULL, UNIQUE |
| `bank_account_number` | TEXT | Account | NOT NULL |
| `ifsc_code` | TEXT | Bank code | NOT NULL |
| `razorpay_account_id` | TEXT | Sub-merchant ID | UNIQUE, nullable |
| `kyc_status` | TEXT | Verification status | pending/verified/rejected |
| `kyc_rejection_reason` | TEXT | Failure reason | Nullable |
| `created_at` | TIMESTAMP | Creation | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Last update | Auto-trigger |
| `kyc_verified_at` | TIMESTAMP | Approval date | Nullable |

### Events Table Update

Added column:
```sql
ALTER TABLE events
  ADD COLUMN organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL;
```

**Purpose:** Link events to specific organizer for payout routing

---

## API Endpoints

### Organizer Endpoints

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/razorpay/onboard-organizer` | Create sub-merchant account | Organizer |
| GET | `/api/razorpay/organizer-status` | Check KYC status | Organizer/Admin |

### Admin Endpoints

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/api/admin/organizers` | List all organizers | Admin |
| PATCH | `/api/admin/organizers` | Update KYC status | Admin |

---

## Business Rules

### CLUB Events

**Organizer:** Student club treasurer  
**PAN:** Student's personal PAN acceptable  
**Bank:** Student's personal bank account acceptable  
**Name Match:** Legal name must match bank account holder

**Example:**
```
Display Name: "Coding Club"
Legal Name: "Alice Johnson"  (from her PAN)
PAN: "AAAAA1234A"
Bank Account: In Alice's name
IFSC: "SBIN0001234"
```

**User Message:**
> "Student treasurer PAN and bank account are acceptable for club events."

### FEST Events

**Organizer:** Fest committee (not individual)  
**PAN:** College/Trust/Society PAN preferred  
**Bank:** College account preferred (not personal)  
**Name Match:** Legal name must match bank account holder

**Example:**
```
Display Name: "Tech Fest 2026"
Legal Name: "ABC College Trust"  (from PAN)
PAN: "AAAAA0000A"  (College PAN)
Bank Account: "ABC College - Main Account"
IFSC: "ICIC0000001"
```

**User Message:**
> "For fest events, please provide college or faculty PAN and bank details."

---

## KYC Flow

```
1. Organizer submits onboarding form
   ↓
2. Server validates input (PAN format, IFSC, etc.)
   ↓
3. Creates Razorpay Route sub-merchant
   - Sends to Razorpay API with PAN + bank details
   ↓
4. Stores in DB: kyc_status = "pending"
   ↓
5. Razorpay validates within 24-48 hours
   - Might auto-verify if data matches RBI/bank records
   - Might request additional docs
   ↓
6. Admin checks KYC status via GET /api/admin/organizers
   ↓
7. Admin manually updates:
   - kyc_status = "verified" (if approved by Razorpay)
   - kyc_status = "rejected" with reason (if failed)
   ↓
8. Organizer can now receive payouts from events
```

---

## Implementation Checklist

- [x] Database migration (15_organizer_razorpay_route.sql)
- [x] Razorpay Route helper library (razorpay-route.ts)
- [x] Organizer onboarding API route
- [x] Organizer status check API route
- [x] Admin organizers management API
- [x] TypeScript type definitions
- [x] Helper functions and utilities
- [x] Razorpay Route setup guide
- [x] External services documentation updated
- [x] Database schema documentation updated
- [ ] UI Components for organizer onboarding (pending - forms/pages)
- [ ] UI Components for admin KYC review dashboard (pending)
- [ ] Automatic transfer creation in payment verification (pending - future)
- [ ] Webhook support for automatic KYC sync (pending - future)

---

## Security Considerations

### Secrets Management
- `RAZORPAY_KEY_SECRET` never exposed to client
- Only server-side API routes handle secret
- HTTP Basic Auth used for Razorpay Route API

### Data Protection
- PAN stored securely in database
- Bank account numbers masked in UI
- RLS policies prevent cross-organizer data access
- Admin-only KYC status updates

### Validation
- All input validated server-side
- PAN format verified before Razorpay API call
- Name matching prevents mismatched accounts
- IFSC and bank account format validated

---

## Testing Strategy

### Unit Tests (Recommended)
- PAN format validation
- IFSC format validation  
- Bank account format validation
- Name matching logic (exact + fuzzy)

### Integration Tests
- Create CLUB organizer (happy path)
- Create FEST organizer (happy path)
- Prevent duplicate organizer
- Verify FEST membership check
- Sync KYC status from Razorpay
- Admin KYC status update

### Manual Testing (Using Test Keys)
see RAZORPAY_ROUTE_SETUP.md for checklist

---

## Deployment

### Prerequisites
1. Razorpay Route enabled by support
2. Test environment setup
3. Production database migration applied

### Steps
1. Deploy code with new API routes
2. Apply migrations (01-17) to production database
3. Set environment variables (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
4. Test organizer onboarding with test PAN
5. Monitor admin dashboard for created organizers
6. Manually verify and approve KYC for test organizers
7. Enable for production users

---

## Future Enhancements

### High Priority
- **Automatic Transfer Creation**: Route organizer share to sub-merchant after payment
- **Bulk KYC Sync**: Scheduled job to sync pending KYC statuses
- **Organizer Dashboard**: View pending payouts and settlement status

### Medium Priority
- **Webhook Support**: Auto-update KYC on Razorpay status change
- **Bank Account Changes**: Allow updates with KYC re-verification
- **Settlement History**: Track all transfers to submerchants

### Low Priority
- **Payout Schedule Options**: Weekly/monthly/on-demand settlements
- **Tax Document Integration**: Auto-generate 1099 forms
- **Multi-Currency Support**: Support international payouts

---

## Support & Contact

**For Questions About:**
- **Razorpay Integration**: See [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md)
- **Database Schema**: See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **API Endpoints**: Use inline code comments in route files
- **Deployment**: See [EXTERNAL_SERVICES_SETUP.md](EXTERNAL_SERVICES_SETUP.md)

**Emergency Contact**
- Razorpay Support: support@razorpay.com
- Supabase Support: support@supabase.io
