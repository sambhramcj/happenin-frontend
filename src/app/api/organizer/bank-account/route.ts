import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "organizer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await serviceSupabase
    .from("organizer_bank_accounts")
    .select("*")
    .eq("organizer_email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: "Failed to load bank account" }, { status: 500 });
  }

  return NextResponse.json({ bankAccount: data || null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;

  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (role !== "organizer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    account_holder_name,
    bank_name,
    account_number,
    ifsc_code,
    upi_id,
  } = body || {};

  const hasBankDetails = account_holder_name && bank_name && account_number && ifsc_code;
  const hasUpi = Boolean(upi_id);

  if (!hasBankDetails && !hasUpi) {
    return NextResponse.json({ error: "Provide bank details or UPI ID" }, { status: 400 });
  }

  const { data: existing } = await serviceSupabase
    .from("organizer_bank_accounts")
    .select("id, is_verified")
    .eq("organizer_email", email)
    .single();

  if (existing?.is_verified) {
    return NextResponse.json({ error: "Bank details are verified and cannot be edited" }, { status: 403 });
  }

  const { data, error } = await serviceSupabase
    .from("organizer_bank_accounts")
    .upsert(
      {
        organizer_email: email,
        account_holder_name: account_holder_name || null,
        bank_name: bank_name || null,
        account_number: account_number || null,
        ifsc_code: ifsc_code || null,
        upi_id: upi_id || null,
        is_verified: false,
      },
      { onConflict: "organizer_email" }
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save bank account" }, { status: 500 });
  }

  return NextResponse.json({ bankAccount: data });
}
