import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { eventId } = await context.params;

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        organizers_profile:organizers!events_organizer_email_fkey (
          first_name,
          last_name,
          logo_url
        )
      `)
      .eq("id", eventId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, event: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
