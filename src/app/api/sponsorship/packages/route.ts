import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Package creation is managed by the platform" }, { status: 405 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");

  if (!event_id) {
    return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, fest_id, sponsorship_enabled")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!event.sponsorship_enabled) {
    return NextResponse.json({ packages: [] });
  }

  const requiredPackages: Array<{
    type: string;
    price: number;
    scope: string;
    event_id: string | null;
  }> = [
    { type: "digital", price: 10000, scope: "per_event", event_id },
    { type: "app", price: 25000, scope: "per_event", event_id },
  ];

  if (event.fest_id) {
    requiredPackages.push({
      type: "fest",
      price: 50000,
      scope: "fest",
      event_id: null,
    });
  }

  const { data: existing } = await supabase
    .from("sponsorship_packages")
    .select("id, type, scope, event_id, fest_id")
    .eq("is_active", true)
    .or(`event_id.eq.${event_id}${event.fest_id ? `,fest_id.eq.${event.fest_id}` : ""}`);

  const existingKeys = new Set(
    (existing || []).map((pkg: any) => `${pkg.type}-${pkg.scope}-${pkg.event_id || ""}-${pkg.fest_id || ""}`)
  );

  const inserts = requiredPackages
    .map((pkg) => ({
      type: pkg.type,
      price: pkg.price,
      scope: pkg.scope,
      event_id: pkg.scope === "per_event" ? event_id : null,
      fest_id: pkg.scope === "fest" ? event.fest_id : null,
      is_active: true,
    }))
    .filter((pkg) => !existingKeys.has(`${pkg.type}-${pkg.scope}-${pkg.event_id || ""}-${pkg.fest_id || ""}`));

  if (inserts.length > 0) {
    await supabase.from("sponsorship_packages").insert(inserts);
  }

  const { data: packages, error } = await supabase
    .from("sponsorship_packages")
    .select("id, type, price, scope, event_id, fest_id")
    .eq("is_active", true)
    .or(`event_id.eq.${event_id}${event.fest_id ? `,fest_id.eq.${event.fest_id}` : ""}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordered = (packages || []).sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
  return NextResponse.json({ packages: ordered });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ error: "Package updates are managed by the platform" }, { status: 405 });
}
