"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckSquare, Square, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CommissionRecord } from "@/types";

interface EnrichedRecord extends CommissionRecord {
  beneficiary?: { full_name: string | null; email: string } | null;
  source_user?: { full_name: string | null; email: string } | null;
}

export default function CommissionRecordsTable({
  records,
  adminId,
}: {
  records: EnrichedRecord[];
  adminId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "joining_bonus" | "profit_share" | "custom_bonus">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("pending");

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== "all" && r.commission_type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [records, typeFilter, statusFilter]);

  const pendingSelectable = filtered.filter((r) => r.status === "pending");
  const allSelected = pendingSelectable.length > 0 && pendingSelectable.every((r) => selected.has(r.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingSelectable.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const totalSelected = filtered
    .filter((r) => selected.has(r.id))
    .reduce((sum, r) => sum + Number(r.commission_earned), 0);

  const handleBulkPay = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    try {
      const supabase = createClient();
      const ids = Array.from(selected);

      const { error } = await supabase
        .from("commission_records")
        .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: adminId })
        .in("id", ids);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "commission_records.bulk_paid",
        target_type: "commission_records",
        after_value: { count: ids.length, ids },
      });

      logger.info("Bulk commission payout processed", { count: ids.length, adminId });
      toast.success(`${ids.length} commission${ids.length > 1 ? "s" : ""} marked as paid.`);
      setSelected(new Set());
      router.refresh();
    } catch (err) {
      logger.error("Bulk commission payout failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Per-User Earnings Breakdown</h2>
        <div className="flex flex-wrap gap-2">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="input-field !w-auto !py-1.5 text-xs">
            <option value="all">All Types</option>
            <option value="joining_bonus">Joining Bonus</option>
            <option value="profit_share">Profit Share</option>
            <option value="custom_bonus">Custom Bonus</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="input-field !w-auto !py-1.5 text-xs">
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-gold/30 bg-gold/5 p-3">
          <span className="text-sm text-text-primary">
            {selected.size} selected, {formatCurrency(totalSelected)}
          </span>
          <button onClick={handleBulkPay} disabled={processing} className="btn-primary !py-1.5 !px-4 text-xs">
            <DollarSign className="h-3.5 w-3.5" /> {processing ? "Processing..." : "Mark Selected as Paid"}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-2 pr-2">
                <button onClick={toggleSelectAll} className="text-text-muted hover:text-gold">
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="pb-2 font-medium">Beneficiary</th>
              <th className="pb-2 font-medium">Source User</th>
              <th className="pb-2 font-medium">Position</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Rate</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Period</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className="py-2.5 pr-2">
                  {r.status === "pending" && (
                    <button onClick={() => toggleSelect(r.id)} className="text-text-muted hover:text-gold">
                      {selected.has(r.id) ? <CheckSquare className="h-4 w-4 text-gold" /> : <Square className="h-4 w-4" />}
                    </button>
                  )}
                </td>
                <td className="py-2.5 text-text-primary/90">{r.beneficiary?.full_name || r.beneficiary?.email}</td>
                <td className="py-2.5 text-text-primary/90">
                  {r.commission_type === "custom_bonus" ? "N/A" : r.source_user?.full_name || r.source_user?.email}
                </td>
                <td className="py-2.5 text-text-primary/90">
                  {r.commission_type === "custom_bonus" ? (
                    <span className="text-text-muted">N/A</span>
                  ) : (
                    <>
                      {r.position === 1 ? "Nearest" : `${r.position}${["", "st", "nd", "rd"][r.position ?? 0] ?? "th"}`}
                      <span className="ml-1 text-text-muted">({r.chain_depth}-layer)</span>
                    </>
                  )}
                </td>
                <td className="py-2.5">
                  <span className="badge-neutral">
                    {r.commission_type === "joining_bonus" ? "Joining Bonus" : r.commission_type === "profit_share" ? "Profit Share" : "Custom Bonus"}
                  </span>
                </td>
                <td className="py-2.5 text-text-primary/90">
                  {r.commission_type === "profit_share"
                    ? `${r.rate_at_time}%`
                    : r.commission_type === "custom_bonus"
                    ? "N/A"
                    : formatCurrency(r.bonus_amount_at_time ?? 0)}
                </td>
                <td className="py-2.5 text-text-primary/90">{formatCurrency(r.commission_earned)}</td>
                <td className="py-2.5 text-text-primary/90">
                  {r.commission_type === "custom_bonus" ? (r.custom_reason ?? "N/A") : (r.settlement_period ?? "N/A")}
                </td>
                <td className="py-2.5 text-text-primary/90">{formatDate(r.created_at)}</td>
                <td className="py-2.5">
                  <span className={r.status === "paid" ? "badge-success" : "badge-warning"}>{r.status}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-text-muted">
                  No commission records match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
