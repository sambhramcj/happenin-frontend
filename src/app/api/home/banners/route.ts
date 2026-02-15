import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { data: banners, error } = await supabase
      .from("home_banners")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())
      .order("priority", { ascending: true });

    if (error) {
      console.error("Error fetching home banners:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ banners: banners || [] });
  } catch (error: any) {
    console.error("Error in home banners API:", error);
    return NextResponse.json(
      { error: "Failed to fetch home banners" },
      { status: 500 }
    );
  }
}
