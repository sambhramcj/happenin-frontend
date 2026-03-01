export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import { razorpay } from "@/lib/razorpay";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface CreateBulkOrderBody {
  bulkPackId?: string;
  quantityPurchased?: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email;
    const sessionRole = (session?.user as { role?: string } | undefined)?.role;

    if (!sessionEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionRole !== "student") {
      return NextResponse.json(
        { error: "Only students can purchase bulk tickets" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as CreateBulkOrderBody;
    const bulkPackId = body.bulkPackId;
    const requestedQuantity = Number(body.quantityPurchased || 0);

    if (!bulkPackId) {
      return NextResponse.json({ error: "bulkPackId is required" }, { status: 400 });
    }

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return NextResponse.json(
        { error: "quantityPurchased must be a positive number" },
        { status: 400 }
      );
    }

    const { data: packData, error: packError } = await supabase
      .from("bulk_ticket_packs")
      .select("id, event_id, name, quantity, bulk_price, status, available_count")
      .eq("id", bulkPackId)
      .single();

    if (packError || !packData) {
      return NextResponse.json({ error: "Bulk pack not found" }, { status: 404 });
    }

    if (packData.status !== "active") {
      return NextResponse.json(
        { error: "This bulk pack is not available for purchase" },
        { status: 400 }
      );
    }

    if (packData.available_count < requestedQuantity) {
      return NextResponse.json(
        { error: "Not enough tickets available in this pack" },
        { status: 400 }
      );
    }

    const { data: existingPurchase, error: existingPurchaseError } = await supabase
      .from("bulk_ticket_purchases")
      .select("id")
      .eq("bulk_pack_id", bulkPackId)
      .eq("buyer_email", sessionEmail)
      .maybeSingle();

    if (existingPurchaseError) {
      throw existingPurchaseError;
    }

    if (existingPurchase?.id) {
      return NextResponse.json(
        { error: "You have already purchased this bulk pack" },
        { status: 409 }
      );
    }

    const totalAmount = Number(packData.bulk_price) * requestedQuantity;
    const amountPaise = Math.round(totalAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `bulk_${bulkPackId.slice(0, 8)}_${Date.now()}`,
      notes: {
        bulkPackId,
        buyerEmail: sessionEmail,
        quantityPurchased: String(requestedQuantity),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: totalAmount,
      amountPaise,
      currency: "INR",
      bulkPackId,
      quantityPurchased: requestedQuantity,
      packName: packData.name,
      eventId: packData.event_id,
    });
  } catch (error: unknown) {
    console.error("Error creating bulk ticket order:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create bulk ticket order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
