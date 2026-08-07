import { CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import RiskBanner from "@/components/shared/RiskBanner";
import DepositInterestForm from "@/components/dashboard/DepositInterestForm";

export default async function DepositPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: plans }, { data: deposits }] = await Promise.all([
    supabase.from("plans").select("*").eq("is_active", true).order("min_deposit"),
    supabase.from("deposits").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Deposit</h1>
        <p className="mt-1 text-sm text-text-muted">Register your interest to fund your account.</p>
      </div>

      <RiskBanner variant="full" />

      <div className="glass-card flex items-start gap-3 border-gold/20 p-5">
        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-sm text-text-primary/90">
          Deposit functionality will be enabled once our live trading infrastructure is confirmed.
          Register your interest below and our team will follow up with next steps.
        </p>
      </div>

      <DepositInterestForm plans={plans ?? []} userId={profile.id} />

      {/* Payment shell placeholder */}
      <div className="glass-card border-dashed border-white/20 p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-text-muted">Payment Gateway</p>
        <p className="mt-2 text-sm text-text-muted">
          This area will host the client&apos;s 3D-secure payment gateway once integrated in Phase 2.
        </p>
      </div>

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
                    <td className="py-3 text-text-primary/90">{formatDate(d.created_at)}</td>
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
                    No deposit interest registered yet.
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
