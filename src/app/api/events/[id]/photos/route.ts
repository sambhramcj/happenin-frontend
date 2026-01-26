import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const photo = formData.get("photo") as File;
    const caption = formData.get("caption") as string;

    if (!photo) {
      return NextResponse.json(
        { error: "No photo provided" },
        { status: 400 }
      );
    }

    // Convert file to base64 for storage (in production, use proper file storage like S3)
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const photoUrl = `data:${photo.type};base64,${base64}`;

    // Insert photo record
    const { data, error } = await supabase
      .from("event_photos")
      .insert({
        event_id: id,
        photo_url: photoUrl,
        caption: caption || null,
        uploaded_by: session.user.email,
        status: "pending", // Requires moderation
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: "Photo uploaded successfully. Pending moderation.",
    });
  } catch (error: any) {
    console.error("Upload photo error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === "admin";

    // Build query
    let query = supabase
      .from("event_photos")
      .select(`
        id,
        photo_url,
        caption,
        uploaded_by,
        uploaded_at,
        status,
        photo_tags (count)
      `)
      .eq("event_id", id)
      .order("uploaded_at", { ascending: false });

    // Non-admins only see approved photos
    if (!isAdmin) {
      query = query.eq("status", "approved");
    }

    const { data, error } = await query;

    if (error) throw error;

    // Add tags count to each photo
    const photosWithTagCount = data.map(photo => ({
      ...photo,
      tags_count: photo.photo_tags?.[0]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: photosWithTagCount,
    });
  } catch (error: any) {
    console.error("Fetch photos error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
