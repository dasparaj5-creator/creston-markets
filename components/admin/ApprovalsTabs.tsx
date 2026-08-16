"use client";

import { useState } from "react";
import { Copy, ImageIcon } from "lucide-react";
import { formatCurrency, formatDateTime, slugifyStatus } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import ApprovalActions from "@/components/admin/ApprovalActions";

interface DepositProofRow {
  id: string;
  network: string;
  transaction_hash: string;
  screenshot_path: string | null;
}
interface DepositRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  is_plan_upgrade?: boolean;
  upgrade_from_plan_id?: string | null;
  user?: { full_name: string | null; email: string } | null;
  deposit_proofs?: DepositProofRow[];
}
interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  user?: { full_name: string | null; email: string } | null;
}

function DepositProofCell({ proofs }: { proofs?: DepositProofRow[] }) {
  const proof = proofs?.[0];
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);

  if (!proof) return <span className="text-xs text-text-muted">No proof submitted</span>;

  const handleViewScreenshot = async () => {
    if (!proof.screenshot_path) return;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("deposit-proofs")
      .createSignedUrl(proof.screenshot_path, 300);
    if (data?.signedUrl) {
      setScreenshotUrl(data.signedUrl);
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center gap-1.5">
        <span className="badge-neutral">{proof.network}</span>
        <button
          onClick={() => navigator.clipboard.writeText(proof.transaction_hash)}
          className="flex items-center gap-1 text-text-muted hover:text-gold"
          title="Copy transaction hash"
        >
          <span className="max-w-[120px] truncate">{proof.transaction_hash}</span>
          <Copy className="h-3 w-3 shrink-0" />
        </button>
      </div>
      {proof.screenshot_path && (
        <button onClick={handleViewScreenshot} className="flex items-center gap-1 text-electric hover:underline">
          <ImageIcon className="h-3 w-3" /> View screenshot
        </button>
      )}
    </div>
  );
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
                <th className="pb-3 font-medium">Proof</th>
                <th className="pb-3 font-medium">Requested</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">
                    {d.user?.full_name || d.user?.email}
                    {d.is_plan_upgrade && (
                      <span className="ml-2 rounded-full bg-electric/10 px-2 py-0.5 text-[10px] font-medium text-electric">
                        Plan Upgrade
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-text-primary/90">{formatCurrency(d.amount)}</td>
                  <td className="py-3"><DepositProofCell proofs={d.deposit_proofs} /></td>
                  <td className="py-3 text-text-primary/90">{formatDateTime(d.created_at)}</td>
                  <td className="py-3">
                    <span
                      className={
                        d.status === "approved" ? "badge-success" : d.status === "rejected" ? "badge-danger" : "badge-warning"
                      }
                    >
                      {slugifyStatus(d.status)}
                    </span>
                  </td>
                  <td className="py-3">
                    {d.status === "pending" && <ApprovalActions table="deposits" id={d.id} adminId={adminId} />}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-text-muted">No deposit requests.</td>
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
                      {slugifyStatus(w.status)}
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
