import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PackRow = {
  id: string;
  sponsor_id: string;
  payment_status: string;
  amount: number;
  [key: string]: unknown;
};

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!email) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = db
    .from("digital_visibility_packs")
    .select(`
      id,
      sponsor_id,
      event_id,
      fest_id,
      pack_type,
      amount,
      payment_status,
      visibility_active,
      admin_approved,
      organizer_email,
      created_at,
      events (id, title, fest_id),
      fests (id, title, start_date, end_date),
      sponsors_profile!digital_visibility_packs_sponsor_id_fkey (company_name, email, website_url, is_active)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("payment_status", status);
  }

  const { data: packs, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const paidPacks = ((packs || []) as PackRow[]).filter((item) => item.payment_status === "paid");
  const totalRevenue = paidPacks.reduce((sum: number, item) => sum + Number(item.amount || 0), 0);

  const deals = ((packs || []) as PackRow[]).map((item) => ({
    ...item,
    sponsor_email: item.sponsor_id,
    status: item.payment_status,
    organizer_payout_settled: false,
    organizer_payout_settled_at: null,
  }));

  return NextResponse.json({
    deals,
    analytics: {
      totalRevenue,
      dealsCount: deals.length,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const body = await req.json();
  const { action, deal_id, value, target_type, target_id } = body;

  if (action === "verify_payment" || action === "toggle_visibility") {
    if (!deal_id) return NextResponse.json({ error: "Missing deal_id" }, { status: 400 });

    const patch: { admin_approved?: boolean; visibility_active: boolean } =
      action === "verify_payment"
        ? { admin_approved: true, visibility_active: true }
        : { visibility_active: Boolean(value) };

    const { error } = await db
      .from("digital_visibility_packs")
      .update(patch)
      .eq("id", deal_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (action === "reject_payment") {
    if (!deal_id) return NextResponse.json({ error: "Missing deal_id" }, { status: 400 });

    const { error } = await db
      .from("digital_visibility_packs")
      .update({ visibility_active: false, admin_approved: false })
      .eq("id", deal_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  if (target_type === "sponsor" && target_id) {
    const { error } = await db
      .from("sponsors_profile")
      .update({ is_active: Boolean(value) })
      .eq("email", target_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
