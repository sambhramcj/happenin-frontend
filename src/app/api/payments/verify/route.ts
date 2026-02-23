export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  notifyStudentPaymentSuccess,
  notifyOrganizerPaymentReceived,
  notifyOrganizerCapacityAlert,
  notifyStudentRegistration,
  notifyOrganizerNewRegistration,
} from "@/lib/notifications";
import {
  calculateStudentEventPrice,
  getStudentEligibilityContext,
  isStudentEligibleForEvent,
} from "@/lib/registration-eligibility";

// Server-only admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      eventId?: string;
    };

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
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
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
      .select("id,title,price,date,location,max_attendees,organizer_email,discount_enabled,discount_club,discount_amount,eligible_members")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const studentContext = await getStudentEligibilityContext(db, studentEmail);
    const eligible = await isStudentEligibleForEvent(
      db,
      eventId,
      studentEmail,
      studentContext
    );
    if (!eligible) {
      return NextResponse.json(
        { error: "You are not eligible to register for this event" },
        { status: 403 }
      );
    }

    const finalPrice = calculateStudentEventPrice(event, studentContext);

    // 4️⃣ Check if already registered
    const { data: existingPayment } = await db
      .from("registrations")
      .select("id,student_email,event_id,status")
      .or(
        `razorpay_order_id.eq.${razorpay_order_id},razorpay_payment_id.eq.${razorpay_payment_id}`
      )
      .limit(1)
      .maybeSingle();

    if (existingPayment?.id) {
      if (
        existingPayment.student_email !== studentEmail ||
        existingPayment.event_id !== eventId
      ) {
        return NextResponse.json(
          { error: "Payment already used" },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true, message: "Already verified" });
    }

    const { data: existingReg } = await db
      .from("registrations")
      .select("id,status")
      .eq("student_email", studentEmail)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingReg?.id) {
      if (existingReg.status === "confirmed") {
        return NextResponse.json({ success: true, message: "Already registered" });
      }

      const { error: updateError } = await db
        .from("registrations")
        .update({
          final_price: finalPrice,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          status: "confirmed",
        })
        .eq("id", existingReg.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to confirm registration" },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (event.max_attendees) {
      const { count, error: countError } = await db
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["confirmed", "registered", "checked_in"]);

      if (countError) {
        console.error("Capacity count error:", countError);
        return NextResponse.json(
          { error: "Failed to validate event capacity" },
          { status: 500 }
        );
      }

      if ((count || 0) >= event.max_attendees) {
        return NextResponse.json(
          { error: "Event is full" },
          { status: 409 }
        );
      }
    }

    // 5️⃣ Save registration (using admin client to bypass RLS)
    const registrationPayload = {
      student_email: studentEmail,
      event_id: eventId,
      final_price: finalPrice,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: "confirmed",
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

    // 7️⃣ Send notifications to student and organizer
    try {
      // Get organizer info for notification
      const { data: organizerData } = await db
        .from("users")
        .select("email, name")
        .eq("email", event.organizer_email)
        .single();

      // Notify student
      await notifyStudentPaymentSuccess(
        studentEmail,
        eventId,
        event.title || "Event",
        finalPrice
      );

      // Notify organizer
      if (organizerData?.email) {
        await notifyOrganizerPaymentReceived(
          organizerData.email,
          eventId,
          event.title || "Event",
          organizerData.name || studentEmail,
          finalPrice
        );

        // Check capacity and alert if needed
        if (event.max_attendees) {
          const { count } = await db
            .from("registrations")
            .select("id", { count: "exact", head: true })
            .eq("event_id", eventId)
            .in("status", ["confirmed", "registered", "checked_in"]);

          if (count && count > 0) {
            await notifyOrganizerCapacityAlert(
              organizerData.email,
              eventId,
              event.title || "Event",
              count,
              event.max_attendees
            );
          }
        }
      }

      // Also notify with registration confirmation
      await notifyStudentRegistration(
        studentEmail,
        eventId,
        event.title || "Event",
        "individual"
      );

      if (organizerData?.email) {
        await notifyOrganizerNewRegistration(
          organizerData.email,
          eventId,
          event.title || "Event",
          organizerData.name || studentEmail,
          studentEmail,
          "individual"
        );
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
      // Don't fail registration if notifications fail
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
