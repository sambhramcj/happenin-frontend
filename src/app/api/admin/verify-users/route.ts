import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("email, role, full_name")
      .in("email", ["student@test.com", "organizer@test.com", "admin@test.com"]);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      found: users.length,
      users: users,
      message: users.length === 0 ? "No users found - seed endpoint may have failed" : "Users found",
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to verify users" },
      { status: 500 }
    );
  }
}
