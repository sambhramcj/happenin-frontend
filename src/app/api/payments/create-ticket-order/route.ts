import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { razorpay } from "@/lib/razorpay";
import { splitTicketAmount, toPaise } from "@/lib/revenue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;
    const { eventId } = (await req.json()) as { eventId?: string };

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const { data: event, error: eventError } = await db
      .from("events")
      .select("id,title,price,organizer_email,max_attendees")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const ticketPrice = Number(event.price || 0);
    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      return NextResponse.json({ error: "Invalid ticket price" }, { status: 400 });
    }

    const { data: existingRegistration } = await db
      .from("registrations")
      .select("id,status")
      .eq("student_email", studentEmail)
      .eq("event_id", eventId)
      .in("status", ["pending", "registered", "confirmed", "checked_in"])
      .maybeSingle();

    if (existingRegistration) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 });
    }

    if (event.max_attendees) {
      const { count } = await db
        .from("registrations")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .in("status", ["registered", "confirmed", "checked_in"]);

      if ((count || 0) >= Number(event.max_attendees)) {
        return NextResponse.json({ error: "Event is full" }, { status: 409 });
      }
    }

    const { data: organizer, error: organizerError } = await db
      .from("organizers")
      .select("razorpay_account_id,kyc_status")
      .eq("user_email", event.organizer_email)
      .maybeSingle();

    if (organizerError || !organizer?.razorpay_account_id || organizer.kyc_status !== "verified") {
      return NextResponse.json(
        { error: "Organizer payout account is not ready for route transfers" },
        { status: 400 }
      );
    }

    const { organizerAmount, platformAmount } = splitTicketAmount(ticketPrice);

    const orderPayload = {
      amount: toPaise(ticketPrice),
      currency: "INR",
      receipt: `ticket_${eventId.slice(-6)}_${Date.now()}`,
      notes: {
        stream: "ticket",
        event_id: eventId,
        student_email: studentEmail,
      },
      transfers: [
        {
          account: organizer.razorpay_account_id,
          amount: toPaise(organizerAmount),
          currency: "INR",
          notes: {
            event_id: eventId,
            stream: "ticket",
            organizer_email: event.organizer_email,
          },
        },
      ],
    };

    const order = await razorpay.orders.create(
      orderPayload as unknown as Parameters<typeof razorpay.orders.create>[0]
    );

    const { error: insertError } = await db.from("registrations").insert({
      event_id: eventId,
      student_email: studentEmail,
      registration_date: new Date().toISOString(),
      status: "pending",
      payment_status: "pending",
      final_price: ticketPrice,
      organizer_share: organizerAmount,
      platform_share: platformAmount,
      razorpay_order_id: order.id,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: ticketPrice,
      currency: "INR",
      organizerAmount,
      platformAmount,
      eventId,
    });
  } catch (error: unknown) {
    console.error("Create ticket order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create ticket order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
