import { DollarSign, Users, Gift, TrendingUp, Network } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatCurrency, maskName } from "@/lib/utils";
import KpiCard from "@/components/dashboard/KpiCard";

// Clients should see their own commission/network data live, not a
// cached snapshot -- especially right after a referral triggers a new
// payout, which should be reflected immediately.
export const dynamic = "force-dynamic";
import EarningsBreakdownTable from "@/components/dashboard/EarningsBreakdownTable";

interface DownlineNode {
  id: string;
  full_name: string | null;
  email: string;
  position: number; // this client's position relative to this downline member
}

/**
 * Walks the current user's downline (people they referred, people those
 * people referred, etc.) up to 5 positions deep, so we can show the client
 * exactly which position (Nearest / 2nd / 3rd / 4th / 5th) they'd earn at
 * for any given person in their network -- answering "what category do I
 * fall into" directly rather than only after a commission has already
 * been recorded.
 */
async function getDownlineWithPositions(supabase: any, rootUserId: string): Promise<DownlineNode[]> {
  const results: DownlineNode[] = [];
  let currentLevel = [rootUserId];
  let position = 1;

  while (currentLevel.length > 0 && position <= 5) {
    const { data: nextLevel } = await supabase
      .from("users")
      .select("id, full_name, email, referred_by")
      .in("referred_by", currentLevel);

    if (!nextLevel || nextLevel.length === 0) break;

    for (const u of nextLevel) {
      results.push({ id: u.id, full_name: u.full_name, email: u.email, position });
    }

    currentLevel = nextLevel.map((u: any) => u.id);
    position += 1;
  }

  return results;
}

export default async function EarningsPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: records }, downline] = await Promise.all([
    supabase
      .from("commission_records")
      .select("*, source_user:users!commission_records_source_user_id_fkey(full_name)")
      .eq("beneficiary_id", profile.id)
      .order("created_at", { ascending: false }),
    getDownlineWithPositions(supabase, profile.id),
  ]);

  const allRecords = records ?? [];
  const totalEarned = allRecords.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.commission_earned), 0);
  const totalPending = allRecords.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.commission_earned), 0);
  const joiningBonusTotal = allRecords
    .filter((r) => r.commission_type === "joining_bonus")
    .reduce((s, r) => s + Number(r.commission_earned), 0);
  const profitShareTotal = allRecords
    .filter((r) => r.commission_type === "profit_share")
    .reduce((s, r) => s + Number(r.commission_earned), 0);

  // Group actual earnings by position for the summary strip.
  const positionTotals = [1, 2, 3, 4, 5].map((position) => ({
    position,
    total: allRecords.filter((r) => r.position === position).reduce((s, r) => s + Number(r.commission_earned), 0),
    count: allRecords.filter((r) => r.position === position).length,
  }));

  const positionLabel = (p: number) => (p === 1 ? "Nearest" : `${p}${["", "st", "nd", "rd"][p] ?? "th"}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">My Earnings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Joining bonuses and profit share across your referral network, up to 5 positions deep.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard icon={DollarSign} label="Total Paid" value={formatCurrency(totalEarned)} />
        <KpiCard icon={Gift} label="Total Pending" value={formatCurrency(totalPending)} />
        <KpiCard icon={Users} label="Joining Bonuses" value={formatCurrency(joiningBonusTotal)} />
        <KpiCard icon={TrendingUp} label="Profit Share" value={formatCurrency(profitShareTotal)} />
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Earnings by Position</h2>
        <div className="grid grid-cols-5 gap-3">
          {positionTotals.map((pt) => (
            <div key={pt.position} className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
              <p className="text-xs text-text-muted">{positionLabel(pt.position)}</p>
              <p className="mt-1 font-semibold text-gold">{formatCurrency(pt.total)}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">{pt.count} record{pt.count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Network className="h-4 w-4 text-gold" /> Your Network
        </h2>
        <p className="mb-4 text-xs text-text-muted">
          The position shown is where you sit relative to that person, this is exactly what
          determines your share whenever they trigger a joining bonus or profit share event.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-2 font-medium">Person</th>
                <th className="pb-2 font-medium">Your Position</th>
              </tr>
            </thead>
            <tbody>
              {downline.map((d) => (
                <tr key={d.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 text-text-primary/90">{d.full_name ? maskName(d.full_name) : d.email}</td>
                  <td className="py-2.5">
                    <span className="badge-neutral">{positionLabel(d.position)}</span>
                  </td>
                </tr>
              ))}
              {downline.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-text-muted">
                    No one in your network yet, share your referral link to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EarningsBreakdownTable records={allRecords as any} />
    </div>
  );
}
