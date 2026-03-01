/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");

const SEED_PREFIX = "[SEED]";
const DEFAULT_PASSWORD = "password123";

function loadEnv() {
  const envFiles = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];

  for (const file of envFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2] || "";
      value = value.replace(/^['\"]|['\"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tableExistsCache = new Map();
const columnExistsCache = new Map();

async function tableExists(table) {
  if (tableExistsCache.has(table)) return tableExistsCache.get(table);
  const { error } = await supabase.from(table).select("*", { count: "exact", head: true });
  const exists = !error || error.code !== "PGRST205";
  tableExistsCache.set(table, exists);
  return exists;
}

async function columnExists(table, column) {
  const key = `${table}.${column}`;
  if (columnExistsCache.has(key)) return columnExistsCache.get(key);
  if (!(await tableExists(table))) {
    columnExistsCache.set(key, false);
    return false;
  }
  const { error } = await supabase.from(table).select(column, { head: true, count: "exact" });
  const exists = !error || !String(error.message || "").includes("Could not find the column");
  columnExistsCache.set(key, exists);
  return exists;
}

async function pickColumns(table, row) {
  const output = {};
  for (const [key, value] of Object.entries(row)) {
    if (await columnExists(table, key)) {
      output[key] = value;
    }
  }
  return output;
}

function extractMissingColumn(message) {
  const text = String(message || "");
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column\s+"([^"]+)"\s+of\s+relation/i,
    /column\s+([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function removeColumnFromRows(rows, column) {
  return rows.map((row) => {
    const next = { ...row };
    delete next[column];
    return next;
  });
}

async function insertWithRetry(table, rows, selectClause) {
  let candidateRows = [...rows];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (!candidateRows.length) return { data: [], error: null };

    let query = supabase.from(table).insert(candidateRows);
    if (selectClause) query = query.select(selectClause);

    const { data, error } = await query;
    if (!error) return { data, error: null };

    const missingColumn = extractMissingColumn(error.message);
    if (!missingColumn) return { data: null, error };

    console.warn(`⚠️ ${table}: dropping missing column '${missingColumn}' and retrying insert`);
    columnExistsCache.set(`${table}.${missingColumn}`, false);
    candidateRows = removeColumnFromRows(candidateRows, missingColumn);
  }

  return { data: null, error: new Error(`Insert retries exhausted for ${table}`) };
}

async function upsertWithRetry(table, rows, upsertOptions, selectClause) {
  let candidateRows = [...rows];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (!candidateRows.length) return { data: [], error: null };

    let query = supabase.from(table).upsert(candidateRows, upsertOptions);
    if (selectClause) query = query.select(selectClause);

    const { data, error } = await query;
    if (!error) return { data, error: null };

    const missingColumn = extractMissingColumn(error.message);
    if (!missingColumn) return { data: null, error };

    console.warn(`⚠️ ${table}: dropping missing column '${missingColumn}' and retrying upsert`);
    columnExistsCache.set(`${table}.${missingColumn}`, false);
    candidateRows = removeColumnFromRows(candidateRows, missingColumn);
  }

  return { data: null, error: new Error(`Upsert retries exhausted for ${table}`) };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function shuffle(array) {
  const cloned = [...array];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function buildSchedule(start) {
  const d = new Date(start);
  const date = d.toISOString().split("T")[0];
  return [
    { date, start_time: "09:00", end_time: "10:30", description: "Opening + briefing" },
    { date, start_time: "11:00", end_time: "13:00", description: "Main session" },
    { date, start_time: "14:00", end_time: "17:00", description: "Final rounds" },
  ];
}

async function cleanupSeedData() {
  console.log("🧹 Cleaning previous seeded data...");

  const tables = {
    banners: await tableExists("banners"),
    bulkTickets: await tableExists("bulk_tickets"),
    bulkPurchases: await tableExists("bulk_ticket_purchases"),
    bulkPacks: await tableExists("bulk_ticket_packs"),
    volunteerAssignments: await tableExists("volunteer_assignments"),
    volunteerApplications: await tableExists("volunteer_applications"),
    studentCertificates: await tableExists("student_certificates"),
    badges: await tableExists("achievement_badges"),
    tickets: await tableExists("tickets"),
    registrations: await tableExists("registrations"),
    festEvents: await tableExists("fest_events"),
    festMembers: await tableExists("fest_members"),
    sponsorshipOrders: await tableExists("sponsorship_orders"),
    events: await tableExists("events"),
    fests: await tableExists("fests"),
    sponsorProfiles: await tableExists("sponsors_profile"),
    studentProfiles: await tableExists("student_profiles"),
    users: await tableExists("users"),
  };

  let seededEventIds = [];
  let seededFestIds = [];

  if (tables.events) {
    const { data } = await supabase
      .from("events")
      .select("id")
      .ilike("title", `${SEED_PREFIX}%`);
    seededEventIds = (data || []).map((row) => row.id);
  }

  if (tables.fests) {
    const { data } = await supabase
      .from("fests")
      .select("id")
      .ilike("title", `${SEED_PREFIX}%`);
    seededFestIds = (data || []).map((row) => row.id);
  }

  if (tables.banners) {
    await supabase.from("banners").delete().ilike("title", `${SEED_PREFIX}%`);
  }

  if (tables.bulkTickets && seededEventIds.length) {
    await supabase.from("bulk_tickets").delete().in("event_id", seededEventIds);
  }

  if (tables.bulkPurchases && seededEventIds.length && tables.bulkPacks) {
    const { data: packs } = await supabase
      .from("bulk_ticket_packs")
      .select("id")
      .in("event_id", seededEventIds);
    const packIds = (packs || []).map((row) => row.id);
    if (packIds.length) {
      await supabase.from("bulk_ticket_purchases").delete().in("bulk_pack_id", packIds);
    }
  }

  if (tables.bulkPacks && seededEventIds.length) {
    await supabase.from("bulk_ticket_packs").delete().in("event_id", seededEventIds);
  }

  if (tables.volunteerAssignments && seededEventIds.length) {
    await supabase.from("volunteer_assignments").delete().in("event_id", seededEventIds);
  }

  if (tables.volunteerApplications && seededEventIds.length) {
    await supabase.from("volunteer_applications").delete().in("event_id", seededEventIds);
  }

  if (tables.studentCertificates) {
    await supabase.from("student_certificates").delete().ilike("event_name", `${SEED_PREFIX}%`);
  }

  if (tables.badges) {
    await supabase.from("achievement_badges").delete().ilike("badge_name", `${SEED_PREFIX}%`);
  }

  if (tables.tickets && seededEventIds.length) {
    await supabase.from("tickets").delete().in("event_id", seededEventIds);
  }

  if (tables.registrations && seededEventIds.length) {
    await supabase.from("registrations").delete().in("event_id", seededEventIds);
  }

  if (tables.festEvents && seededFestIds.length) {
    await supabase.from("fest_events").delete().in("fest_id", seededFestIds);
  }

  if (tables.festMembers && seededFestIds.length) {
    await supabase.from("fest_members").delete().in("fest_id", seededFestIds);
  }

  if (tables.sponsorshipOrders) {
    const sponsorEmailCol = (await columnExists("sponsorship_orders", "sponsor_email"))
      ? "sponsor_email"
      : null;
    if (sponsorEmailCol) {
      await supabase
        .from("sponsorship_orders")
        .delete()
        .ilike(sponsorEmailCol, "seed.sponsor%@happenin.test");
    }
  }

  if (tables.events) {
    await supabase.from("events").delete().ilike("title", `${SEED_PREFIX}%`);
  }

  if (tables.fests) {
    await supabase.from("fests").delete().ilike("title", `${SEED_PREFIX}%`);
  }

  if (tables.sponsorProfiles) {
    await supabase
      .from("sponsors_profile")
      .delete()
      .ilike("email", "seed.sponsor%@happenin.test");
  }

  if (tables.studentProfiles) {
    await supabase
      .from("student_profiles")
      .delete()
      .ilike("student_email", "seed.student%@happenin.test");
  }

  if (tables.users) {
    await supabase
      .from("users")
      .delete()
      .or([
        "email.ilike.seed.student%@happenin.test",
        "email.ilike.seed.organizer%@happenin.test",
        "email.ilike.seed.sponsor%@happenin.test",
        "email.ilike.seed.admin%@happenin.test",
      ].join(","));
  }

  console.log("✅ Previous seeded data cleaned");
}

async function seed() {
  const shouldResetOnly = process.argv.includes("--reset-only");

  await cleanupSeedData();

  if (shouldResetOnly) {
    console.log("🧼 Reset complete. No new seed data inserted.");
    return;
  }

  const stats = {
    users: 0,
    studentProfiles: 0,
    sponsorProfiles: 0,
    fests: 0,
    events: 0,
    festEvents: 0,
    registrations: 0,
    tickets: 0,
    volunteerApplications: 0,
    volunteerAssignments: 0,
    studentCertificates: 0,
    badges: 0,
    bulkPacks: 0,
    bulkPurchases: 0,
    bulkTickets: 0,
    sponsorshipOrders: 0,
    sponsorshipDeals: 0,
    banners: 0,
  };

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const organizers = Array.from({ length: 8 }, (_, i) => ({
    email: `seed.organizer${i + 1}@happenin.test`,
    role: "organizer",
  }));
  const students = Array.from({ length: 60 }, (_, i) => ({
    email: `seed.student${i + 1}@happenin.test`,
    role: "student",
  }));
  const sponsors = Array.from({ length: 12 }, (_, i) => ({
    email: `seed.sponsor${i + 1}@happenin.test`,
    role: "sponsor",
  }));
  const admins = [{ email: "seed.admin1@happenin.test", role: "admin" }];

  const allUsers = [...organizers, ...students, ...sponsors, ...admins];

  if (await tableExists("users")) {
    const rows = [];
    for (const user of allUsers) {
      const base = {
        email: user.email,
        role: user.role,
        password_hash: hashedPassword,
      };
      rows.push(await pickColumns("users", base));
    }

    const { data, error } = await upsertWithRetry(
      "users",
      rows,
      { onConflict: "email", ignoreDuplicates: false },
      "email"
    );

    if (error) throw new Error(`Failed to seed users: ${error.message}`);
    stats.users = data?.length || 0;
  }

  if (await tableExists("student_profiles")) {
    const branches = ["CSE", "ECE", "ME", "Civil", "AI&DS", "EEE"];
    const rows = [];
    for (let i = 0; i < students.length; i += 1) {
      const email = students[i].email;
      const profile = {
        student_email: email,
        full_name: `Seed Student ${i + 1}`,
        dob: `200${(i % 8) + 1}-0${(i % 9) + 1}-1${i % 9}`,
        college_name: "Seed Engineering College",
        college_email: email,
        branch: branches[i % branches.length],
        year_of_study: (i % 4) + 1,
        phone_number: `90000${String(i + 1).padStart(5, "0")}`,
        personal_email: email,
        profile_photo_url: `https://picsum.photos/seed/student-${i + 1}/300/300`,
      };
      rows.push(await pickColumns("student_profiles", profile));
    }

    const { data, error } = await upsertWithRetry(
      "student_profiles",
      rows,
      { onConflict: "student_email", ignoreDuplicates: false },
      "student_email"
    );

    if (error) throw new Error(`Failed to seed student profiles: ${error.message}`);
    stats.studentProfiles = data?.length || 0;
  }

  if (await tableExists("sponsors_profile")) {
    const rows = [];
    for (let i = 0; i < sponsors.length; i += 1) {
      const email = sponsors[i].email;
      const profile = {
        email,
        company_name: `${SEED_PREFIX} Sponsor Co ${i + 1}`,
        logo_url: `https://picsum.photos/seed/sponsor-logo-${i + 1}/400/200`,
        website_url: `https://seed-sponsor-${i + 1}.example.com`,
        contact_name: `Sponsor Contact ${i + 1}`,
        contact_phone: `98888${String(i + 1).padStart(5, "0")}`,
        banner_url: `https://picsum.photos/seed/sponsor-banner-${i + 1}/1200/400`,
        is_active: true,
      };
      rows.push(await pickColumns("sponsors_profile", profile));
    }

    const { data, error } = await upsertWithRetry(
      "sponsors_profile",
      rows,
      { onConflict: "email", ignoreDuplicates: false },
      "email"
    );

    if (error) throw new Error(`Failed to seed sponsor profiles: ${error.message}`);
    stats.sponsorProfiles = data?.length || 0;
  }

  let collegeIds = [];
  if (await tableExists("colleges")) {
    const { data } = await supabase.from("colleges").select("id").limit(20);
    collegeIds = (data || []).map((row) => row.id);
  }

  const festRows = [];
  if (await tableExists("fests")) {
    for (let i = 0; i < 6; i += 1) {
      const start = new Date(Date.now() + (i - 2) * 14 * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
      const row = {
        title: `${SEED_PREFIX} Fest ${i + 1}`,
        description: `${SEED_PREFIX} Fest showcase with competitions, workshops, concerts, and exhibitions`,
        banner_image: `https://picsum.photos/seed/fest-${i + 1}/1600/900`,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        location: sample(["Main Campus", "North Grounds", "Tech Park", "Convention Hall"]),
        college_id: collegeIds.length ? sample(collegeIds) : null,
        core_team_leader_email: organizers[i % organizers.length].email,
        status: i < 4 ? "active" : "archived",
      };
      festRows.push(await pickColumns("fests", row));
    }
  }

  let createdFests = [];
  if (festRows.length) {
    const { data, error } = await insertWithRetry("fests", festRows, "id,title");
    if (error) throw new Error(`Failed to seed fests: ${error.message}`);
    createdFests = data || [];
    stats.fests = createdFests.length;
  }

  if (createdFests.length && (await tableExists("fest_members"))) {
    const memberRows = [];
    for (let i = 0; i < createdFests.length; i += 1) {
      memberRows.push(await pickColumns("fest_members", {
        fest_id: createdFests[i].id,
        member_email: organizers[i % organizers.length].email,
        role: "leader",
      }));
      memberRows.push(await pickColumns("fest_members", {
        fest_id: createdFests[i].id,
        member_email: organizers[(i + 1) % organizers.length].email,
        role: "member",
      }));
    }
    const { error } = await upsertWithRetry(
      "fest_members",
      memberRows,
      { onConflict: "fest_id,member_email", ignoreDuplicates: true }
    );
    if (!error) stats.festEvents += 0;
  }

  const categories = [
    "hackathon", "workshop", "conference", "cultural", "sports", "music", "dance", "debate",
    "quiz", "gaming", "robotics", "ai", "startup", "design", "photography", "literary",
  ];

  const eventRows = [];
  for (let i = 0; i < 42; i += 1) {
    const start = new Date(Date.now() + (i - 12) * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + randomInt(2, 8) * 60 * 60 * 1000);
    const paid = i % 3 !== 0;
    const sponsorshipEnabled = i % 2 === 0;
    const needsVolunteers = i % 3 !== 1;
    const hasPrize = i % 4 === 0;
    const hasDiscount = i % 5 === 0;
    const hasWhatsapp = i % 2 === 0;
    const hasBrochure = i % 3 === 0;
    const fest = createdFests.length && i % 2 === 0 ? sample(createdFests) : null;

    const baseRow = {
      title: `${SEED_PREFIX} ${sample(["Hack", "Summit", "Carnival", "Challenge", "Expo", "Showdown"])} ${i + 1}`,
      description: `${SEED_PREFIX} Auto-generated test event with full feature coverage for UI and flow validation`,
      date: start.toISOString(),
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
      schedule_sessions: buildSchedule(start),
      location: sample(["Main Auditorium", "Seminar Hall", "Open Grounds", "Lab Complex", "Online"]),
      venue: sample(["Main Auditorium", "Seminar Hall", "Open Grounds", "Lab Complex", "Online"]),
      price: paid ? randomInt(99, 1499) : 0,
      ticket_price: paid ? randomInt(99, 1499) : 0,
      organizer_email: sample(organizers).email,
      category: categories[i % categories.length],
      max_attendees: randomInt(80, 500),
      registrations_closed: false,
      registration_close_datetime: new Date(start.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      banner_image: `https://picsum.photos/seed/seed-event-${i + 1}/1200/800`,
      banner_url: `https://picsum.photos/seed/seed-event-banner-${i + 1}/1200/800`,
      brochure_url: hasBrochure
        ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        : null,
      sponsorship_enabled: sponsorshipEnabled,
      needs_volunteers: needsVolunteers,
      volunteer_roles: needsVolunteers
        ? [
            { role: "Operations", title: "Operations", description: "On-ground event execution" },
            { role: "Content", title: "Content", description: "Stage + speaker support" },
          ]
        : [],
      volunteer_description: needsVolunteers ? "Manage crowd, logistics, and participant support" : null,
      prize_pool_amount: hasPrize ? randomInt(10000, 100000) : null,
      prize_pool_description: hasPrize ? "Winner, runner-up, and innovation prizes" : null,
      discount_enabled: hasDiscount,
      discount_club: hasDiscount ? sample(["Coding Club", "AI Circle", "Robotics Club", "Design Club"]) : null,
      discount_amount: hasDiscount ? randomInt(25, 300) : 0,
      eligible_members: hasDiscount
        ? [
            { name: "Seed Student 1", memberId: "CLUB001" },
            { name: "Seed Student 2", memberId: "CLUB002" },
          ]
        : [],
      whatsapp_group_enabled: hasWhatsapp,
      whatsapp_group_link: hasWhatsapp ? `https://chat.whatsapp.com/SEED${String(i + 1).padStart(4, "0")}` : null,
      organizer_contact_name: `Organizer ${i + 1}`,
      organizer_contact_phone: `97777${String(i + 1).padStart(5, "0")}`,
      organizer_contact_email: sample(organizers).email,
      fest_id: fest?.id || null,
      boost_visibility: i % 6 === 0,
      boost_payment_status: i % 6 === 0 ? "completed" : "unpaid",
      boost_priority: i % 6 === 0 ? randomInt(1, 5) : 0,
    };

    eventRows.push(await pickColumns("events", baseRow));
  }

  let createdEvents = [];
  if (await tableExists("events")) {
    const { data, error } = await insertWithRetry(
      "events",
      eventRows,
      "id,title,organizer_email,needs_volunteers,price,fest_id,sponsorship_enabled"
    );

    if (error) throw new Error(`Failed to seed events: ${error.message}`);
    createdEvents = data || [];
    stats.events = createdEvents.length;
  }

  if (createdEvents.length && (await tableExists("fest_events"))) {
    const rows = [];
    for (const event of createdEvents.filter((e) => e.fest_id)) {
      rows.push(await pickColumns("fest_events", {
        fest_id: event.fest_id,
        event_id: event.id,
        submitted_by_email: event.organizer_email,
        approval_status: sample(["approved", "pending", "approved", "rejected"]),
        rejection_reason: null,
      }));
    }
    const { data, error } = await upsertWithRetry(
      "fest_events",
      rows,
      { onConflict: "fest_id,event_id", ignoreDuplicates: true },
      "id"
    );
    if (!error) stats.festEvents = data?.length || 0;
  }

  const registrationEmailColumn = (await columnExists("registrations", "student_email"))
    ? "student_email"
    : (await columnExists("registrations", "user_email"))
    ? "user_email"
    : null;

  let createdRegistrations = [];
  if (createdEvents.length && registrationEmailColumn && (await tableExists("registrations"))) {
    const regRows = [];
    for (const event of createdEvents) {
      const pickedStudents = shuffle(students).slice(0, randomInt(8, 24));
      for (const student of pickedStudents) {
        const row = {
          event_id: event.id,
          [registrationEmailColumn]: student.email,
          status: sample(["registered", "registered", "checked_in"]),
          registration_date: new Date().toISOString(),
          final_price: Number(event.price) || 0,
        };
        regRows.push(await pickColumns("registrations", row));
      }
    }

    const { data, error } = await insertWithRetry(
      "registrations",
      regRows,
      `id,event_id,${registrationEmailColumn}`
    );

    if (error) {
      console.warn("⚠️ Registrations seed warning:", error.message);
    } else {
      createdRegistrations = data || [];
      stats.registrations = createdRegistrations.length;
    }
  }

  if (createdRegistrations.length && (await tableExists("tickets"))) {
    const eventMap = new Map(createdEvents.map((event) => [event.id, event]));
    const rows = [];
    for (const reg of createdRegistrations.slice(0, 240)) {
      const event = eventMap.get(reg.event_id);
      if (!event) continue;
      const row = {
        ticket_id: `SEED-TKT-${reg.id.slice(0, 8).toUpperCase()}`,
        event_id: reg.event_id,
        registration_id: reg.id,
        student_email: reg[registrationEmailColumn] || sample(students).email,
        event_title: event.title,
        event_date: new Date().toISOString(),
        event_location: "Seed Venue",
        qr_code_data: `${reg.event_id}:${reg.id}:seed`,
        design_template: "modern",
        status: "active",
      };
      rows.push(await pickColumns("tickets", row));
    }

    const validRows = rows.filter((row) => Object.keys(row).length > 0);
    if (validRows.length) {
      const { data, error } = await insertWithRetry("tickets", validRows, "id");
      if (!error) {
        stats.tickets = data?.length || 0;
      } else {
        console.warn("⚠️ Tickets seed warning:", error.message);
      }
    }
  }

  if (createdEvents.length && (await tableExists("volunteer_applications"))) {
    const rows = [];
    const volunteerEvents = createdEvents.filter((event) => event.needs_volunteers);
    for (const event of volunteerEvents) {
      const applicants = shuffle(students).slice(0, randomInt(3, 10));
      for (const student of applicants) {
        const status = sample(["pending", "accepted", "rejected", "accepted"]);
        rows.push(await pickColumns("volunteer_applications", {
          event_id: event.id,
          student_email: student.email,
          role: sample(["Operations", "Tech Support", "Content", "Hospitality"]),
          message: `${SEED_PREFIX} I can volunteer for this event`,
          status,
          applied_at: new Date().toISOString(),
          reviewed_at: status === "pending" ? null : new Date().toISOString(),
          reviewed_by: status === "pending" ? null : event.organizer_email,
        }));
      }
    }

    const { data, error } = await insertWithRetry(
      "volunteer_applications",
      rows,
      "id,event_id,student_email,role,status"
    );

    if (!error) {
      stats.volunteerApplications = data?.length || 0;

      if (await tableExists("volunteer_assignments")) {
        const accepted = (data || []).filter((item) => item.status === "accepted");
        const eventMap = new Map(createdEvents.map((event) => [event.id, event]));
        const assignmentRows = [];
        for (const app of accepted) {
          const event = eventMap.get(app.event_id);
          assignmentRows.push(await pickColumns("volunteer_assignments", {
            event_id: app.event_id,
            student_email: app.student_email,
            role: app.role,
            assigned_by: event?.organizer_email || null,
            hours_contributed: Number(randomInt(4, 18)),
            rating: randomInt(3, 5),
            feedback: `${SEED_PREFIX} Great contribution`,
          }));
        }
        const { data: assignmentData, error: assignmentError } = await insertWithRetry(
          "volunteer_assignments",
          assignmentRows,
          "id"
        );
        if (!assignmentError) {
          stats.volunteerAssignments = assignmentData?.length || 0;
        }

        if (await tableExists("student_certificates")) {
          const certificateRows = [];
          for (const app of accepted.slice(0, 80)) {
            const event = eventMap.get(app.event_id);
            certificateRows.push(await pickColumns("student_certificates", {
              student_email: app.student_email,
              certificate_url: `https://example.com/certificates/${app.id}.pdf`,
              event_name: event?.title || `${SEED_PREFIX} Event`,
              event_id: app.event_id,
              certificate_type: "volunteer",
              certificate_title: `${SEED_PREFIX} Volunteer Certificate`,
              issued_by: event?.organizer_email || organizers[0].email,
              recipient_type: "volunteer",
              sent_date: new Date().toISOString(),
            }));
          }

          const { data: certData, error: certError } = await insertWithRetry(
            "student_certificates",
            certificateRows,
            "id"
          );

          if (!certError) stats.studentCertificates = certData?.length || 0;
        }
      }
    }
  }

  if (await tableExists("achievement_badges")) {
    const rows = students.slice(0, 40).map(async (student, index) =>
      pickColumns("achievement_badges", {
        student_email: student.email,
        badge_type: sample(["volunteer_5", "event_winner", "achievement"]),
        badge_name: `${SEED_PREFIX} Badge ${index + 1}`,
        badge_description: "Seeded achievement badge for UI testing",
        badge_icon_url: `https://picsum.photos/seed/badge-${index + 1}/128/128`,
        earned_at: new Date().toISOString(),
      })
    );

    const resolvedRows = await Promise.all(rows);
    const { data, error } = await insertWithRetry("achievement_badges", resolvedRows, "id");
    if (!error) stats.badges = data?.length || 0;
  }

  if (await tableExists("bulk_ticket_packs")) {
    const paidEvents = createdEvents.filter((event) => Number(event.price) > 0);
    const packRows = [];
    for (const event of paidEvents.slice(0, 22)) {
      const base = Number(event.price) || randomInt(199, 999);
      const quantity = sample([5, 10, 15, 20]);
      const discount = sample([10, 15, 20, 25]);
      const bulkPerTicket = Number((base * (1 - discount / 100)).toFixed(2));
      const row = {
        event_id: event.id,
        organizer_email: event.organizer_email,
        name: `${SEED_PREFIX} Group of ${quantity}`,
        description: `${SEED_PREFIX} Bulk tickets for teams/groups`,
        quantity,
        base_price: base,
        bulk_price: bulkPerTicket,
        discount_percentage: discount,
        total_cost: Number((bulkPerTicket * quantity).toFixed(2)),
        offer_title: `${discount}% OFF`,
        offer_description: "Limited time bulk discount",
        offer_expiry_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        sold_count: 0,
      };
      packRows.push(await pickColumns("bulk_ticket_packs", row));
    }

    const { data: packData, error: packError } = await insertWithRetry(
      "bulk_ticket_packs",
      packRows,
      "id,event_id,quantity,bulk_price"
    );

    if (!packError) {
      stats.bulkPacks = packData?.length || 0;

      if (await tableExists("bulk_ticket_purchases")) {
        const studentEmailCol = (await columnExists("bulk_ticket_purchases", "student_email"))
          ? "student_email"
          : (await columnExists("bulk_ticket_purchases", "buyer_email"))
          ? "buyer_email"
          : null;

        if (studentEmailCol) {
          const purchaseRows = [];
          for (const pack of (packData || []).slice(0, 12)) {
            const buyer = sample(students).email;
            const quantityPurchased = Math.max(1, Math.floor(pack.quantity / 2));
            purchaseRows.push(await pickColumns("bulk_ticket_purchases", {
              bulk_pack_id: pack.id,
              [studentEmailCol]: buyer,
              quantity_purchased: quantityPurchased,
              price_per_ticket: pack.bulk_price,
              total_amount: Number((quantityPurchased * Number(pack.bulk_price)).toFixed(2)),
              payment_status: "completed",
            }));
          }

          const { data: purchaseData, error: purchaseError } = await insertWithRetry(
            "bulk_ticket_purchases",
            purchaseRows,
            "id,bulk_pack_id,quantity_purchased"
          );

          if (!purchaseError) {
            stats.bulkPurchases = purchaseData?.length || 0;

            if (await tableExists("bulk_tickets")) {
              const packMap = new Map((packData || []).map((pack) => [pack.id, pack]));
              const bulkTicketRows = [];
              for (const purchase of purchaseData || []) {
                const pack = packMap.get(purchase.bulk_pack_id);
                const eventId = pack?.event_id;
                if (!eventId) continue;
                for (let i = 0; i < Number(purchase.quantity_purchased || 0); i += 1) {
                  bulkTicketRows.push(await pickColumns("bulk_tickets", {
                    bulk_purchase_id: purchase.id,
                    event_id: eventId,
                    ticket_number: `SEED-BULK-${purchase.id.slice(0, 6).toUpperCase()}-${String(i + 1).padStart(3, "0")}`,
                    qr_code_data: `${eventId}:${purchase.id}:${i + 1}:seed`,
                    status: "available",
                  }));
                }
              }

              const { data: bulkTicketData, error: bulkTicketError } = await insertWithRetry(
                "bulk_tickets",
                bulkTicketRows,
                "id"
              );

              if (!bulkTicketError) {
                stats.bulkTickets = bulkTicketData?.length || 0;
              }
            }
          }
        }
      }
    }
  }

  if (await tableExists("sponsorship_orders")) {
    const rows = [];
    const sponsorshipEvents = createdEvents.filter((event) => event.sponsorship_enabled);
    for (let i = 0; i < Math.min(36, sponsorshipEvents.length); i += 1) {
      const event = sponsorshipEvents[i];
      const sponsor = sponsors[i % sponsors.length].email;
      const packType = event.fest_id && i % 3 === 0 ? "fest" : sample(["digital", "app"]);
      const amount = packType === "digital" ? 10000 : packType === "app" ? 25000 : 50000;

      rows.push(await pickColumns("sponsorship_orders", {
        sponsor_email: sponsor,
        event_id: packType === "fest" ? null : event.id,
        fest_id: packType === "fest" ? event.fest_id : null,
        pack_type: packType,
        amount,
        razorpay_order_id: `seed_order_${i + 1}_${Date.now()}`,
        razorpay_payment_id: `seed_pay_${i + 1}_${Date.now()}`,
        status: "paid",
        visibility_active: true,
        organizer_payout_settled: i % 4 === 0,
      }));
    }

    const { data, error } = await insertWithRetry("sponsorship_orders", rows, "id");
    if (!error) {
      stats.sponsorshipOrders = data?.length || 0;
    } else {
      console.warn("⚠️ Sponsorship orders seed warning:", error.message);
    }
  }

  if (!stats.sponsorshipOrders && (await tableExists("sponsorship_packages")) && (await tableExists("sponsorship_deals"))) {
    const sponsorshipEvents = createdEvents.filter((event) => event.sponsorship_enabled);

    const packageRows = [];
    for (let i = 0; i < Math.min(18, sponsorshipEvents.length); i += 1) {
      const event = sponsorshipEvents[i];
      packageRows.push(await pickColumns("sponsorship_packages", {
        event_id: event.id,
        tier: sample(["bronze", "silver", "gold", "platinum"]),
        min_amount: 10000,
        max_amount: 75000,
        facilitator_fee: sample([0, 500, 1000]),
        organizer_notes: `${SEED_PREFIX} Sponsored deliverables package`,
        is_active: true,
      }));
    }

    const { data: packageData, error: packageError } = await insertWithRetry(
      "sponsorship_packages",
      packageRows,
      "id,event_id,facilitator_fee"
    );

    if (!packageError) {
      const eventMap = new Map(createdEvents.map((event) => [event.id, event]));
      const dealRows = [];
      for (let i = 0; i < (packageData || []).length; i += 1) {
        const pkg = packageData[i];
        const sponsor = sponsors[i % sponsors.length].email;
        const event = eventMap.get(pkg.event_id);
        const amountPaid = sample([12000, 18000, 25000, 40000]);
        const platformFee = Math.round(amountPaid * 0.1);
        const facilitationFee = Number(pkg.facilitator_fee || 0);
        dealRows.push(await pickColumns("sponsorship_deals", {
          sponsor_id: sponsor,
          event_id: pkg.event_id,
          package_id: pkg.id,
          amount_paid: amountPaid,
          platform_fee: platformFee,
          organizer_amount: amountPaid - platformFee - facilitationFee,
          facilitation_fee: facilitationFee,
          visibility_manual_verified: true,
          verification_admin_email: admins[0].email,
          razorpay_order_id: `seed_deal_order_${i + 1}_${Date.now()}`,
          razorpay_payment_id: `seed_deal_payment_${i + 1}_${Date.now()}`,
          status: sample(["confirmed", "active", "completed"]),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organizer_email: event?.organizer_email,
        }));
      }

      const { data: dealData, error: dealError } = await insertWithRetry("sponsorship_deals", dealRows, "id");
      if (!dealError) {
        stats.sponsorshipDeals = dealData?.length || 0;
      } else {
        console.warn("⚠️ Sponsorship deals seed warning:", dealError.message);
      }
    }
  }

  if (await tableExists("banners")) {
    const sponsorOrderMap = new Map();
    if (stats.sponsorshipOrders > 0) {
      const { data } = await supabase
        .from("sponsorship_orders")
        .select("id,event_id,fest_id,sponsor_email")
        .ilike("sponsor_email", "seed.sponsor%@happenin.test");
      for (const order of data || []) sponsorOrderMap.set(order.id, order);
    }

    const rows = [];

    for (let i = 0; i < Math.min(18, createdEvents.length); i += 1) {
      const event = createdEvents[i];
      rows.push(await pickColumns("banners", {
        title: `${SEED_PREFIX} Event Banner ${i + 1}`,
        type: "event",
        event_id: event.id,
        image_url: `https://picsum.photos/seed/event-banner-${i + 1}/1200/500`,
        placement: "event_page",
        link_type: "internal_event",
        link_target_id: event.id,
        link_url: null,
        status: "approved",
        priority: randomInt(0, 10),
        start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: event.organizer_email,
      }));
    }

    let index = 1;
    for (const order of sponsorOrderMap.values()) {
      rows.push(await pickColumns("banners", {
        title: `${SEED_PREFIX} Sponsor Banner ${index}`,
        type: "sponsor",
        event_id: order.event_id,
        fest_id: order.fest_id,
        sponsor_email: order.sponsor_email,
        sponsorship_order_id: order.id,
        image_url: `https://picsum.photos/seed/sponsor-banner-seed-${index}/1200/500`,
        placement: order.fest_id ? sample(["home_top", "home_mid"]) : "event_page",
        link_type: order.event_id ? "internal_event" : "internal_sponsor",
        link_target_id: order.event_id || order.id,
        link_url: "https://example.com",
        status: "approved",
        priority: randomInt(5, 12),
        start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: order.sponsor_email,
      }));
      index += 1;
      if (index > 18) break;
    }

    const validRows = rows.filter((row) => Object.keys(row).length > 0);
    if (validRows.length) {
      const { data, error } = await insertWithRetry("banners", validRows, "id");
      if (!error) stats.banners = data?.length || 0;
    }
  }

  console.log("\n🎉 Demo seed complete");
  console.table(stats);
  console.log("\n🔐 Test login credentials");
  console.log(`- Any seeded user password: ${DEFAULT_PASSWORD}`);
  console.log("- Student example: seed.student1@happenin.test");
  console.log("- Organizer example: seed.organizer1@happenin.test");
  console.log("- Sponsor example: seed.sponsor1@happenin.test");
  console.log("- Admin example: seed.admin1@happenin.test");
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
