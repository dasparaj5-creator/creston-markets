"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Layers, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types";

export default function PlanAllocationForm({
  userId,
  currentPlanId,
  plans,
  adminId,
}: {
  userId: string;
  currentPlanId: string | null;
  plans: Plan[];
  adminId: string;
}) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState(currentPlanId ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const newPlanId = selectedPlanId || null;

      const { error } = await supabase
        .from("users")
        .update({
          plan_id: newPlanId,
          plan_activated_at: newPlanId ? new Date().toISOString() : null,
        })
        .eq("id", userId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "user.plan_changed",
        target_type: "users",
        target_id: userId,
        before_value: { plan_id: currentPlanId },
        after_value: { plan_id: newPlanId },
      });

      const planName = plans.find((p) => p.id === newPlanId)?.name;
      logger.info("Client plan allocation changed", { userId, adminId, newPlanId });
      toast.success(newPlanId ? `Plan set to ${planName}.` : "Plan removed.");
      router.refresh();
    } catch (err) {
      logger.error("Plan allocation change failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Layers className="h-4 w-4 text-gold" /> Plan Allocation
      </h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Assigned Plan</label>
          <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className="input-field">
            <option value="">No plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}, min. {formatCurrency(p.min_deposit)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || selectedPlanId === (currentPlanId ?? "")}
          className="btn-primary"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Plan"}
        </button>
      </div>
    </div>
  );
}
