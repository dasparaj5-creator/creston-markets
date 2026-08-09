"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount"),
  paymentMethod: z.string().min(1, "Select a payment method"),
  walletAddress: z.string().min(4, "Enter a wallet address or bank details"),
});
type FormValues = z.infer<typeof schema>;

export default function WithdrawForm({ userId, availableBalance }: { userId: string; availableBalance: number }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (values.amount > availableBalance) {
      toast.error("Amount exceeds available balance.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("withdrawals").insert({
        user_id: userId,
        amount: values.amount,
        payment_method: values.paymentMethod,
        wallet_address: values.walletAddress,
        status: "pending",
      });

      if (error) throw error;

      logger.info("Withdrawal request submitted", { userId, amount: values.amount });
      toast.success("Withdrawal request submitted.");
      setSubmitted(true);
    } catch (err) {
      logger.error("Withdrawal request failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-text-primary">
          Your withdrawal request has been submitted as <span className="text-gold">pending</span>. It will be
          processed once live trading operations commence.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Amount (USD)</label>
        <input {...register("amount")} type="number" step="0.01" placeholder="0.00" className="input-field" />
        {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Payment Method</label>
        <select {...register("paymentMethod")} className="input-field">
          <option value="">Choose a method…</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="crypto">Cryptocurrency</option>
          <option value="card">Card</option>
        </select>
        {errors.paymentMethod && <p className="mt-1 text-xs text-danger">{errors.paymentMethod.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Wallet Address / Bank Details</label>
        <input {...register("walletAddress")} placeholder="Enter details" className="input-field" />
        {errors.walletAddress && <p className="mt-1 text-xs text-danger">{errors.walletAddress.message}</p>}
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        <Send className="h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Withdrawal Request"}
      </button>
    </form>
  );
}
