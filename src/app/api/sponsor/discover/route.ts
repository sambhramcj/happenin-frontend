import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const budget_min = searchParams.get("budget_min");
  const budget_max = searchParams.get("budget_max");
  const college = searchParams.get("college");

  let query = supabase
    .from("events")
    .select(
      `
      id,
      title,
      description,
      date,
      location,
      banner_image,
      college,
      organizer_email,
      fest_id,
      sponsorship_enabled
    `
    )
    .eq("sponsorship_enabled", true);

  if (college) {
    query = query.eq("college", college);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = events || [];

  if (budget_min || budget_max) {
    const min = budget_min ? parseFloat(budget_min) : 0;
    const max = budget_max ? parseFloat(budget_max) : Infinity;

    filtered = filtered.filter((event: any) => {
      const prices = [10000, 25000];
      if (event.fest_id) prices.push(50000);
      return prices.some((price) => price >= min && price <= max);
    });
  }

  return NextResponse.json({ events: filtered });
}
