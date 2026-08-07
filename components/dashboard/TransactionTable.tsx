"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

type TxRow = {
  id: string;
  type: "Deposit" | "Withdrawal" | "Referral Bonus";
  amount: number;
  status: string;
  date: string;
};

const filters = ["All", "Deposits", "Withdrawals", "Referral Bonuses"] as const;

export default function TransactionTable({ rows }: { rows: TxRow[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return rows;
    if (filter === "Deposits") return rows.filter((r) => r.type === "Deposit");
    if (filter === "Withdrawals") return rows.filter((r) => r.type === "Withdrawal");
    return rows.filter((r) => r.type === "Referral Bonus");
  }, [rows, filter]);

  const handleExport = () => {
    const header = "Type,Amount,Status,Date\n";
    const body = filtered
      .map((r) => `${r.type},${r.amount},${r.status},${r.date}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "creston-markets-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-gold text-navy" : "bg-white/5 text-text-muted hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={handleExport} className="btn-secondary !py-1.5 !px-3 text-xs">
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">{r.type}</td>
                  <td className="py-3 text-text-primary/90">{formatCurrency(r.amount)}</td>
                  <td className="py-3">
                    <span
                      className={
                        r.status === "approved" || r.status === "paid"
                          ? "badge-success"
                          : r.status === "rejected"
                          ? "badge-danger"
                          : "badge-warning"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-text-primary/90">{formatDate(r.date)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted">
                  No transactions found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
