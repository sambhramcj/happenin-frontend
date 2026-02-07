import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

function getPlatformFeeRate(tier: string) {
  return tier === "platinum" || tier === "gold" ? 0.1 : 0.15;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "sponsor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { event_id, package_id, amount } = body;

  if (!event_id || !package_id || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: pkg } = await supabase
    .from("sponsorship_packages")
    .select("*")
    .eq("id", package_id)
    .eq("event_id", event_id)
    .eq("is_active", true)
    .single();

  if (!pkg) {
    return NextResponse.json({ error: "Package not found or inactive" }, { status: 404 });
  }

  if (amount < pkg.min_amount || amount > pkg.max_amount) {
    return NextResponse.json({ error: "Amount out of range" }, { status: 400 });
  }

  const platform_fee = amount * getPlatformFeeRate(pkg.tier);
  const organizer_amount = amount - platform_fee;

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `sponsor_${Date.now()}`,
    });

    const { data: deal, error } = await supabase
      .from("sponsorship_deals")
      .insert({
        sponsor_id: session.user.email,
        event_id,
        package_id,
        amount_paid: amount,
        platform_fee,
        organizer_amount,
        status: "pending",
        razorpay_order_id: order.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deal, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = (session.user as any).role;

  let query = supabase
    .from("sponsorship_deals")
    .select(`
      *,
      events (id, title, date, location, banner_image),
      sponsorship_packages (tier, min_amount, max_amount),
      sponsors_profile (company_name, logo_url)
    `);

  if (role === "sponsor") {
    query = query.eq("sponsor_id", session.user.email);
  } else if (role === "organizer") {
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_email", session.user.email);
    
    if (events && events.length > 0) {
      const eventIds = events.map(e => e.id);
      query = query.in("event_id", eventIds);
    } else {
      return NextResponse.json({ deals: [] });
    }
  } else if (role === "admin") {
    // Admin sees all
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event_id = searchParams.get("event_id");
  if (event_id) {
    query = query.eq("event_id", event_id);
  }

  const { data: deals, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deals: deals || [] });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "sponsor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { deal_id, razorpay_payment_id, status } = body;

  if (!deal_id || !razorpay_payment_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: deal, error } = await supabase
    .from("sponsorship_deals")
    .update({
      razorpay_payment_id,
      status: status || "confirmed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", deal_id)
    .eq("sponsor_id", session.user.email)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (deal) {
    const { data: payoutSource, error: payoutError } = await supabase
      .from("sponsorship_deals")
      .select(
        `
        id,
        amount_paid,
        platform_fee,
        organizer_amount,
        events (organizer_email),
        sponsorship_packages (tier)
      `
      )
      .eq("id", deal.id)
      .single();

    if (!payoutError && payoutSource) {
      const eventData = payoutSource.events as any;
      const organizerEmail = eventData?.organizer_email;
      
      if (organizerEmail) {
        const tier = (payoutSource.sponsorship_packages as any)?.tier || "bronze";
        const grossAmount = payoutSource.amount_paid || 0;
        const platformFee = payoutSource.platform_fee ?? grossAmount * getPlatformFeeRate(tier);
        const payoutAmount = payoutSource.organizer_amount ?? grossAmount - platformFee;

        await supabase
          .from("sponsorship_payouts")
          .upsert(
            {
              sponsorship_deal_id: payoutSource.id,
              organizer_email: organizerEmail,
              gross_amount: grossAmount,
              platform_fee: platformFee,
              payout_amount: payoutAmount,
              payout_status: "pending",
            },
            { onConflict: "sponsorship_deal_id" }
          );
      }
    }
  }

  return NextResponse.json({ deal });
}
