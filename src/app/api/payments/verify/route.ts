export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Server-only admin client (bypasses RLS). Will only be created if service key is present.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const db = serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : supabase;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !eventId
    ) {
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // 0️⃣ Auth: derive student identity from server session (never trust client email)
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const studentEmail = session.user.email as string;

    // 1️⃣ Verify signature (timing-safe)
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    const sigA = Buffer.from(generatedSignature);
    const sigB = Buffer.from(razorpay_signature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // 2️⃣ Fetch event
    const { data: event } = await db
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
      const { data: membership } = await db
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

    // 4️⃣ Check if already registered
    const { data: existingReg, error: checkError } = await supabase
      .from("registrations")
      .select("id")
      .eq("student_email", studentEmail)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingReg) {
      // Already registered, return success without re-registering
      console.log("Student already registered for this event");
      return NextResponse.json({ 
        success: true, 
        message: "Already registered" 
      });
    }

    // 5️⃣ Save registration (using admin client to bypass RLS)
    const registrationPayload = {
      student_email: studentEmail,
      event_id: eventId,
      final_price: finalPrice,
    };

    const { data: newRegistration, error: insertError } = await db
      .from("registrations")
      .insert(registrationPayload)
      .select("id")
      .single();

    if (insertError) {
      console.error("Registration insert error:", insertError);
      return NextResponse.json(
        { error: `Failed to create registration: ${insertError.message}` },
        { status: 400 }
      );
    }

    if (!newRegistration) {
      console.error("No registration data returned");
      return NextResponse.json(
        { error: "Registration created but no data returned" },
        { status: 400 }
      );
    }

    // 6️⃣ Create ticket for the registration
    const registrationId = newRegistration.id;
    const qrData = `${eventId}:${registrationId}:${Date.now()}`;
    const ticketId = `TKT-${registrationId.slice(0, 8)}-${Date.now()}`;

    const ticketPayload = {
      ticket_id: ticketId,
      event_id: eventId,
      registration_id: registrationId,
      student_email: studentEmail,
      event_title: event.title || "",
      event_date: event.date || "",
      event_location: event.location || "",
      qr_code_data: qrData,
      design_template: "modern",
      status: "active",
      created_at: new Date().toISOString(),
    };

    const { error: ticketError } = await db
      .from("tickets")
      .insert(ticketPayload);

    if (ticketError) {
      console.error("Ticket creation error:", ticketError);
      // Don't fail registration if ticket creation fails - student can still access event
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
