import { DollarSign, Users, Gift, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import EarningsBreakdownTable from "@/components/dashboard/EarningsBreakdownTable";

export default async function EarningsPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const { data: records } = await supabase
    .from("commission_records")
    .select("*, source_user:users!commission_records_source_user_id_fkey(full_name)")
    .eq("beneficiary_id", profile.id)
    .order("created_at", { ascending: false });

  const allRecords = records ?? [];
  const totalEarned = allRecords.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.commission_earned), 0);
  const totalPending = allRecords.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.commission_earned), 0);
  const joiningBonusTotal = allRecords
    .filter((r) => r.commission_type === "joining_bonus")
    .reduce((s, r) => s + Number(r.commission_earned), 0);
  const profitShareTotal = allRecords
    .filter((r) => r.commission_type === "profit_share")
    .reduce((s, r) => s + Number(r.commission_earned), 0);

  // Per-level summary
  const levelTotals = [1, 2, 3, 4, 5].map((level) => ({
    level,
    total: allRecords.filter((r) => r.level === level).reduce((s, r) => s + Number(r.commission_earned), 0),
    count: allRecords.filter((r) => r.level === level).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Earnings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Joining bonuses and profit share across your 5-level referral network.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={DollarSign} label="Total Paid" value={formatCurrency(totalEarned)} />
        <KpiCard icon={Gift} label="Total Pending" value={formatCurrency(totalPending)} />
        <KpiCard icon={Users} label="Joining Bonuses" value={formatCurrency(joiningBonusTotal)} />
        <KpiCard icon={TrendingUp} label="Profit Share" value={formatCurrency(profitShareTotal)} />
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Earnings by Level</h2>
        <div className="grid grid-cols-5 gap-3">
          {levelTotals.map((lt) => (
            <div key={lt.level} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
              <p className="text-xs text-text-muted">Level {lt.level}</p>
              <p className="mt-1 font-semibold text-gold">{formatCurrency(lt.total)}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">{lt.count} record{lt.count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      </div>

      <EarningsBreakdownTable records={allRecords as any} />
    </div>
  );
}
