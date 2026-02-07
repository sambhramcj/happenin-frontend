import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;

  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = serviceSupabase
    .from("sponsorship_payouts")
    .select(
      `
      id,
      sponsorship_deal_id,
      organizer_email,
      gross_amount,
      platform_fee,
      payout_amount,
      payout_method,
      payout_status,
      paid_at,
      created_at,
      sponsorship_deals (
        id,
        events (id, title),
        sponsorship_packages (tier),
        sponsors_profile (company_name)
      )
    `
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("payout_status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }

  const payouts = data || [];
  const organizerEmails = Array.from(new Set(payouts.map((p: any) => p.organizer_email).filter(Boolean)));

  const { data: bankAccounts } = organizerEmails.length
    ? await serviceSupabase
        .from("organizer_bank_accounts")
        .select("organizer_email, account_holder_name, bank_name, account_number, ifsc_code, upi_id, is_verified")
        .in("organizer_email", organizerEmails)
    : { data: [] };

  const bankMap = (bankAccounts || []).reduce((acc: Record<string, any>, account: any) => {
    acc[account.organizer_email] = account;
    return acc;
  }, {} as Record<string, any>);

  const enrichedPayouts = payouts.map((p: any) => ({
    ...p,
    organizer_bank_accounts: bankMap[p.organizer_email] || null,
  }));
  const { data: metricsRows } = await serviceSupabase
    .from("sponsorship_payouts")
    .select("gross_amount, platform_fee, payout_amount, payout_status");

  const totalSponsorshipRevenue = (metricsRows || []).reduce(
    (sum: number, p: any) => sum + (p.gross_amount || 0),
    0
  );
  const totalPlatformEarnings = (metricsRows || []).reduce(
    (sum: number, p: any) => sum + (p.platform_fee || 0),
    0
  );
  const totalPaidToOrganizers = (metricsRows || []).reduce(
    (sum: number, p: any) => sum + (p.payout_status === "paid" ? p.payout_amount || 0 : 0),
    0
  );
  const pendingPayoutsCount = (metricsRows || []).filter((p: any) => p.payout_status === "pending").length;

  return NextResponse.json({
    payouts: enrichedPayouts,
    metrics: {
      totalSponsorshipRevenue,
      totalPlatformEarnings,
      totalPaidToOrganizers,
      pendingPayoutsCount,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const adminEmail = session?.user?.email as string | undefined;

  if (!adminEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { payout_id, payout_method } = body || {};

  if (!payout_id || !payout_method) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!['UPI', 'IMPS'].includes(payout_method)) {
    return NextResponse.json({ error: "Invalid payout method" }, { status: 400 });
  }

  const { data, error } = await serviceSupabase
    .from("sponsorship_payouts")
    .update({
      payout_status: "paid",
      payout_method,
      paid_at: new Date().toISOString(),
      admin_email: adminEmail,
    })
    .eq("id", payout_id)
    .eq("payout_status", "pending")
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update payout" }, { status: 500 });
  }

  return NextResponse.json({ payout: data });
}
