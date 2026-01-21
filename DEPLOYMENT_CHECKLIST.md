# 🚀 Production Deployment Checklist

## Pre-Deployment (LOCAL TESTING)

### 1. Install & Build
- [ ] Dependencies installed: `npm install` ✓ (bcrypt, upstash packages added)
- [ ] No TypeScript errors: `npm run build`
- [ ] App starts: `npm run dev`

### 2. Password Hashing Testing
- [ ] Login with `student@test.com` / `password123` works
- [ ] Login with wrong password fails
- [ ] Hash function in `src/lib/password.ts` works
- [ ] Password strength validation works

### 3. Rate Limiting Testing (Local)
Set dummy Upstash variables in `.env.local`:
```env
UPSTASH_REDIS_REST_URL=https://test.upstash.io
UPSTASH_REDIS_REST_TOKEN=test
```

- [ ] First 5 login attempts succeed
- [ ] 6th login attempt gets 429 error
- [ ] First 10 payment requests succeed
- [ ] 11th payment request gets 429 error
- [ ] Retry-After header is present

### 4. College Model Testing (Local)
After running migration (see below):
- [ ] Student profile API returns `college` field
- [ ] College info shows name, domain, verified status
- [ ] Null college gracefully handled for old users

### 5. Code Quality
- [ ] No console errors in dev tools
- [ ] No TypeScript warnings: `npx tsc --noEmit`
- [ ] Linting passes: `npm run lint`

---

## Database Migration (STAGING/PRODUCTION)

### 1. Backup First
- [ ] Export current database as backup
- [ ] Screenshot of current schema
- [ ] Save to secure location

### 2. Run Migration
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy entire contents of `frontend/src/lib/db-migrations.sql`
5. Review the SQL (check it looks correct)
6. Execute the query
7. Verify in Table Editor:
   - [ ] `colleges` table created
   - [ ] `users.college_id` column exists
   - [ ] `users.password_hash` column exists
   - [ ] Sample colleges inserted

### 3. Verify Migration
Run these queries in Supabase SQL Editor:

```sql
-- Check colleges table
SELECT * FROM colleges LIMIT 5;

-- Check users table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users';

-- Check test users have password_hash
SELECT email, password_hash IS NOT NULL as has_hash FROM users 
WHERE email IN ('student@test.com', 'organizer@test.com', 'admin@test.com');
```

---

## Environment Configuration

### Staging

Add to `.env.staging`:
```env
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx-staging.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Existing vars (keep as is)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### Production

Add to `.env.production`:
```env
# Upstash Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=https://xxx-prod.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Existing vars (keep as is)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

---

## Deployment Steps

### For Vercel (Recommended)

1. **Push code to git**:
   ```bash
   git add .
   git commit -m "🔐 Implement password hashing, rate limiting, college model"
   git push
   ```

2. **Update environment variables** in Vercel Dashboard:
   - [ ] Go to Project Settings > Environment Variables
   - [ ] Add `UPSTASH_REDIS_REST_URL` (prod)
   - [ ] Add `UPSTASH_REDIS_REST_TOKEN` (prod)
   - [ ] Verify other env vars are set

3. **Trigger deployment**:
   - [ ] Vercel auto-deploys on push
   - [ ] Or manually trigger: Vercel Dashboard > Redeploy
   - [ ] Wait for "Ready" status

4. **Verify deployment**:
   - [ ] Visit production URL
   - [ ] Test login: `student@test.com` / `password123`
   - [ ] Check browser console for errors

### For Self-Hosted

1. Pull latest code: `git pull`
2. Install deps: `npm install`
3. Build: `npm run build`
4. Set environment variables
5. Start: `npm start` or `pm2 start npm --name happenin -- run start`

---

## Post-Deployment Testing

### 1. Smoke Tests (5 minutes after deployment)

- [ ] Login page loads
- [ ] Can login with test account
- [ ] Dashboard shows after login
- [ ] No 500 errors in logs

