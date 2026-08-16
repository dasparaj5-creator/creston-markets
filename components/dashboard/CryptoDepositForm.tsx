"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Copy, Check, Send, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import type { CryptoDepositAddress, CryptoNetwork, Plan } from "@/types";

const NETWORKS: CryptoNetwork[] = ["ERC20", "TRC20", "BEP20"];

const schema = z.object({
  network: z.enum(["ERC20", "TRC20", "BEP20"]),
  planId: z.string().min(1, "Select a plan"),
  amount: z.coerce.number().positive("Enter an amount"),
  transactionHash: z.string().min(6, "Enter the transaction hash"),
});
type FormValues = z.infer<typeof schema>;

export default function CryptoDepositForm({
  addresses,
  plans,
  userId,
}: {
  addresses: CryptoDepositAddress[];
  plans: Plan[];
  userId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { network: "TRC20" } });

  const selectedNetwork = watch("network");
  const selectedPlanId = watch("planId");
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const activeAddress = useMemo(
    () => addresses.find((a) => a.network === selectedNetwork && a.is_active),
    [addresses, selectedNetwork]
  );

  const handleCopy = async () => {
    if (!activeAddress) return;
    try {
      await navigator.clipboard.writeText(activeAddress.wallet_address);
      setCopied(true);
      toast.success("Address copied.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy address.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!activeAddress) {
      toast.error("No deposit address configured for this network yet. Please contact support.");
      return;
    }
    if (selectedPlan && values.amount < selectedPlan.min_deposit) {
      toast.error(`Minimum deposit for ${selectedPlan.name} is ${formatCurrency(selectedPlan.min_deposit)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      const { data: deposit, error: depositError } = await supabase
        .from("deposits")
        .insert({
          user_id: userId,
          plan_id: values.planId,
          amount: values.amount,
          status: "pending",
          payment_reference: `${values.network}:${activeAddress.wallet_address}`,
        })
        .select()
        .single();
      if (depositError || !deposit) throw depositError;

      let screenshotPath: string | null = null;
      if (screenshot) {
        const path = `${userId}/${deposit.id}-${Date.now()}-${screenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from("deposit-proofs")
          .upload(path, screenshot);
        if (uploadError) throw uploadError;
        screenshotPath = path;
      }

      const { error: proofError } = await supabase.from("deposit_proofs").insert({
        deposit_id: deposit.id,
        network: values.network,
        transaction_hash: values.transactionHash,
        screenshot_path: screenshotPath,
      });
      if (proofError) throw proofError;

      logger.info("Crypto deposit proof submitted", { depositId: deposit.id, network: values.network });
      toast.success("Deposit submitted. Our team will verify within 6–8 hours.");
      setSubmitted(true);
    } catch (err) {
      logger.error("Crypto deposit submission failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-sm text-text-primary">
          Your deposit proof has been submitted and is <span className="text-gold">pending verification</span>.
          Our team typically confirms deposits within 6–8 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-5 p-6">
      <div>
        <label className="mb-2 block text-xs font-medium text-text-muted">Select Network</label>
        <div className="flex gap-2">
          {NETWORKS.map((n) => (
            <label
              key={n}
              className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors ${
                selectedNetwork === n
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-white/10 bg-white/[0.02] text-text-muted hover:text-text-primary"
              }`}
            >
              <input type="radio" value={n} {...register("network")} className="hidden" />
              USDT ({n})
            </label>
          ))}
        </div>
      </div>

      {activeAddress ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-gold/20 bg-gold/5 p-5 sm:flex-row">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={activeAddress.wallet_address} size={112} />
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <p className="text-xs text-text-muted">Send USDT ({selectedNetwork}) to:</p>
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary/90">{activeAddress.wallet_address}</span>
              <button type="button" onClick={handleCopy} className="shrink-0 text-text-muted hover:text-gold">
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-center text-sm text-danger">
          No deposit address is configured for {selectedNetwork} yet. Please contact support or try another network.
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Select Plan</label>
        <select {...register("planId")} className="input-field">
          <option value="">Choose a plan…</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}, min. {formatCurrency(p.min_deposit)}
            </option>
          ))}
        </select>
        {errors.planId && <p className="mt-1 text-xs text-danger">{errors.planId.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Amount Sent (USD)</label>
        <input
          {...register("amount")}
          type="number"
          step="0.01"
          placeholder={selectedPlan ? String(selectedPlan.min_deposit) : "0.00"}
          className="input-field"
        />
        {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Transaction Hash (TXID)</label>
        <input {...register("transactionHash")} placeholder="0x... or transaction ID" className="input-field" />
        {errors.transactionHash && <p className="mt-1 text-xs text-danger">{errors.transactionHash.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Screenshot (optional)</label>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-4 text-center text-sm text-text-muted hover:border-gold/40">
          <Upload className="h-4 w-4" />
          {screenshot ? screenshot.name : "Upload payment screenshot"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      <button type="submit" disabled={submitting || !activeAddress} className="btn-primary w-full">
        <Send className="h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Deposit for Verification"}
      </button>
    </form>
  );
}
