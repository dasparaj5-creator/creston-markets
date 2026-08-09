import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReferralConfig, getReferralDisplayStatus, daysUntilEligible } from "@/lib/referral";
import ReferralConfigEditor from "@/components/admin/ReferralConfigEditor";
import PayBonusButton from "@/components/admin/PayBonusButton";

const statusBadge: Record<string, string> = {
  eligible: "badge-success",
  paid: "badge-success",
  pending_maturity: "badge-warning",
};

export default async function AdminReferralsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();
  const config = await getReferralConfig();

  const { data: bonuses } = await supabase
    .from("referral_bonuses")
    .select(
      "*, referrer:users!referral_bonuses_referrer_id_fkey(full_name, email), referred:users!referral_bonuses_referred_user_id_fkey(full_name, email)"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Referral Bonus Management</h1>
        <p className="mt-1 text-sm text-text-muted">Single-tier flat bonuses. Review and process payouts.</p>
      </div>

      <ReferralConfigEditor config={config} adminId={admin.id} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">All Referrals</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">Referrer</th>
                <th className="pb-3 font-medium">Referred User</th>
                <th className="pb-3 font-medium">Join Date</th>
                <th className="pb-3 font-medium">Maturity Date</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {(bonuses ?? []).map((b: any) => {
                const displayStatus = getReferralDisplayStatus(b);
                return (
                  <tr key={b.id} className="border-b border-white/5 last:border-0">
                    <td className="py-3 text-text-primary/90">{b.referrer?.full_name || b.referrer?.email}</td>
                    <td className="py-3 text-text-primary/90">{b.referred?.full_name || b.referred?.email}</td>
                    <td className="py-3 text-text-primary/90">{formatDate(b.created_at)}</td>
                    <td className="py-3 text-text-primary/90">{formatDate(b.eligible_after)}</td>
                    <td className="py-3 text-text-primary/90">{formatCurrency(b.bonus_amount)}</td>
                    <td className="py-3">
                      <span className={statusBadge[displayStatus]}>
                        {displayStatus === "pending_maturity"
                          ? `${daysUntilEligible(b.eligible_after)}d left`
                          : displayStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      {displayStatus === "eligible" && <PayBonusButton bonusId={b.id} adminId={admin.id} />}
                    </td>
                  </tr>
                );
              })}
              {(!bonuses || bonuses.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted">
                    No referral bonuses recorded yet.
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
