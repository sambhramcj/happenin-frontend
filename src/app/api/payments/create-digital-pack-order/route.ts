import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { razorpay } from "@/lib/razorpay";
import {
  DIGITAL_PACK_PRICES,
  DigitalPackType,
  splitDigitalPackAmount,
  toPaise,
} from "@/lib/revenue";
import { getServerFeatureFlags } from "@/lib/serverFeatureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const flags = await getServerFeatureFlags();
    if (!flags.SPONSORSHIPS || !flags.DIGITAL_VISIBILITY_PACKS) {
      return NextResponse.json({ error: "Digital visibility packs are currently disabled" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "sponsor") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: sponsorProfile } = await db
      .from("sponsors_profile")
      .select("email,is_active")
      .eq("email", email)
      .maybeSingle();

    if (!sponsorProfile || sponsorProfile.is_active === false) {
      return NextResponse.json({ error: "Active sponsor profile required" }, { status: 400 });
    }

    const body = (await req.json()) as {
      eventId?: string;
      event_id?: string;
      festId?: string;
      fest_id?: string;
      packType?: DigitalPackType;
      pack_type?: DigitalPackType;
    };

    const packType = (body.packType || body.pack_type) as DigitalPackType | undefined;
    const eventId = body.eventId || body.event_id || null;
    let festId = body.festId || body.fest_id || null;

    if (!packType || !(packType in DIGITAL_PACK_PRICES)) {
      return NextResponse.json({ error: "Invalid pack type" }, { status: 400 });
    }

    if ((packType === "silver" || packType === "gold") && !eventId) {
      return NextResponse.json({ error: "eventId is required for silver/gold" }, { status: 400 });
    }

    let organizerEmail: string | null = null;

    if (eventId) {
      const { data: event, error: eventError } = await db
        .from("events")
        .select("id, title, fest_id, organizer_email, sponsorship_enabled")
        .eq("id", eventId)
        .single();

      if (eventError || !event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      if (!event.sponsorship_enabled) {
        return NextResponse.json({ error: "Sponsorship is disabled for this event" }, { status: 400 });
      }

      organizerEmail = event.organizer_email;
      if (!festId) festId = event.fest_id || null;
    }

    if (packType === "platinum") {
      if (!festId) {
        return NextResponse.json({ error: "festId is required for platinum" }, { status: 400 });
      }

      const { data: fest, error: festError } = await db
        .from("fests")
        .select("id, core_team_leader_email")
        .eq("id", festId)
        .single();

      if (festError || !fest) {
        return NextResponse.json({ error: "Fest not found" }, { status: 404 });
      }

      organizerEmail = organizerEmail || fest.core_team_leader_email;
    }

    if (!organizerEmail) {
      return NextResponse.json({ error: "Could not resolve organizer for payout" }, { status: 400 });
    }

    const { data: organizer, error: organizerError } = await db
      .from("organizers")
      .select("razorpay_account_id,kyc_status")
      .eq("user_email", organizerEmail)
      .maybeSingle();

    if (organizerError || !organizer?.razorpay_account_id || organizer.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "Organizer payout account not ready" },
        { status: 400 }
      );
    }

    if (packType === "platinum") {
      const { data: platinumExists } = await db
        .from("digital_visibility_packs")
        .select("id")
        .eq("fest_id", festId)
        .eq("pack_type", "platinum")
        .in("payment_status", ["pending", "paid"])
        .maybeSingle();

      if (platinumExists) {
        return NextResponse.json({ error: "Platinum pack already exists for this fest" }, { status: 409 });
      }
    }

    if (eventId && (packType === "silver" || packType === "gold")) {
      const { data: eventPackExists } = await db
        .from("digital_visibility_packs")
        .select("id")
        .eq("event_id", eventId)
        .in("pack_type", ["silver", "gold"])
        .in("payment_status", ["pending", "paid"])
        .maybeSingle();

      if (eventPackExists) {
        return NextResponse.json({ error: "Only one Silver or Gold pack is allowed per event" }, { status: 409 });
      }
    }

    const amount = DIGITAL_PACK_PRICES[packType];
    const { organizerShare, platformShare } = splitDigitalPackAmount(amount);

    const orderPayload = {
      amount: toPaise(amount),
      currency: "INR",
      receipt: `dvp_${Date.now()}`,
      notes: {
        stream: "digital_pack",
        sponsor_id: email,
        pack_type: packType,
        event_id: eventId || "",
        fest_id: festId || "",
      },
      transfers: [
        {
          account: organizer.razorpay_account_id,
          amount: toPaise(organizerShare),
          currency: "INR",
          notes: {
            stream: "digital_pack",
            organizer_email: organizerEmail,
            pack_type: packType,
          },
        },
      ],
    };

    const order = await razorpay.orders.create(
      orderPayload as unknown as Parameters<typeof razorpay.orders.create>[0]
    );

    const { data: created, error: insertError } = await db
      .from("digital_visibility_packs")
      .insert({
        sponsor_id: email,
        event_id: eventId,
        fest_id: festId,
        pack_type: packType,
        amount,
        organizer_share: organizerShare,
        platform_share: platformShare,
        payment_status: "pending",
        visibility_active: false,
        admin_approved: false,
        organizer_email: organizerEmail,
        razorpay_order_id: order.id,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      orderRecordId: created.id,
      amount,
      currency: "INR",
      packType,
      organizerShare,
      platformShare,
    });
  } catch (error: unknown) {
    console.error("Create digital pack order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create digital pack order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
