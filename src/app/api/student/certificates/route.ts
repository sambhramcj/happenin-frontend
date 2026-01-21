import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Add certificate (volunteering, participation, or winning)
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

// GET: Get all student's certificates with filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentEmail = searchParams.get("email") || session.user.email;
    const typeFilter = searchParams.get("type"); // 'volunteering', 'participation', 'winning', or 'all'

    // Students can only view their own, organizers can view applicants'
    if ((session.user as any).role === "student") {
      if (studentEmail !== session.user.email) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Build query
    let query = supabase
      .from("volunteer_certificates")
      .select("*")
      .eq("student_email", studentEmail);

    // Apply type filter if specified
    if (typeFilter && typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    const { data: certificates, error } = await query.order("date", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching certificates:", error);
      return NextResponse.json(
        { error: "Failed to fetch certificates" },
        { status: 500 }
      );
    }

    // Group certificates by type for easy filtering
    const grouped = {
      all: certificates || [],
      volunteering:
        certificates?.filter((c) => c.type === "volunteering") || [],
      participation:
        certificates?.filter((c) => c.type === "participation") || [],
      winning: certificates?.filter((c) => c.type === "winning") || [],
    };

    // Count by type
    const counts = {
      total: certificates?.length || 0,
      volunteering: grouped.volunteering.length,
      participation: grouped.participation.length,
      winning: grouped.winning.length,
    };

    return NextResponse.json({
      certificates: typeFilter ? grouped[typeFilter as keyof typeof grouped] || [] : grouped.all,
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
