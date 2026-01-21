import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedUsers() {
  try {
    // Hash test password
    const testPassword = "password123";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test users
    const testUsers = [
      {
        email: "student@test.com",
        password_hash: hashedPassword,
        role: "student",
      },
      {
        email: "organizer@test.com",
        password_hash: hashedPassword,
        role: "organizer",
      },
      {
        email: "admin@test.com",
        password_hash: hashedPassword,
        role: "admin",
      },
    ];

    // First delete existing users
    await supabase
      .from("users")
      .delete()
      .in("email", ["student@test.com", "organizer@test.com", "admin@test.com"]);

    // Then insert fresh users
    const { data, error } = await supabase
      .from("users")
      .insert(testUsers)
      .select();

    if (error) {
      console.error("Insert error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log("Users inserted:", data);

    return {
      success: true,
      message: "Test users created",
      usersCreated: data?.length || 0,
      credentials: {
        student: { email: "student@test.com", password: testPassword },
        organizer: { email: "organizer@test.com", password: testPassword },
        admin: { email: "admin@test.com", password: testPassword },
      },
    };
  } catch (error: any) {
    console.error("Seed error:", error);
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

export async function GET() {
  try {
    const result = await seedUsers();
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const result = await seedUsers();
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
