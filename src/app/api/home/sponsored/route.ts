import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data: deals, error } = await supabase
      .from("digital_visibility_packs")
      .select(`
        id,
        pack_type,
        amount,
        event_id,
        fest_id,
        payment_status,
        visibility_active,
        admin_approved,
        events:event_id (
          id,
          title,
          banner_url,
          banner_image,
        ),
        sponsors_profile!digital_visibility_packs_sponsor_id_fkey (
          company_name,
          logo_url,
          banner_url,
          industry
        )
      `)
      .eq("visibility_active", true)
      .eq("admin_approved", true)
      .eq("payment_status", "paid")
      .in("pack_type", ["platinum", "gold", "silver"])
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching sponsored content:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deals: deals || [] });
  } catch (error: unknown) {
    console.error("Error in sponsored content API:", error);
    return NextResponse.json(
      { error: "Failed to fetch sponsored content" },
      { status: 500 }
    );
  }
}
