"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { CryptoNetwork } from "@/types";

const NETWORKS: CryptoNetwork[] = ["ERC20", "TRC20", "BEP20"];

const schema = z.object({
  amount: z.coerce.number().positive("Enter an amount"),
  network: z.enum(["ERC20", "TRC20", "BEP20"], { errorMap: () => ({ message: "Select a network" }) }),
  walletAddress: z.string().min(10, "Enter a valid USDT wallet address"),
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
        payment_method: `USDT (${values.network})`,
        wallet_address: values.walletAddress,
        status: "pending",
      });

      if (error) throw error;

      logger.info("Withdrawal request submitted", { userId, amount: values.amount, network: values.network });
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
          Your withdrawal request has been submitted as <span className="text-gold">pending</span>. Our
          team typically processes withdrawals within 6–8 hours.
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

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Withdrawal Wallet Address</label>
        <input {...register("walletAddress")} placeholder="Enter your USDT wallet address" className="input-field" />
        {errors.walletAddress && <p className="mt-1 text-xs text-danger">{errors.walletAddress.message}</p>}
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-gold/20 bg-gold/5 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs text-text-muted">
          Please ensure your network and wallet address are entered correctly. Creston Markets is
          not responsible for funds lost due to incorrect details provided by the client.
        </p>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        <Send className="h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Withdrawal Request"}
      </button>
    </form>
  );
}
