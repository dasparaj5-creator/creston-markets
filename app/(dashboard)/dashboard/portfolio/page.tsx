import { Cpu, Wallet, TrendingUp, ArrowUpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import RiskBanner from "@/components/shared/RiskBanner";
import Link from "next/link";

export default async function PortfolioPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: snapshots }, { data: plan }, { data: plans }] = await Promise.all([
    supabase.from("portfolio_snapshots").select("*").eq("user_id", profile.id),
    profile.plan_id
      ? supabase.from("plans").select("*").eq("id", profile.plan_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("plans").select("*").eq("is_active", true).order("min_deposit"),
  ]);

  const liveSnapshot = (snapshots ?? []).find((s) => s.source === "mt5_api");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Portfolio</h1>
        <p className="mt-1 text-sm text-text-muted">Track your account value and performance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Wallet} label="Portfolio Value" value={formatCurrency(liveSnapshot?.balance ?? 0)} />
        <KpiCard icon={TrendingUp} label="Total Return" value={`${(liveSnapshot?.return_percent ?? 0).toFixed(2)}%`} />
        <KpiCard icon={ArrowUpCircle} label="Current Plan" value={plan?.name ?? "None"} />
      </div>

      <PerformanceChart snapshots={snapshots ?? []} />
      <RiskBanner variant="compact" />

      {/* Phase 1 placeholder notice */}
      <div className="glass-card p-6">
        <p className="text-sm text-text-primary/90">
          Live PAMM performance data will sync automatically once MT5 connection is active. Current
          figures are for demonstration purposes.
        </p>
      </div>

      {/* MT5 Integration status card */}
      <div className="glass-card flex items-center gap-4 border-electric/20 p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric/10 text-electric">
          <Cpu className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">MT5 Integration Status</p>
          <p className="mt-0.5 text-xs text-text-muted">Coming in Phase 2 — not yet connected.</p>
        </div>
      </div>

      {/* Monthly statements table */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Statements</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">Period</th>
                <th className="pb-3 font-medium">Balance</th>
                <th className="pb-3 font-medium">Return</th>
                <th className="pb-3 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {snapshots && snapshots.length > 0 ? (
                snapshots
                  .filter((s) => s.source === "mt5_api")
                  .map((s) => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 text-text-primary/90">{formatDate(s.snapshot_date)}</td>
                      <td className="py-3 text-text-primary/90">{formatCurrency(s.balance)}</td>
                      <td className="py-3 text-text-primary/90">{s.return_percent.toFixed(2)}%</td>
                      <td className="py-3"><span className="badge-success">Live</span></td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-text-muted">
                    No statements available yet. Statements will populate once live PAMM data is connected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan upgrade */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Plan</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(plans ?? []).map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-4 ${
                p.id === profile.plan_id ? "border-gold/40 bg-gold/5" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <p className="font-semibold text-text-primary">{p.name}</p>
              <p className="mt-1 text-sm text-text-muted">{formatCurrency(p.min_deposit)} min.</p>
              {p.id === profile.plan_id && <span className="badge-warning mt-2">Current Plan</span>}
            </div>
          ))}
        </div>
        <Link href="/dashboard/deposit" className="btn-secondary mt-4 inline-flex text-sm">
          Change Plan
        </Link>
      </div>
    </div>
  );
}
