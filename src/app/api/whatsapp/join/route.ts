import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

const WHATSAPP_LINK_PATTERN = /^https:\/\/chat\.whatsapp\.com\/.+/;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const event_id = body?.event_id;

  if (!event_id) {
    return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
  }

  const { data: registration } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", event_id)
    .eq("student_email", session.user.email)
    .maybeSingle();

  if (!registration) {
    return NextResponse.json({ error: "Not registered" }, { status: 403 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .select("whatsapp_group_enabled, whatsapp_group_link")
    .eq("id", event_id)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!event.whatsapp_group_enabled || !event.whatsapp_group_link) {
    return NextResponse.json({ error: "WhatsApp group not available" }, { status: 404 });
  }

  if (!WHATSAPP_LINK_PATTERN.test(event.whatsapp_group_link)) {
    return NextResponse.json({ error: "Invalid WhatsApp link" }, { status: 400 });
  }

  const { error: insertError } = await supabase.from("whatsapp_group_joins").insert({
    event_id,
    student_email: session.user.email,
  });

  if (insertError) {
    console.error("WhatsApp join logging failed:", insertError);
  }

  return NextResponse.json({ link: event.whatsapp_group_link });
}
