import { Wallet, TrendingUp, Layers, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import { getReferralDisplayStatus } from "@/lib/referral";
import Link from "next/link";

export default async function DashboardHomePage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: plan }, { data: snapshots }, { data: recentTx }, { data: referrals }, { data: announcements }] =
    await Promise.all([
      profile.plan_id
        ? supabase.from("plans").select("*").eq("id", profile.plan_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("portfolio_snapshots").select("*").eq("user_id", profile.id),
      supabase
        .from("deposits")
        .select("id, amount, status, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("referral_bonuses").select("*").eq("referrer_id", profile.id),
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`target.eq.all,target_user_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const sortedSnapshots = (snapshots ?? [])
    .slice()
    .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime());
  const latestSnapshot = sortedSnapshots[0];
  const portfolioValue = latestSnapshot?.balance ?? 0;
  const totalReturn = latestSnapshot?.return_percent ?? 0;

  const bonusEarned = (referrals ?? [])
    .filter((r) => getReferralDisplayStatus(r) === "paid")
    .reduce((sum, r) => sum + Number(r.bonus_amount), 0);

  return (
    <div className="space-y-6">
      <AnnouncementBanner announcements={announcements ?? []} />

      <div>
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Here&apos;s an overview of your account.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Wallet} label="Portfolio Value" value={formatCurrency(portfolioValue)} />
        <KpiCard
          icon={TrendingUp}
          label="Total Return"
          value={`${totalReturn.toFixed(2)}%`}
          trend={latestSnapshot ? undefined : "No statement yet"}
        />
        <KpiCard icon={Layers} label="Plan Status" value={plan?.name ?? "No Plan Selected"} />
        <KpiCard icon={Gift} label="Referral Bonus Earned" value={formatCurrency(bonusEarned)} />
      </div>

      <PerformanceChart snapshots={snapshots ?? []} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Recent Transactions</h2>
          {recentTx && recentTx.length > 0 ? (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm text-text-primary">{formatCurrency(tx.amount)}</p>
                    <p className="text-xs text-text-muted">{formatDate(tx.created_at)}</p>
                  </div>
                  <span
                    className={
                      tx.status === "approved" ? "badge-success" : tx.status === "rejected" ? "badge-danger" : "badge-warning"
                    }
                  >
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-text-muted">No transactions yet.</p>
          )}
          <Link href="/dashboard/transactions" className="mt-4 block text-center text-xs text-gold hover:underline">
            View all transactions →
          </Link>
        </div>

        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Referral Quick Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-text-primary">{referrals?.length ?? 0}</p>
              <p className="mt-1 text-xs text-text-muted">Referred Users</p>
            </div>
            <div>
              <p className="text-xl font-bold text-success">{formatCurrency(bonusEarned)}</p>
              <p className="mt-1 text-xs text-text-muted">Bonus Earned</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gold">
                {formatCurrency(
                  (referrals ?? [])
                    .filter((r) => getReferralDisplayStatus(r) !== "paid")
                    .reduce((sum, r) => sum + Number(r.bonus_amount), 0)
                )}
              </p>
              <p className="mt-1 text-xs text-text-muted">Bonus Pending</p>
            </div>
          </div>
          <Link href="/dashboard/referral" className="mt-4 block text-center text-xs text-gold hover:underline">
            View referral program →
          </Link>
        </div>
      </div>
    </div>
  );
}
