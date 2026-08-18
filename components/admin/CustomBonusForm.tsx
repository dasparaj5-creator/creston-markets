"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Gift, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

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
      router.refresh();
    } catch (err) {
      logger.error("Failed to grant custom bonus", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card space-y-4 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Gift className="h-4 w-4 text-gold" /> Grant Custom Bonus
      </h2>
      <p className="text-xs text-text-muted">
        Creates a real, permanent commission record, separate from and in addition to any
        auto-calculated joining bonus or profit share. Visible to {userLabel} on their My Earnings
        page as a "Custom Bonus."
      </p>

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
    </div>
  );
}
