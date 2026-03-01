import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy sponsorship verify route deprecated. Use /api/payments/webhook",
      replacement: "/api/payments/webhook",
    },
    { status: 410 }
  );
}
