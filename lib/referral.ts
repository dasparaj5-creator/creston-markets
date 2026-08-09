/**
 * Creston Markets — Referral bonus logic
 *
 * Single-tier flat referral bonus. No multi-level chains.
 * Flow:
 *   1. User A shares their referral link/code.
 *   2. User B registers using it (users.referred_by = A.id).
 *   3. User B's FIRST deposit is approved by admin.
 *      -> users.account_active_since is stamped (DB trigger handles this)
 *      -> a referral_bonuses row is created with status='pending' and
 *         eligible_after = approval time + maturity_days
 *   4. Once now() >= eligible_after, the bonus is "eligible" (computed,
 *      not stored as a separate status until admin marks it paid).
 *   5. Admin marks eligible bonuses as 'paid' from /admin/referrals.
 *
 * NOTE: the DB trigger `handle_deposit_approval` in supabase/schema.sql
 * performs the authoritative insert. The helpers below are for computing
 * derived UI state and for admin actions.
 */
import { logger } from "@/lib/logger";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface ReferralConfig {
  bonus_amount: number;
  bonus_currency: string;
  maturity_days: number;
}

export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  bonus_amount: 25,
  bonus_currency: "USD",
  maturity_days: 30,
};

export type ReferralDisplayStatus = "pending_maturity" | "eligible" | "paid";

/**
 * Derives the display status for a referral_bonuses row. The DB only stores
 * 'pending' | 'paid' — "eligible" (matured but not yet paid) is computed
 * here so the admin UI can surface a "Pay Now" action.
 */
export function getReferralDisplayStatus(bonus: {
  status: "pending" | "paid";
  eligible_after: string;
}): ReferralDisplayStatus {
  if (bonus.status === "paid") return "paid";
  const now = new Date();
  const eligibleAfter = new Date(bonus.eligible_after);
  return now >= eligibleAfter ? "eligible" : "pending_maturity";
}

export function daysUntilEligible(eligibleAfter: string): number {
  const diffMs = new Date(eligibleAfter).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86400000));
}

/**
 * Fetches the current (most recently updated) referral config row,
 * falling back to defaults if none exists yet.
 */
export async function getReferralConfig(): Promise<ReferralConfig> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("referral_config")
      .select("bonus_amount, bonus_currency, maturity_days")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.warn("Referral config not found, using defaults", { error });
      return DEFAULT_REFERRAL_CONFIG;
    }
    return data as ReferralConfig;
  } catch (err) {
    logger.error("Failed to load referral config", { err });
    return DEFAULT_REFERRAL_CONFIG;
  }
}

/**
 * Admin action: marks a single referral bonus as paid.
 * Logs the eligibility check context per spec section 9.
 */
export async function markReferralBonusPaid(bonusId: string, adminId: string) {
  const supabase = createServerClient();

  const { data: bonus, error: fetchErr } = await supabase
    .from("referral_bonuses")
    .select("*")
    .eq("id", bonusId)
    .single();

  if (fetchErr || !bonus) {
    logger.error("Referral bonus not found for payout", { bonusId, fetchErr });
    throw new Error("Referral bonus not found");
  }

  const displayStatus = getReferralDisplayStatus(bonus);
  logger.debug("Referral bonus eligibility check", {
    bonusId,
    displayStatus,
    eligible_after: bonus.eligible_after,
    referrer_id: bonus.referrer_id,
  });

  if (displayStatus !== "eligible") {
    logger.warn("Attempted payout of non-eligible referral bonus", { bonusId, displayStatus });
    throw new Error(`Bonus is not eligible for payout (status: ${displayStatus})`);
  }

  const { error: updateErr } = await supabase
    .from("referral_bonuses")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", bonusId);

  if (updateErr) {
    logger.error("Failed to mark referral bonus paid", { bonusId, updateErr });
    throw updateErr;
  }

  await supabase.from("admin_audit_log").insert({
    admin_id: adminId,
    action: "referral_bonus.paid",
    target_type: "referral_bonuses",
    target_id: bonusId,
    before_value: { status: "pending" },
    after_value: { status: "paid" },
  });

  logger.info("Referral bonus marked as paid", { bonusId, adminId });
}
