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
  const { event_id, tier, min_amount, max_amount, organizer_notes, deliverables } = body;

  if (!event_id || !tier || !min_amount || !max_amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const tierBounds = {
    bronze: { min: 5000, max: 15000 },
    silver: { min: 15000, max: 35000 },
    gold: { min: 35000, max: 100000 },
    platinum: { min: 100000, max: 10000000 },
  };

  if (min_amount < tierBounds[tier as keyof typeof tierBounds].min || max_amount > tierBounds[tier as keyof typeof tierBounds].max) {
    return NextResponse.json({ error: "Amount out of tier bounds" }, { status: 400 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("organizer_email")
    .eq("id", event_id)
    .single();

  if (!event || event.organizer_email !== session.user.email) {
    return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 404 });
  }

  const { data: packageData, error: packageError } = await supabase
    .from("sponsorship_packages")
    .insert({
      event_id,
      tier,
      min_amount,
      max_amount,
      organizer_notes,
      is_active: true,
    })
    .select()
    .single();

  if (packageError) {
    return NextResponse.json({ error: packageError.message }, { status: 500 });
  }

  if (deliverables && Array.isArray(deliverables)) {
    const deliverablesData = deliverables.map((d: any) => ({
      package_id: packageData.id,
      type: "organizer_defined",
      category: d.category,
      title: d.title,
      description: d.description,
    }));

    await supabase.from("sponsorship_deliverables").insert(deliverablesData);
  }

  return NextResponse.json({ package: packageData });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  const package_id = searchParams.get("package_id");

  if (package_id) {
    const { data: pkg, error: pkgError } = await supabase
      .from("sponsorship_packages")
      .select(`
        *,
        sponsorship_deliverables (*)
      `)
      .eq("id", package_id)
      .single();

    if (pkgError) {
      return NextResponse.json({ error: pkgError.message }, { status: 500 });
    }

    return NextResponse.json({ package: pkg });
  }

  if (!event_id) {
    return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
  }

  const { data: packages, error } = await supabase
    .from("sponsorship_packages")
    .select(`
      *,
      sponsorship_deliverables (*)
    `)
    .eq("event_id", event_id)
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packages: packages || [] });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { package_id, is_active, min_amount, max_amount, organizer_notes } = body;

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

  const updates: any = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (min_amount !== undefined) updates.min_amount = min_amount;
  if (max_amount !== undefined) updates.max_amount = max_amount;
  if (organizer_notes !== undefined) updates.organizer_notes = organizer_notes;

  const { data, error } = await supabase
    .from("sponsorship_packages")
    .update(updates)
    .eq("id", package_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ package: data });
}
