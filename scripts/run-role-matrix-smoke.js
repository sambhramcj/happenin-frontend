/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const PASSWORD = process.env.SMOKE_PASSWORD || "password123";

const USERS = {
  student: "smoke.student@happenin.test",
  organizer: "smoke.organizer@happenin.test",
  sponsor: "smoke.sponsor@happenin.test",
  admin: "smoke.admin@happenin.test",
};

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function cookieHeader(setCookieHeaders) {
  const map = new Map();
  for (const header of setCookieHeaders || []) {
    if (!header) continue;
    const first = String(header).split(";")[0];
    const i = first.indexOf("=");
    if (i > 0) map.set(first.slice(0, i), first.slice(i + 1));
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function mergeCookies(...cookieStrings) {
  const map = new Map();
  for (const c of cookieStrings) {
    if (!c) continue;
    for (const part of c.split(";")) {
      const trimmed = part.trim();
      if (!trimmed || !trimmed.includes("=")) continue;
      const i = trimmed.indexOf("=");
      map.set(trimmed.slice(0, i), trimmed.slice(i + 1));
    }
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function login(email, password) {
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const csrfBody = await csrfRes.json();
  const csrfCookies = cookieHeader(
    csrfRes.headers.getSetCookie
      ? csrfRes.headers.getSetCookie()
      : [csrfRes.headers.get("set-cookie")]
  );

  const form = new URLSearchParams({
    csrfToken: csrfBody.csrfToken,
    email,
    password,
    callbackUrl: `${BASE_URL}/`,
    json: "true",
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials?json=true`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: csrfCookies,
    },
    body: form.toString(),
    redirect: "manual",
  });

  const loginCookies = cookieHeader(
    loginRes.headers.getSetCookie
      ? loginRes.headers.getSetCookie()
      : [loginRes.headers.get("set-cookie")]
  );

  const cookies = mergeCookies(csrfCookies, loginCookies);
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { cookie: cookies },
  });
  const session = await sessionRes.json();

  if (!session?.user?.email) {
    throw new Error(`Login failed for ${email} (status=${loginRes.status})`);
  }

  return { cookies, session };
}

async function request({ method, path, cookies, body }) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(cookies ? { cookie: cookies } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // no-op
  }

  return { status: res.status, ok: res.ok, json, raw: text };
}

function evaluateExpectation(type, status, allowedStatuses = []) {
  if (type === "denied") return status === 401 || status === 403;
  if (type === "access") return status !== 401 && status !== 403;
  if (type === "one-of") return allowedStatuses.includes(status);
  return false;
}

async function ensureUsersAndPrereqs() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  const userRows = [
    { email: USERS.student, role: "student", password_hash: hash },
    { email: USERS.organizer, role: "organizer", password_hash: hash },
    { email: USERS.sponsor, role: "sponsor", password_hash: hash },
    { email: USERS.admin, role: "admin", password_hash: hash },
  ];

  const { error: usersError } = await db.from("users").upsert(userRows, { onConflict: "email" });
  if (usersError) throw new Error(`Failed to upsert smoke users: ${usersError.message}`);

  const { data: sponsorProfile } = await db
    .from("sponsors_profile")
    .select("email")
    .eq("email", USERS.sponsor)
    .maybeSingle();

  if (!sponsorProfile) {
    await db.from("sponsors_profile").insert({
      email: USERS.sponsor,
      company_name: "Smoke Sponsor Co",
      is_active: true,
    });
  } else {
    await db.from("sponsors_profile").update({ is_active: true }).eq("email", USERS.sponsor);
  }

  const nowIso = new Date().toISOString();
  const { data: event } = await db
    .from("events")
    .select("id,title,date,price,sponsorship_enabled,college_id,organizer_email")
    .eq("organizer_email", USERS.organizer)
    .gte("date", nowIso)
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!event) {
    throw new Error("No organizer-owned future event for smoke organizer. Create one first.");
  }

  return { eventId: event.id, eventTitle: event.title };
}

(async () => {
  const prereq = await ensureUsersAndPrereqs();
  const missingUuid = "00000000-0000-0000-0000-000000000000";

  const auth = {
    student: await login(USERS.student, PASSWORD),
    organizer: await login(USERS.organizer, PASSWORD),
    sponsor: await login(USERS.sponsor, PASSWORD),
    admin: await login(USERS.admin, PASSWORD),
  };

  const tests = [
    { name: "Student session", method: "GET", path: "/api/auth/session", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student profile GET", method: "GET", path: "/api/student/profile", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student tickets GET", method: "GET", path: "/api/student/tickets", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student certs GET", method: "GET", path: "/api/student/certificates", role: "student", expect: "access" },
    { name: "Student ticket order variation", method: "POST", path: "/api/payments/create-ticket-order", role: "student", body: { eventId: prereq.eventId }, expect: "access" },

    { name: "Organizer sponsorships GET", method: "GET", path: "/api/organizer/sponsorships", role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Organizer bank GET", method: "GET", path: "/api/organizer/bank-account", role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Organizer payout GET self", method: "GET", path: `/api/organizer/sponsorship-payout?email=${encodeURIComponent(USERS.organizer)}`, role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Organizer featured order variation", method: "POST", path: "/api/payments/create-featured-boost-order", role: "organizer", body: { eventId: prereq.eventId }, expect: "access" },

    { name: "Sponsor profile GET", method: "GET", path: "/api/sponsor/profile", role: "sponsor", expect: "one-of", statuses: [200] },
    { name: "Sponsor analytics GET", method: "GET", path: "/api/sponsor/analytics", role: "sponsor", expect: "one-of", statuses: [200] },
    { name: "Sponsor reports missing-range variation", method: "GET", path: "/api/sponsor/reports", role: "sponsor", expect: "one-of", statuses: [400] },
    { name: "Sponsor reports valid-range", method: "GET", path: `/api/sponsor/reports?from=${new Date(Date.now()-7*86400000).toISOString()}&to=${new Date().toISOString()}`, role: "sponsor", expect: "access" },
    { name: "Sponsor digital-pack order variation", method: "POST", path: "/api/payments/create-digital-pack-order", role: "sponsor", body: { eventId: prereq.eventId, packType: "silver" }, expect: "access" },

    { name: "Admin dashboard GET", method: "GET", path: "/api/admin/dashboard", role: "admin", expect: "access" },
    { name: "Admin users analytics GET", method: "GET", path: "/api/admin/analytics/users", role: "admin", expect: "access" },
    { name: "Admin revenue analytics GET", method: "GET", path: "/api/admin/analytics/revenue", role: "admin", expect: "access" },
    { name: "Admin sponsorship payouts GET", method: "GET", path: "/api/admin/sponsorship-payouts", role: "admin", expect: "access" },

    { name: "Student denied admin dashboard", method: "GET", path: "/api/admin/dashboard", role: "student", expect: "denied" },
    { name: "Sponsor denied organizer payout", method: "GET", path: `/api/organizer/sponsorship-payout?email=${encodeURIComponent(USERS.organizer)}`, role: "sponsor", expect: "denied" },
    { name: "Organizer denied sponsor analytics", method: "GET", path: "/api/sponsor/analytics", role: "organizer", expect: "denied" },
    { name: "Admin denied sponsor-only pack create", method: "POST", path: "/api/payments/create-digital-pack-order", role: "admin", body: { eventId: prereq.eventId, packType: "silver" }, expect: "denied" },
    { name: "Sponsor denied organizer-only featured create", method: "POST", path: "/api/payments/create-featured-boost-order", role: "sponsor", body: { eventId: prereq.eventId }, expect: "denied" },
    { name: "Student denied sponsor-only pack create", method: "POST", path: "/api/payments/create-digital-pack-order", role: "student", body: { eventId: prereq.eventId, packType: "silver" }, expect: "denied" },

    { name: "Student volunteer applications GET", method: "GET", path: "/api/volunteers/apply", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student volunteer apply invalid payload", method: "POST", path: "/api/volunteers/apply", role: "student", body: { eventId: prereq.eventId }, expect: "one-of", statuses: [400] },
    { name: "Organizer denied student volunteer apply", method: "POST", path: "/api/volunteers/apply", role: "organizer", body: { eventId: prereq.eventId, role: "Operations" }, expect: "denied" },
    { name: "Organizer volunteers list", method: "GET", path: "/api/organizer/volunteers", role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Organizer volunteers by event", method: "GET", path: `/api/organizer/volunteers/${prereq.eventId}`, role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Organizer volunteer review invalid id", method: "PATCH", path: `/api/organizer/volunteers/application/${missingUuid}`, role: "organizer", body: { status: "accepted" }, expect: "one-of", statuses: [404] },
    { name: "Student denied organizer volunteers", method: "GET", path: "/api/organizer/volunteers", role: "student", expect: "denied" },

    { name: "Student certificates filtered", method: "GET", path: "/api/student/certificates?type=volunteer", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student certificate delete blocked", method: "DELETE", path: "/api/student/certificates", role: "student", expect: "one-of", statuses: [403] },
    { name: "Organizer certificate issue invalid payload", method: "POST", path: "/api/organizer/certificates", role: "organizer", body: {}, expect: "one-of", statuses: [400] },
    { name: "Sponsor denied organizer certificates", method: "POST", path: "/api/organizer/certificates", role: "sponsor", body: {}, expect: "denied" },

    { name: "Public fests list", method: "GET", path: "/api/fests", role: null, expect: "one-of", statuses: [200] },
    { name: "Student fest create invalid payload", method: "POST", path: "/api/fests", role: "student", body: { title: "Smoke Fest" }, expect: "one-of", statuses: [400] },
    { name: "Fest events list by id", method: "GET", path: `/api/fests/${missingUuid}/events`, role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Fest submit event invalid payload", method: "POST", path: `/api/fests/${missingUuid}/events`, role: "organizer", body: {}, expect: "one-of", statuses: [400] },
    { name: "Fest members list public", method: "GET", path: `/api/fests/${missingUuid}/members`, role: null, expect: "one-of", statuses: [200] },
    { name: "Fest member add non-leader variation", method: "POST", path: `/api/fests/${missingUuid}/members`, role: "organizer", body: { memberEmail: USERS.student }, expect: "one-of", statuses: [403] },

    { name: "Student notifications list", method: "GET", path: "/api/notifications?unread=true&limit=5", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student notifications patch missing ids", method: "PATCH", path: "/api/notifications", role: "student", body: {}, expect: "one-of", statuses: [400] },
    { name: "Student notifications delete missing ids", method: "DELETE", path: "/api/notifications", role: "student", body: {}, expect: "one-of", statuses: [400] },
    { name: "Organizer in-app notifications list", method: "GET", path: "/api/notifications/in-app?limit=10", role: "organizer", expect: "one-of", statuses: [200] },
    { name: "Sponsor create in-app notification", method: "POST", path: "/api/notifications/in-app", role: "sponsor", body: { title: "Smoke", body: "Smoke body", notificationType: "general" }, expect: "one-of", statuses: [201] },
    { name: "Admin mark all in-app read", method: "PUT", path: "/api/notifications/in-app/read-all", role: "admin", expect: "one-of", statuses: [200] },
    { name: "Student notification preferences GET", method: "GET", path: "/api/notifications/preferences", role: "student", expect: "one-of", statuses: [200] },
    { name: "Student notification preferences PATCH", method: "PATCH", path: "/api/notifications/preferences", role: "student", body: { in_app_enabled: true, fest_mode_enabled: true }, expect: "one-of", statuses: [200] },

    { name: "Unauth denied student profile", method: "GET", path: "/api/student/profile", role: null, expect: "denied" },
    { name: "Unauth denied admin dashboard", method: "GET", path: "/api/admin/dashboard", role: null, expect: "denied" },
    { name: "Unauth denied sponsor analytics", method: "GET", path: "/api/sponsor/analytics", role: null, expect: "denied" },
    { name: "Unauth denied organizer bank", method: "GET", path: "/api/organizer/bank-account", role: null, expect: "denied" },
    { name: "Unauth denied volunteer apply", method: "GET", path: "/api/volunteers/apply", role: null, expect: "denied" },
    { name: "Unauth denied notifications", method: "GET", path: "/api/notifications", role: null, expect: "denied" },
    { name: "Unauth denied notification preferences", method: "GET", path: "/api/notifications/preferences", role: null, expect: "denied" },
  ];

  const results = [];
  for (const test of tests) {
    const cookies = test.role ? auth[test.role].cookies : undefined;
    const response = await request({
      method: test.method,
      path: test.path,
      cookies,
      body: test.body,
    });

    const pass = evaluateExpectation(test.expect, response.status, test.statuses || []);

    results.push({
      name: test.name,
      role: test.role || "unauthenticated",
      method: test.method,
      path: test.path,
      expected: test.expect === "one-of" ? `status in [${(test.statuses || []).join(",")}]` : test.expect,
      status: response.status,
      pass,
      body: response.json || response.raw,
    });
  }

  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  const byRole = results.reduce((acc, row) => {
    if (!acc[row.role]) acc[row.role] = { total: 0, passed: 0 };
    acc[row.role].total += 1;
    if (row.pass) acc[row.role].passed += 1;
    return acc;
  }, {});

  const output = {
    meta: {
      baseUrl: BASE_URL,
      eventId: prereq.eventId,
      eventTitle: prereq.eventTitle,
      executedAt: new Date().toISOString(),
    },
    summary: {
      total,
      passed,
      failed: total - passed,
      passRate: `${((passed / total) * 100).toFixed(1)}%`,
      byRole,
    },
    failed,
  };

  console.log(JSON.stringify(output, null, 2));

  if (failed.length > 0) {
    process.exit(2);
  }
})();
