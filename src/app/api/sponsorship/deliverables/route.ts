import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { package_id, category, title, description } = body;

  if (!package_id || !category || !title) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const validCategories = ["social", "on_ground", "stall"];
  if (!validCategories.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const { data: pkg } = await supabase
    .from("sponsorship_packages")
    .select("event_id, events!inner(organizer_email)")
    .eq("id", package_id)
    .single();

  if (!pkg || (pkg as any).events.organizer_email !== session.user.email) {
    return NextResponse.json({ error: "Package not found or unauthorized" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("sponsorship_deliverables")
    .insert({
      package_id,
      type: "organizer_defined",
      category,
      title,
      description,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deliverable: data });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const package_id = searchParams.get("package_id");

  if (!package_id) {
    return NextResponse.json({ error: "Missing package_id" }, { status: 400 });
  }

  const { data: pkg } = await supabase
    .from("sponsorship_packages")
    .select("event_id, events!inner(organizer_email)")
    .eq("id", package_id)
    .single();

  if (!pkg || (pkg as any).events.organizer_email !== session.user.email) {
    return NextResponse.json({ error: "Package not found or unauthorized" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("sponsorship_deliverables")
    .select("id, title, description, category")
    .eq("package_id", package_id)
    .eq("type", "organizer_defined")
    .in("category", ["social", "on_ground", "stall"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deliverables: data || [] });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deliverable_id = searchParams.get("deliverable_id");

  if (!deliverable_id) {
    return NextResponse.json({ error: "Missing deliverable_id" }, { status: 400 });
  }

  const { data: deliverable } = await supabase
    .from("sponsorship_deliverables")
    .select("type, package_id, sponsorship_packages!inner(event_id, events!inner(organizer_email))")
    .eq("id", deliverable_id)
    .single();

  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  if (deliverable.type === "platform_default") {
    return NextResponse.json({ error: "Cannot delete platform default deliverables" }, { status: 403 });
  }

  const organizerEmail = (deliverable as any).sponsorship_packages.events.organizer_email;
  if (organizerEmail !== session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("sponsorship_deliverables")
    .delete()
    .eq("id", deliverable_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
