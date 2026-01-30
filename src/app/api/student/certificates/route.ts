import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Student views all their certificates and badges (NO DELETE)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type"); // 'volunteer', 'participant', 'winning'

    // Get certificates
    let certificateQuery = supabase
      .from("student_certificates")
      .select("*")
      .eq("student_email", session.user.email)
      .order("sent_date", { ascending: false });

    if (filterType) {
      certificateQuery = certificateQuery.eq("certificate_type", filterType);
    }

    const { data: certificates, error: certError } = await certificateQuery;

    if (certError) {
      return NextResponse.json({ error: "Failed to fetch certificates" }, { status: 500 });
    }

    // Get badges
    const { data: badges, error: badgeError } = await supabase
      .from("achievement_badges")
      .select("*")
      .eq("student_email", session.user.email)
      .order("earned_at", { ascending: false });

    if (badgeError) {
      return NextResponse.json({ error: "Failed to fetch badges" }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      totalCertificates: certificates?.length || 0,
      volunteer: certificates?.filter((c) => c.certificate_type === "volunteer").length || 0,
      participant: certificates?.filter((c) => c.certificate_type === "participant").length || 0,
      winning: certificates?.filter((c) => c.certificate_type === "winning").length || 0,
      totalBadges: badges?.length || 0,
    };

    return NextResponse.json({
      success: true,
      certificates: certificates || [],
      badges: badges || [],
      stats,
    });
  } catch (error) {
    console.error("Certificate fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: DISABLED - Organizers issue certificates now
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "student") {
      return NextResponse.json(
        { error: "Only students can add certificates" },
        { status: 403 }
      );
    }

    const {
      type,
      eventName,
      role,
      organization,
      date,
      description,
      certificateUrl,
      issuedBy,
      achievement,
    } = await req.json();

    // Validate required fields
    if (!type || !eventName || !organization || !date) {
      return NextResponse.json(
        { error: "Type, event name, organization, and date are required" },
        { status: 400 }
      );
    }

    // Validate type
    if (!["volunteering", "participation", "winning"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'volunteering', 'participation', or 'winning'" },
        { status: 400 }
      );
    }

    const studentEmail = session.user.email;

    // Insert certificate
    const { data: certificate, error: insertError } = await supabase
      .from("volunteer_certificates")
      .insert({
        student_email: studentEmail,
        type,
        event_name: eventName,
        role: role || null,
        organization,
        date,
        description: description || null,
        certificate_url: certificateUrl || null,
        issued_by: issuedBy || null,
        achievement: achievement || null,
        verified: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding certificate:", insertError);
      return NextResponse.json(
        { error: "Failed to add certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Certificate added successfully",
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add certificate error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE: NOT ALLOWED - Students cannot delete certificates
export async function DELETE(req: NextRequest) {
  return NextResponse.json(
    { error: "Deleting certificates is not allowed." },
    { status: 403 }
  );
}
      grouped,
      counts,
    });
  } catch (error) {
    console.error("Fetch certificates error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE: Remove certificate
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get("id");

    if (!certificateId) {
      return NextResponse.json(
        { error: "Certificate ID is required" },
        { status: 400 }
      );
    }

    const studentEmail = session.user.email;

    // Delete certificate (RLS will ensure they own it)
    const { error: deleteError } = await supabase
      .from("volunteer_certificates")
      .delete()
      .eq("id", certificateId)
      .eq("student_email", studentEmail);

    if (deleteError) {
      console.error("Error deleting certificate:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete certificate" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (error) {
    console.error("Delete certificate error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
