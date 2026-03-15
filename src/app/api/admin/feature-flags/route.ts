import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { FEATURE_FLAGS, FeatureFlagKey } from "@/config/featureFlags";
import { getServerFeatureFlags } from "@/lib/serverFeatureFlags";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDbClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.email || role !== "admin") return null;
  return session.user.email;
}

export async function GET() {
  const adminEmail = await requireAdmin();
  if (!adminEmail) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const flags = await getServerFeatureFlags();
  return NextResponse.json({
    flags,
    keys: Object.keys(FEATURE_FLAGS),
  });
}

export async function PATCH(req: NextRequest) {
  const adminEmail = await requireAdmin();
  if (!adminEmail) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const body = (await req.json()) as {
    updates?: Partial<Record<FeatureFlagKey, boolean>>;
  };

  const updates = body?.updates || {};
  const entries = Object.entries(updates).filter(([key, value]) => {
    return key in FEATURE_FLAGS && typeof value === "boolean";
  }) as Array<[FeatureFlagKey, boolean]>;

  if (entries.length === 0) {
    return NextResponse.json({ error: "No valid feature-flag updates provided" }, { status: 400 });
  }

  const db = getDbClient();

  for (const [flagKey, enabled] of entries) {
    const { error } = await db.from("platform_feature_flags").upsert(
      {
        flag_key: flagKey,
        enabled,
        updated_by: adminEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "flag_key" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const flags = await getServerFeatureFlags();
  return NextResponse.json({ success: true, flags });
}
