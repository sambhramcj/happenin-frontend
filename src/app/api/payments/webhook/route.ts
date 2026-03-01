import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

type RegistrationWithEvent = {
  id: string;
  event_id: string;
  student_email: string;
  final_price: number | null;
  organizer_share: number | null;
  platform_share: number | null;
  events?: {
    title?: string | null;
    date?: string | null;
    venue?: string | null;
    organizer_email?: string | null;
  } | null;
};

type WebhookPayload = {
  id?: string;
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
};

function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const sigA = Buffer.from(expected);
  const sigB = Buffer.from(signature || "");
  return sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);
}

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const sigA = Buffer.from(expected);
  const sigB = Buffer.from(signature);
  return sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB);
}

async function writeTransactionLog(payload: {
  streamType: "ticket" | "digital_pack" | "featured_boost";
  sourceId?: string | null;
  eventId?: string | null;
  festId?: string | null;
  payerEmail: string;
  organizerEmail?: string | null;
  grossAmount: number;
  organizerAmount: number;
  platformAmount: number;
  orderId: string;
  paymentId: string;
}) {
  const { data: existingTx, error: existingTxError } = await db
    .from("payment_transactions")
    .select("id")
    .eq("razorpay_order_id", payload.orderId)
    .eq("razorpay_payment_id", payload.paymentId)
    .maybeSingle();

  if (existingTxError) {
    console.error("Transaction dedupe lookup failed:", existingTxError.message);
    return;
  }

  if (existingTx) return;

  const { error: txInsertError } = await db.from("payment_transactions").insert({
    stream_type: payload.streamType,
    source_id: payload.sourceId,
    event_id: payload.eventId,
    fest_id: payload.festId,
    payer_email: payload.payerEmail,
    organizer_email: payload.organizerEmail || null,
    gross_amount: payload.grossAmount,
    organizer_amount: payload.organizerAmount,
    platform_amount: payload.platformAmount,
    razorpay_order_id: payload.orderId,
    razorpay_payment_id: payload.paymentId,
    status: "captured",
  });

  if (txInsertError) {
    console.error("Transaction insert failed:", txInsertError.message);
  }
}

