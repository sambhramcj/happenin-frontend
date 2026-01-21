#!/bin/bash

# Setup script for security implementations
# Run this after deploying to production

echo "🔐 Security Implementation Setup"
echo "================================"
echo ""

# Check environment variables
echo "1️⃣  Checking environment variables..."
if [ -z "$UPSTASH_REDIS_REST_URL" ]; then
  echo "⚠️  UPSTASH_REDIS_REST_URL not set"
  echo "   Get from: https://upstash.com > Redis Database > REST URL"
else
  echo "✅ UPSTASH_REDIS_REST_URL is set"
fi

if [ -z "$UPSTASH_REDIS_REST_TOKEN" ]; then
  echo "⚠️  UPSTASH_REDIS_REST_TOKEN not set"
  echo "   Get from: https://upstash.com > Redis Database > REST Token"
else
  echo "✅ UPSTASH_REDIS_REST_TOKEN is set"
fi

echo ""
echo "2️⃣  Dependencies check..."
npm list bcrypt > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ bcrypt is installed"
else
  echo "❌ bcrypt is NOT installed"
  echo "   Run: npm install bcrypt"
  exit 1
fi

npm list @upstash/ratelimit > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ @upstash/ratelimit is installed"
else
  echo "❌ @upstash/ratelimit is NOT installed"
  echo "   Run: npm install @upstash/ratelimit @upstash/redis"
  exit 1
fi

echo ""
echo "3️⃣  Next steps:"
echo ""
echo "   A. Run database migrations in Supabase:"
echo "      1. Go to https://supabase.com > Your Project > SQL Editor"
echo "      2. Create a new query"
echo "      3. Copy contents of: src/lib/db-migrations.sql"
echo "      4. Execute the query"
echo ""
echo "   B. Test the implementations:"
echo "      1. npm run dev"
echo "      2. Try logging in (password hashing)"
echo "      3. Try creating multiple payments quickly (rate limiting)"
echo "      4. Check API responses for X-RateLimit headers"
echo ""
echo "✅ Setup complete! Read SECURITY_IMPLEMENTATION.md for details."
