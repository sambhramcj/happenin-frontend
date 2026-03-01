import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SessionUserWithRole = {
  email?: string;
  role?: string;
};

type PayoutRow = {
  organizer_email: string;
  gross_amount: number;
  platform_fee: number;
  payout_amount: number;
  payout_status: "pending" | "paid";
};

type BankAccountRow = {
  organizer_email: string;
  account_holder_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  is_verified: boolean;
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as SessionUserWithRole | undefined)?.role;

  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = serviceSupabase
    .from("sponsorship_payouts")
    .select(
      `
      id,
      digital_pack_id,
      organizer_email,
      gross_amount,
      platform_fee,
      payout_amount,
      payout_method,
      payout_status,
      paid_at,
      created_at,
      digital_visibility_packs!sponsorship_payouts_digital_pack_id_fkey (
        id,
        pack_type,
        events (id, title),
        sponsors_profile!digital_visibility_packs_sponsor_id_fkey (company_name)
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
  const organizerEmails = Array.from(
    new Set(((payouts || []) as PayoutRow[]).map((payout) => payout.organizer_email).filter(Boolean))
  );

  const { data: bankAccounts } = organizerEmails.length
    ? await serviceSupabase
        .from("organizer_bank_accounts")
        .select("organizer_email, account_holder_name, bank_name, account_number, ifsc_code, upi_id, is_verified")
        .in("organizer_email", organizerEmails)
    : { data: [] };

  const bankMap = ((bankAccounts || []) as BankAccountRow[]).reduce((acc: Record<string, BankAccountRow>, account) => {
    acc[account.organizer_email] = account;
    return acc;
  }, {} as Record<string, BankAccountRow>);

  const enrichedPayouts = ((payouts || []) as Array<Record<string, unknown>>).map((payout) => {
    const pack = payout.digital_visibility_packs as
      | {
          events?: { title?: string } | Array<{ title?: string }> | null;
          sponsors_profile?: { company_name?: string } | Array<{ company_name?: string }> | null;
          pack_type?: string;
        }
      | null;
    const event = Array.isArray(pack?.events) ? pack?.events[0] : pack?.events;
    const sponsor = Array.isArray(pack?.sponsors_profile)
      ? pack?.sponsors_profile[0]
      : pack?.sponsors_profile;

    return {
      ...payout,
      event_title: event?.title || "Event",
      sponsor_name: sponsor?.company_name || "Sponsor",
      pack_type: pack?.pack_type || "standard",
    };
  });

  const payoutsWithBank = enrichedPayouts.map((payout) => ({
    ...payout,
    organizer_bank_accounts: bankMap[String(payout.organizer_email)] || null,
  }));

  const { data: metricsRows } = await serviceSupabase
    .from("sponsorship_payouts")
    .select("gross_amount, platform_fee, payout_amount, payout_status");

  const typedMetrics = (metricsRows || []) as PayoutRow[];

  const totalSponsorshipRevenue = typedMetrics.reduce(
    (sum: number, payout) => sum + (payout.gross_amount || 0),
    0
  );
  const totalPlatformEarnings = typedMetrics.reduce(
    (sum: number, payout) => sum + (payout.platform_fee || 0),
    0
  );
  const totalPaidToOrganizers = typedMetrics.reduce(
    (sum: number, payout) => sum + (payout.payout_status === "paid" ? payout.payout_amount || 0 : 0),
    0
  );
  const pendingPayoutsCount = typedMetrics.filter((payout) => payout.payout_status === "pending").length;

  return NextResponse.json({
    payouts: payoutsWithBank,
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
  const role = (session?.user as SessionUserWithRole | undefined)?.role;
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
