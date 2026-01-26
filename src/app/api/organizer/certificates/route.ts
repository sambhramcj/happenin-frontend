import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Issue certificate to approved volunteer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.role !== "organizer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId, certificateTitle, issuedDate } = await req.json();

    if (!applicationId || !certificateTitle) {
      return NextResponse.json(
        { error: "applicationId and certificateTitle required" },
        { status: 400 }
      );
    }

    // Get the application with related data
    const { data: application, error: appError } = await supabase
      .from("volunteer_applications")
      .select("*, volunteer_roles(title), events(title)")
      .eq("id", applicationId)
      .eq("status", "approved")
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found or not approved" },
        { status: 404 }
      );
    }

    // Generate certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create certificate record
    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        id: certificateId,
        student_email: application.student_email,
        volunteer_role: application.volunteer_roles?.title || "Volunteer",
        event_name: application.events?.title || "College Event",
        issued_date: issuedDate || new Date().toISOString().split("T")[0],
        certificate_title: certificateTitle,
        issued_by: session.user.email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (certError) {
      console.error("Certificate creation error:", certError);
      return NextResponse.json(
        { error: "Failed to create certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({ certificate }, { status: 200 });
  } catch (error) {
    console.error("Certificate error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
