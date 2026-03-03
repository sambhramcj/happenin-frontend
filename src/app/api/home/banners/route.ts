import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

type BannerPackRow = {
  id: string;
  events?: { id?: string; title?: string; banner_url?: string; banner_image?: string } | Array<{ id?: string; title?: string; banner_url?: string; banner_image?: string }>;
  sponsors_profile?: { company_name?: string; banner_url?: string; logo_url?: string } | Array<{ company_name?: string; banner_url?: string; logo_url?: string }>;
};

export async function GET() {
  try {
    const nowIso = new Date().toISOString();

    const { data: packs, error } = await supabase
      .from("digital_visibility_packs")
      .select(`
        id,
        event_id,
        pack_type,
        events:event_id (id,title,banner_url,banner_image),
        sponsors_profile!digital_visibility_packs_sponsor_id_fkey (company_name,banner_url,logo_url)
      `)
      .eq("pack_type", "platinum")
      .eq("payment_status", "paid")
      .eq("admin_approved", true)
      .eq("visibility_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    const packBanners = ((packs || []) as BannerPackRow[])
      .map((pack) => {
        const event = Array.isArray(pack.events) ? pack.events[0] : pack.events;
        const sponsor = Array.isArray(pack.sponsors_profile)
          ? pack.sponsors_profile[0]
          : pack.sponsors_profile;

        const imageUrl =
          sponsor?.banner_url || event?.banner_url || event?.banner_image || sponsor?.logo_url;

        if (!imageUrl) return null;

        return {
          id: pack.id,
          image_url: imageUrl,
          redirect_url: event?.id ? `/events/${event.id}` : null,
          title: sponsor?.company_name || event?.title || "Sponsored Banner",
          priority: 1,
        };
      })
      .filter(Boolean);

    if (!error && packBanners.length > 0) {
      return NextResponse.json({ banners: packBanners });
    }

    const { data: fallbackBanners, error: fallbackError } = await supabase
      .from("banners")
      .select("id,image_url,event_id,title,priority")
      .eq("status", "approved")
      .lte("start_date", nowIso)
      .gte("end_date", nowIso)
      .order("priority", { ascending: false })
      .limit(10);

    if (fallbackError) {
      console.error("Error fetching home banners:", error || fallbackError);
      return NextResponse.json({ error: fallbackError.message }, { status: 500 });
    }

    const banners = (fallbackBanners || []).map((banner: any) => ({
      id: banner.id,
      image_url: banner.image_url,
      redirect_url: banner.event_id ? `/events/${banner.event_id}` : null,
      title: banner.title || "Sponsored Banner",
      priority: Number(banner.priority || 0),
    }));

    return NextResponse.json({ banners });
  } catch (error: unknown) {
    console.error("Error in home banners API:", error);
    return NextResponse.json(
      { error: "Failed to fetch home banners" },
      { status: 500 }
    );
  }
}
