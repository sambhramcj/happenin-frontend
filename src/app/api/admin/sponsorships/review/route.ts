import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/admin/sponsorships/review
// Body: { sponsorshipId: string, action: 'approve'|'reject', tier?: 'title'|'gold'|'silver'|'partner' }
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email as string | undefined;
    const role = (session?.user as any)?.role as string | undefined;

    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sponsorshipId, action, tier } = await req.json();

    if (!sponsorshipId || !action) {
      return NextResponse.json({ error: "sponsorshipId and action are required" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const updatePayload: any = {
      status: newStatus,
      reviewed_by: email,
      reviewed_at: new Date().toISOString(),
    };
    if (tier) updatePayload.tier = tier;

    const { data, error } = await serviceSupabase
      .from("sponsorships")
      .update(updatePayload)
      .eq("id", sponsorshipId)
      .select("*")
      .single();

    if (error) {
      console.error("Review sponsorship error:", error);
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ success: true, sponsorship: data });
  } catch (e) {
    console.error("Admin review error:", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
