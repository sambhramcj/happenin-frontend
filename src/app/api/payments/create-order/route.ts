import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { supabase } from "@/lib/supabase";

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { eventId, studentEmail } = await req.json();

    if (!eventId || !studentEmail) {
      return NextResponse.json(
        { error: "Missing eventId or studentEmail" },
        { status: 400 }
      );
    }

    // 1️⃣ Fetch event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Default price
    let finalPrice = Number(event.price);

    // 3️⃣ Apply discount ONLY if enabled
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

    // 4️⃣ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: finalPrice * 100, // paise
      currency: "INR",
      receipt: `evt_${eventId.slice(-6)}_${Date.now()}`,
    });

    return NextResponse.json({
      orderId: order.id,
      amount: finalPrice,
      currency: "INR",
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
