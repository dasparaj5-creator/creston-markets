import "server-only";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Coinbase Commerce webhook receiver. Coinbase calls this endpoint when a
 * charge's status changes (pending -> confirmed / failed / expired).
 *
 * Setup required in the Coinbase Commerce dashboard:
 *   Settings -> Webhook subscriptions -> add endpoint:
 *   https://crestonmarkets.com/api/webhooks/coinbase
 * Copy the "Shared Secret" shown there into COINBASE_COMMERCE_WEBHOOK_SECRET.
 *
 * Docs: https://docs.cloud.coinbase.com/commerce/docs/webhooks
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  const signature = req.headers.get("x-cc-webhook-signature");
  const rawBody = await req.text();

  if (!webhookSecret) {
    logger.error("Coinbase webhook received but COINBASE_COMMERCE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  if (!signature) {
    logger.warn("Coinbase webhook received with no signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify the webhook actually came from Coinbase, not a spoofed request.
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const validSignature =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!validSignature) {
    logger.warn("Coinbase webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event?.event?.type as string | undefined;
  const charge = event?.event?.data;
  const depositId = charge?.metadata?.deposit_id as string | undefined;

  if (!depositId) {
    logger.warn("Coinbase webhook missing deposit_id metadata", { eventType });
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();

  try {
    if (eventType === "charge:confirmed") {
      const { data: existing } = await supabase.from("deposits").select("status").eq("id", depositId).single();

      // Idempotency: webhooks can be delivered more than once.
      if (existing?.status === "approved") {
        return NextResponse.json({ received: true });
      }

      await supabase
        .from("deposits")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          payment_reference: charge.id,
        })
        .eq("id", depositId);

      logger.info("Coinbase deposit confirmed and approved", { depositId, chargeId: charge.id });
    } else if (eventType === "charge:failed" || eventType === "charge:expired") {
      await supabase
        .from("deposits")
        .update({ status: "rejected", payment_reference: charge.id })
        .eq("id", depositId);

      logger.info("Coinbase deposit failed/expired", { depositId, eventType });
    } else {
      logger.debug("Coinbase webhook event ignored", { eventType, depositId });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error("Coinbase webhook processing failed", { err, depositId, eventType });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
