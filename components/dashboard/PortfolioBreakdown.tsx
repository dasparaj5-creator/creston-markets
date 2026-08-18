"use client";

import { motion } from "framer-motion";
import { Wallet, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

/**
 * The client-facing breakdown behind the combined Portfolio Value
 * figure -- per an explicit product decision, Portfolio Value now shows
 * account balance + paid referral/bonus earnings combined, rather than
 * just the reconciled account balance alone. This component exists
 * specifically so that combination is never a black box: a client can
 * always see exactly how much of their total came from their actual
 * trading account (which itself already reflects deposits + trading
 * performance) versus how much came from referring others / bonuses.
 */
export default function PortfolioBreakdown({
  accountBalance,
  paidEarnings,
}: {
  accountBalance: number;
  paidEarnings: number;
}) {
  const total = accountBalance + paidEarnings;
  if (total === 0) return null; // nothing meaningful to break down yet

  const accountPct = total > 0 ? (accountBalance / total) * 100 : 0;
  const earningsPct = total > 0 ? (paidEarnings / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.16, ease: "easeOut" }}
      className="glass-card p-6"
    >
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Portfolio Breakdown</h2>

      {/* Stacked proportion bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        {accountPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${accountPct}%` }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="h-full bg-gold"
          />
        )}
        {earningsPct > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${earningsPct}%` }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="h-full bg-emerald-400"
          />
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-text-muted">Account Balance</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(accountBalance)}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">Deposits + trading performance</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
            <Gift className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs text-text-muted">Referral &amp; Bonus Earnings</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(paidEarnings)}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">Paid joining bonus, profit share &amp; custom bonuses</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
