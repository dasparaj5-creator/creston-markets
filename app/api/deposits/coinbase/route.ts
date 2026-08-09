import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

/**
 * Creates a Coinbase Commerce charge for a deposit and returns the hosted
 * checkout URL. Requires COINBASE_COMMERCE_API_KEY to be set -- until the
 * client provides that key, this route responds with a clear "not
 * configured" error rather than silently failing, so the deposit page can
 * show a helpful message instead of a broken button.
 *
 * Coinbase Commerce API docs: https://docs.cloud.coinbase.com/commerce/docs
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;

  if (!apiKey) {
    logger.warn("Coinbase Commerce charge attempted without API key configured");
    return NextResponse.json(
      { error: "Payment gateway is not yet configured. Please contact support." },
      { status: 503 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  const planId = body?.planId as string | undefined;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid deposit amount." }, { status: 400 });
  }

  try {
    // 1. Create a pending deposit row first, so we have an internal
    //    reference id to reconcile the webhook against.
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        plan_id: planId ?? null,
        amount,
        status: "pending",
        payment_reference: "COINBASE_PENDING",
      })
      .select()
      .single();

    if (depositError || !deposit) throw depositError;

    // 2. Create the Coinbase Commerce charge, tagging it with our deposit id
    //    as metadata so the webhook can match the payment back to this row.
    const chargeRes = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": apiKey,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: "Creston Markets Deposit",
        description: `Account deposit — ${deposit.id}`,
        pricing_type: "fixed_price",
        local_price: { amount: amount.toFixed(2), currency: "USD" },
        metadata: { deposit_id: deposit.id, user_id: user.id },
        redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/deposit?status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/deposit?status=cancelled`,
      }),
    });

    if (!chargeRes.ok) {
      const errBody = await chargeRes.text();
      throw new Error(`Coinbase Commerce charge creation failed: ${errBody}`);
    }

    const charge = await chargeRes.json();

    await supabase
      .from("deposits")
      .update({ payment_reference: charge.data.id })
      .eq("id", deposit.id);

    logger.info("Coinbase Commerce charge created", { depositId: deposit.id, chargeId: charge.data.id });

    return NextResponse.json({ checkoutUrl: charge.data.hosted_url });
  } catch (err) {
    logger.error("Coinbase Commerce charge creation failed", { err });
    return NextResponse.json({ error: "Could not start payment. Please try again." }, { status: 500 });
  }
}
