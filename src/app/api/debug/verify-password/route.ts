import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Get user from database
    const { data: user, error } = await supabase
      .from("users")
      .select("email, password_hash, role")
      .eq("email", email)
      .single();

    if (error || !user) {
      return Response.json({ error: "User not found", userFound: false });
    }

    // Test password comparison
    console.log("Stored hash:", user.password_hash);
    console.log("Input password:", password);

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    console.log("Password match result:", passwordMatch);

    return Response.json({
      userFound: true,
      email: user.email,
      role: user.role,
      passwordMatch,
      storedHashStart: user.password_hash.substring(0, 20),
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
