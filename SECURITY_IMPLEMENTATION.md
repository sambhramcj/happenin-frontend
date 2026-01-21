# Security Implementation Guide

This document outlines the 3 critical security implementations added to the app.

## 1. Password Hashing with Bcrypt

### What Changed
- Passwords are now hashed using bcrypt with 10 salt rounds before storage
- Authentication compares hashed passwords instead of plain text
- New column: `password_hash` in users table

### Files Modified
- `src/app/api/auth/[...nextauth]/route.ts` - Now verifies hashed passwords
- `src/lib/password.ts` - New utility functions for password hashing

### Environment Setup
No additional environment variables needed for bcrypt.

### How to Use in Signup (Example)
```typescript
import { hashPassword, validatePasswordStrength } from "@/lib/password";

// Validate password strength
const error = validatePasswordStrength(password);
if (error) {
  throw new Error(error);
}

// Hash before storing
const passwordHash = await hashPassword(password);
await supabase.from("users").insert({
  email,
  password_hash: passwordHash,
  role: "student",
});
```

## 2. Rate Limiting with Upstash

### What Changed
- API endpoints now have rate limiting to prevent abuse
- Payment routes: 10 requests per 10 seconds
- Login routes: 5 requests per 10 seconds
- Other API routes: 30 requests per minute

### Files Modified
- `src/middleware.ts` - Implements rate limiting for all API routes

### Environment Setup (REQUIRED)
Get these from [upstash.com](https://upstash.com):

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Steps:**
1. Sign up at https://upstash.com (free tier: 10k requests/day)
2. Create a Redis database
3. Copy REST URL and Token from dashboard
4. Add to `.env.local`

### Testing Rate Limiting
```bash
# This will be rate limited after 5 attempts in 10 seconds
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
```

## 3. College Identity Model

### What Changed
- New `colleges` table for verified colleges
- Users now have `college_id` linking to colleges table
- Replaces domain-based college inference

### Files Modified
- `src/lib/db-migrations.sql` - Migration script for colleges table

### Database Setup (REQUIRED)
Run the migration script in Supabase SQL Editor:
1. Go to Supabase Dashboard > SQL Editor
2. Create a new query
3. Copy contents of `src/lib/db-migrations.sql`
4. Execute

This will:
- Create `colleges` table
- Add `college_id` and `password_hash` columns to `users` table
- Create necessary indexes
- Insert sample colleges
- Setup RLS policies

### Using College in Your App
```typescript
// Get user with college info
const { data } = await supabase
  .from("users")
  .select("email, college_id, colleges(name, domain)")
  .eq("email", userEmail)
  .single();

console.log(data.colleges.name); // "National Institute of Technology Karnataka"
```

## Testing All Security Features

### 1. Test Password Hashing
```bash
# Login should work with correct password
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"password123"}'

# Login should fail with wrong password
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"wrongpassword"}'
```

### 2. Test Rate Limiting
```bash
# Should return 429 after 5 attempts in 10 seconds
for i in {1..10}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/payments/create-order \
    -H "Content-Type: application/json" \
    -d '{"amount":500}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.5
done
```

### 3. Test College Model
```bash
# Fetch user with college info
curl http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Migration Checklist

Before launching to production:

- [ ] Run migration script in Supabase (creates colleges table)
- [ ] Add Upstash environment variables to production environment
- [ ] Test rate limiting on staging
- [ ] Test password hashing with new user signup
- [ ] Verify college selection works in organizer signup
- [ ] Test payment flow (should respect rate limits)
- [ ] Monitor error rates in first hour of deployment

## Rollback Instructions

If something breaks, here's how to rollback:

### Rollback Password Hashing
```sql
-- Keep using password_hash, just don't verify it (allow all)
-- This is dangerous but allows reverting quickly
```

### Rollback Rate Limiting
Remove environment variables:
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Requests will still work without rate limiting.

### Rollback College Model
```sql
-- Keep the college_id column but don't enforce it
-- Existing data will continue to work
```

## Support & Troubleshooting

### "Too many login attempts" error
- This is rate limiting working correctly
- User must wait 10 seconds before trying again
- Logs will show: "Rate limiter error" if Redis is down

### "Database column not found: password_hash"
- Run migration script in Supabase
- Verify migration completed successfully

### Password hashing fails on signup
- Check bcrypt is installed: `npm list bcrypt`
- Check password meets strength requirements (8+ chars, uppercase, lowercase, number)

### Upstash errors
- Verify environment variables are set correctly
- Check Redis database exists in Upstash dashboard
- Check rate limits aren't exceeded (free tier: 10k/day)
