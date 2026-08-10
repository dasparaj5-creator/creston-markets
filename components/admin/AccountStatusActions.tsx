"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ShieldOff, ShieldCheck, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function AccountStatusActions({
  userId,
  isActive,
  adminId,
}: {
  userId: string;
  isActive: boolean;
  adminId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const nextStatus = !isActive;

      const { error } = await supabase.from("users").update({ is_active: nextStatus }).eq("id", userId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: nextStatus ? "user.reactivated" : "user.deactivated",
        target_type: "users",
        target_id: userId,
        before_value: { is_active: isActive },
        after_value: { is_active: nextStatus },
      });

      logger.info(nextStatus ? "User account reactivated" : "User account deactivated", { userId, adminId });
      toast.success(nextStatus ? "Account reactivated." : "Account put on hold.");
      setConfirming(false);
      router.refresh();
    } catch (err) {
      logger.error("Account status change failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (isActive && !confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="btn-secondary !py-1.5 !px-3 text-xs text-danger">
        <ShieldOff className="h-3.5 w-3.5" /> Put on Hold
      </button>
    );
  }

  if (isActive && confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger" />
        <span className="text-xs text-text-primary">Deactivate this account?</span>
        <button onClick={handleToggle} disabled={loading} className="text-xs font-medium text-danger hover:underline">
          {loading ? "..." : "Confirm"}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-text-muted hover:underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleToggle} disabled={loading} className="btn-secondary !py-1.5 !px-3 text-xs text-success">
      <ShieldCheck className="h-3.5 w-3.5" /> {loading ? "Reactivating..." : "Reactivate Account"}
    </button>
  );
}
