"use client";

import { formatCurrency, formatDate, slugifyStatus } from "@/lib/utils";
import { maskName } from "@/lib/utils";

interface EarningRow {
  id: string;
  chain_depth: number | null;
  position: number | null;
  commission_type: "joining_bonus" | "profit_share" | "custom_bonus";
  rate_at_time: number | null;
  bonus_amount_at_time: number | null;
  commission_earned: number;
  status: "pending" | "paid";
  settlement_period: string | null;
  custom_reason: string | null;
  created_at: string;
  source_user?: { full_name: string | null } | null;
}

const TYPE_LABELS: Record<EarningRow["commission_type"], string> = {
  joining_bonus: "Joining Bonus",
  profit_share: "Profit Share",
  custom_bonus: "Custom Bonus",
};

export default function EarningsBreakdownTable({ records }: { records: EarningRow[] }) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Earnings Breakdown</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-3 font-medium">From</th>
              <th className="pb-3 font-medium">Position</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Rate</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Period</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const isCustom = r.commission_type === "custom_bonus";
              return (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">
                    {isCustom ? "N/A" : r.source_user?.full_name ? maskName(r.source_user.full_name) : "N/A"}
                  </td>
                  <td className="py-3 text-text-primary/90">
                    {isCustom ? (
                      <span className="text-text-muted">N/A</span>
                    ) : (
                      <>
                        Position {r.position} <span className="text-text-muted">({r.chain_depth}-layer chain)</span>
                      </>
                    )}
                  </td>
                  <td className="py-3">
                    <span className="badge-neutral">{TYPE_LABELS[r.commission_type]}</span>
                  </td>
                  <td className="py-3 text-text-primary/90">
                    {isCustom
                      ? "N/A"
                      : r.commission_type === "profit_share"
                      ? `${r.rate_at_time}%`
                      : formatCurrency(r.bonus_amount_at_time ?? 0)}
                  </td>
                  <td className="py-3 text-text-primary/90">{formatCurrency(r.commission_earned)}</td>
                  <td className="py-3 text-text-primary/90">
                    {isCustom ? (r.custom_reason ?? "N/A") : (r.settlement_period ?? "N/A")}
                  </td>
                  <td className="py-3 text-text-primary/90">{formatDate(r.created_at)}</td>
                  <td className="py-3">
                    <span className={r.status === "paid" ? "badge-success" : "badge-warning"}>{slugifyStatus(r.status)}</span>
                  </td>
                </tr>
              );
            })}
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-text-muted">
                  No earnings yet. Refer investors to start earning across up to 5 levels.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
