import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    const whatsappLink = typeof body.whatsappGroupLink === "string" ? body.whatsappGroupLink.trim() : "";
    const whatsappEnabled = Boolean(body.whatsappGroupEnabled);
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
      date: body.date || null,
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

      organizer_contact_phone: body.organizerContactPhone || null,
      organizer_contact_email: body.organizerContactEmail || null,

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

    return NextResponse.json({
      success: true,
      event: data?.[0],
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
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ SUPABASE FETCH ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const sanitized = (data || []).map(({ whatsapp_group_link, whatsapp_group_enabled, ...rest }) => rest);
  return NextResponse.json(sanitized);
}
