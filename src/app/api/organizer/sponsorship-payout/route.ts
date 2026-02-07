import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const queryEmail = searchParams.get("email");

  // Ensure organizer can only access their own payout data
  if (queryEmail !== email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data: bankAccount } = await serviceSupabase
      .from("organizer_bank_accounts")
      .select("*")
      .eq("organizer_email", email)
      .single();

    const { data: payouts, error: payoutsError } = await serviceSupabase
      .from("sponsorship_payouts")
      .select(
        `
        id,
        sponsorship_deal_id,
        gross_amount,
        platform_fee,
        payout_amount,
        payout_status,
        payout_method,
        paid_at,
        created_at,
        sponsorship_deals (
          id,
          event_id,
          sponsorship_packages (tier),
          events (id, title),
          sponsors_profile (company_name)
        )
      `
      )
      .eq("organizer_email", email)
      .order("created_at", { ascending: false });

    if (payoutsError) throw payoutsError;

    const typedPayouts = payouts || [];
    const totalEarnings = typedPayouts.reduce(
      (sum: number, p: any) => sum + (p.payout_amount || 0),
      0
    );
    const paidToOrganizer = typedPayouts.reduce(
      (sum: number, p: any) => sum + (p.payout_status === "paid" ? p.payout_amount || 0 : 0),
      0
    );
    const pendingPayouts = typedPayouts.filter((p: any) => p.payout_status === "pending").length;

    return NextResponse.json({
      bankAccount: bankAccount || null,
      totals: {
        totalEarnings,
        paidToOrganizer,
        pendingPayouts,
      },
      payouts: typedPayouts,
    });
  } catch (error) {
    console.error("Error fetching payout:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout data" },
      { status: 500 }
    );
  }
}
