"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import { maskName } from "@/lib/utils";

interface EarningRow {
  id: string;
  level: number;
  commission_type: "joining_bonus" | "profit_share";
  rate_at_time: number | null;
  bonus_amount_at_time: number | null;
  commission_earned: number;
  status: "pending" | "paid";
  settlement_period: string | null;
  created_at: string;
  source_user?: { full_name: string | null } | null;
}

export default function EarningsBreakdownTable({ records }: { records: EarningRow[] }) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Earnings Breakdown</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-3 font-medium">From</th>
              <th className="pb-3 font-medium">Level</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Rate</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Period</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 text-text-primary/90">
                  {r.source_user?.full_name ? maskName(r.source_user.full_name) : "—"}
                </td>
                <td className="py-3 text-text-primary/90">L{r.level}</td>
                <td className="py-3">
                  <span className="badge-neutral">
                    {r.commission_type === "joining_bonus" ? "Joining Bonus" : "Profit Share"}
                  </span>
                </td>
                <td className="py-3 text-text-primary/90">
                  {r.commission_type === "profit_share" ? `${r.rate_at_time}%` : formatCurrency(r.bonus_amount_at_time ?? 0)}
                </td>
                <td className="py-3 text-text-primary/90">{formatCurrency(r.commission_earned)}</td>
                <td className="py-3 text-text-primary/90">{r.settlement_period ?? "—"}</td>
                <td className="py-3 text-text-primary/90">{formatDate(r.created_at)}</td>
                <td className="py-3">
                  <span className={r.status === "paid" ? "badge-success" : "badge-warning"}>{r.status}</span>
                </td>
              </tr>
            ))}
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
