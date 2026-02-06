import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "sponsor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("sponsors_profile")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: profile || null });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "sponsor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { company_name, logo_url, website_url, contact_name, contact_phone } = body;

  if (!company_name) {
    return NextResponse.json({ error: "Company name required" }, { status: 400 });
  }

  const { data: profile, error } = await supabase
    .from("sponsors_profile")
    .upsert({
      email: session.user.email,
      company_name,
      logo_url,
      website_url,
      contact_name,
      contact_phone,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}
