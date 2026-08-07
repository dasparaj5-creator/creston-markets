"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import ApprovalActions from "@/components/admin/ApprovalActions";

interface DepositRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  user?: { full_name: string | null; email: string } | null;
}
interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  user?: { full_name: string | null; email: string } | null;
}

export default function ApprovalsTabs({
  deposits,
  withdrawals,
  adminId,
}: {
  deposits: DepositRow[];
  withdrawals: WithdrawalRow[];
  adminId: string;
}) {
  const [tab, setTab] = useState<"deposits" | "withdrawals">("deposits");

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("deposits")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium ${
            tab === "deposits" ? "bg-gold text-navy" : "bg-white/5 text-text-muted"
          }`}
        >
          Deposits ({deposits.filter((d) => d.status === "pending").length} pending)
        </button>
        <button
          onClick={() => setTab("withdrawals")}
          className={`rounded-full px-4 py-1.5 text-xs font-medium ${
            tab === "withdrawals" ? "bg-gold text-navy" : "bg-white/5 text-text-muted"
          }`}
        >
          Withdrawals ({withdrawals.filter((w) => w.status === "pending").length} pending)
        </button>
      </div>

      {tab === "deposits" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Requested</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">{d.user?.full_name || d.user?.email}</td>
                  <td className="py-3 text-text-primary/90">{formatCurrency(d.amount)}</td>
                  <td className="py-3 text-text-primary/90">{formatDateTime(d.created_at)}</td>
                  <td className="py-3">
                    <span
                      className={
                        d.status === "approved" ? "badge-success" : d.status === "rejected" ? "badge-danger" : "badge-warning"
                      }
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {d.status === "pending" && <ApprovalActions table="deposits" id={d.id} adminId={adminId} />}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">No deposit requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Requested</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">{w.user?.full_name || w.user?.email}</td>
                  <td className="py-3 text-text-primary/90">{formatCurrency(w.amount)}</td>
                  <td className="py-3 text-text-primary/90">{w.payment_method}</td>
                  <td className="py-3 text-text-primary/90">{formatDateTime(w.created_at)}</td>
                  <td className="py-3">
                    <span
                      className={
                        w.status === "approved" ? "badge-success" : w.status === "rejected" ? "badge-danger" : "badge-warning"
                      }
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {w.status === "pending" && <ApprovalActions table="withdrawals" id={w.id} adminId={adminId} />}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">No withdrawal requests.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
