import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { data, error } = await supabase
      .from("custom_registration_fields")
      .select("*")
      .eq("event_id", eventId)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom fields" },
      { status: 500 }
    );
  }
}

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

    // Verify user is event organizer
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("organizer_email")
      .eq("id", eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (eventData.organizer_email !== session.user.email) {
      return NextResponse.json(
        { error: "You must be the event organizer" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fieldName, fieldType, isRequired, options, displayOrder } = body;

    const { data, error } = await supabase
      .from("custom_registration_fields")
      .insert({
        event_id: eventId,
        field_name: fieldName,
        field_type: fieldType,
        is_required: isRequired || false,
        options: options ? JSON.stringify(options) : null,
        display_order: displayOrder || 0,
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error creating custom field:", error);
    return NextResponse.json(
      { error: "Failed to create custom field" },
      { status: 500 }
    );
  }
}
