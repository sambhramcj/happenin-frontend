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

    // Increment click count using the function
    const { error } = await supabase.rpc("increment_banner_clicks", {
      banner_id: id,
    });

    if (error) {
      console.error("Failed to increment clicks:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to track banner click:", error);
    return NextResponse.json(
      { error: "Failed to track click" },
      { status: 500 }
    );
  }
}
