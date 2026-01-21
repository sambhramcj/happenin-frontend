import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const testEmail = "student@test.com";
    const testPassword = "password123";

    // Get user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", testEmail)
      .single();

    if (error || !user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Database user:", JSON.stringify(user, null, 2));

    // Try to compare
    const result = await bcrypt.compare(testPassword, user.password_hash);

    return Response.json({
      userFound: true,
      email: user.email,
      role: user.role,
      storedHashStart: user.password_hash?.substring(0, 20),
      hashLength: user.password_hash?.length,
      testPassword,
      compareResult: result,
      hashType: typeof user.password_hash,
      passwordHashExists: !!user.password_hash,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
