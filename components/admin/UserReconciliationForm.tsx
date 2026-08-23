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
  snapshotDate: z.string().min(1, "Select the date this entry applies to"),
  balance: z.coerce.number(),
  pnlTotal: z.coerce.number(),
  pnlToday: z.coerce.number(),
  pnlThisMonth: z.coerce.number(),
  returnPercent: z.coerce.number(),
  isSettlement: z.boolean().optional(),
  settlementPeriod: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Same reconciliation entry form as the general Reconciliation page, but
 * scoped to a single user and pre-selected -- used on the admin user
 * detail page so admin doesn't need to leave the page or re-select the
 * user from a dropdown.
 *
 * REAL BUG FIXED: this form was a separate, older component from
 * ReconciliationForm.tsx (the main Reconciliation page) and never
 * received the snapshotDate field that was added there -- every entry
 * made from this specific form silently defaulted to today's date, with
 * no way to backdate a correction. Combined with a separate client-side
 * sorting bug (fixed in the dashboard/portfolio/withdraw pages) that had
 * no tiebreaker for same-day entries, this meant reconciliation updates
 * entered from a client's own admin detail page could silently produce
 * wrong displayed balances -- not because the update failed, but
 * because a same-day auto-created snapshot (from their first deposit
 * approval) could be shown instead of the actual correction. Both
 * halves of that bug are now fixed: this form has the same explicit
 * date field as the main Reconciliation page, and the display-side sort
 * now uses created_at as a tiebreaker.
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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { isSettlement: false, snapshotDate: today() },
  });

  const isSettlement = watch("isSettlement");
  const snapshotDate = watch("snapshotDate");
  const isBackdated = snapshotDate && snapshotDate !== today();

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
        snapshot_date: values.snapshotDate,
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

      logger.info("Reconciliation snapshot recorded from user detail page", {
        userId,
        adminId,
        isSettlement: values.isSettlement,
        snapshotDate: values.snapshotDate,
        backdated: values.snapshotDate !== today(),
      });
      toast.success(values.isSettlement ? "Settlement recorded, commissions calculated." : "Entry saved.");
      reset({ isSettlement: false, snapshotDate: today() });
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
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Date This Entry Applies To</label>
        <input {...register("snapshotDate")} type="date" max={today()} className="input-field" />
        {errors.snapshotDate && <p className="mt-1 text-xs text-danger">{errors.snapshotDate.message}</p>}
        {isBackdated && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Backdated entry for {snapshotDate}, not today. This will correctly show as the current
            balance once it's the most recent entry for this date.
          </p>
        )}
      </div>

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
