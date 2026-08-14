import { Share2, UserCheck, Gift, Users, DollarSign, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, maskName } from "@/lib/utils";
import { getReferralConfig, getReferralDisplayStatus, daysUntilEligible } from "@/lib/referral";
import KpiCard from "@/components/dashboard/KpiCard";
import ReferralLinkCard from "@/components/dashboard/ReferralLinkCard";

const statusBadge: Record<string, string> = {
  eligible: "badge-success",
  paid: "badge-success",
  pending_maturity: "badge-warning",
};

const statusLabel: Record<string, string> = {
  eligible: "Eligible",
  paid: "Paid",
  pending_maturity: "Pending Maturity",
};

export default async function ReferralPage() {
  const profile = await requireUser();
  const supabase = createClient();
  const config = await getReferralConfig();

  const { data: bonuses } = await supabase
    .from("referral_bonuses")
    .select("*, referred:users!referral_bonuses_referred_user_id_fkey(full_name, created_at, is_active)")
    .eq("referrer_id", profile.id)
    .order("created_at", { ascending: false });

  const totalReferred = bonuses?.length ?? 0;
  const bonusEarned = (bonuses ?? [])
    .filter((b) => getReferralDisplayStatus(b) === "paid")
    .reduce((sum, b) => sum + Number(b.bonus_amount), 0);
  const bonusPending = (bonuses ?? [])
    .filter((b) => getReferralDisplayStatus(b) !== "paid")
    .reduce((sum, b) => sum + Number(b.bonus_amount), 0);
  const activeCount = (bonuses ?? []).filter((b) => getReferralDisplayStatus(b) !== "pending_maturity").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Referral Program</h1>
        <p className="mt-1 text-sm text-text-muted">
          Earn a flat {formatCurrency(config.bonus_amount, config.bonus_currency)} bonus for every investor you refer who stays
          active for {config.maturity_days} days.
        </p>
      </div>

      <ReferralLinkCard referralCode={profile.referral_code} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">How It Works</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-medium text-text-primary">1. Share Link</p>
              <p className="text-xs text-text-muted">Send your unique referral link to a friend.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-medium text-text-primary">2. Friend Registers & Invests</p>
              <p className="text-xs text-text-muted">They sign up and complete their first deposit.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-medium text-text-primary">3. Stay Active {config.maturity_days} Days</p>
              <p className="text-xs text-text-muted">
                You earn {formatCurrency(config.bonus_amount, config.bonus_currency)} once matured.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={Users} label="Total Referred" value={String(totalReferred)} />
        <KpiCard icon={Clock} label="Active (30 Days)" value={String(activeCount)} />
        <KpiCard icon={DollarSign} label="Bonus Earned" value={formatCurrency(bonusEarned)} />
        <KpiCard icon={Gift} label="Bonus Pending" value={formatCurrency(bonusPending)} />
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Referred Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Join Date</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Bonus</th>
              </tr>
            </thead>
            <tbody>
              {bonuses && bonuses.length > 0 ? (
                bonuses.map((b: any) => {
                  const displayStatus = getReferralDisplayStatus(b);
                  return (
                    <tr key={b.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-text-primary/90">
                        {b.referred?.full_name ? maskName(b.referred.full_name) : ","}
                      </td>
                      <td className="py-3 text-text-primary/90">{formatDate(b.created_at)}</td>
                      <td className="py-3">
                        <span className={statusBadge[displayStatus]}>
                          {displayStatus === "pending_maturity"
                            ? `Matures in ${daysUntilEligible(b.eligible_after)}d`
                            : statusLabel[displayStatus]}
                        </span>
                      </td>
                      <td className="py-3 text-text-primary/90">{formatCurrency(b.bonus_amount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    You haven&apos;t referred anyone yet. Share your link to get started.
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
