export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface VerifyBulkBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
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
        { error: "Only students can verify bulk ticket purchases" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as VerifyBulkBody;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bulkPackId,
      quantityPurchased,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bulkPackId ||
      !quantityPurchased
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const sigA = Buffer.from(generatedSignature);
    const sigB = Buffer.from(razorpay_signature);

    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const requestedQuantity = Number(quantityPurchased);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return NextResponse.json(
        { error: "Invalid quantityPurchased" },
        { status: 400 }
      );
    }

    const { data: existingPurchaseByBuyer, error: existingPurchaseError } = await supabase
      .from("bulk_ticket_purchases")
      .select("id, quantity_purchased")
      .eq("bulk_pack_id", bulkPackId)
      .eq("buyer_email", sessionEmail)
      .maybeSingle();

    if (existingPurchaseError) {
      throw existingPurchaseError;
    }

    if (existingPurchaseByBuyer?.id) {
      return NextResponse.json({
        success: true,
        message: "Bulk purchase already verified",
        purchaseId: existingPurchaseByBuyer.id,
        tickets_generated: existingPurchaseByBuyer.quantity_purchased,
      });
    }

    const { data: packData, error: packError } = await supabase
      .from("bulk_ticket_packs")
      .select("id, event_id, quantity, bulk_price, sold_count, available_count, status")
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
        { status: 409 }
      );
    }

    const totalAmount = Number(packData.bulk_price) * requestedQuantity;

    const { data: purchaseData, error: purchaseError } = await supabase
      .from("bulk_ticket_purchases")
      .insert([
        {
          bulk_pack_id: bulkPackId,
          buyer_email: sessionEmail,
          quantity_purchased: requestedQuantity,
          price_per_ticket: packData.bulk_price,
          total_amount: totalAmount,
          payment_status: "completed",
        },
      ])
      .select("id")
      .single();

    if (purchaseError) {
      if (purchaseError.code === "23505") {
        const { data: duplicatePurchase } = await supabase
          .from("bulk_ticket_purchases")
          .select("id, quantity_purchased")
          .eq("bulk_pack_id", bulkPackId)
          .eq("buyer_email", sessionEmail)
          .maybeSingle();

        if (duplicatePurchase?.id) {
          return NextResponse.json({
            success: true,
            message: "Bulk purchase already verified",
            purchaseId: duplicatePurchase.id,
            tickets_generated: duplicatePurchase.quantity_purchased,
          });
        }
      }
      throw purchaseError;
    }

    const updatedSoldCount = Number(packData.sold_count) + requestedQuantity;
    const newStatus = updatedSoldCount >= Number(packData.quantity) ? "sold_out" : "active";

    const { error: packUpdateError } = await supabase
      .from("bulk_ticket_packs")
      .update({ sold_count: updatedSoldCount, status: newStatus })
      .eq("id", bulkPackId);

    if (packUpdateError) {
      throw packUpdateError;
    }

    const now = Date.now();
    const eventSlug = packData.event_id.slice(0, 8).toUpperCase();
    const ticketRows = Array.from({ length: requestedQuantity }, (_, index) => ({
      bulk_purchase_id: purchaseData.id,
      event_id: packData.event_id,
      ticket_number: `BULK-${eventSlug}-${now}-${String(index + 1).padStart(3, "0")}`,
      qr_code_data: `${packData.event_id}:${purchaseData.id}:${index + 1}:${now}`,
      status: "available",
    }));

    const { error: ticketInsertError } = await supabase
      .from("bulk_tickets")
      .insert(ticketRows);

    if (ticketInsertError) {
      throw ticketInsertError;
    }

    return NextResponse.json({
      success: true,
      purchaseId: purchaseData.id,
      tickets_generated: requestedQuantity,
    });
  } catch (error: unknown) {
    console.error("Error verifying bulk ticket purchase:", error);
    const message =
      error instanceof Error ? error.message : "Failed to verify bulk ticket purchase";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
