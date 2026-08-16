import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { buildDepositApprovedEmail } from "@/lib/email/deposit-approved";
import { formatCurrency } from "@/lib/utils";

/**
 * Sends the deposit-approved confirmation email. Deliberately a
 * server-side API route, not called directly from client-side code --
 * the Resend API key must never be exposed to the browser, and this
 * also re-verifies the deposit actually exists and is genuinely
 * approved server-side before sending anything, rather than trusting
 * whatever the caller claims.
 *
 * Designed to fail SAFELY: if the email fails to send for any reason
 * (missing API key, Resend outage, invalid address), this returns an
 * error response but does NOT throw in a way that would roll back or
 * block the actual deposit approval that triggered it -- the approval
 * itself already succeeded in the database by the time this runs; a
 * failed notification email should never be able to undo a real
 * financial action.
 */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { depositId } = await request.json();
  if (!depositId) {
    return NextResponse.json({ error: "depositId is required" }, { status: 400 });
  }

  const { data: deposit, error: depositError } = await supabase
    .from("deposits")
    .select("id, amount, status, plan_id, user_id")
    .eq("id", depositId)
    .single();

  if (depositError || !deposit) {
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  }

  if (deposit.status !== "approved") {
    return NextResponse.json({ error: "Deposit is not approved -- refusing to send confirmation email" }, { status: 400 });
  }

  const [{ data: client }, { data: plan }] = await Promise.all([
    supabase.from("users").select("email, full_name").eq("id", deposit.user_id).single(),
    deposit.plan_id ? supabase.from("plans").select("name").eq("id", deposit.plan_id).single() : Promise.resolve({ data: null }),
  ]);

  if (!client?.email) {
    return NextResponse.json({ error: "Client email not found" }, { status: 404 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Fails safely and visibly in logs, rather than silently doing
    // nothing -- if this env var is never set up, every send attempt
    // will show this specific error in Vercel's logs instead of a
    // generic failure that's harder to diagnose.
    console.error("RESEND_API_KEY is not set -- cannot send deposit confirmation email");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.crestonmarkets.com";

  const { html, text } = buildDepositApprovedEmail({
    clientName: client.full_name ?? "there",
    amount: formatCurrency(deposit.amount),
    planName: plan?.name ?? "your selected",
    dashboardUrl: `${siteUrl}/dashboard`,
  });

  try {
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Creston Markets <notifications@crestonmarkets.com>",
      to: client.email,
      subject: "Your deposit has been confirmed",
      html,
      text,
    });

    if (sendError) {
      console.error("Resend failed to send deposit confirmation email", sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected error sending deposit confirmation email", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
