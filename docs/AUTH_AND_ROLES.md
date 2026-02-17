# AUTH_AND_ROLES.md

> **Status:** Production System Documentation  
> **Last Updated:** February 17, 2026  
> **Auth Provider:** NextAuth v4 with JWT strategy

---

## Overview

Happenin uses **NextAuth v4** with **JWT session strategy** for authentication. User roles determine access to different dashboard views and API routes.

**Auth Providers:**
- Credentials (email/password with bcrypt)
- Google OAuth

**Role System:** 4 roles (student, organizer, admin, sponsor)

---

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [Role System](#2-role-system)
3. [NextAuth Configuration](#3-nextauth-configuration)
4. [Middleware & Route Protection](#4-middleware--route-protection)
5. [Database Role Storage](#5-database-role-storage)
6. [RLS Policies](#6-rls-policies-row-level-security)
7. [Session Management](#7-session-management)
8. [Security Considerations](#8-security-considerations)

---

## 1. Authentication Flow

### Login Flow (Credentials Provider)

```
1. User submits email + password → /api/auth/signin
2. NextAuth CredentialsProvider.authorize() called
3. Fetch user from users table (with password_hash)
4. bcrypt.compare(password, password_hash)
5. If match: return { id: email, email, role }
6. JWT token created with { email, role }
7. Session object populated with email + role
8. Redirect to role-based dashboard
```

**Code Location:** [frontend/src/app/api/auth/[...nextauth]/route.ts](frontend/src/app/api/auth/[...nextauth]/route.ts)

```typescript
CredentialsProvider({
  async authorize(credentials) {
    // Fetch user with password_hash
    const { data: user } = await supabase
      .from("users")
      .select("email, password_hash, role, college_id")
      .eq("email", credentials.email)
      .single();

    // Verify password
    const passwordMatch = await bcrypt.compare(
      credentials.password,
      user.password_hash
    );

    if (!passwordMatch) return null;

    return {
      id: user.email,
      email: user.email,
      role: user.role,
    };
  }
})
```

---

### Login Flow (Google OAuth)

```
1. User clicks "Sign in with Google"
2. Google OAuth consent screen
3. User approves → Google redirects with auth code
4. NextAuth exchanges code for user info
5. signIn() callback triggered
6. Check if user exists in users table
7A. If exists: fetch role from DB
7B. If new: create user with role='student', password_hash=''
8. JWT token created with { email, role }
9. Session object populated
10. Redirect to /dashboard/student
```

**Code Location:** [frontend/src/app/api/auth/[...nextauth]/route.ts](frontend/src/app/api/auth/[...nextauth]/route.ts)

```typescript
async signIn({ user, account }) {
  if (account?.provider === "google") {
    const { data: existingUser } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", user.email)
      .single();

    if (!existingUser) {
      // Auto-create user as 'student'
      await supabase.from("users").insert({
        email: user.email,
        role: "student",
        password_hash: "", // OAuth users don't need password
      });
    }
  }
  return true;
}
```

**⚠️ CRITICAL:** All new OAuth users default to `role='student'`. No mechanism exists to create organizers/admins via OAuth—must be done manually in database.

---

## 2. Role System

### Role Definitions

| Role | Dashboard Route | Capabilities |
|------|----------------|--------------|
| **student** | `/dashboard/student` | Browse events, register, view tickets, manage profile, favorite events, apply for volunteer roles, view certificates |
| **organizer** | `/dashboard/organizer` | Create events, manage registrations, check-in attendees, create sponsorship packages, manage volunteers, generate certificates, view analytics |
| **admin** | `/dashboard/admin` | Approve banners, manage colleges, view all users/events, handle disputes, view admin logs, manage fests |
| **sponsor** | `/sponsor/*` | ⚠️ Partial implementation—sponsor role exists but sponsor dashboard not fully confirmed |

**Database Storage:** `users.role` column (TEXT, CHECK IN ('student', 'organizer', 'admin'))

⚠️ **WARNING:** Sponsor role exists in some code paths but is NOT enforced in the users table CHECK constraint. Unclear if sponsors use a separate authentication flow or if this role is vestigial.

---

### Role Assignment

**Credentials Signup:**
- Role selected during signup: `/api/auth/signup`
- Allowed roles: student, organizer
- Admin role cannot be self-assigned (must be manually set in database)

**OAuth Signup:**
- Auto-assigned: `role='student'`
- Cannot change role during OAuth flow
- Manual DB update required to promote to organizer/admin

**⚠️ LIMITATION:** No built-in role promotion UI. Role changes must be done directly in Supabase dashboard or via admin API (if implemented).

---

## 3. NextAuth Configuration

### File Location
`frontend/src/app/api/auth/[...nextauth]/route.ts`

### Providers

#### 1. CredentialsProvider
```typescript
CredentialsProvider({
  name: "Credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    // Fetch user from users table
    // Verify bcrypt password
    // Return { id, email, role }
  }
})
```

**Password Hashing:** bcrypt (10 rounds)  
**Password Storage:** `users.password_hash` column

---

#### 2. GoogleProvider
```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
})
```

**Environment Variables Required:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**OAuth Callback:** Auto-creates user with `role='student'` if not exists

---

### Callbacks

#### `signIn({ user, account })`
**Purpose:** Auto-create OAuth users in database

**Logic:**
- If provider is Google and user doesn't exist → INSERT into users table
- Default role: `student`
- Default password_hash: empty string

---

#### `jwt({ token, user, account })`
**Purpose:** Attach role to JWT token

**Logic:**
- For OAuth users: fetch role from database
- For Credentials users: use role from authorize() return
- Store in `token.role`

**Token Structure:**
```typescript
{
  email: string,
  role: 'student' | 'organizer' | 'admin'
}
```

---

#### `session({ session, token })`
**Purpose:** Populate session object with role

**Logic:**
- Copy `token.email` → `session.user.email`
- Copy `token.role` → `session.user.role`

**Session Structure:**
```typescript
{
  user: {
    email: string,
    role: 'student' | 'organizer' | 'admin'
  }
}
```

---

### Session Configuration

```typescript
session: {
  strategy: "jwt",
}
```

**Storage:** JWT tokens (no server-side session storage)  
**Lifetime:** ⚠️ Not explicitly configured (uses NextAuth defaults: 30 days)  
**Security:** Signed with `NEXTAUTH_SECRET`

---

### Pages Configuration

```typescript
pages: {
  signIn: "/auth",
}
```

**Custom Auth Page:** `/auth` (Next.js App Router page)  
**Default NextAuth Pages:** Disabled (using custom UI)

---

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXTAUTH_SECRET` | JWT signing secret | ✅ YES |
| `NEXTAUTH_URL` | Canonical site URL | ✅ YES (production) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | 🟡 Optional (if using OAuth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | 🟡 Optional (if using OAuth) |

---

## 4. Middleware & Route Protection

### File Location
`frontend/src/proxy.ts` (⚠️ Not in standard `middleware.ts` location)

### Purpose
Role-based route protection for `/dashboard/*` routes

### Implementation

```typescript
export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const path = req.nextUrl.pathname;

    // Redirect users to correct dashboard based on role
    if (path.startsWith("/dashboard/student") && role !== "student") {
      // Redirect to their correct dashboard
    }
    // Similar for organizer and admin
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token; // Require token for dashboard
        }
        return true; // Allow other routes
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

### Route Protection Logic

| Path Accessed | User Role | Result |
|---------------|-----------|--------|
| `/dashboard/student` | student | ✅ Allow |
| `/dashboard/student` | organizer | ❌ Redirect to `/dashboard/organizer` |
| `/dashboard/student` | admin | ❌ Redirect to `/dashboard/admin` |
| `/dashboard/organizer` | organizer | ✅ Allow |
| `/dashboard/organizer` | student | ❌ Redirect to `/dashboard/student` |
| `/dashboard/admin` | admin | ✅ Allow |
| `/dashboard/admin` | student | ❌ Redirect to `/dashboard/student` |
| `/dashboard/*` | (no token) | ❌ Redirect to `/auth` |

**⚠️ IMPORTANT:** Middleware only protects `/dashboard/*` routes. API routes must implement their own auth checks.

---

### API Route Protection

API routes use `getServerSession(authOptions)` for authentication:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as any).role;
  
  if (userRole !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Proceed with protected logic
}
```

**Common Checks:**
- Student-only: `role === 'student'`
- Organizer-only: `role === 'organizer'`
- Admin-only: `role === 'admin'`
- Sponsor-only: `role === 'sponsor'` (⚠️ usage unclear)

---

## 5. Database Role Storage

### Users Table

**Schema:** (from migrations 01)
```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  password TEXT,              -- Legacy field (unused?)
  password_hash TEXT,         -- bcrypt hash
  role TEXT NOT NULL CHECK (role IN ('student', 'organizer', 'admin')),
  college_id UUID REFERENCES colleges(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Role Validation:** CHECK constraint enforces 3 roles only (student, organizer, admin)

⚠️ **INCONSISTENCY:** Code references `role='sponsor'` in multiple places, but database CHECK constraint does not allow it. Sponsor users likely stored differently or constraint needs updating.

---

### RLS on Users Table

⚠️ **WARNING:** Row Level Security (RLS) NOT explicitly enabled on `users` table in migrations. This is a potential security risk if users can query the table directly.

**Recommended Policy (Not Implemented):**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT
  USING (email = auth.jwt()->>'email');

-- No one can update their own role
CREATE POLICY "Users cannot change role" ON users
  FOR UPDATE
  USING (email = auth.jwt()->>'email')
  WITH CHECK (role = (SELECT role FROM users WHERE email = auth.jwt()->>'email'));
```

---

## 6. RLS Policies (Row Level Security)

### Overview

Most tables use RLS to restrict data access based on user role and email. Policies use `auth.jwt()->>'email'` and `auth.jwt()->>'role'` to identify current user.

---

### Common RLS Patterns

#### Pattern 1: Users Can Only Access Own Data
```sql
-- Example: student_certificates
CREATE POLICY "Students can view own certificates" ON student_certificates
  FOR SELECT
  USING (student_email = auth.jwt() ->> 'email');
```

**Tables Using This:**
- `student_profiles`
- `student_certificates`
- `favorite_events`
- `favorite_colleges`
- `registrations` (for students)
- `volunteer_applications` (for students)
- `notification_preferences`
- `user_preferences`

---

#### Pattern 2: Organizers Can Access Their Event Data
```sql
-- Example: events
CREATE POLICY "Organizers can manage own events" ON events
  FOR ALL
  USING (organizer_email = auth.jwt() ->> 'email');
```

**Tables Using This:**
- `events` (organizers manage their events)
- `sponsorship_packages` (via event ownership)
- `certificate_templates` (via event ownership)
- `volunteer_applications` (organizers view applicants for their events)
- `banners` (organizers view their event banners)

---

#### Pattern 3: Admin Full Access
```sql
-- Example: colleges
CREATE POLICY "Admin manage colleges" ON colleges
  FOR ALL
  USING ((SELECT role FROM users WHERE email = auth.jwt() ->> 'email') = 'admin');
```

**Tables Using This:**
- `colleges`
- `banners` (approve/reject)
- `organizer_bank_accounts` (verify)
- `sponsorship_payouts` (manage)
- `admin_logs`
- `user_reports`
- `event_reports`
- `payment_disputes`

---

#### Pattern 4: Public Read Access
```sql
-- Example: events
CREATE POLICY "Public can view active events" ON events
  FOR SELECT
  TO public
  USING (true);
```

**Tables Using This:**
- `events` (all users browse events)
- `colleges` (public college listings)
- `banners` (approved, active banners only)
- `event_categories` (public category browsing)
- `volunteer_assignments` (public view for event pages)
- `festival_analytics` (public fest stats)

---

### RLS Policy Warnings

⚠️ **Tables WITHOUT RLS (Potential Risks):**
1. **`users`** - No RLS policies found (users could query all emails/roles?)
2. **`payments`** - No RLS policies documented (payment data may be exposed?)
3. **`event_access_control`** - No RLS policies documented
4. **`event_locations`** - Has RLS but policies may be incomplete

⚠️ **Tables with PARTIAL RLS:**
- `sponsorship_deals` (RLS not documented in migrations—verify in production)
- `bulk_ticket_packs` (no RLS policies found)
- `bulk_ticket_purchases` (no RLS policies found)

**Recommendation:** Audit all tables for RLS coverage before fest.

---

## 7. Session Management

### Session Lifecycle

1. **Creation:** Login → JWT token created → stored in HTTP-only cookie
2. **Storage:** Client-side cookie (name: `next-auth.session-token`)
3. **Validation:** Each request → NextAuth validates JWT signature
4. **Renewal:** ⚠️ Not explicitly configured (relies on NextAuth defaults)
5. **Expiration:** ⚠️ Default 30 days (not explicitly set in config)

---

### Session Access

**Client-Side (React Server Components):**
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth");
  }

  const userEmail = session.user.email;
  const userRole = session.user.role;
}
```

**Client-Side (React Client Components):**
```typescript
"use client";
import { useSession } from "next-auth/react";

export default function Component() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Spinner />;
  if (status === "unauthenticated") return <LoginPrompt />;
  
  const userEmail = session?.user?.email;
  const userRole = session?.user?.role;
}
```

---

### Session Persistence

**Cookie Name:** `next-auth.session-token` (production) or `__Secure-next-auth.session-token` (HTTPS)  
**Cookie Attributes:**
- HttpOnly: ✅ Yes (prevents XSS access)
- Secure: ✅ Yes (HTTPS only in production)
- SameSite: ⚠️ Not explicitly configured (uses NextAuth default: `lax`)

---

### Logout Flow

```
1. User clicks logout
2. Client calls signOut() from next-auth/react
3. NextAuth deletes session cookie
4. Redirect to /auth
```

**Code Example:**
```typescript
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ callbackUrl: "/auth" })}>
  Logout
</button>
```

---

## 8. Security Considerations

### ✅ **Strong Security Practices**

1. **Password Hashing:** bcrypt with 10 rounds
2. **JWT Signing:** NEXTAUTH_SECRET required
3. **HTTP-Only Cookies:** Session tokens not accessible via JavaScript
4. **Role-Based Access Control:** Middleware + API checks
5. **OAuth Provider:** Google OAuth for password-less auth

---

### ⚠️ **Security Gaps**

#### 1. RLS Not Enabled on Critical Tables
**Risk:** Users may directly query sensitive tables via Supabase client
**Tables Affected:**
- `users` (emails, roles, password hashes visible?)
- `payments` (payment details exposed?)

**Mitigation:** Enable RLS and create policies before fest

---

#### 2. Sponsor Role Not in CHECK Constraint
**Risk:** Role mismatch between code and database schema
**Impact:** Sponsor users may fail to authenticate or bypass checks

**Mitigation:** Either:
- Remove sponsor role from code
- Update CHECK constraint to include 'sponsor'

---

#### 3. No Rate Limiting on Auth Routes
**Risk:** Brute force attacks on login endpoint
**Impact:** Attackers could attempt password guessing

**Mitigation:** Implement rate limiting (e.g., Vercel Rate Limiting, Cloudflare)

---

#### 4. No Session Expiration Configured
**Risk:** Long-lived sessions (30 days default)
**Impact:** Stolen tokens valid for extended period

**Mitigation:** Set explicit session.maxAge:
```typescript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60, // 7 days
}
```

---

#### 5. No CSRF Protection Documented
**Risk:** Cross-Site Request Forgery attacks
**Impact:** ⚠️ NextAuth includes built-in CSRF protection, but not explicitly verified

**Mitigation:** Verify NextAuth CSRF tokens are enabled (default behavior)

---

#### 6. Password Reset Flow Not Documented
**Risk:** Users with forgotten passwords cannot recover accounts
**Impact:** Support burden, locked-out users

**Status:** ⚠️ Password reset mechanism not found in codebase. May need implementation.

---

#### 7. No Multi-Factor Authentication (MFA)
**Risk:** Compromised passwords = account takeover
**Impact:** High-value accounts (organizers, admins) vulnerable

**Status:** Not implemented. Consider for post-fest enhancement.

---

### 🔒 **Pre-Fest Security Checklist**

- [ ] Enable RLS on `users` and `payments` tables
- [ ] Audit all RLS policies for completeness
- [ ] Fix sponsor role CHECK constraint mismatch
- [ ] Implement rate limiting on `/api/auth/signin`
- [ ] Set explicit session.maxAge (7 days recommended)
- [ ] Test OAuth flow end-to-end (Google)
- [ ] Verify bcrypt password hashing works correctly
- [ ] Test role-based redirects for all 3 roles
- [ ] Ensure `NEXTAUTH_SECRET` is strong (32+ characters)
- [ ] Verify HTTPS enforcement in production

---

## Role-Specific Access Matrix

| Feature/Route | Student | Organizer | Admin | Sponsor |
|---------------|---------|-----------|-------|---------|
| Browse Events | ✅ | ✅ | ✅ | ✅ |
| Register for Event | ✅ | ❌ | ❌ | ❌ |
| Create Event | ❌ | ✅ | ✅ | ❌ |
| Manage Registrations | ❌ | ✅ (own events) | ✅ (all) | ❌ |
| View Analytics | ❌ | ✅ (own events) | ✅ (all) | ❌ |
| Approve Banners | ❌ | ❌ | ✅ | ❌ |
| Create Sponsorship Package | ❌ | ✅ | ❌ | ❌ |
| Purchase Sponsorship | ❌ | ❌ | ❌ | ✅ |
| Generate Certificates | ❌ | ✅ (own events) | ❌ | ❌ |
| Manage Volunteers | ❌ | ✅ (own events) | ❌ | ❌ |
| Apply for Volunteer | ✅ | ❌ | ❌ | ❌ |
| Favorite Events | ✅ | ✅ | ✅ | ⚠️ |
| View Own Certificates | ✅ | ✅ | ✅ | ❌ |
| Create Fest | ❌ | ✅ | ✅ | ❌ |
| Approve Fest Submissions | ❌ | ✅ (if fest leader) | ✅ | ❌ |
| Manage Colleges | ❌ | ❌ | ✅ | ❌ |
| View Admin Logs | ❌ | ❌ | ✅ | ❌ |
| Handle Disputes | ❌ | ❌ | ✅ | ❌ |

---

**END OF AUTH_AND_ROLES.md**
