import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// URL may be shared; prefer server `SUPABASE_URL` if present, fallback to public
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

let supabase: SupabaseClient;

if (typeof window === "undefined") {
  // Server-side: require service role for full access (never exposed to client)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase server configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
} else {
  // Client-side: use anon key only
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Missing Supabase client configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  supabase = createClient(supabaseUrl, anonKey);
}

export { supabase };
