import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { razorpay } from "@/lib/razorpay";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering for API routes
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      eventId?: string;
      teamSize?: number;
      members?: Array<{ email: string; full_name: string }>;
    };

    const { eventId, teamSize, members } = body;

    // 0️⃣ Verify required body
    if (!eventId || !teamSize || !members || members.length === 0) {
      return NextResponse.json(
        { error: "Missing eventId, teamSize, or members" },
        { status: 400 }
      );
    }

    if (teamSize !== members.length) {
      return NextResponse.json(
        { error: "Team size does not match number of members" },
        { status: 400 }
      );
    }

    if (teamSize < 2) {
      return NextResponse.json(
        { error: "Team must have at least 2 members" },
        { status: 400 }
      );
    }

    // 1️⃣ SECURITY: Verify the request is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized: please sign in" },
        { status: 401 }
      );
    }

    const studentEmail = session.user.email as string;

    // 2️⃣ SECURITY: Check that the student has a complete profile
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let profile: any = null;

    try {
      if (supabaseUrl && serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });
        const { data, error } = await supabaseAdmin
          .from("student_profiles")
          .select("full_name,dob,college_name,college_email")
          .eq("student_email", studentEmail)
          .single();
        if (!error) profile = data;
      } else {
        const { data, error } = await supabase
          .from("student_profiles")
          .select("full_name,dob,college_name,college_email")
          .eq("student_email", studentEmail)
          .single();
        if (!error) profile = data;
      }
    } catch (err) {
      console.error("Profile lookup error:", err);
    }

    const required = ["full_name", "dob", "college_name", "college_email"];
    const missing = !profile || required.some((k) => !profile[k]);
    if (missing) {
      return NextResponse.json(
        {
          error:
            "Profile incomplete: please complete your student profile before registering",
        },
        { status: 400 }
      );
    }

    // 3️⃣ Fetch event
    const adminDb =
      supabaseUrl && serviceRoleKey
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : supabase;

    const { data: event, error: eventError } = await adminDb
      .from("events")
      .select("id,title,price")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 4️⃣ Check if team lead (primary user) already registered
    const { data: existingReg } = await adminDb
      .from("registrations")
      .select("id,status")
      .eq("student_email", studentEmail)
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingReg?.id) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 409 }
      );
    }

    // 5️⃣ Calculate total price (team size × event price)
    const basePrice = Math.max(0, Number(event.price));
    const totalPrice = basePrice * teamSize;

    // 6️⃣ Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100), // paise
      currency: "INR",
      receipt: `bulk_${eventId.slice(-6)}_${Date.now()}`,
      notes: {
        event_id: eventId,
        team_size: teamSize.toString(),
        registration_type: "team",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: totalPrice,
      currency: "INR",
      teamSize,
    });
  } catch (err) {
    console.error("CREATE BULK ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to create bulk order" },
      { status: 500 }
    );
  }
}
