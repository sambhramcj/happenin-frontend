import { createClient } from "@supabase/supabase-js";
import { FEATURE_FLAGS, FeatureFlagKey, FeatureFlags } from "@/config/featureFlags";

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return null;
}

function getEnvOverride(key: FeatureFlagKey): boolean | null {
  const envKey = `FEATURE_${key}`;
  return normalizeBoolean(process.env[envKey]);
}

export async function getServerFeatureFlags(): Promise<FeatureFlags> {
  const merged: FeatureFlags = { ...FEATURE_FLAGS };

  for (const key of Object.keys(FEATURE_FLAGS) as FeatureFlagKey[]) {
    const envOverride = getEnvOverride(key);
    if (envOverride !== null) {
      merged[key] = envOverride;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return merged;
  }

  try {
    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await db
      .from("platform_feature_flags")
      .select("flag_key, enabled");

    if (error || !data) return merged;

    for (const row of data) {
      const key = String(row.flag_key || "") as FeatureFlagKey;
      if (!(key in FEATURE_FLAGS)) continue;
      const enabled = normalizeBoolean(row.enabled);
      if (enabled !== null) {
        merged[key] = enabled;
      }
    }
  } catch {
    return merged;
  }

  return merged;
}
