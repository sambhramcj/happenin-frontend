import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString();

    // Get active fests with their event categories
    const { data: fests, error: festsError } = await supabase
      .from("fests")
      .select(`
        *,
        colleges!fests_college_id_fkey (
          name,
          logo_url
        )
      `)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("start_date", { ascending: true })
      .limit(3);

    if (festsError) {
      console.error("Error fetching fests:", festsError);
      return NextResponse.json({ error: festsError.message }, { status: 500 });
    }

    // For each fest, get event categories
    const festsWithCategories = await Promise.all(
      (fests || []).map(async (fest) => {
        const { data: categories } = await supabase
          .from("events")
          .select("category")
          .eq("fest_id", fest.id)
          .not("category", "is", null);

        const uniqueCategories = [
          ...new Set((categories || []).map((c) => c.category)),
        ];

        return {
          ...fest,
          categories: uniqueCategories,
        };
      })
    );

    return NextResponse.json({ fests: festsWithCategories });
  } catch (error: any) {
    console.error("Error in fest discovery API:", error);
    return NextResponse.json(
      { error: "Failed to fetch fest discovery data" },
      { status: 500 }
    );
  }
}
