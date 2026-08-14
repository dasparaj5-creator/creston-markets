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
  balance: z.coerce.number(),
  pnlTotal: z.coerce.number(),
  pnlToday: z.coerce.number(),
  pnlThisMonth: z.coerce.number(),
  returnPercent: z.coerce.number(),
  isSettlement: z.boolean().optional(),
  settlementPeriod: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

/**
 * Same reconciliation entry form as the general Reconciliation page, but
 * scoped to a single user and pre-selected -- used on the admin user
 * detail page so admin doesn't need to leave the page or re-select the
 * user from a dropdown.
 */
export default function UserReconciliationForm({ userId, adminId }: { userId: string; adminId: string }) {
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
      toast.error('Enter a settlement period label (e.g. "January 2026") before marking as official settlement.');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("portfolio_snapshots").insert({
        user_id: userId,
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

      logger.info("Reconciliation snapshot recorded from user detail page", { userId, adminId, isSettlement: values.isSettlement });
      toast.success(values.isSettlement ? "Settlement recorded, commissions calculated." : "Entry saved.");
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              Triggers profit share commissions for this user&apos;s upline. Leave unchecked for
              routine corrections.
            </p>
          </div>
        </label>
        {isSettlement && (
          <input
            {...register("settlementPeriod")}
            placeholder='e.g. "January 2026"'
            className="input-field mt-3"
          />
        )}
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Entry"}
      </button>
    </form>
  );
}
