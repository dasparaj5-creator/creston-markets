"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";
import type { Plan } from "@/types";

export default function PlanCard({ plan, adminId }: { plan: Plan; adminId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleActive = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "plan.toggle_active",
        target_type: "plans",
        target_id: plan.id,
        before_value: { is_active: plan.is_active },
        after_value: { is_active: !plan.is_active },
      });

      logger.info("Plan status toggled", { planId: plan.id, adminId });
      toast.success(`${plan.name} plan ${!plan.is_active ? "activated" : "deactivated"}.`);
      router.refresh();
    } catch (err) {
      logger.error("Plan toggle failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-text-primary">{plan.name}</h3>
        <span className={plan.is_active ? "badge-success" : "badge-neutral"}>
          {plan.is_active ? "Active" : "Inactive"}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gold">{formatCurrency(plan.min_deposit)}</p>
      <p className="mt-1 text-xs text-text-muted">Minimum deposit</p>
      <p className="mt-3 text-sm text-text-muted">{plan.description}</p>
      <button onClick={toggleActive} disabled={loading} className="btn-secondary mt-4 w-full text-sm">
        {loading ? "Updating..." : plan.is_active ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}
