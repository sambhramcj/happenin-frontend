import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SessionUser = {
  email?: string | null;
  role?: string;
};

type VolunteerApplication = {
  event_id: string;
  student_email: string;
};

// GET: Get all volunteer applications for organizer's events
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as SessionUser | undefined;
    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "organizer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizerEmail = user.email;

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
      .select("*")
      .in("event_id", eventIds)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    const studentEmails = Array.from(
      new Set(
        ((applications || []) as VolunteerApplication[])
          .map((app) => app.student_email)
          .filter((email): email is string => Boolean(email))
      )
    );

    const { data: profiles } = studentEmails.length
      ? await supabase
          .from("student_profiles")
          .select("student_email, full_name, phone_number, profile_photo_url, college_name")
          .in("student_email", studentEmails)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((profile) => [profile.student_email, profile]));

    const applicationsWithCerts = await Promise.all(
      ((applications || []) as VolunteerApplication[]).map(async (app) => {
        const { data: certificates } = await supabase
          .from("student_certificates")
          .select("*")
          .eq("student_email", app.student_email)
          .eq("event_id", app.event_id)
          .eq("certificate_type", "volunteer")
          .order("sent_date", { ascending: false });

        return {
          ...app,
          student_profiles: profileMap.get(app.student_email) || null,
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