async function processCapturedPayment(orderId: string, paymentId: string) {
  // 1) Ticket payments
  const { data: registration } = await db
    .from("registrations")
    .select("id,event_id,student_email,status,payment_status,final_price,organizer_share,platform_share,events!registrations_event_id_fkey(title,date,venue,organizer_email)")
    .eq("razorpay_order_id", orderId)
    .maybeSingle<RegistrationWithEvent>();

  if (registration) {
    await db
      .from("registrations")
      .update({
        status: "confirmed",
        payment_status: "success",
        razorpay_payment_id: paymentId,
        payment_captured_at: new Date().toISOString(),
      })
      .eq("id", registration.id);

    const ticketId = `TKT-${registration.id.slice(0, 8)}-${Date.now()}`;

    const { data: existingTicket } = await db
      .from("tickets")
      .select("id")
      .eq("registration_id", registration.id)
      .maybeSingle();

    if (!existingTicket) {
      await db.from("tickets").insert({
        ticket_id: ticketId,
        event_id: registration.event_id,
        registration_id: registration.id,
        student_email: registration.student_email,
        event_title: registration.events?.title || "",
        event_date: registration.events?.date || "",
        event_location: registration.events?.venue || "",
        qr_code_data: `${registration.event_id}:${registration.id}:${Date.now()}`,
        design_template: "modern",
        status: "active",
      });
    }

    await writeTransactionLog({
      streamType: "ticket",
      sourceId: registration.id,
      eventId: registration.event_id,
      payerEmail: registration.student_email,
      organizerEmail: registration.events?.organizer_email || null,
      grossAmount: Number(registration.final_price || 0),
      organizerAmount: Number(registration.organizer_share || 0),
      platformAmount: Number(registration.platform_share || 0),
      orderId,
      paymentId,
    });

    return "ticket";
  }

  // 2) Digital packs
  const { data: pack } = await db
    .from("digital_visibility_packs")
    .select("id,sponsor_id,event_id,fest_id,organizer_email,amount,organizer_share,platform_share,admin_approved")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (pack) {
    await db
      .from("digital_visibility_packs")
      .update({
        payment_status: "paid",
        razorpay_payment_id: paymentId,
        visibility_active: Boolean(pack.admin_approved),
      })
      .eq("id", pack.id);

    const { data: existingPayout, error: payoutLookupError } = await db
      .from("sponsorship_payouts")
      .select("id")
      .eq("digital_pack_id", pack.id)
      .maybeSingle();

    if (payoutLookupError) {
      console.error("Payout dedupe lookup failed:", payoutLookupError.message);
    } else if (!existingPayout) {
      const { error: payoutInsertError } = await db.from("sponsorship_payouts").insert({
        digital_pack_id: pack.id,
        organizer_email: pack.organizer_email,
        gross_amount: Number(pack.amount || 0),
        platform_fee: Number(pack.platform_share || 0),
        payout_amount: Number(pack.organizer_share || 0),
        payout_status: "pending",
      });

      if (payoutInsertError) {
        console.error("Payout insert failed:", payoutInsertError.message);
      }
    }

    await writeTransactionLog({
      streamType: "digital_pack",
      sourceId: pack.id,
      eventId: pack.event_id,
      festId: pack.fest_id,
      payerEmail: pack.sponsor_id,
      organizerEmail: pack.organizer_email,
      grossAmount: Number(pack.amount || 0),
      organizerAmount: Number(pack.organizer_share || 0),
      platformAmount: Number(pack.platform_share || 0),
      orderId,
      paymentId,
    });

    return "digital_pack";
  }

  // 3) Featured boost
  const { data: featured } = await db
    .from("featured_events")
    .select("id,event_id,organizer_email")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  if (featured) {
    await db
      .from("featured_events")
      .update({
        payment_status: "paid",
        active: true,
        razorpay_payment_id: paymentId,
      })
      .eq("id", featured.id);

    await writeTransactionLog({
      streamType: "featured_boost",
      sourceId: featured.id,
      eventId: featured.event_id,
      payerEmail: featured.organizer_email,
      organizerEmail: null,
      grossAmount: 1000,
      organizerAmount: 0,
      platformAmount: 1000,
      orderId,
      paymentId,
    });

    return "featured_boost";
  }

  return "unknown";
}

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

    // Official webhook path
    if (signature) {
      if (!verifyWebhookSignature(rawBody, signature)) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }

      const payload = JSON.parse(rawBody || "{}") as WebhookPayload;
      const eventId = payload?.payload?.payment?.entity?.id
        ? `payment_${payload.payload.payment.entity.id}`
        : payload?.id || `unknown_${Date.now()}`;
      const eventType = payload?.event || "unknown";

      const { data: existing } = await db
        .from("webhook_events")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ ok: true, duplicate: true });
      }

      await db.from("webhook_events").insert({
        event_id: eventId,
        event_type: eventType,
        payload,
      });

      if (eventType === "payment.captured" || eventType === "order.paid") {
        const paymentEntity = payload?.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;

        if (orderId && paymentId) {
          await processCapturedPayment(orderId, paymentId);
        }
      }

      return NextResponse.json({ ok: true });
    }

    // Client-assisted verification fallback (for checkout handler)
    const body = JSON.parse(rawBody || "{}") as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      [key: string]: unknown;
    };
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const checkoutSignature = body.razorpay_signature;

    if (!orderId || !paymentId || !checkoutSignature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    if (!verifyCheckoutSignature(orderId, paymentId, checkoutSignature)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const dedupeId = `manual_${orderId}_${paymentId}`;

    const { data: existingManual } = await db
      .from("webhook_events")
      .select("id")
      .eq("event_id", dedupeId)
      .maybeSingle();

    if (existingManual) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    await db.from("webhook_events").insert({
      event_id: dedupeId,
      event_type: "payment.captured.manual",
      payload: body,
    });

    const stream = await processCapturedPayment(orderId, paymentId);
    return NextResponse.json({ success: true, stream });
  } catch (error: unknown) {
    console.error("Payments webhook error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
