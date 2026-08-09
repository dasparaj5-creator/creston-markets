"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types";

const schema = z.object({
  planId: z.string().min(1, "Select a plan"),
  amount: z.coerce.number().positive("Enter an amount"),
});
type FormValues = z.infer<typeof schema>;

export default function DepositInterestForm({ plans, userId }: { plans: Plan[]; userId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      const supabase = createClient();
      const { error } = await supabase.from("deposits").insert({
        user_id: userId,
        plan_id: values.planId,
        amount: values.amount,
        status: "pending",
        payment_reference: "PHASE1-INTEREST-REGISTRATION",
      });

      if (error) throw error;

      logger.info("Deposit interest registered", { userId, planId: values.planId, amount: values.amount });
      toast.success("Interest registered. Our team will follow up.");
      setSubmitted(true);
    } catch (err) {
      logger.error("Deposit interest registration failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-text-primary">
          Thanks — your interest has been registered as <span className="text-gold">pending</span>. Our team will
          reach out with next steps once live deposit functionality is enabled.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
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
        <Send className="h-4 w-4" />
        {submitting ? "Registering..." : "Register Interest"}
      </button>
    </form>
  );
}
