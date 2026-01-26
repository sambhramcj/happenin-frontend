import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find photos where the student is tagged
    const { data: tags, error: tagsError } = await supabase
      .from("photo_tags")
      .select(`
        photo_id,
        event_photos (
          id,
          event_id,
          photo_url,
          caption,
          uploaded_at,
          events (
            title
          )
        )
      `)
      .eq("student_email", session.user.email)
      .eq("event_photos.status", "approved");

    if (tagsError) throw tagsError;

    // Format response
    const photos = tags
      .map(tag => {
        const photo = (tag as any).event_photos;
        if (!photo) return null;
        
        return {
          id: photo.id,
          event_id: photo.event_id,
          event_title: photo.events?.title || "Unknown Event",
          photo_url: photo.photo_url,
          caption: photo.caption,
          uploaded_at: photo.uploaded_at,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: photos,
      message: `Found ${photos.length} photo(s)`,
    });
  } catch (error: any) {
    console.error("Find my photos error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to find photos" },
      { status: 500 }
    );
  }
}
