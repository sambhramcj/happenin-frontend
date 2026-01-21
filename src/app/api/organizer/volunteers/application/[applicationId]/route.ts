import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH: Accept or reject volunteer application
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "organizer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId } = await params;
    const { status } = await req.json();

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'accepted' or 'rejected'" },
        { status: 400 }
      );
    }

    const organizerEmail = session.user.email;

    // Get application with event details
    const { data: application, error: appError } = await supabase
      .from("volunteer_applications")
      .select(`
        *,
        events (
          id,
          organizer_email,
          title
        )
      `)
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Verify organizer owns the event
    if ((application.events as any).organizer_email !== organizerEmail) {
      return NextResponse.json(
        { error: "You don't have permission to review this application" },
        { status: 403 }
      );
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabase
      .from("volunteer_applications")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: organizerEmail,
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    // If accepted, create volunteer assignment
    if (status === "accepted") {
      const { error: assignError } = await supabase
        .from("volunteer_assignments")
        .insert({
          event_id: application.event_id,
          student_email: application.student_email,
          role: application.role,
          assigned_by: organizerEmail,
        });

      if (assignError) {
        console.error("Error creating assignment:", assignError);
        // Don't fail the request, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApp,
    });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
