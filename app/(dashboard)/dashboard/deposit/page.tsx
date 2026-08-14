import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import RiskBanner from "@/components/shared/RiskBanner";
import CryptoDepositForm from "@/components/dashboard/CryptoDepositForm";
import PlanUpgradeForm from "@/components/dashboard/PlanUpgradeForm";

export default async function DepositPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: plans }, { data: deposits }, { data: addresses }] = await Promise.all([
    supabase.from("plans").select("*").eq("is_active", true).order("min_deposit"),
    supabase.from("deposits").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("crypto_deposit_addresses").select("*").eq("is_active", true),
  ]);

  const currentPlan = plans?.find((p) => p.id === profile.plan_id);
  const higherPlans = currentPlan ? (plans ?? []).filter((p) => p.min_deposit > currentPlan.min_deposit) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Deposit</h1>
        <p className="mt-1 text-sm text-text-muted">Fund your account via USDT (ERC20 / TRC20 / BEP20).</p>
      </div>

      <RiskBanner variant="compact" />

      <div className="glass-card flex items-start gap-3 border-gold/20 p-5">
        <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-sm text-text-primary/90">
          Select a network, send USDT to the address shown, then submit your transaction hash
          (and optionally a screenshot) below. Our team verifies deposits manually, typically
          within 6–8 hours.
        </p>
      </div>

      {currentPlan && higherPlans.length > 0 && (
        <PlanUpgradeForm userId={profile.id} currentPlan={currentPlan} higherPlans={higherPlans} addresses={addresses ?? []} />
      )}

      <CryptoDepositForm addresses={addresses ?? []} plans={plans ?? []} userId={profile.id} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Deposit History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {deposits && deposits.length > 0 ? (
                deposits.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-text-primary/90">{formatDateTime(d.created_at)}</td>
                    <td className="py-3 text-text-primary/90">{formatCurrency(d.amount)}</td>
                    <td className="py-3">
                      <span
                        className={
                          d.status === "approved" ? "badge-success" : d.status === "rejected" ? "badge-danger" : "badge-warning"
                        }
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-text-muted">
                    No deposits yet.
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
