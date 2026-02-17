<!-- docs/RAZORPAY_ROUTE_SETUP.md -->
# Razorpay Route Setup Guide

> **Status:** Implementation Guide for Organizer Payout Onboarding  
> **Last Updated:** February 17, 2026  
> **Technology:** Razorpay Route (Sub-Merchant Management)

---

## Overview

Happenin uses **Razorpay Route** to enable event organizers (both club and fest) to directly receive payouts from ticket sales. This replaces manual settlement and enables automated, KYC-verified sub-merchant accounts.

**Key Architecture:**
- Platform (Happenin) receives payments via Razorpay standard orders
- Platform routes percentage to organizer's sub-merchant account
- Sub-merchants have independent Razorpay accounts with KYC verification
- Payouts happen automatically or manually based on settlement frequency

---

## Prerequisites

1. **Razorpay Business Account** (not just standard account)
2. **Razorpay Route activated** by Razorpay support
3. **API Keys:** Key ID and Key Secret for Route API access
4. **KYC completed:** Platform must be KYC-verified to create sub-merchants

---

## Setup Steps

### Step 1: Verify Razorpay Route Access

1. Log into Razorpay Dashboard
2. Go to **Settings → API Keys** → **Generate Key** (if not already generated)
3. Copy both **Key ID** (public) and **Key Secret** (private)
4. Contact Razorpay support to ensure **Route** feature is enabled on your account

**Status Check:** Try this curl command:

```bash
curl -H "Authorization: Basic <base64(keyid:keysecret)>" \
  https://api.razorpay.com/v1/accounts
```

If successful, you get an empty array or existing sub-merchant list. If you get `403 Forbidden`, Route is not enabled.

### Step 2: Environment Variables

Set these in your `.env.local` or production environment:

```bash
# Server-side only (NEVER expose to client)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
```

These are used by:
- `src/lib/razorpay-route.ts` - Sub-merchant API calls
- `src/app/api/razorpay/onboard-organizer/route.ts` - Organizer onboarding

### Step 3: Database Migration

Run migration 15:

```sql
-- backend/supabase/migrations/15_organizer_razorpay_route.sql
-- Creates organizers table and RLS policies
```

Apply via Supabase CLI:

```bash
supabase db push
```

### Step 4: Test Sub-Merchant Creation

Use the test API endpoint:

```bash
curl -X POST http://localhost:3000/api/razorpay/onboard-organizer \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "organizer_type": "CLUB",
    "display_name": "Coding Club",
    "legal_name": "John Doe",
    "pan_number": "AAAPA5055K",
    "bank_account_number": "1234567890123",
    "ifsc_code": "SBIN0001234"
  }'
```

Expected response:

```json
{
  "success": true,
  "organizer_id": "uuid-here",
  "razorpay_account_id": "acc_xxxxxxxxxx",
  "kyc_status": "pending"
}
```

---

## Business Logic

### CLUB Organizers

**Who:** Student clubs creating events  
**Bank Account:** Student treasurer's personal account acceptable  
**PAN:** Student treasurer's PAN acceptable  
**Validation:** PAN holder name must match bank account holder name

**Example:**
```
Display Name: Coding Club
Legal Name: John Doe (from PAN)
PAN: AAAPA5055K
Bank Account: John Doe's personal account
IFSC: SBIN0001234
```

**Message to User:**
> "Student treasurer PAN and bank account are acceptable for club events."

### FEST Organizers

**Who:** Fest committees (not individual students)  
**Bank Account:** College/Fest account preferred (not personal)  
**PAN:** College/Trust PAN or faculty coordinator's PAN  
**Validation:** PAN holder name must match bank account holder name

**Example:**
```
Display Name: Tech Fest 2026
Legal Name: ABC College Trust
PAN: AAAAA0000A (college PAN)
Bank Account: ABC College Main Account
IFSC: ICIC0000001
```

**Message to User:**
> "For fest events, please provide college or faculty PAN and bank details."

---

