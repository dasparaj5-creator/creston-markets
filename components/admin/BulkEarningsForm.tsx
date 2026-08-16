"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Users, UsersRound, CheckSquare, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface LiteUser {
  id: string;
  full_name: string | null;
  email: string;
}
interface Group {
  id: string;
  name: string;
}
interface Membership {
  group_id: string;
  user_id: string;
}

type SelectionMode = "all" | "group" | "manual";

const today = () => new Date().toISOString().slice(0, 10);

export default function BulkEarningsForm({
  allClients,
  groups,
  memberships,
  adminId,
}: {
  allClients: LiteUser[];
  groups: Group[];
  memberships: Membership[];
  adminId: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<SelectionMode>("all");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [manuallySelected, setManuallySelected] = useState<Set<string>>(new Set());

  const [snapshotDate, setSnapshotDate] = useState(today());
  const [returnPercent, setReturnPercent] = useState("");
  const [isSettlement, setIsSettlement] = useState(false);
  const [settlementPeriod, setSettlementPeriod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isBackdated = snapshotDate !== today();

  const targetClients = useMemo(() => {
    if (mode === "all") return allClients;
    if (mode === "group") {
      const memberIds = memberships.filter((m) => m.group_id === selectedGroupId).map((m) => m.user_id);
      return allClients.filter((c) => memberIds.includes(c.id));
    }
    return allClients.filter((c) => manuallySelected.has(c.id));
  }, [mode, allClients, memberships, selectedGroupId, manuallySelected]);

  const toggleManual = (id: string) => {
    setManuallySelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllManual = () => setManuallySelected(new Set(allClients.map((c) => c.id)));
  const clearManual = () => setManuallySelected(new Set());

  const handleApply = async () => {
    if (!returnPercent) {
      toast.error("Enter a return percentage to apply.");
      return;
    }
    if (isSettlement && !settlementPeriod.trim()) {
      toast.error("Enter a settlement period label.");
      return;
    }
    if (targetClients.length === 0) {
      toast.error("No clients selected.");
      return;
    }

    const scopeLabel =
      mode === "all"
        ? `ALL ${targetClients.length} clients`
        : mode === "group"
        ? `the selected group (${targetClients.length} member${targetClients.length !== 1 ? "s" : ""})`
        : `${targetClients.length} manually selected client${targetClients.length !== 1 ? "s" : ""}`;

    if (
      !confirm(
        `Apply a ${returnPercent}% return update to ${scopeLabel}${
          isBackdated ? `, backdated to ${snapshotDate}` : ""
        }${
          isSettlement ? ", as an OFFICIAL SETTLEMENT (this will trigger profit-share commissions for their upline)" : ""
        }? This cannot be bulk-undone.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let successCount = 0;
      let failCount = 0;

      // Applied sequentially, not in parallel -- see the note in
      // GroupManager.tsx's original bulk form for why: each settlement
      // insert triggers real commission-calculation logic server-side,
      // and running many of those concurrently against shared upline
      // records is safer done one at a time for something this
      // financially consequential.
      for (const client of targetClients) {
        // IMPORTANT: find the previous balance to calculate the % change
        // from by snapshot_date (the real-world date), not created_at
        // (insertion order) -- otherwise a backdated correction would
        // incorrectly calculate its % change against whatever was
        // entered most RECENTLY in wall-clock time, even if that entry
        // is chronologically AFTER the date being corrected. This
        // mirrors the same fix applied to the commission trigger itself
        // in migration_012.sql.
        const { data: previousSnapshot } = await supabase
          .from("portfolio_snapshots")
          .select("balance")
          .eq("user_id", client.id)
          .lt("snapshot_date", snapshotDate)
          .order("snapshot_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const previousBalance = previousSnapshot?.balance ?? 0;
        const pct = parseFloat(returnPercent);
        const newBalance = previousBalance * (1 + pct / 100);
        const pnl = newBalance - previousBalance;

        const { error } = await supabase.from("portfolio_snapshots").insert({
          user_id: client.id,
          snapshot_date: snapshotDate,
          balance: newBalance,
          return_percent: pct,
          pnl_total: pnl,
          pnl_today: pnl,
          pnl_this_month: pnl,
          is_settlement: isSettlement,
          settlement_period: isSettlement ? settlementPeriod.trim() : null,
          updated_by: adminId,
        });

        if (error) {
          failCount++;
          logger.error("Bulk earnings entry failed for one client", { userId: client.id, err: error });
        } else {
          successCount++;
        }
      }

      logger.info("Bulk earnings update applied", {
        adminId,
        mode,
        successCount,
        failCount,
        snapshotDate,
        backdated: isBackdated,
      });

      if (failCount === 0) {
        toast.success(`Applied to all ${successCount} client(s).`);
      } else {
        toast.error(`Applied to ${successCount}, failed for ${failCount}. Check individual accounts.`);
      }
      router.refresh();
    } catch (err) {
      logger.error("Bulk earnings update failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection mode */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Who To Update</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMode("all")}
            className={mode === "all" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          >
            <Users className="h-3.5 w-3.5" /> All Clients
          </button>
          <button
            onClick={() => setMode("group")}
            className={mode === "group" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          >
            <UsersRound className="h-3.5 w-3.5" /> By Group
          </button>
          <button
            onClick={() => setMode("manual")}
            className={mode === "manual" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          >
            <CheckSquare className="h-3.5 w-3.5" /> Select Individually
          </button>
        </div>

        {mode === "group" && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-text-muted">Group</label>
            <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} className="input-field">
              <option value="">Select a group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {groups.length === 0 && (
              <p className="mt-2 text-xs text-text-muted">
                No groups exist yet, create one under Client Groups first.
              </p>
            )}
          </div>
        )}

        {mode === "manual" && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-text-muted">
                {manuallySelected.size} of {allClients.length} selected
              </label>
              <div className="flex gap-2">
                <button onClick={selectAllManual} className="text-xs text-gold hover:underline">
                  Select all
                </button>
                <button onClick={clearManual} className="text-xs text-text-muted hover:underline">
                  Clear
                </button>
              </div>
            </div>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-white/10 p-2">
              {allClients.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary/90 hover:bg-white/[0.03]"
                >
                  <input type="checkbox" checked={manuallySelected.has(c.id)} onChange={() => toggleManual(c.id)} />
                  {c.full_name || c.email}
                </label>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-xs text-text-muted">
          Currently targeting <span className="text-text-primary">{targetClients.length}</span> client
          {targetClients.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* The actual update */}
      <div className="glass-card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-text-primary">The Update</h2>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Date This Entry Applies To</label>
          <input
            type="date"
            value={snapshotDate}
            max={today()}
            onChange={(e) => setSnapshotDate(e.target.value)}
            className="input-field"
          />
          {isBackdated && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Backdated entry for {snapshotDate}, not today. The % change is calculated against
              each client's balance as of the closest entry BEFORE this date, so this slots in
              correctly among their real history rather than being treated as "most recent."
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Return % to Apply</label>
          <input
            value={returnPercent}
            onChange={(e) => setReturnPercent(e.target.value)}
            type="number"
            step="0.01"
            placeholder="e.g. 4.5"
            className="input-field"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-text-muted">
          <input type="checkbox" checked={isSettlement} onChange={(e) => setIsSettlement(e.target.checked)} />
          Mark as official settlement (triggers profit-share commissions for upline)
        </label>

        {isSettlement && (
          <input
            value={settlementPeriod}
            onChange={(e) => setSettlementPeriod(e.target.value)}
            placeholder="Settlement period label (e.g. January 2026)"
            className="input-field"
          />
        )}

        <button onClick={handleApply} disabled={submitting || targetClients.length === 0} className="btn-primary">
          <Send className="h-4 w-4" />
          {submitting ? "Applying..." : `Apply to ${targetClients.length} Client${targetClients.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
