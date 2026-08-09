"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Save, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

const schema = z.object({
  userId: z.string().min(1, "Select a user"),
  balance: z.coerce.number(),
  pnlTotal: z.coerce.number(),
  pnlToday: z.coerce.number(),
  pnlThisMonth: z.coerce.number(),
  returnPercent: z.coerce.number(),
  isSettlement: z.boolean().optional(),
  settlementPeriod: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ReconciliationForm({
  users,
  adminId,
}: {
  users: { id: string; full_name: string | null; email: string }[];
  adminId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { isSettlement: false } });

  const isSettlement = watch("isSettlement");

  const onSubmit = async (values: FormValues) => {
    if (values.isSettlement && !values.settlementPeriod?.trim()) {
      toast.error("Enter a settlement period label (e.g. \"January 2026\") before marking as official settlement.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("portfolio_snapshots").insert({
        user_id: values.userId,
        balance: values.balance,
        pnl_total: values.pnlTotal,
        pnl_today: values.pnlToday,
        pnl_this_month: values.pnlThisMonth,
        return_percent: values.returnPercent,
        source: "reconciliation",
        is_settlement: values.isSettlement ?? false,
        settlement_period: values.isSettlement ? values.settlementPeriod : null,
        updated_by: adminId,
      });
      if (error) throw error;

      logger.info("Reconciliation snapshot recorded", {
        userId: values.userId,
        adminId,
        isSettlement: values.isSettlement,
      });

      if (values.isSettlement) {
        toast.success("Settlement recorded — profit share commissions calculated for upline.");
      } else {
        toast.success("Reconciliation entry saved (routine update, no commissions triggered).");
      }

      reset();
      router.refresh();
    } catch (err) {
      logger.error("Reconciliation entry failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <h2 className="text-sm font-semibold text-text-primary">New Reconciliation Entry</h2>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">User</label>
        <select {...register("userId")} className="input-field">
          <option value="">Select user…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name || u.email}
            </option>
          ))}
        </select>
        {errors.userId && <p className="mt-1 text-xs text-danger">{errors.userId.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Balance</label>
          <input {...register("balance")} type="number" step="0.01" className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Return %</label>
          <input {...register("returnPercent")} type="number" step="0.01" className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">P&L Total</label>
          <input {...register("pnlTotal")} type="number" step="0.01" className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">P&L Today</label>
          <input {...register("pnlToday")} type="number" step="0.01" className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">P&L This Month</label>
          <input {...register("pnlThisMonth")} type="number" step="0.01" className="input-field" />
        </div>
      </div>

      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
        <label className="flex items-start gap-3">
          <input {...register("isSettlement")} type="checkbox" className="mt-0.5 rounded border-white/20 bg-white/5" />
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-gold">
              <TrendingUp className="h-4 w-4" /> Mark as official settlement
            </span>
            <p className="mt-1 text-xs text-text-muted">
              This will trigger profit share calculations for all upline members based on this
              user&apos;s gain since their last settlement. Leave unchecked for routine balance
              corrections — those save normally without triggering any commissions.
            </p>
          </div>
        </label>

        {isSettlement && (
          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">
              Settlement Period Label
            </label>
            <input
              {...register("settlementPeriod")}
              placeholder='e.g. "January 2026" or "Q1 2026"'
              className="input-field"
            />
          </div>
        )}
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Reconciliation Entry"}
      </button>
    </form>
  );
}
