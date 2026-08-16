"use client";

import { motion } from "framer-motion";
import { ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types";

/**
 * Genuinely new information for the client, not just a decorative
 * addition -- shows exactly how far they are from the next plan tier
 * and links directly to the real upgrade flow already built earlier
 * this project. Renders nothing if the client is already on the top
 * plan or has no plan selected yet, rather than showing an empty or
 * misleading progress bar.
 */
export default function PlanProgressCard({
  currentPlan,
  allPlans,
  currentBalance,
}: {
  currentPlan: Plan | null;
  allPlans: Plan[];
  currentBalance: number;
}) {
  if (!currentPlan) return null;

  const higherPlans = allPlans.filter((p) => p.min_deposit > currentPlan.min_deposit).sort((a, b) => a.min_deposit - b.min_deposit);
  const nextPlan = higherPlans[0];

  if (!nextPlan) return null; // already on the top plan

  const remaining = Math.max(nextPlan.min_deposit - currentBalance, 0);
  const progressPct = Math.min((currentBalance / nextPlan.min_deposit) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.32, ease: "easeOut" }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
            <ArrowUpCircle className="h-4 w-4" />
          </span>
          <p className="text-sm font-semibold text-text-primary">Path to {nextPlan.name}</p>
        </div>
        <Link href="/dashboard/deposit" className="text-xs text-gold hover:underline">
          Upgrade →
        </Link>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold"
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
        <span>{formatCurrency(currentBalance)}</span>
        <span>{formatCurrency(nextPlan.min_deposit)}</span>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        {remaining > 0 ? (
          <>Just <span className="font-medium text-text-primary">{formatCurrency(remaining)}</span> more to unlock {nextPlan.name}.</>
        ) : (
          <>You&apos;ve reached the {nextPlan.name} threshold, upgrade whenever you&apos;re ready.</>
        )}
      </p>
    </motion.div>
  );
}
