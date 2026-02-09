import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Legacy endpoint: replaced by PATCH /api/admin/sponsorships
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated endpoint. Use /api/admin/sponsorships." },
    { status: 410 }
  );
}
