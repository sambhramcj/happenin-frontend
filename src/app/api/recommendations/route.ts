import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's past registrations
    const { data: pastRegistrations } = await supabase
      .from("registrations")
      .select("event_id, events(location, discount_club)")
      .eq("student_email", session.user.email);

    if (!pastRegistrations || pastRegistrations.length === 0) {
      // Return random popular events if no history
      const { data: randomEvents } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString())
        .limit(10)
        .order("created_at", { ascending: false });

      return NextResponse.json(randomEvents || []);
    }

    // Extract preferences from past events
    const locations = [
      ...new Set(pastRegistrations.map((r: any) => r.events?.location)),
    ];
    const clubs = [
      ...new Set(pastRegistrations.map((r: any) => r.events?.discount_club)),
    ].filter(Boolean);

    // Find similar events
    const { data: recommendations } = await supabase
      .from("events")
      .select("*")
      .gte("date", new Date().toISOString())
      .or(`location.in.(${locations.join(",")}),discount_club.in.(${clubs.join(",")})`)
      .limit(20)
      .order("date", { ascending: true });

    return NextResponse.json(recommendations || []);
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
