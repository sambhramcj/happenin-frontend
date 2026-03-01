import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type SessionUserWithRole = {
  email?: string;
  role?: string;
};

type OrganizerPayoutRow = {
  payout_amount: number;
  payout_status: "pending" | "paid";
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email as string | undefined;
  const role = (session?.user as SessionUserWithRole | undefined)?.role;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "organizer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const queryEmail = searchParams.get("email");

  // Ensure organizer can only access their own payout data
  if (queryEmail !== email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { data: bankAccount } = await serviceSupabase
      .from("organizer_bank_accounts")
      .select("*")
      .eq("organizer_email", email)
      .single();

    const { data: payouts, error: payoutsError } = await serviceSupabase
      .from("sponsorship_payouts")
      .select(
        `
        id,
        digital_pack_id,
        gross_amount,
        platform_fee,
        payout_amount,
        payout_status,
        payout_method,
        paid_at,
        created_at
      `
      )
      .eq("organizer_email", email)
      .order("created_at", { ascending: false });

    if (payoutsError) throw payoutsError;

    const typedPayouts = (payouts || []) as Array<Record<string, unknown>>;
    const digitalPackIds = Array.from(
      new Set(
        typedPayouts
          .map((payout) => payout.digital_pack_id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
      )
    );

    const { data: packs } = digitalPackIds.length
      ? await serviceSupabase
          .from("digital_visibility_packs")
          .select("id, pack_type, event_id, sponsor_id")
          .in("id", digitalPackIds)
      : { data: [] };

    const eventIds = Array.from(
      new Set(
        ((packs || []) as Array<{ event_id?: string | null }>)
          .map((pack) => pack.event_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    const sponsorIds = Array.from(
      new Set(
        ((packs || []) as Array<{ sponsor_id?: string | null }>)
          .map((pack) => pack.sponsor_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const { data: events } = eventIds.length
      ? await serviceSupabase.from("events").select("id, title").in("id", eventIds)
      : { data: [] };
    const { data: sponsors } = sponsorIds.length
      ? await serviceSupabase
          .from("sponsors_profile")
          .select("email, company_name")
          .in("email", sponsorIds)
      : { data: [] };

    const packMap = new Map(
      ((packs || []) as Array<{ id: string; pack_type?: string | null; event_id?: string | null; sponsor_id?: string | null }>).map(
        (pack) => [pack.id, pack]
      )
    );
    const eventMap = new Map(
      ((events || []) as Array<{ id: string; title?: string | null }>).map((event) => [event.id, event])
    );
    const sponsorMap = new Map(
      ((sponsors || []) as Array<{ email: string; company_name?: string | null }>).map((sponsor) => [
        sponsor.email,
        sponsor,
      ])
    );

    const normalizedPayouts = typedPayouts.map((payout) => {
      const pack = packMap.get(String(payout.digital_pack_id || ""));
      const eventTitle = pack?.event_id ? eventMap.get(pack.event_id)?.title : null;
      const sponsorName = pack?.sponsor_id ? sponsorMap.get(pack.sponsor_id)?.company_name : null;

      return {
        ...payout,
        event_title: eventTitle || "Event",
        sponsor_name: sponsorName || "Sponsor",
        pack_type: pack?.pack_type || "standard",
      };
    });

    const totalEarnings = typedPayouts.reduce(
      (sum: number, payout) => sum + Number((payout as OrganizerPayoutRow).payout_amount || 0),
      0
    );
    const paidToOrganizer = typedPayouts.reduce(
      (sum: number, payout) => {
        const typed = payout as OrganizerPayoutRow;
        return sum + (typed.payout_status === "paid" ? Number(typed.payout_amount || 0) : 0);
      },
      0
    );
    const pendingPayouts = typedPayouts.filter(
      (payout) => (payout as OrganizerPayoutRow).payout_status === "pending"
    ).length;

    return NextResponse.json({
      bankAccount: bankAccount || null,
      totals: {
        totalEarnings,
        paidToOrganizer,
        pendingPayouts,
      },
      payouts: normalizedPayouts,
    });
  } catch (error) {
    console.error("Error fetching payout:", error);
    return NextResponse.json(
      { error: "Failed to fetch payout data" },
      { status: 500 }
    );
  }
}
