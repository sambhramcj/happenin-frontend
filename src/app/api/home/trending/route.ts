import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userEmail = session?.user?.email;

    // Get user's college_id if authenticated
    let collegeId: string | null = null;
    if (userEmail) {
      const { data: profile } = await supabase
        .from("students_profile")
        .select("college_id")
        .eq("email", userEmail)
        .single();
      
      collegeId = profile?.college_id || null;
    }

    // Call the SQL function to get top events by registrations
    const { data: events, error } = await supabase.rpc(
      "get_top_events_by_registrations",
      {
        p_college_id: collegeId,
        p_limit: 5,
      }
    );

    if (error) {
      console.error("Error fetching trending events:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error("Error in trending events API:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending events" },
      { status: 500 }
    );
  }
}
