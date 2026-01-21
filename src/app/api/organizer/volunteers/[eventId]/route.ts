import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Get volunteer applications for event
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "organizer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { eventId } = params;
    const organizerEmail = session.user.email;

    // Verify organizer owns this event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, organizer_email")
      .eq("id", eventId)
      .eq("organizer_email", organizerEmail)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found or access denied" },
        { status: 404 }
      );
    }

    // Get all applications with applicant details
    const { data: applications, error } = await supabase
      .from("volunteer_applications")
      .select(`
        *,
        student_profiles (
          full_name,
          phone_number,
          profile_photo,
          college_name
        )
      `)
      .eq("event_id", eventId)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    // For each applicant, get their certificates
    const applicationsWithCerts = await Promise.all(
      applications.map(async (app) => {
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

    return NextResponse.json({ applications: applicationsWithCerts });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
