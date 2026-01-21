import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Server API for student profile: GET (fetch), POST (create), PATCH (update)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let profile: any = null;
    let userCollege: any = null;

    if (supabaseUrl && serviceRole) {
      const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
      
      // Fetch student profile
      const { data, error } = await admin
        .from("student_profiles")
        .select("*")
        .eq("student_email", studentEmail)
        .single();
      // PGRST116 is normal when no profile exists yet (empty result)
      if (error && error.code !== "PGRST116") {
        console.error("Supabase admin profile fetch error:", error);
      } else {
        profile = data;
      }

      // Fetch user's college info
      const { data: userData, error: userError } = await admin
        .from("users")
        .select("college_id, colleges(name, domain, verified)")
        .eq("email", studentEmail)
        .single();
      
      if (!userError && userData?.colleges) {
        userCollege = userData.colleges;
      }
    } else {
      const { data, error } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("student_email", studentEmail)
        .single();
      // PGRST116 is normal when no profile exists yet (empty result)
      if (error && error.code !== "PGRST116") {
        console.error("Supabase profile fetch error:", error);
      } else {
        profile = data;
      }
    }

    return NextResponse.json({ 
      profile: profile || null,
      college: userCollege || null
    });
  } catch (err) {
    console.error("GET /api/student/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;
    const body = await req.json();

    const allowed = [
      "full_name",
      "dob",
      "college_name",
      "college_email",
      "phone_number",
      "personal_email",
      "profile_photo_url",
    ];

    const payload: Record<string, any> = { student_email: studentEmail };
    for (const k of allowed) if (k in body) payload[k] = body[k];

    // Prevent creating a duplicate
    const { data: existing } = await supabase
      .from("student_profiles")
      .select("student_email")
      .eq("student_email", studentEmail)
      .single();
    if (existing) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }

    // Use service role if available to bypass RLS for creation, otherwise use anon client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let insertResult: any;
    if (supabaseUrl && serviceRole) {
      const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
      insertResult = await admin.from("student_profiles").insert(payload).select().single();
    } else {
      insertResult = await supabase.from("student_profiles").insert(payload).select().single();
    }

    if (insertResult.error) {
      console.error("Profile insert error:", insertResult.error);
      return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: insertResult.data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/student/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentEmail = session.user.email as string;
    const body = await req.json();

    const allowed = [
      "full_name",
      "dob",
      "college_name",
      "college_email",
      "phone_number",
      "personal_email",
      "profile_photo_url",
    ];

    const updates: Record<string, any> = {};
    for (const k of allowed) if (k in body) updates[k] = body[k];

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let updateResult: any;
    if (supabaseUrl && serviceRole) {
      const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
      updateResult = await admin
        .from("student_profiles")
        .update(updates)
        .eq("student_email", studentEmail)
        .select()
        .single();
    } else {
      updateResult = await supabase
        .from("student_profiles")
        .update(updates)
        .eq("student_email", studentEmail)
        .select()
        .single();
    }

    if (updateResult.error) {
      console.error("Profile update error:", updateResult.error);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ profile: updateResult.data });
  } catch (err) {
    console.error("PATCH /api/student/profile error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
