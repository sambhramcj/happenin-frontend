import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { razorpay } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PACK_PRICES: Record<"digital" | "app" | "fest", number> = {
  digital: 10000,
  app: 25000,
  fest: 50000,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role as string | undefined;

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role !== "sponsor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as {
      event_id?: string | null;
      pack_type?: "digital" | "app" | "fest";
    };

    const eventId = body.event_id || null;
    const packType = body.pack_type;

    if (!packType || !(packType in PACK_PRICES)) {
      return NextResponse.json({ error: "Invalid pack_type" }, { status: 400 });
    }

    if (!eventId) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }

    const { data: event, error: eventError } = await db
      .from("events")
      .select("id, title, fest_id, sponsorship_enabled")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.sponsorship_enabled) {
      return NextResponse.json(
        { error: "Sponsorship visibility not enabled for this event" },
        { status: 400 }
      );
    }

    if (packType === "fest" && !event.fest_id) {
      return NextResponse.json(
        { error: "Fest sponsorship is not available for this event" },
        { status: 400 }
      );
    }

    const sponsorEmail = session.user.email as string;

    const { data: sponsorProfile } = await db
      .from("sponsors_profile")
      .select("email, is_active")
      .eq("email", sponsorEmail)
      .single();

    if (!sponsorProfile) {
      return NextResponse.json(
        { error: "Sponsor profile required" },
        { status: 400 }
      );
    }

    if (sponsorProfile.is_active === false) {
      return NextResponse.json(
        { error: "Sponsor account is disabled" },
        { status: 403 }
      );
    }

    const existingQuery = db
      .from("sponsorship_orders")
      .select("id")
      .eq("sponsor_email", sponsorEmail)
      .eq("pack_type", packType)
      .eq("status", "paid");

    if (packType === "fest") {
      existingQuery.eq("fest_id", event.fest_id);
    } else {
      existingQuery.eq("event_id", event.id);
    }

    const { data: existingPaid } = await existingQuery.maybeSingle();

    if (existingPaid) {
      return NextResponse.json(
        { error: "Sponsorship already active for this pack" },
        { status: 409 }
      );
    }

    const amount = PACK_PRICES[packType];

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `sp_${event.id.slice(-6)}_${Date.now()}`,
    });

    const { data: created, error: insertError } = await db
      .from("sponsorship_orders")
      .insert({
        sponsor_email: sponsorEmail,
        event_id: packType === "fest" ? null : event.id,
        fest_id: packType === "fest" ? event.fest_id : null,
        pack_type: packType,
        amount,
        razorpay_order_id: order.id,
        status: "created",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create sponsorship order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      amount,
      currency: "INR",
      orderRecordId: created?.id,
    });
  } catch (error) {
    console.error("Create sponsorship order error:", error);
    return NextResponse.json(
      { error: "Failed to create sponsorship order" },
      { status: 500 }
    );
  }
}