## KYC Verification Flow

### User Flow

```
1. Organizer submits onboarding form
   ↓
2. API creates Razorpay Route sub-merchant
   - Sends PAN + bank details
   - Razorpay validates against RBI/bank databases
   ↓
3. kyc_status = "pending" (stored in DB)
   ↓
4. Razorpay performs KYC (24-48 hours)
   - Might auto-verify if data matches
   - Might request documents
   ↓
5. Admin queries Razorpay via GET /api/razorpay/organizer-status
   ↓
6. Admin updates kyc_status to "verified" or "rejected"
   ↓
7. Organizer can now receive payouts
```

### Admin Dashboard

Check `GET /api/admin/organizers?kyc_status=pending` to see pending KYC.

Update via `PATCH /api/admin/organizers`:

```bash
curl -X PATCH http://localhost:3000/api/admin/organizers \
  -H "Content-Type: application/json" \
  -d '{
    "organizer_id": "uuid-here",
    "kyc_status": "verified"
  }'
```

---

## Payment Flow Integration

### Current (Old) Flow
```
Ticket Payment → Razorpay → Happenin Account
                                ↓
                            Manual payout to organizer
```

### New Flow (Razorpay Route)
```
Ticket Payment → Razorpay Standard Order
                        ↓
              Happenin receives full amount
                        ↓
         API call: razorpay.transfers.create()
                        ↓
         Auto-transfer to organizer's sub-merchant
                        ↓
         Organizer receives funds in their bank account
                        ↓
         Razorpay fees: Deducted from Happenin's account
```

### Implementation Notes

- **NOT YET IMPLEMENTED:** Automatic transfer creation
- Currently only handles sub-merchant creation
- Transfer creation will be added in payment verification route:
  - `src/app/api/payments/verify/route.ts`
- Use `razorpay.transfers.create()` with:
  - `account`: organizer's `razorpay_account_id`
  - `amount`: organizer's share of ticket price
  - `currency`: "INR"

---

## API Endpoints

### 1. Organizer Onboarding

**POST** `/api/razorpay/onboard-organizer`

**Auth:** Organizer role required

**Request:**
```json
{
  "organizer_type": "CLUB" | "FEST",
  "display_name": "string",
  "legal_name": "string (PAN holder)",
  "pan_number": "string",
  "bank_account_number": "string",
  "ifsc_code": "string",
  "fest_id": "uuid (required if FEST)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "organizer_id": "uuid",
  "razorpay_account_id": "acc_xxxxx",
  "kyc_status": "pending"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "string",
  "details": {
    "field": "pan_number",
    "message": "Invalid PAN format"
  }
}
```

### 2. Check Organizer Status

**GET** `/api/razorpay/organizer-status?organizer_id=uuid`

**Auth:** Organizer or Admin role required

**Response:**
```json
{
  "success": true,
  "organizer": {
    "id": "uuid",
    "organizer_type": "CLUB",
    "display_name": "string",
    "legal_name": "string",
    "kyc_status": "pending" | "verified" | "rejected",
    "razorpay_account_id": "acc_xxxxx",
    "created_at": "ISO timestamp"
  }
}
```

### 3. Admin: List Organizers

**GET** `/api/admin/organizers?kyc_status=pending&organizer_type=CLUB`

**Auth:** Admin only

**Response:**
```json
{
  "success": true,
  "organizers": [...],
  "total": 42
}
```

### 4. Admin: Update KYC Status

**PATCH** `/api/admin/organizers`

**Auth:** Admin only

**Request:**
```json
{
  "organizer_id": "uuid",
  "kyc_status": "verified",
  "kyc_rejection_reason": "string (if rejected)"
}
```

---

## Validation Rules

### PAN Format
- 10 alphanumeric characters
- Pattern: `AAAPA5055K` (letters-numbers-letter)
- Validated by: `validatePANFormat()` in `src/lib/razorpay-route.ts`

