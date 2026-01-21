import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Student applies for volunteer position
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "student") {
      return NextResponse.json(
        { error: "Only students can apply for volunteer positions" },
        { status: 403 }
      );
    }

    const { eventId, role, message } = await req.json();

    if (!eventId || !role) {
      return NextResponse.json(
        { error: "Event ID and role are required" },
        { status: 400 }
      );
    }

    const studentEmail = session.user.email;

    // Check if event needs volunteers
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, needs_volunteers, volunteer_roles")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    if (!event.needs_volunteers) {
      return NextResponse.json(
        { error: "This event is not looking for volunteers" },
        { status: 400 }
      );
    }

    // Check if role exists in event
    const volunteerRoles = event.volunteer_roles || [];
    const roleExists = volunteerRoles.some((r: any) => r.role === role);

    if (!roleExists) {
      return NextResponse.json(
        { error: "Invalid role for this event" },
        { status: 400 }
      );
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from("volunteer_applications")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("student_email", studentEmail)
      .eq("role", role)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        {
          error: `You have already applied for this role (Status: ${existingApplication.status})`,
        },
        { status: 409 }
      );
    }

    // Create application
    const { data: application, error: insertError } = await supabase
      .from("volunteer_applications")
      .insert({
        event_id: eventId,
        student_email: studentEmail,
        role,
        message: message || null,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating application:", insertError);
      return NextResponse.json(
        { error: "Failed to submit application" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Volunteer application submitted successfully",
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Volunteer application error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// GET: Get student's volunteer applications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email;

    // Get all applications with event details
    const { data: applications, error } = await supabase
      .from("volunteer_applications")
      .select(`
        *,
        events (
          id,
          title,
          date,
          location,
          banner_image,
          organizer_email
        )
      `)
      .eq("student_email", studentEmail)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Fetch applications error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
