import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";
import { Users, TrendingUp, Gift, Download } from "lucide-react";

export default async function AdminReportsPage() {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: users }, { data: deposits }, { data: bonuses }] = await Promise.all([
    supabase.from("users").select("created_at").eq("role", "client"),
    supabase.from("deposits").select("amount, status, created_at"),
    supabase.from("referral_bonuses").select("bonus_amount, status"),
  ]);

  const totalDepositVolume = (deposits ?? [])
    .filter((d) => d.status === "approved")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalBonusesPaid = (bonuses ?? [])
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + Number(b.bonus_amount), 0);

  // Group signups by month for a simple growth view
  const growthByMonth: Record<string, number> = {};
  (users ?? []).forEach((u) => {
    const key = new Date(u.created_at).toLocaleString("en-US", { month: "short", year: "numeric" });
    growthByMonth[key] = (growthByMonth[key] || 0) + 1;
  });

  const handleExportNote = "Export available via each section's CSV download.";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Reports</h1>
          <p className="mt-1 text-sm text-text-muted">User growth, deposit volume, and referral bonus reporting.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={Users} label="Total Registered Users" value={String(users?.length ?? 0)} />
        <KpiCard icon={TrendingUp} label="Approved Deposit Volume" value={formatCurrency(totalDepositVolume)} />
        <KpiCard icon={Gift} label="Referral Bonuses Paid" value={formatCurrency(totalBonusesPaid)} />
      </div>

      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">User Growth by Month</h2>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Download className="h-3.5 w-3.5" /> {handleExportNote}
          </span>
        </div>
        <div className="space-y-2">
          {Object.entries(growthByMonth).length > 0 ? (
            Object.entries(growthByMonth).map(([month, count]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="w-24 text-xs text-text-muted">{month}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.min(100, count * 20)}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-text-primary">{count}</span>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-text-muted">No signup data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
