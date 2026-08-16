"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function ApprovalActions({
  table,
  id,
  adminId,
}: {
  table: "deposits" | "withdrawals";
  id: string;
  adminId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(true);
    try {
      const supabase = createClient();
      const updatePayload =
        table === "deposits"
          ? { status, approved_by: adminId, approved_at: new Date().toISOString() }
          : { status, processed_by: adminId, processed_at: new Date().toISOString() };

      const { error } = await supabase.from(table).update(updatePayload).eq("id", id);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: `${table.slice(0, -1)}.${status}`,
        target_type: table,
        target_id: id,
        after_value: { status },
      });

      logger.info(`${table} ${status}`, { id, adminId });
      toast.success(`${table === "deposits" ? "Deposit" : "Withdrawal"} ${status}.`);

      // Send the deposit confirmation email -- deliberately fire-and-forget
      // (not awaited into the main try block) so a slow or failed email
      // send can never delay or block the actual approval action from
      // completing for the admin. Only fires for deposits being approved,
      // never rejections, never withdrawals (no email template exists for
      // those yet).
      if (table === "deposits" && status === "approved") {
        fetch("/api/send-deposit-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ depositId: id }),
        }).catch((err) => {
          // A failed confirmation email should never surface as an error
          // to the admin about the approval itself -- the approval already
          // succeeded. Logged quietly instead.
          logger.error("Deposit confirmation email failed to send", { err, depositId: id });
        });
      }

      router.refresh();
    } catch (err) {
      logger.error(`${table} action failed`, { err });
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => handleAction("approved")}
        className="btn-secondary !py-1 !px-2 text-xs text-success"
      >
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => handleAction("rejected")}
        className="btn-secondary !py-1 !px-2 text-xs text-danger"
      >
        Reject
      </button>
    </div>
  );
}
