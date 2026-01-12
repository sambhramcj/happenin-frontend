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
    const { eventId } = await req.json();

    // 0️⃣ Verify required body
    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    // 1️⃣ SECURITY: Verify the request is authenticated and get canonical student email
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized: please sign in" },
        { status: 401 }
      );
    }

    const studentEmail = session.user.email as string;

    // 2️⃣ SECURITY: Check that the student has a complete profile
    // Prefer using the SUPABASE_SERVICE_ROLE_KEY server-side to bypass RLS for this check.
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
        // Fallback: try with regular anon client (may be blocked by RLS)
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

    // Required fields to consider profile 'complete'
    const required = ["full_name", "dob", "college_name", "college_email"];
    const missing = !profile || required.some((k) => !profile[k]);
    if (missing) {
      return NextResponse.json(
        { error: "Profile incomplete: please complete your student profile before registering" },
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
