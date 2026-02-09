import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Manual sponsorship verification is admin-only.
export async function PATCH() {
  return NextResponse.json(
    { error: "Only admins can verify sponsorship payments." },
    { status: 403 }
  );
}
