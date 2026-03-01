import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy route deprecated. Use /api/payments/create-ticket-order",
      replacement: "/api/payments/create-ticket-order",
    },
    { status: 410 }
  );
}
