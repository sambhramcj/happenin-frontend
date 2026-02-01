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
      .from("event_brochures")
      .select("*")
      .eq("event_id", eventId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 is "no rows"
    if (!data) {
      return NextResponse.json(
        { error: "No brochure found for this event" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching brochure:", error);
    return NextResponse.json(
      { error: "Failed to fetch brochure" },
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
        { error: "You must be the event organizer to upload brochure" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { fileUrl, fileName, fileSize } = body;

    // Delete existing brochure if any
    await supabase
      .from("event_brochures")
      .delete()
      .eq("event_id", eventId);

    // Insert new brochure
    const { data, error } = await supabase
      .from("event_brochures")
      .insert({
        event_id: eventId,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        uploaded_by: session.user.email,
      })
      .select();

    if (error) throw error;

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    console.error("Error uploading brochure:", error);
    return NextResponse.json(
      { error: "Failed to upload brochure" },
      { status: 500 }
    );
  }
}

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
        { error: "You must be the event organizer to delete brochure" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("event_brochures")
      .delete()
      .eq("event_id", eventId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brochure:", error);
    return NextResponse.json(
      { error: "Failed to delete brochure" },
      { status: 500 }
    );
  }
}
