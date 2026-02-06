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
    .select(`
      id,
      title,
      description,
      date,
      location,
      banner_image,
      college,
      organizer_email,
      sponsorship_packages (
        id,
        tier,
        min_amount,
        max_amount,
        is_active
      )
    `)
    .not("sponsorship_packages", "is", null);

  if (college) {
    query = query.eq("college", college);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let filtered = events || [];

  if (budget_min || budget_max) {
    filtered = filtered.filter((event: any) => {
      if (!event.sponsorship_packages || event.sponsorship_packages.length === 0) return false;
      
      return event.sponsorship_packages.some((pkg: any) => {
        if (!pkg.is_active) return false;
        const min = budget_min ? parseFloat(budget_min) : 0;
        const max = budget_max ? parseFloat(budget_max) : Infinity;
        return pkg.min_amount >= min && pkg.max_amount <= max;
      });
    });
  }

  filtered = filtered.filter((event: any) => 
    event.sponsorship_packages && event.sponsorship_packages.length > 0 &&
    event.sponsorship_packages.some((pkg: any) => pkg.is_active)
  );

  return NextResponse.json({ events: filtered });
}
