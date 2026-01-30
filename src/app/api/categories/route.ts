import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET all categories or specific category
export async function GET(
  req: NextRequest,
  { params }: { params: { categoryId?: string } }
) {
  try {
    if (params.categoryId) {
      // Get specific category with events
      const { data: category, error: categoryError } = await supabase
        .from("event_categories")
        .select("*")
        .eq("id", params.categoryId)
        .single();

      if (categoryError || !category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // Get events in this category
      const { data: events, error: eventsError } = await supabase
        .from("event_category_mapping")
        .select("events(*)")
        .eq("category_id", params.categoryId);

      if (eventsError) throw eventsError;

      return NextResponse.json({
        ...category,
        events: events?.map((e: any) => e.events) || [],
      });
    }

    // Get all categories
    const { data: categories, error } = await supabase
      .from("event_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST: Create new category (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you may need to adjust this based on your admin role)
    const body = await req.json();
    const { categoryName, description, colorCode, displayOrder, iconUrl } =
      body;

    if (!categoryName) {
      return NextResponse.json(
        { error: "categoryName is required" },
        { status: 400 }
      );
    }

    // Insert new category
    const { data: category, error } = await supabase
      .from("event_categories")
      .insert({
        category_name: categoryName,
        description: description || null,
        color_code: colorCode || "#6366F1",
        display_order: displayOrder || 0,
        icon_url: iconUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
