import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const resolvedParams = await params;
    const packId = resolvedParams.packId;

    if (!packId) {
      return NextResponse.json({ error: "packId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("bulk_ticket_packs")
      .delete()
      .eq("id", packId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting bulk pack:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
