import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment view count using the function
    const { error } = await supabase.rpc("increment_banner_views", {
      banner_id: id,
    });

    if (error) {
      console.error("Failed to increment views:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track banner view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
