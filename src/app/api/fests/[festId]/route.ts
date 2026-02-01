import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

// GET /api/fests/[festId] - Get fest details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ festId: string }> }
) {
  try {
    const { festId } = await params;
    const { data: fest, error } = await supabase
      .from("fests")
      .select("*")
      .eq("id", festId)
      .single();

    if (error || !fest) {
      return NextResponse.json({ error: "Fest not found" }, { status: 404 });
    }

    return NextResponse.json({ fest });
  } catch (err) {
    console.error("Error fetching fest:", err);
    return NextResponse.json(
      { error: "Failed to fetch fest" },
      { status: 500 }
    );
  }
}
