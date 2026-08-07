"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function PayBonusButton({ bonusId, adminId }: { bonusId: string; adminId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      logger.debug("Referral bonus eligibility check (admin action)", { bonusId, adminId });

      const { error } = await supabase
        .from("referral_bonuses")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", bonusId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "referral_bonus.paid",
        target_type: "referral_bonuses",
        target_id: bonusId,
        before_value: { status: "pending" },
        after_value: { status: "paid" },
      });

      logger.info("Referral bonus marked paid", { bonusId, adminId });
      toast.success("Bonus marked as paid.");
      router.refresh();
    } catch (err) {
      logger.error("Failed to mark bonus paid", { err });
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button disabled={loading} onClick={handlePay} className="btn-secondary !py-1 !px-2 text-xs text-success">
      {loading ? "Processing..." : "Pay Now"}
    </button>
  );
}
