"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Gift, Send, Pencil, Save, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency, formatDate, slugifyStatus } from "@/lib/utils";

interface CustomBonusRecord {
  id: string;
  commission_earned: number;
  custom_reason: string | null;
  status: "pending" | "paid";
  created_at: string;
}

export default function CustomBonusForm({
  userId,
  userLabel,
  adminId,
}: {
  userId: string;
  userLabel: string;
  adminId: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const [existingBonuses, setExistingBonuses] = useState<CustomBonusRecord[]>([]);
  const [loadingBonuses, setLoadingBonuses] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const loadExistingBonuses = async () => {
    setLoadingBonuses(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("commission_records")
      .select("id, commission_earned, custom_reason, status, created_at")
      .eq("beneficiary_id", userId)
      .eq("commission_type", "custom_bonus")
      .order("created_at", { ascending: false });
    if (!error) setExistingBonuses(data ?? []);
    setLoadingBonuses(false);
  };

  useEffect(() => {
    loadExistingBonuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleGrant = async () => {
    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount greater than $0.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Enter a reason for this bonus, it's kept as a permanent record.");
      return;
    }
    if (
      !confirm(
        `Grant ${userLabel} a custom bonus of $${numericAmount.toFixed(2)}?\n\nReason: ${reason.trim()}\n\nThis creates a real, permanent commission record visible on their My Earnings page.`
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_custom_bonus", {
        p_beneficiary_id: userId,
        p_amount: numericAmount,
        p_reason: reason.trim(),
        p_admin_id: adminId,
      });
      if (error) throw error;

      logger.info("Custom bonus granted", { userId, adminId, amount: numericAmount, reason: reason.trim() });
      toast.success(`$${numericAmount.toFixed(2)} custom bonus granted to ${userLabel}.`);
      setAmount("");
      setReason("");
      await loadExistingBonuses();
      router.refresh();
    } catch (err) {
      logger.error("Failed to grant custom bonus", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (bonus: CustomBonusRecord) => {
    setEditingId(bonus.id);
    setEditAmount(String(bonus.commission_earned));
    setEditReason(bonus.custom_reason ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount("");
    setEditReason("");
  };

  const handleSaveEdit = async (bonus: CustomBonusRecord) => {
    const numericAmount = parseFloat(editAmount);
    if (!numericAmount || numericAmount <= 0) {
      toast.error("Enter a valid amount greater than $0.");
      return;
    }
    if (!editReason.trim()) {
      toast.error("A reason is required.");
      return;
    }

    const amountChanged = numericAmount !== bonus.commission_earned;
    const reasonChanged = editReason.trim() !== (bonus.custom_reason ?? "");
    if (!amountChanged && !reasonChanged) {
      cancelEditing();
      return;
    }

    if (
      bonus.status === "paid" &&
      !confirm(
        `This bonus is already marked as PAID. Editing it changes a record the client may already consider final.\n\nContinue anyway?`
      )
    ) {
      return;
    }

    setEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("commission_records")
        .update({
          commission_earned: numericAmount,
          base_amount: numericAmount,
          custom_reason: editReason.trim(),
        })
        .eq("id", bonus.id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "commission.custom_bonus_edited",
        target_type: "commission_records",
        target_id: bonus.id,
        before_value: { amount: bonus.commission_earned, reason: bonus.custom_reason },
        after_value: { amount: numericAmount, reason: editReason.trim() },
      });

      logger.info("Custom bonus edited", { bonusId: bonus.id, adminId, newAmount: numericAmount });
      toast.success("Custom bonus updated.");
      cancelEditing();
      await loadExistingBonuses();
      router.refresh();
    } catch (err) {
      logger.error("Failed to edit custom bonus", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const handleMarkPaid = async (bonus: CustomBonusRecord) => {
    if (
      !confirm(
        `Mark this $${bonus.commission_earned.toFixed(2)} bonus as paid?\n\nThis updates the client's Portfolio Value and Referral & Bonus Earnings totals immediately -- only mark this once the amount has genuinely been credited/confirmed.`
      )
    ) {
      return;
    }

    setMarkingPaidId(bonus.id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("commission_records")
        .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: adminId })
        .eq("id", bonus.id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "commission.custom_bonus_marked_paid",
        target_type: "commission_records",
        target_id: bonus.id,
        after_value: { status: "paid", amount: bonus.commission_earned },
      });

      logger.info("Custom bonus marked paid", { bonusId: bonus.id, adminId });
      toast.success("Marked as paid, now reflected in the client's Portfolio Value.");
      await loadExistingBonuses();
      router.refresh();
    } catch (err) {
      logger.error("Failed to mark custom bonus as paid", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setMarkingPaidId(null);
    }
  };

  return (
    <div className="glass-card space-y-5 p-6">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Gift className="h-4 w-4 text-gold" /> Grant Custom Bonus
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Creates a real, permanent commission record, separate from and in addition to any
          auto-calculated joining bonus or profit share. Visible to {userLabel} on their My
          Earnings page as a "Custom Bonus."
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Amount ($)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            min="0"
            placeholder="300.00"
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Reason (required, kept as a permanent record)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Loyalty bonus for large deposit"
            className="input-field"
          />
        </div>
      </div>

      <button onClick={handleGrant} disabled={saving} className="btn-primary">
        <Send className="h-4 w-4" /> {saving ? "Granting..." : "Grant Bonus"}
      </button>

      <div className="border-t border-white/5 pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-muted">
          Previously Granted Custom Bonuses
        </p>

        {loadingBonuses ? (
          <p className="text-xs text-text-muted">Loading...</p>
        ) : existingBonuses.length === 0 ? (
          <p className="text-xs text-text-muted">No custom bonuses granted to {userLabel} yet.</p>
        ) : (
          <div className="space-y-2">
            {existingBonuses.map((bonus) => {
              const isEditing = editingId === bonus.id;
              return (
                <div key={bonus.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  {isEditing ? (
                    <div className="space-y-2.5">
                      {bonus.status === "paid" && (
                        <div className="flex items-start gap-2 rounded-md border border-gold/20 bg-gold/5 p-2 text-xs text-gold">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          This bonus is already marked as paid. Editing changes a record the client may
                          consider final.
                        </div>
                      )}
                      <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                        <input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          type="number"
                          step="0.01"
                          min="0"
                          className="input-field"
                        />
                        <input
                          value={editReason}
                          onChange={(e) => setEditReason(e.target.value)}
                          placeholder="Reason"
                          className="input-field"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(bonus)}
                          disabled={editSaving}
                          className="btn-primary text-xs"
                        >
                          <Save className="h-3.5 w-3.5" /> {editSaving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={cancelEditing} disabled={editSaving} className="btn-secondary text-xs">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary">{formatCurrency(bonus.commission_earned)}</span>
                          <span className={bonus.status === "paid" ? "badge-success" : "badge-warning"}>
                            {slugifyStatus(bonus.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-text-muted">{bonus.custom_reason ?? "No reason recorded"}</p>
                        <p className="mt-0.5 text-[11px] text-text-muted">{formatDate(bonus.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        {bonus.status === "pending" && (
                          <button
                            onClick={() => handleMarkPaid(bonus)}
                            disabled={markingPaidId === bonus.id}
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-success/20 px-2.5 text-xs text-success hover:bg-success/10"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {markingPaidId === bonus.id ? "Marking..." : "Mark Paid"}
                          </button>
                        )}
                        <button
                          onClick={() => startEditing(bonus)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-text-muted hover:text-gold"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
