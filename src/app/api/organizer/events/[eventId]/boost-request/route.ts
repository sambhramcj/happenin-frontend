import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error: "Legacy boost request route deprecated. Use /api/payments/create-featured-boost-order",
      replacement: "/api/payments/create-featured-boost-order",
    },
    { status: 410 }
  );
}
