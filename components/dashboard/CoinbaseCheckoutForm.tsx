"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { CreditCard, ExternalLink } from "lucide-react";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types";

const schema = z.object({
  planId: z.string().min(1, "Select a plan"),
  amount: z.coerce.number().positive("Enter an amount"),
});
type FormValues = z.infer<typeof schema>;

export default function CoinbaseCheckoutForm({ plans }: { plans: Plan[] }) {
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedPlanId = watch("planId");
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const onSubmit = async (values: FormValues) => {
    if (selectedPlan && values.amount < selectedPlan.min_deposit) {
      toast.error(`Minimum deposit for ${selectedPlan.name} is ${formatCurrency(selectedPlan.min_deposit)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/deposits/coinbase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: values.amount, planId: values.planId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          toast.error("Crypto payments aren't live yet — check back soon.");
        } else {
          toast.error(data.error || "Could not start payment.");
        }
        logger.warn("Coinbase checkout could not start", { status: res.status, error: data.error });
        return;
      }

      logger.info("Redirecting to Coinbase Commerce checkout");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      logger.error("Coinbase checkout request failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-gold" />
        <h2 className="text-sm font-semibold text-text-primary">Deposit via Crypto (USDT / USDC)</h2>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Select Plan</label>
        <select {...register("planId")} className="input-field">
          <option value="">Choose a plan…</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — min. {formatCurrency(p.min_deposit)}
            </option>
          ))}
        </select>
        {errors.planId && <p className="mt-1 text-xs text-danger">{errors.planId.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Amount (USD)</label>
        <input
          {...register("amount")}
          type="number"
          step="0.01"
          placeholder={selectedPlan ? String(selectedPlan.min_deposit) : "0.00"}
          className="input-field"
        />
        {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        <ExternalLink className="h-4 w-4" />
        {submitting ? "Redirecting..." : "Continue to Coinbase Checkout"}
      </button>
      <p className="text-center text-[11px] text-text-muted">
        You&apos;ll be redirected to Coinbase Commerce to complete payment via USDT or USDC.
      </p>
    </form>
  );
}
