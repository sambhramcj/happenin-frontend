import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

const WHATSAPP_LINK_PATTERN = /^https:\/\/chat\.whatsapp\.com\/.+/;

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  const { data: event, error } = await supabase
    .from("events")
    .select("organizer_email, whatsapp_group_enabled, whatsapp_group_link")
    .eq("id", eventId)
    .single();

  if (error || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (event.organizer_email !== session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    whatsapp_group_enabled: Boolean(event.whatsapp_group_enabled),
    whatsapp_group_link: event.whatsapp_group_link || "",
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const body = await req.json().catch(() => ({}));

  const enabled = Boolean(body?.whatsapp_group_enabled);
  const link = typeof body?.whatsapp_group_link === "string" ? body.whatsapp_group_link.trim() : "";

  if (link && !WHATSAPP_LINK_PATTERN.test(link)) {
    return NextResponse.json(
      { error: "WhatsApp link must start with https://chat.whatsapp.com/" },
      { status: 400 }
    );
  }

  if (enabled && !link) {
    return NextResponse.json({ error: "WhatsApp link is required when enabled" }, { status: 400 });
  }

  const { data: event, error } = await supabase
    .from("events")
    .update({
      whatsapp_group_enabled: enabled,
      whatsapp_group_link: link || null,
    })
    .eq("id", eventId)
    .eq("organizer_email", session.user.email)
    .select("whatsapp_group_enabled, whatsapp_group_link")
    .single();

  if (error || !event) {
    return NextResponse.json({ error: error?.message || "Event not found" }, { status: 404 });
  }

  return NextResponse.json({
    whatsapp_group_enabled: Boolean(event.whatsapp_group_enabled),
    whatsapp_group_link: event.whatsapp_group_link || "",
  });
}
