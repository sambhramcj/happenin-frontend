import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy sponsorship route deprecated. Use /api/payments/create-digital-pack-order",
      replacement: "/api/payments/create-digital-pack-order",
    },
    { status: 410 }
  );
}
