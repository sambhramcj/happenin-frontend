<!-- docs/ORGANIZER_PAYOUT_INDEX.md -->
# Organizer Payout Onboarding - Implementation Index

> **Quick Reference**: All files and resources for Razorpay Route sub-merchant integration  
> **Last Updated**: February 17, 2026

---

## 📋 Quick Navigation

### For Developers
- **Want to understand the architecture?** → [ORGANIZER_PAYOUT_IMPLEMENTATION.md](ORGANIZER_PAYOUT_IMPLEMENTATION.md)
- **Need to set up Razorpay Route?** → [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md)
- **Looking at database schema?** → [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md#5a-organizer-payout-razorpay-route) (Section 5a)
- **External services setup help?** → [EXTERNAL_SERVICES_SETUP.md](EXTERNAL_SERVICES_SETUP.md#razorpay-route-setup-sub-merchant-management)

### For DevOps/System Admins
- **First-time Razorpay Route setup** → [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md#setup-steps)
- **Environment variables needed** → [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md#environment-variables)
- **Deployment checklist** → [ORGANIZER_PAYOUT_IMPLEMENTATION.md](ORGANIZER_PAYOUT_IMPLEMENTATION.md#deployment)

### For Product/Business
- **Business rules (CLUB vs FEST)** → [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md#business-logic)
- **KYC verification flow** → [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md#kyc-verification-flow)
- **Features implemented** → [ORGANIZER_PAYOUT_IMPLEMENTATION.md](ORGANIZER_PAYOUT_IMPLEMENTATION.md#overview)

---

## 📁 Files Created

### Database
```
backend/supabase/migrations/
  └── 15_organizer_razorpay_route.sql
```
**What:** Database schema for organizer payout setup  
**Creates:** `organizers` table, RLS policies, indexes, triggers

### Server-Side Code
```
frontend/src/lib/
  ├── razorpay-route.ts              # Razorpay API wrapper
  └── organizer-helpers.ts            # Validation & utility functions

frontend/src/types/
  └── organizer.ts                    # TypeScript interfaces

frontend/src/app/api/
  ├── razorpay/onboard-organizer/route.ts     # POST - Create sub-merchant
  ├── razorpay/organizer-status/route.ts      # GET - Check KYC status
  └── admin/organizers/route.ts                # GET/PATCH - Admin management
```

### Documentation
```
docs/
  ├── ORGANIZER_PAYOUT_INDEX.md      # This file
  ├── ORGANIZER_PAYOUT_IMPLEMENTATION.md  # Full implementation guide
  ├── RAZORPAY_ROUTE_SETUP.md        # Detailed setup & operations
  ├── DATABASE_SCHEMA.md             # Updated with organizers table
  └── EXTERNAL_SERVICES_SETUP.md     # Updated with Route section
```

---

## 🔧 Configuration Needed

### Environment Variables
Both needed in production `.env` file:

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx
```

**⚠️ CRITICAL**: `RAZORPAY_KEY_SECRET` must NEVER be exposed to frontend

### Database
Apply migrations 01-17:
```bash
supabase db push
```

This creates:
- `organizers` table
- Indexes and constraints
- Row Level Security policies
- Updated `events` table with `organizer_id` foreign key

---

## 🚀 API Endpoints Summary

### Organizer Endpoints (Login Required, Organizer Role)

**Create Payout Setup**
```bash
POST /api/razorpay/onboard-organizer
Content-Type: application/json

{
  "organizer_type": "CLUB" | "FEST",
  "display_name": "string",
  "legal_name": "string (PAN holder name)",
  "pan_number": "string (AAAPA5055K format)",
  "bank_account_number": "string (9-18 digits)",
  "ifsc_code": "string (SBIN0001234 format)",
  "fest_id": "uuid (required if FEST)"
}
```

**Check Status**
```bash
GET /api/razorpay/organizer-status
GET /api/razorpay/organizer-status?organizer_id=uuid
```

### Admin Endpoints (Admin Role Only)

**List All Organizers**
```bash
GET /api/admin/organizers
GET /api/admin/organizers?kyc_status=pending
GET /api/admin/organizers?organizer_type=CLUB
```

**Update KYC Status**
```bash
PATCH /api/admin/organizers

{
  "organizer_id": "uuid",
  "kyc_status": "verified" | "rejected",
  "kyc_rejection_reason": "string (if rejected)"
}
```

---

## 📊 Database Schema

### New Table: `organizers`

**Primary Purpose:** Store sub-merchant account info for payouts

**Key Fields:**
- `id` (UUID) - Primary key
- `organizer_type` (TEXT) - "CLUB" or "FEST" (mutually exclusive logic)
- `user_email` (TEXT) - For CLUB organizers only
- `fest_id` (UUID) - For FEST organizers only
- `pan_number` (TEXT) - Unique per organizer
- `bank_account_number`, `ifsc_code` - Bank details
- `razorpay_account_id` (TEXT) - Sub-merchant ID from Razorpay
- `kyc_status` (TEXT) - "pending", "verified", or "rejected"
- `created_at`, `updated_at`, `kyc_verified_at` - Timestamps

**Constraints:**
- CLUB: `user_email NOT NULL, fest_id IS NULL`
- FEST: `fest_id NOT NULL, user_email IS NULL`
- PAN must be UNIQUE
- Name matching enforced: `legal_name` = bank account holder

**Indexes:** On user_email, fest_id, kyc_status, pan_number, razorpay_account_id

**RLS Policies:**
- CLUB organizers: Read/update own profile (if KYC pending)
- FEST members: Read/update own fest profile (if KYC pending)
- Admins: Full read/write including KYC status updates

### New Link: events.organizer_id

**What:** Optional foreign key in `events` table  
**References:** `organizers.id`  
**Purpose:** Route ticket payments to correct sub-merchant

---

## 🧪 Validation Rules

All validated both client-side and server-side:

### PAN (Permanent Account Number)
- **Format:** 10 characters: AAAPA5055K
- **Regex:** `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **Example:** `AAAPA5055K`

### IFSC (Indian Financial System Code)  
- **Format:** 11 characters: SBIN0001234 (4 letters + 0 + 6 alphanumerics)
- **Regex:** `^[A-Z]{4}0[A-Z0-9]{6}$`
- **Example:** `SBIN0001234`

### Bank Account
- **Length:** 9-18 digits
- **Allowed:** Digits only
- **Example:** `1234567890123`

### Name Matching
- **PAN Holder Name** MUST match **Bank Account Holder Name**
- Fuzzy matching: case-insensitive, normalizes spaces, allows word order variations
- Example: "John Doe Smith" ≈ "John Smith" (accepted if both in longer name)

---

## 📈 Business Logic

### CLUB Events

| Aspect | Rule |
|--------|------|
| **Organizer** | Student club (represented by treasurer) |
| **PAN** | Student treasurer's personal PAN acceptable |
| **Bank Account** | Treasurer's personal account acceptable |
| **Name Match** | Legal name must match bank account holder |
| **Message** | "Student treasurer PAN and bank account are acceptable for club events." |

### FEST Events

| Aspect | Rule |
|--------|------|
| **Organizer** | Fest committee (not individual) |
| **PAN** | College/Trust/Society PAN preferred |
| **Bank Account** | College/Fest account preferred |
| **Name Match** | Legal name must match bank account holder |
| **Message** | "For fest events, please provide college or faculty PAN and bank details." |

---

## ✅ Implementation Checklist

### Database
- [x] Migrations consolidated (17 files)
- [x] `organizers` table with all fields
- [x] RLS policies configured
- [x] Indexes created
- [x] `events.organizer_id` foreign key added

### Code
- [x] Razorpay Route API wrapper
- [x] Validation helpers
- [x] Organizer onboarding API route
- [x] Status check route
- [x] Admin management route
- [x] TypeScript types
- [x] Helper utilities

### Documentation
- [x] This index file
- [x] Full implementation guide
- [x] Razorpay Route setup guide
- [x] Database schema docs
- [x] External services docs

### Still Needed
- [ ] UI Components for organizer onboarding form
- [ ] UI Components for admin KYC review dashboard
- [ ] Integration with event creation flow
- [ ] Automatic transfer creation (payment verification)
- [ ] Tests & QA

---

## 🔒 Security Checklist

- [x] `RAZORPAY_KEY_SECRET` only in backend environment
- [x] HTTP Basic Auth for Razorpay Route API
- [x] RLS policies prevent cross-organizer access
- [x] PAN format validated before API call
- [x] Name matching prevents mismatched accounts
- [x] Admin-only KYC status updates

---

## 🚨 Important Notes

### Razorpay Route Must Be Enabled
- Standard Razorpay account is NOT enough
- Must contact Razorpay support: "Please enable Route for my account"
- Verification: Test curl to `/v1/accounts` endpoint

### KYC is NOT Automatic
- Organizer submits form → Razorpay validates
- Razorpay might auto-verify or request documents
- Admin must manually update `kyc_status` in database
- Future: Webhook integration for automatic updates

### PAN is REQUIRED
- No exceptions for CLUB or FEST
- Both must have valid, unique PAN
- Name matching is strict (Razorpay requirement)

### Payment Routing Not Yet Implemented
- Organizer setup is complete ✅
- Automatic transfer creation needs:
  - Update `src/app/api/payments/verify/route.ts`
  - Call `razorpay.transfers.create()` for organizer share
  - Scheduled for future implementation

---

## 📚 Related Documentation

| Document | When to Read |
|----------|--------------|
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Understanding table structure |
| [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md) | Setting up Razorpay Route |
| [EXTERNAL_SERVICES_SETUP.md](EXTERNAL_SERVICES_SETUP.md#razorpay-route-setup-sub-merchant-management) | External service checklist |
| [ORGANIZER_PAYOUT_IMPLEMENTATION.md](ORGANIZER_PAYOUT_IMPLEMENTATION.md) | Full technical details |
| [AUTH_AND_ROLES.md](AUTH_AND_ROLES.md) | Authentication system |

---

## 🆘 Troubleshooting

### Problem: "Invalid PAN format"
**Cause:** PAN doesn't match AAAPA5055K pattern  
**Solution:** Verify with actual PAN from tax document

### Problem: "Name mismatch"  
**Cause:** PAN holder name doesn't match bank account holder  
**Solution:** Get name from bank account records (passbook/statement)

### Problem: "KYC validation failed"
**Cause:** Razorpay couldn't verify PAN + bank match  
**Solution:** Admin contacts Razorpay support with full details

### Problem: "Route API returning 403"
**Cause:** Route not enabled on Razorpay account  
**Solution:** Contact Razorpay support to enable Route product

---

## 📝 Next Steps

1. **Setup**: Follow [RAZORPAY_ROUTE_SETUP.md](RAZORPAY_ROUTE_SETUP.md)
2. **Test**: Test organizer onboarding with test PAN
3. **UI**: Build organizer onboarding form (NOT YET IMPLEMENTED)
4. **Admin Dashboard**: Build KYC review dashboard (NOT YET IMPLEMENTED)
5. **Transfers**: Implement automatic payment routing to organizers
6. **QA**: Full end-to-end testing with real test accounts

---

## 📞 Contact & Support

**For Razorpay Route Issues:**
- Contact: Razorpay Support (support@razorpay.com)
- Provide: Account ID, Sub-Merchant ID, Error Code
- Response Time: 24-48 hours

**For Happenin-Specific Issues:**
- Check endpoint error responses
- Verify input formatting (PAN, IFSC, account)
- Check Supabase for record creation
- Review RLS policies if access denied

