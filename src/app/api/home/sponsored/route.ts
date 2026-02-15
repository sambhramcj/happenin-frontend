import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString();

    // Get active sponsorship deals with paid visibility
    const { data: deals, error } = await supabase
      .from("sponsorship_deals")
      .select(`
        *,
        events!sponsorship_deals_event_id_fkey (
          id,
          title,
          banner_url,
          banner_image,
          start_date,
          date,
          college_id
        ),
        sponsors_profile!sponsorship_deals_sponsor_email_fkey (
          company_name,
          logo_url,
          banner_url,
          industry
        )
      `)
      .eq("visibility_active", true)
      .eq("payment_status", "verified")
      .gte("visibility_end_date", now)
      .order("visibility_priority", { ascending: true })
      .limit(5);

    if (error) {
      console.error("Error fetching sponsored content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deals: deals || [] });
  } catch (error: any) {
    console.error("Error in sponsored content API:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsored content" },
      { status: 500 }
    );
  }
}
