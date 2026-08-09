import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import RiskBanner from "@/components/shared/RiskBanner";
import WithdrawForm from "@/components/dashboard/WithdrawForm";

export default async function WithdrawPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: snapshots }, { data: withdrawals }] = await Promise.all([
    supabase.from("portfolio_snapshots").select("*").eq("user_id", profile.id),
    supabase.from("withdrawals").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
  ]);

  const liveSnapshot = (snapshots ?? []).find((s) => s.source === "mt5_api");
  const availableBalance = liveSnapshot?.balance ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Withdraw</h1>
        <p className="mt-1 text-sm text-text-muted">Submit a withdrawal request.</p>
      </div>

      <RiskBanner variant="full" />

      <div className="glass-card flex items-center gap-4 p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Wallet className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs text-text-muted">Available Balance</p>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(availableBalance)}</p>
        </div>
      </div>

      <div className="glass-card border-gold/20 p-5">
        <p className="text-sm text-text-primary/90">
          Withdrawal requests will be processed once live trading operations commence.
        </p>
      </div>

      <WithdrawForm userId={profile.id} availableBalance={availableBalance} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Withdrawal History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-text-primary/90">{formatDate(w.created_at)}</td>
                    <td className="py-3 text-text-primary/90">{formatCurrency(w.amount)}</td>
                    <td className="py-3 text-text-primary/90">{w.payment_method}</td>
                    <td className="py-3">
                      <span
                        className={
                          w.status === "approved" ? "badge-success" : w.status === "rejected" ? "badge-danger" : "badge-warning"
                        }
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    No withdrawal requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
