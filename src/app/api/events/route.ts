import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

// ======================
// CREATE EVENT
// ======================
export async function POST(req: Request) {
  console.log("POST /api/events HIT");

  try {
    const body = await req.json();
    console.log("REQUEST BODY:", body);

    const maxAttendeesRaw = body.maxAttendees;
    const maxAttendees =
      maxAttendeesRaw === undefined || maxAttendeesRaw === null || maxAttendeesRaw === ""
        ? null
        : Number(maxAttendeesRaw);

    if (
      maxAttendees !== null &&
      (!Number.isFinite(maxAttendees) || !Number.isInteger(maxAttendees) || maxAttendees <= 0)
    ) {
      return NextResponse.json(
        { success: false, error: "Max attendees must be a positive whole number" },
        { status: 400 }
      );
    }

    const whatsappLink = typeof body.whatsappGroupLink === "string" ? body.whatsappGroupLink.trim() : "";
    const whatsappEnabled = Boolean(body.whatsappGroupEnabled);
    const startDateTime = body.start_datetime || null;
    const endDateTime = body.end_datetime || null;
    const legacyDate = body.date || startDateTime || endDateTime || new Date().toISOString();
    const whatsappPattern = /^https:\/\/chat\.whatsapp\.com\/.+/;

    if (whatsappLink && !whatsappPattern.test(whatsappLink)) {
      return NextResponse.json(
        { success: false, error: "WhatsApp link must start with https://chat.whatsapp.com/" },
        { status: 400 }
      );
    }

    if (whatsappEnabled && !whatsappLink) {
      return NextResponse.json(
        { success: false, error: "WhatsApp link is required when enabled" },
        { status: 400 }
      );
    }

    const insertPayload = {
      title: body.title,
      description: body.description || "",
      date: legacyDate,
      start_datetime: startDateTime,
      end_datetime: endDateTime,
      schedule_sessions: body.schedule_sessions || null,
      location: body.location || "",
      price: Number(body.price),
      banner_image: body.bannerImage || null,
      brochure_url: body.brochureUrl || null,

      discount_enabled: Boolean(body.discountEnabled),
      discount_club: body.discountClub || null,
      discount_amount: Number(body.discountAmount) || 0,

      eligible_members: body.eligibleMembers || [],

      sponsorship_enabled: Boolean(body.sponsorshipEnabled) || false,

      prize_pool_amount: body.prizePoolAmount || null,
      prize_pool_description: body.prizePoolDescription || null,

      max_attendees: maxAttendees,

      organizer_contact_phone: body.organizerContactPhone || null,
      organizer_contact_email: body.organizerContactEmail || null,
      organizer_contact_name: body.organizerContactName || null,

      whatsapp_group_enabled: whatsappEnabled,
      whatsapp_group_link: whatsappLink || null,

      // Volunteer fields (added)
      needs_volunteers: Boolean(body.needsVolunteers) || false,
      volunteer_roles: body.volunteerRoles || [],
      volunteer_description: body.volunteerDescription || null,

      organizer_email: body.organizerEmail,
    };

    console.log("INSERT PAYLOAD:", insertPayload);

    const { data, error } = await supabase
      .from("events")
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("❌ SUPABASE INSERT ERROR:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log("✅ EVENT CREATED:", data);

    const createdEvent = data?.[0];
    const registrationRestrictions = body.registrationRestrictions || {};
    const restrictionEnabled = Boolean(registrationRestrictions.enabled);

    if (createdEvent?.id && restrictionEnabled) {
      const cleanStrings = (values: any) =>
        (Array.isArray(values) ? values : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean);

      const cleanYears = (values: any) =>
        (Array.isArray(values) ? values : [])
          .map((value) => Number(value))
          .filter((value) => Number.isInteger(value) && value > 0)
          .map((value) => String(value));

      const colleges = cleanStrings(registrationRestrictions.colleges);
      const branches = cleanStrings(registrationRestrictions.branches);
      const years = cleanYears(registrationRestrictions.years);
      const clubs = cleanStrings(registrationRestrictions.clubs);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
          { success: false, error: "Server missing Supabase service role configuration for access control" },
          { status: 500 }
        );
      }

      const adminDb = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const restrictionsJson = {
        college: colleges,
        year_of_study: years.map((year) => Number(year)),
        branch: branches,
        club_membership: clubs,
        require_all_criteria: Boolean(registrationRestrictions.requireAllCriteria),
      };

      const { data: accessControl, error: accessControlError } = await adminDb
        .from("event_access_control")
        .upsert(
          {
            event_id: createdEvent.id,
            organizer_email: body.organizerEmail,
            access_type: "restricted",
            restrictions: restrictionsJson,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id" }
        )
        .select("id")
        .single();

      if (accessControlError || !accessControl?.id) {
        await supabase.from("events").delete().eq("id", createdEvent.id);
        return NextResponse.json(
          { success: false, error: accessControlError?.message || "Failed to save access control settings" },
          { status: 500 }
        );
      }

      const { error: deleteRestrictionsError } = await adminDb
        .from("access_control_restrictions")
        .delete()
        .eq("access_control_id", accessControl.id);

      if (deleteRestrictionsError) {
        await supabase.from("events").delete().eq("id", createdEvent.id);
        return NextResponse.json(
          { success: false, error: deleteRestrictionsError.message },
          { status: 500 }
        );
      }

      const restrictionRows = [
        ...colleges.map((value) => ({ restriction_type: "college", restriction_value: value })),
        ...years.map((value) => ({ restriction_type: "year_of_study", restriction_value: value })),
        ...branches.map((value) => ({ restriction_type: "branch", restriction_value: value })),
        ...clubs.map((value) => ({ restriction_type: "club_membership", restriction_value: value })),
      ].map((row) => ({ ...row, access_control_id: accessControl.id }));

      if (restrictionRows.length > 0) {
        const { error: insertRestrictionsError } = await adminDb
          .from("access_control_restrictions")
          .insert(restrictionRows as any);

        if (insertRestrictionsError) {
          await supabase.from("events").delete().eq("id", createdEvent.id);
          return NextResponse.json(
            { success: false, error: insertRestrictionsError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: createdEvent,
    });
  } catch (err: any) {
    console.error("❌ SERVER ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Server error while creating event" },
      { status: 500 }
    );
  }
}

// ======================
// FETCH EVENTS
// ======================
export async function GET() {
  console.log("GET /api/events HIT");

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      organizers_profile:organizers!events_organizer_email_fkey (
        first_name,
        last_name,
        logo_url
      )
    `)
    .order("created_at", { ascending: false });

  let resolvedData = data;
  if (error) {
    console.warn("⚠️ Relation fetch failed in /api/events, falling back to base events query:", error.message);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (fallbackError) {
      console.error("❌ SUPABASE FALLBACK FETCH ERROR:", fallbackError);
      return NextResponse.json(
        { error: fallbackError.message },
        { status: 500 }
      );
    }

    resolvedData = fallbackData || [];
  }

  const sanitized = (resolvedData || []).map(({ whatsapp_group_link, whatsapp_group_enabled, ...rest }) => rest);
  return NextResponse.json(sanitized);
}
