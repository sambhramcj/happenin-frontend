import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { razorpay } from "@/lib/razorpay";
import { FEATURED_BOOST_PRICE, toPaise } from "@/lib/revenue";
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
    if (!flags.FEATURED_EVENT_BOOST) {
      return NextResponse.json({ error: "Featured event boost is currently disabled" }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "organizer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { eventId } = (await req.json()) as { eventId?: string };
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

    const { data: event, error: eventError } = await db
      .from("events")
      .select("id,title,date,college_id,organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizer_email !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!event.college_id) {
      return NextResponse.json({ error: "Event college is required for featuring" }, { status: 400 });
    }

    const now = new Date();
    const eventDate = new Date(event.date);
    const windowStart = new Date(eventDate);
    windowStart.setDate(windowStart.getDate() - 7);

    if (!(now >= windowStart && now < eventDate)) {
      return NextResponse.json(
        { error: "Featured boost is allowed only in the 7-day window before event date" },
        { status: 400 }
      );
    }

    const { count: activeCount } = await db
      .from("featured_events")
      .select("id", { count: "exact", head: true })
      .eq("college_id", event.college_id)
      .eq("active", true)
      .gte("end_date", now.toISOString());

    if ((activeCount || 0) >= 5) {
      return NextResponse.json({ error: "Max 5 active featured events allowed per college" }, { status: 409 });
    }

    const { data: existing } = await db
      .from("featured_events")
      .select("id")
      .eq("event_id", eventId)
      .in("payment_status", ["pending", "paid"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Featured boost already exists for this event" }, { status: 409 });
    }

    const order = await razorpay.orders.create({
      amount: toPaise(FEATURED_BOOST_PRICE),
      currency: "INR",
      receipt: `boost_${eventId.slice(-6)}_${Date.now()}`,
      notes: {
        stream: "featured_boost",
        event_id: eventId,
        organizer_email: email,
      },
    });

    const { data: created, error: insertError } = await db
      .from("featured_events")
      .insert({
        event_id: eventId,
        college_id: event.college_id,
        organizer_email: email,
        start_date: now.toISOString(),
        end_date: eventDate.toISOString(),
        payment_status: "pending",
        active: false,
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
      amount: FEATURED_BOOST_PRICE,
      currency: "INR",
      eventId,
    });
  } catch (error: unknown) {
    console.error("Create featured boost order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create featured boost order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
