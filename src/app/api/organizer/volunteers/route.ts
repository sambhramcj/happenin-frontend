import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Get all volunteer applications for organizer's events
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "organizer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizerEmail = session.user.email;

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id")
      .eq("organizer_email", organizerEmail);

    if (eventsError) {
      console.error("Error fetching organizer events:", eventsError);
      return NextResponse.json(
        { error: "Failed to fetch organizer events" },
        { status: 500 }
      );
    }

    const eventIds = (events || []).map((e) => e.id);
    if (eventIds.length === 0) {
      return NextResponse.json({ volunteers: [] });
    }

    const { data: applications, error } = await supabase
      .from("volunteer_applications")
      .select(
        `
        *,
        student_profiles (
          full_name,
          phone_number,
          profile_photo,
          college_name
        )
      `
      )
      .in("event_id", eventIds)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    const applicationsWithCerts = await Promise.all(
      (applications || []).map(async (app: any) => {
        const { data: certificates } = await supabase
          .from("volunteer_certificates")
          .select("*")
          .eq("student_email", app.student_email)
          .order("date", { ascending: false });

        return {
          ...app,
          certificates: certificates || [],
        };
      })
    );

    return NextResponse.json({ volunteers: applicationsWithCerts });
  } catch (error) {
    console.error("Fetch volunteers error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
