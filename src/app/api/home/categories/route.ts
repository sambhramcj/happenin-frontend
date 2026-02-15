import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get all unique categories from events
    const { data: categories, error } = await supabase
      .from("events")
      .select("category")
      .not("category", "is", null);

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unique categories and count events per category
    const categoryMap = new Map<string, number>();
    (categories || []).forEach((item) => {
      if (item.category) {
        categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
      }
    });

    const categoriesWithCount = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (error: any) {
    console.error("Error in categories API:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
