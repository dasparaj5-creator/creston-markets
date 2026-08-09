"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { KycStatus } from "@/types";

export default function KycActions({
  userId,
  currentStatus,
  adminId,
}: {
  userId: string;
  currentStatus: KycStatus;
  adminId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: KycStatus) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("users").update({ kyc_status: status }).eq("id", userId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "kyc.status_updated",
        target_type: "users",
        target_id: userId,
        before_value: { kyc_status: currentStatus },
        after_value: { kyc_status: status },
      });

      logger.info("KYC status updated by admin", { userId, status, adminId });
      toast.success(`KYC ${status}.`);
      router.refresh();
    } catch (err) {
      logger.error("KYC status update failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus !== "pending") {
    return <span className="text-xs text-text-muted">No action needed</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => updateStatus("approved")}
        className="btn-secondary !py-1 !px-2 text-xs text-success"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => updateStatus("rejected")}
        className="btn-secondary !py-1 !px-2 text-xs text-danger"
      >
        Reject
      </button>
    </div>
  );
}
