export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      studentEmail,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !eventId ||
      !studentEmail
    ) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // 1️⃣ Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 2️⃣ Fetch event
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Calculate final price again (server trust)
    let finalPrice = Number(event.price);

    if (event.discount_enabled && event.discount_club) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("*")
        .eq("student_email", studentEmail)
        .eq("club", event.discount_club)
        .single();

      if (
        membership &&
        Array.isArray(event.eligible_members) &&
        event.eligible_members.some(
          (m: any) => m.memberId === membership.member_id
        )
      ) {
        finalPrice =
          finalPrice - Number(event.discount_amount || 0);
      }
    }

    if (finalPrice < 0) finalPrice = 0;

    // 4️⃣ Save registration
    const { error: insertError } = await supabase
      .from("registrations")
      .insert({
        student_email: studentEmail,
        event_id: eventId,
        final_price: finalPrice,
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });

    if (insertError) {
      return NextResponse.json(
        { error: "Already registered" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
