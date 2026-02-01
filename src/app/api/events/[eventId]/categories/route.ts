import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET event categories
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Get categories for this event
    const { data: categoryMappings, error } = await supabase
      .from("event_category_mapping")
      .select("event_categories(*)")
      .eq("event_id", eventId);

    if (error) throw error;

    const categories = categoryMappings?.map((mapping: any) => mapping.event_categories) || [];

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching event categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch event categories" },
      { status: 500 }
    );
  }
}

// POST: Add category to event
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    // Verify event exists and user is organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from("event_categories")
      .select("id")
      .eq("id", categoryId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if already mapped
    const { data: existing } = await supabase
      .from("event_category_mapping")
      .select("id")
      .eq("event_id", eventId)
      .eq("category_id", categoryId)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Category already added to event" },
        { status: 400 }
      );
    }

    // Add category to event
    const { data: mapping, error: mapError } = await supabase
      .from("event_category_mapping")
      .insert({
        event_id: eventId,
        category_id: categoryId,
      })
      .select()
      .single();

    if (mapError) throw mapError;

    return NextResponse.json(mapping, { status: 201 });
  } catch (error) {
    console.error("Error adding category to event:", error);
    return NextResponse.json(
      { error: "Failed to add category" },
      { status: 500 }
    );
  }
}

// DELETE: Remove category from event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    // Verify event exists and user is organizer
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizer_email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove category mapping
    const { error: deleteError } = await supabase
      .from("event_category_mapping")
      .delete()
      .eq("event_id", eventId)
      .eq("category_id", categoryId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      message: "Category removed from event",
    });
  } catch (error) {
    console.error("Error removing category from event:", error);
    return NextResponse.json(
      { error: "Failed to remove category" },
      { status: 500 }
    );
  }
}