### IFSC Code
- 11 characters exactly
- Format: 4 letters + "0" + 6 alphanumerics
- Example: `SBIN0001234`
- Validated by: `validateIFSCFormat()`

### Bank Account
- 9-18 digits
- Validated by: `validateBankAccountFormat()`

### Name Matching
- PAN holder name MUST approximately match bank account holder name
- Fuzzy matching allows:
  - Case-insensitive comparison
  - Extra spaces normalized
  - Word order permutations (John Doe ≈ Doe John)
- Validated by: `validatePanBankNameMatch()`

---

## Common Errors & Solutions

### Error: "Invalid PAN format"
**Cause:** PAN doesn't match pattern AAAPA5055K  
**Solution:** Verify PAN with user's actual PAN number from tax document

### Error: "Name mismatch"
**Cause:** PAN holder name doesn't match bank account holder  
**Solution:** Get name from bank account records (passbook/statement)

### Error: "KYC validation failed"
**Cause:** Razorpay couldn't verify PAN + bank match  
**Solution:** Admin contacts Razorpay support with organizer details

### Error: "You already have a payout setup"
**Cause:** User already created an organizer profile  
**Solution:** Check existing profile via `GET /api/razorpay/organizer-status`

---

## Testing Checklist

- [ ] Test PAN validation (valid + invalid formats)
- [ ] Test IFSC validation (valid + invalid)
- [ ] Test bank account validation (9-18 digits)
- [ ] Test CLUB organizer creation
- [ ] Test FEST organizer creation (requires fest_id)
- [ ] Test name matching (exact + fuzzy matches)
- [ ] Test KYC status sync from Razorpay
- [ ] Test admin KYC status update
- [ ] Test role-based access (organizer vs admin)

---

## Razorpay Route API Reference

**Authentication:** HTTP Basic Auth (KeyID:KeySecret)

**Base URL:** `https://api.razorpay.com/v1`

### Create Sub-Merchant

```bash
POST /accounts
Content-Type: application/json

{
  "business_name": "string",
  "business_type": "partnership" | "association",
  "email": "string",
  "phone": "string",
  "pan": "string",
  "bank_account": {
    "account_number": "string",
    "ifsc_code": "string",
    "beneficiary_name": "string"
  },
  "notes": {}
}
```

### Fetch Sub-Merchant Status

```bash
GET /accounts/{account_id}
```

Returns: Account object with `kyc_status` field

### Available KYC Statuses

| Status | Meaning | Action |
|--------|---------|--------|
| `initiated` | KYC started | Wait for Razorpay |
| `verified` | KYC passed | Organizer can receive payouts |
| `suspended` | Account suspended | Contact support |
| `rejected` | KYC failed | Get details from `requirements` field |

---

## Security Notes

⚠️ **CRITICAL:** API Keys  
- `RAZORPAY_KEY_SECRET` must NEVER be exposed to frontend
- Only use in server-side API routes
- Rotate keys periodically
- Use different keys for test vs. live environments

⚠️ **Data Protection**  
- Store PAN securely (don't log or expose)
- Bank account numbers masked in UI
- RLS policies prevent cross-organizer data access

---

## Future Enhancements

1. **Automatic Transfers**
   - Implement `razorpay.transfers.create()` on payment verification
   - Route organizer share automatically

2. **Bulk KYC Sync**
   - Scheduled job to sync all pending KYC statuses
   - Update KYC status without manual admin intervention

3. **Settlement Dashboard**
   - Organizer view of pending payouts
   - Manual settlement trigger for admins
   - Bank account changes (requires KYC re-verification)

4. **Webhook Support**
   - Razorpay webhooks for KYC status changes
   - Auto-update organizer profile in real-time

---

## Support

For Razorpay Route API issues:
- Contact Razorpay Support
- Provide: Account ID, Sub-Merchant ID, Error Code
- Expected response time: 24-48 hours

For Happenin-specific issues:
- Check error response `details.message`
- Verify input formats (PAN, IFSC, etc.)
- Check Supabase for organizer record creation
