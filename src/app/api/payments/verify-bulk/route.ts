export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
      teamSize?: number;
      members?: Array<{ email: string; full_name: string }>;
    };

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId,
      teamSize,
      members,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !eventId ||
      !teamSize ||
      !members ||
      members.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing payment details or team data" },
        { status: 400 }
      );
    }

    // 0️⃣ Auth: derive student identity from server session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const primaryEmail = session.user.email as string;

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
      .select("id,title,price,date,location")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 3️⃣ Calculate final price per person
    const pricePerPerson = Math.max(0, Number(event.price));
    const totalPrice = pricePerPerson * teamSize;

    // 4️⃣ Check if payment already processed
    const { data: existingPayment } = await db
      .from("registrations")
      .select("id,student_email,event_id,status")
      .or(
        `razorpay_order_id.eq.${razorpay_order_id},razorpay_payment_id.eq.${razorpay_payment_id}`
      )
      .limit(1)
      .maybeSingle();

    if (existingPayment?.id) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
      });
    }

    // 5️⃣ Create registrations for all team members
    const registrations: any[] = [];
    const tickets: any[] = [];

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const isTeamLead = i === 0; // First member is team lead (primary user)

      // Check if member already registered (duplicate prevention)
      const { data: existingReg } = await db
        .from("registrations")
        .select("id")
        .eq("student_email", member.email)
        .eq("event_id", eventId)
        .maybeSingle();

      if (existingReg?.id) {
        console.warn(`Member ${member.email} already registered, skipping`);
        continue;
      }

      // Create registration
      const registrationPayload = {
        student_email: member.email,
        event_id: eventId,
        final_price: isTeamLead ? totalPrice : 0, // Only lead pays, others show 0
        razorpay_order_id: isTeamLead ? razorpay_order_id : null,
        razorpay_payment_id: isTeamLead ? razorpay_payment_id : null,
        razorpay_signature: isTeamLead ? razorpay_signature : null,
        status: "confirmed",
      };

      const { data: newRegistration, error: insertError } = await db
        .from("registrations")
        .insert(registrationPayload)
        .select("id")
        .single();

      if (insertError) {
        console.error(
          `Registration insert error for ${member.email}:`,
          insertError
        );
        // Continue to next member instead of failing entire team
        continue;
      }

      if (!newRegistration) {
        console.error(`No registration data returned for ${member.email}`);
        continue;
      }

      registrations.push(newRegistration);

      // Create ticket
      const registrationId = newRegistration.id;
      const qrData = `${eventId}:${registrationId}:${Date.now()}`;
      const ticketId = `TKT-${registrationId.slice(0, 8)}-${Date.now()}`;

      const ticketPayload = {
        ticket_id: ticketId,
        event_id: eventId,
        registration_id: registrationId,
        student_email: member.email,
        event_title: event.title || "",
        event_date: event.date || "",
        event_location: event.location || "",
        qr_code_data: qrData,
        design_template: "modern",
        status: "active",
        created_at: new Date().toISOString(),
      };

      const { data: newTicket, error: ticketError } = await db
        .from("tickets")
        .insert(ticketPayload)
        .select("id")
        .single();

      if (ticketError) {
        console.error(
          `Ticket creation error for ${member.email}:`,
          ticketError
        );
      } else if (newTicket) {
        tickets.push(newTicket);
      }
    }

    if (registrations.length === 0) {
      return NextResponse.json(
        { error: "Failed to create any registrations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Team registration complete: ${registrations.length} members registered`,
      registrations: registrations.length,
      tickets: tickets.length,
    });
  } catch (err) {
    console.error("BULK PAYMENT VERIFICATION ERROR:", err);
    return NextResponse.json(
      { error: "Failed to verify bulk payment" },
      { status: 500 }
    );
  }
}
