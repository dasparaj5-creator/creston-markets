"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowUpCircle, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import type { CryptoDepositAddress, CryptoNetwork, Plan } from "@/types";

const NETWORKS: CryptoNetwork[] = ["ERC20", "TRC20", "BEP20"];

const schema = z.object({
  network: z.enum(["ERC20", "TRC20", "BEP20"], { errorMap: () => ({ message: "Select a network" }) }),
  transactionHash: z.string().min(6, "Enter the transaction hash"),
});
type FormValues = z.infer<typeof schema>;

export default function PlanUpgradeForm({
  userId,
  currentPlan,
  higherPlans,
  addresses,
}: {
  userId: string;
  currentPlan: Plan;
  higherPlans: Plan[];
  addresses: CryptoDepositAddress[];
}) {
  const [targetPlanId, setTargetPlanId] = useState(higherPlans[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const targetPlan = higherPlans.find((p) => p.id === targetPlanId);
  const difference = targetPlan ? Math.max(targetPlan.min_deposit - currentPlan.min_deposit, 0) : 0;

  const selectedNetwork = watch("network");
  const activeAddress = addresses.find((a) => a.network === selectedNetwork);

  const onSubmit = async (values: FormValues) => {
    if (!targetPlan) return;
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("deposits").insert({
        user_id: userId,
        plan_id: targetPlan.id,
        amount: difference,
        payment_reference: values.transactionHash,
        is_plan_upgrade: true,
        upgrade_from_plan_id: currentPlan.id,
        status: "pending",
      });
      if (error) throw error;

      logger.info("Plan upgrade payment submitted", { userId, fromPlan: currentPlan.id, toPlan: targetPlan.id, difference });
      toast.success("Upgrade payment submitted. Your plan will update once verified.");
      setSubmitted(true);
    } catch (err) {
      logger.error("Plan upgrade submission failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (higherPlans.length === 0) {
    return null; // Already on the top plan -- nothing to upgrade to.
  }

  if (submitted) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-sm text-text-primary">
          Your upgrade payment has been submitted as <span className="text-gold">pending</span>. Your plan
          will update to {targetPlan?.name} automatically once our team verifies the payment.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <ArrowUpCircle className="h-4 w-4 text-gold" /> Upgrade Your Plan
      </h2>
      <p className="text-xs text-text-muted">
        You're currently on <span className="text-text-primary">{currentPlan.name}</span>. Upgrade to a
        higher plan by paying only the difference between plans, no need to re-deposit your full existing
        balance.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Upgrade To</label>
        <select value={targetPlanId} onChange={(e) => setTargetPlanId(e.target.value)} className="input-field">
          {higherPlans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}, min. {formatCurrency(p.min_deposit)}
            </option>
          ))}
        </select>
      </div>

      {targetPlan && (
        <div className="rounded-lg border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted">{currentPlan.name} minimum</span>
            <span className="text-text-primary">{formatCurrency(currentPlan.min_deposit)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-text-muted">{targetPlan.name} minimum</span>
            <span className="text-text-primary">{formatCurrency(targetPlan.min_deposit)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-gold/20 pt-2 text-sm font-semibold">
            <span className="text-text-primary">Amount to pay</span>
            <span className="text-gold">{formatCurrency(difference)}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Network</label>
          <select {...register("network")} className="input-field" defaultValue="">
            <option value="" disabled>
              Select USDT network…
            </option>
            {NETWORKS.map((n) => (
              <option key={n} value={n}>
                USDT ({n})
              </option>
            ))}
          </select>
          {errors.network && <p className="mt-1 text-xs text-danger">{errors.network.message}</p>}
        </div>

        {activeAddress && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-text-muted">Send {formatCurrency(difference)} in USDT to:</p>
            <p className="mt-1 break-all font-mono text-xs text-text-primary">{activeAddress.wallet_address}</p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Transaction Hash</label>
          <input {...register("transactionHash")} placeholder="0x... or transaction ID" className="input-field" />
          {errors.transactionHash && <p className="mt-1 text-xs text-danger">{errors.transactionHash.message}</p>}
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-gold/20 bg-gold/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <p className="text-xs text-text-muted">
            Your plan updates automatically once this payment is verified by our team, typically within
            6-8 hours.
          </p>
        </div>

        <button type="submit" disabled={submitting || !activeAddress} className="btn-primary w-full">
          {submitting ? "Submitting..." : `Submit Upgrade Payment (${formatCurrency(difference)})`}
        </button>
      </form>
    </div>
  );
}