### 2. Security Feature Tests

```bash
# Test 1: Password Hashing
curl -X POST https://your-domain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"password123"}'
# Should return session token

# Test 2: Rate Limiting (run 3x in quick succession)
for i in {1..3}; do
  curl -X POST https://your-domain.com/api/payments/create-order \
    -H "Content-Type: application/json" \
    -d '{"amount":500}'
done
# Last one should get 429 error

# Test 3: College Info
curl https://your-domain.com/api/student/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should include college object in response
```

### 3. Monitor Logs (1 hour after deployment)

Watch for these errors:
- ❌ "UPSTASH_REDIS_REST_URL is required"
- ❌ "Database column not found: password_hash"
- ❌ "Database column not found: college_id"
- ❌ "connection refused" (rate limiter)

If you see errors:
1. Check environment variables are set
2. Check database migration ran successfully
3. Check Upstash Redis database exists
4. Restart application

---

## Rollback Plan (If Needed)

### Option 1: Quick Revert (Code)
```bash
git revert HEAD
git push  # Vercel auto-deploys
```

This removes rate limiting and password hashing from code.
- Users can still login (falls back to hardcoded roles)
- Database changes remain (harmless)

### Option 2: Full Rollback (Database + Code)
```sql
-- Revert database changes (in Supabase SQL Editor)
ALTER TABLE users DROP COLUMN college_id;
ALTER TABLE users DROP COLUMN password_hash;
DROP TABLE colleges;
```

Then revert code as Option 1.

### Option 3: Emergency Disable (Fastest)
Remove Upstash env vars from production:
- [ ] Vercel Dashboard > Environment Variables
- [ ] Delete `UPSTASH_REDIS_REST_URL`
- [ ] Delete `UPSTASH_REDIS_REST_TOKEN`
- [ ] Redeploy

This disables rate limiting while keeping code.

---

## Monitoring After Deployment

### Metrics to Watch

1. **Rate Limit Hits** (should be very low)
   - Check Upstash dashboard for request counts
   - Expected: ~0-10 per day (legitimate users)
   - Concern: >100 per day (possible attacks or misconfiguration)

2. **Login Failures** (should be low)
   - Monitor auth errors in logs
   - Expected: <1% failure rate
   - Concern: >10% (possible password issues)

3. **API Errors** (should be stable)
   - Monitor 429 responses
   - Monitor 401 responses (auth failures)
   - Compare with baseline before deployment

### Dashboards to Check

- [ ] Upstash: https://upstash.com - Check Redis usage
- [ ] Supabase: Project > Database - Check connection logs
- [ ] Vercel: Project > Analytics - Check error rates
- [ ] Application logs (check application monitoring tool)

---

## Success Criteria

✅ Deployment is successful when:

1. Users can login with password hashing
2. Rate limiting returns 429 on too many requests
3. Student profiles show college info
4. No new errors in logs
5. Performance is stable (no slowdowns)
6. Upstash shows normal Redis usage (<100 connections)

---

## Support & Troubleshooting

### "Too many login attempts" error
✅ Expected - rate limiting is working. User must wait 10 seconds.

### "Database column not found: password_hash"
❌ Migration didn't run. Go back to "Database Migration" section above.

### "Failed to connect to Redis"
❌ Check Upstash environment variables are correct.

### "Login fails for all users"
❌ Check password_hash column has bcrypt hashes for test users.

---

## Final Checklist Before Going Live to Real Users

- [ ] All code deployed
- [ ] All environment variables set
- [ ] Database migration ran successfully
- [ ] Smoke tests passed
- [ ] Logs monitored for 1 hour
- [ ] No spike in error rate
- [ ] Rate limiting working
- [ ] Password hashing working
- [ ] College model working
- [ ] Team tested on production
- [ ] Rollback plan confirmed

---

**Ready to Deploy! 🚀**

Once all items are checked, you're good to open to real users.
