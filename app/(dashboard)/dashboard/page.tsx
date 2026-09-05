import { Wallet, TrendingUp, Layers, Gift } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate, slugifyStatus } from "@/lib/utils";
import AnimatedKpiCard from "@/components/dashboard/AnimatedKpiCard";
import WelcomeHero from "@/components/dashboard/WelcomeHero";
import PlanProgressCard from "@/components/dashboard/PlanProgressCard";
import PortfolioBreakdown from "@/components/dashboard/PortfolioBreakdown";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
import Link from "next/link";

export default async function DashboardHomePage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [
    { data: plan },
    { data: allPlans },
    { data: snapshots },
    { data: recentTx },
    { data: approvedDeposits },
    { data: commissions },
    { data: announcements },
    { count: directReferralCount },
  ] = await Promise.all([
      profile.plan_id
        ? supabase.from("plans").select("*").eq("id", profile.plan_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from("plans").select("*").eq("is_active", true).order("min_deposit"),
      supabase.from("portfolio_snapshots").select("*").eq("user_id", profile.id),
      supabase
        .from("deposits")
        .select("id, amount, status, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5),
      // Every approved deposit, used as the cost basis for Total Return.
      // Separate from recentTx above, which is capped at 5 rows and
      // includes pending/rejected deposits for the activity list.
      supabase
        .from("deposits")
        .select("amount")
        .eq("user_id", profile.id)
        .eq("status", "approved"),
      // Pulls from commission_records (the real, current 5-layer engine),
      // not the legacy referral_bonuses table -- this widget previously
      // showed stale numbers from the old single-tier system, unrelated
      // to a client's actual current earnings, which is why clicking
      // through to My Earnings always showed a different, correct
      // number. Fixed to match.
      supabase.from("commission_records").select("commission_earned, status").eq("beneficiary_id", profile.id),
      supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .or(`target.eq.all,target_user_id.eq.${profile.id}`)
        .order("created_at", { ascending: false })
        .limit(3),
      // "Referred Users" is a count of actual PEOPLE this client
      // directly referred, not a count of commission records (which
      // would overcount, since one downline member's activity can
      // generate multiple commission records across different chain
      // depths/positions over time).
      supabase.from("users").select("id", { count: "exact", head: true }).eq("referred_by", profile.id),
    ]);

  const sortedSnapshots = (snapshots ?? [])
    .slice()
    .sort((a, b) => {
      // REAL BUG FIX: sorting by snapshot_date alone breaks when two
      // entries share the same calendar date -- which genuinely happens,
      // since a client's first-deposit approval auto-creates a same-day
      // snapshot, and admin frequently enters a reconciliation update for
      // that same day afterward. With no tiebreaker, the wrong entry
      // (e.g. the auto-created $0 one) could be treated as "latest"
      // depending on insertion order, silently showing stale/zeroed data.
      // created_at as a tiebreaker ensures the ACTUAL most recently
      // entered row always wins when dates tie.
      const dateDiff = new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  const latestSnapshot = sortedSnapshots[0];
  const accountBalance = latestSnapshot?.balance ?? 0;

  // Total Return is cumulative: how much the client's balance has grown
  // against everything they put in. It is NOT return_percent from the
  // latest snapshot -- that column holds the rate for a SINGLE period
  // (one weekly reconciliation entry), so showing it here labelled
  // "Total Return" understated every client's actual return and got
  // further from the truth with each weekly entry added. Deriving it
  // from balance vs deposits also fixes historical rows for free,
  // rather than needing a backfill.
  const totalDeposits = (approvedDeposits ?? []).reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );
  const totalReturn =
    totalDeposits > 0 ? ((accountBalance - totalDeposits) / totalDeposits) * 100 : 0;

  // Portfolio Value is a genuine combined total, not just the reconciled
  // account balance alone -- per an explicit product decision, a client's
  // headline number should reflect everything they actually have: their
  // trading account balance (which itself already reflects deposits +
  // performance, since that's what Reconciliation entries represent) PLUS
  // any referral/bonus earnings that have actually been paid out. Earnings
  // still marked "pending" are deliberately excluded from this total --
  // only money that's actually been confirmed/paid counts toward the
  // headline figure, matching how "Total Paid" already works on My
  // Earnings elsewhere in the app.
  const paidEarnings = (commissions ?? [])
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_earned), 0);
  const portfolioValue = accountBalance + paidEarnings;

  const bonusEarned = (commissions ?? [])
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.commission_earned), 0);
  const bonusPending = (commissions ?? [])
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.commission_earned), 0);

  return (
    <div className="space-y-6">
      <AnnouncementBanner announcements={announcements ?? []} />

      <WelcomeHero fullName={profile.full_name} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedKpiCard icon={<Wallet className="h-4 w-4" />} label="Portfolio Value" value={formatCurrency(portfolioValue)} index={0} accent />
        <AnimatedKpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Total Return"
          value={`${totalReturn.toFixed(2)}%`}
          trend={latestSnapshot ? undefined : "No statement yet"}
          index={1}
        />
        <AnimatedKpiCard icon={<Layers className="h-4 w-4" />} label="Plan Status" value={plan?.name ?? "No Plan Selected"} index={2} />
        <AnimatedKpiCard icon={<Gift className="h-4 w-4" />} label="Referral Bonus Earned" value={formatCurrency(bonusEarned)} index={3} />
      </div>

      <PortfolioBreakdown accountBalance={accountBalance} paidEarnings={paidEarnings} />

      <PerformanceChart snapshots={snapshots ?? []} />

      <PlanProgressCard currentPlan={plan} allPlans={allPlans ?? []} currentBalance={accountBalance} />

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
                    {slugifyStatus(tx.status)}
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
              <p className="text-xl font-bold text-text-primary">{directReferralCount ?? 0}</p>
              <p className="mt-1 text-xs text-text-muted">Referred Users</p>
            </div>
            <div>
              <p className="text-xl font-bold text-success">{formatCurrency(bonusEarned)}</p>
              <p className="mt-1 text-xs text-text-muted">Bonus Earned</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gold">{formatCurrency(bonusPending)}</p>
              <p className="mt-1 text-xs text-text-muted">Bonus Pending</p>
            </div>
          </div>
          <Link href="/dashboard/earnings" className="mt-4 block text-center text-xs text-gold hover:underline">
            View My Earnings →
          </Link>
        </div>
      </div>
    </div>
  );
}
