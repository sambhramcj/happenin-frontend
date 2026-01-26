import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const { status } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("event_photos")
      .update({
        status,
        moderated_by: session.user.email,
        moderated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_email: session.user.email,
      action: `photo_${status}`,
      details: { photo_id: id },
    });

    return NextResponse.json({
      success: true,
      data,
      message: `Photo ${status} successfully`,
    });
  } catch (error: any) {
    console.error("Moderate photo error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to moderate photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("event_photos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Log admin action
    await supabase.from("admin_logs").insert({
      admin_email: session.user.email,
      action: "photo_deleted",
      details: { photo_id: id },
    });

    return NextResponse.json({
      success: true,
      message: "Photo deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete photo error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete photo" },
      { status: 500 }
    );
  }
}
