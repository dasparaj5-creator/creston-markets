"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";

interface LiteUser {
  id: string;
  full_name: string | null;
  email: string;
}

interface Context {
  deposits: number;
  prevBalance: number | null;
  prevDate: string | null;
  sameDateCount: number;
}

type Mode = "earnings" | "correction";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Simplified replacement for ReconciliationForm.
 *
 * The old form asked for five separate numbers (balance, return %, and
 * three P&L fields) with no relationship enforced between them, and its
 * zod schema used z.coerce.number() on every one -- which turns an empty
 * input into 0 rather than failing validation. On 2026-08-22 that
 * produced four snapshots with a correct return_percent and a balance of
 * 0, taking four live clients' dashboards to $0 until the rows were
 * removed by hand.
 *
 * This version asks for ONE number, derives the rest, shows the
 * resulting balance before saving, and refuses to save the shapes that
 * caused the incident.
 */
export default function SimpleReconciliationForm({
  users,
  adminId,
}: {
  users: LiteUser[];
  adminId: string;
}) {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("earnings");
  const [userId, setUserId] = useState("");
  const [snapshotDate, setSnapshotDate] = useState(today());
  const [amount, setAmount] = useState("");
  const [isSettlement, setIsSettlement] = useState(false);
  const [settlementPeriod, setSettlementPeriod] = useState("");

  const [ctx, setCtx] = useState<Context | null>(null);
  const [loadingCtx, setLoadingCtx] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pull the client's real position as of the chosen date, so the admin
  // is entering against actual data rather than guessing.
  const loadContext = useCallback(async () => {
    if (!userId || !snapshotDate) {
      setCtx(null);
      return;
    }
    setLoadingCtx(true);
    try {
      const supabase = createClient();

      const [{ data: deps }, { data: prev }, { count: sameDate }] = await Promise.all([
        supabase
          .from("deposits")
          .select("amount, approved_at")
          .eq("user_id", userId)
          .eq("status", "approved"),
        supabase
          .from("portfolio_snapshots")
          .select("balance, snapshot_date")
          .eq("user_id", userId)
          .lt("snapshot_date", snapshotDate)
          .order("snapshot_date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("portfolio_snapshots")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("snapshot_date", snapshotDate),
      ]);

      const deposits = (deps ?? [])
        .filter((d: any) => !d.approved_at || d.approved_at.slice(0, 10) <= snapshotDate)
        .reduce((s: number, d: any) => s + Number(d.amount), 0);

      setCtx({
        deposits,
        prevBalance: prev ? Number(prev.balance) : null,
        prevDate: prev?.snapshot_date ?? null,
        sameDateCount: sameDate ?? 0,
      });
    } catch (err) {
      logger.error("Failed to load reconciliation context", { err });
      setCtx(null);
    } finally {
      setLoadingCtx(false);
    }
  }, [userId, snapshotDate]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const parsed = amount.trim() === "" ? null : Number(amount);
  const amountValid = parsed !== null && Number.isFinite(parsed);

  const prevBalance = ctx?.prevBalance ?? null;
  const newBalance =
    !amountValid
      ? null
      : mode === "correction"
      ? parsed
      : (prevBalance ?? 0) + parsed;
  const gain =
    newBalance === null ? null : newBalance - (prevBalance ?? 0);

  // The specific failure that caused the incident: adding a percentage
  // gain on top of a balance that is missing or zero. The gain lands on
  // nothing and the client's balance collapses to just the gain.
  const noBaseline = ctx !== null && (prevBalance === null || prevBalance === 0);
  const blockedNoBaseline = mode === "earnings" && noBaseline;

  const belowDeposits =
    newBalance !== null && ctx !== null && newBalance < ctx.deposits;

  const periodPct =
    gain !== null && ctx && ctx.deposits > 0 ? (gain / ctx.deposits) * 100 : null;
  const cumulativePct =
    newBalance !== null && ctx && ctx.deposits > 0
      ? ((newBalance - ctx.deposits) / ctx.deposits) * 100
      : null;

  const canSave =
    !!userId &&
    !!snapshotDate &&
    amountValid &&
    !blockedNoBaseline &&
    newBalance !== null &&
    newBalance >= 0 &&
    !saving &&
    (!isSettlement || settlementPeriod.trim().length > 0);

  const handleSave = async () => {
    if (!canSave || newBalance === null || gain === null) return;

    const label = users.find((u) => u.id === userId);
    const name = label?.full_name || label?.email || "this client";

    const warnings: string[] = [];
    if (ctx && ctx.sameDateCount > 0) {
      warnings.push(
        `${name} already has ${ctx.sameDateCount} entr${
          ctx.sameDateCount === 1 ? "y" : "ies"
        } dated ${snapshotDate}. Saving again will add another.`
      );
    }
    if (belowDeposits) {
      warnings.push(
        `The new balance ${formatCurrency(newBalance)} is below their deposits of ${formatCurrency(
          ctx!.deposits
        )}, so this records a loss.`
      );
    }
    if (isSettlement) {
      warnings.push("This is a settlement: it pays profit share to their upline and cannot be undone by deleting the entry.");
    }

    const summary = `Set ${name}'s balance to ${formatCurrency(newBalance)} on ${snapshotDate}${
      gain !== 0 ? ` (${gain > 0 ? "+" : ""}${formatCurrency(gain)})` : ""
    }.`;

    if (!confirm([summary, ...warnings].join("\n\n"))) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("portfolio_snapshots").insert({
        user_id: userId,
        snapshot_date: snapshotDate,
        balance: Number(newBalance.toFixed(2)),
        pnl_total: Number(gain.toFixed(2)),
        pnl_today: Number(gain.toFixed(2)),
        pnl_this_month: Number(gain.toFixed(2)),
        return_percent: periodPct === null ? 0 : Number(periodPct.toFixed(4)),
        source: "reconciliation",
        is_settlement: isSettlement,
        settlement_period: isSettlement ? settlementPeriod.trim() : null,
        updated_by: adminId,
      });
      if (error) throw error;

      logger.info("Reconciliation entry saved", {
        userId,
        adminId,
        mode,
        snapshotDate,
        balance: newBalance,
        gain,
        isSettlement,
      });

      toast.success(
        isSettlement
          ? `Settlement saved. Balance ${formatCurrency(newBalance)}, profit share calculated.`
          : `Saved. Balance ${formatCurrency(newBalance)}.`
      );

      setAmount("");
      setIsSettlement(false);
      setSettlementPeriod("");
      await loadContext();
      router.refresh();
    } catch (err) {
      logger.error("Reconciliation entry failed", { err });
      toast.error("Could not save the entry. Nothing was changed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card space-y-5 p-6">
      <h2 className="text-sm font-semibold text-text-primary">New entry</h2>

      {/* Client + date */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Client</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field"
          >
            <option value="">Select a client…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">
            Date this applies to
          </label>
          <input
            type="date"
            value={snapshotDate}
            max={today()}
            onChange={(e) => setSnapshotDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Where the client stands right now */}
      {userId && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {loadingCtx ? (
            <p className="text-xs text-text-muted">Loading their current position…</p>
          ) : ctx ? (
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-text-muted">Deposits</p>
                <p className="text-text-primary">{formatCurrency(ctx.deposits)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">
                  Balance{ctx.prevDate ? ` on ${ctx.prevDate}` : ""}
                </p>
                <p className="text-text-primary">
                  {ctx.prevBalance === null ? "None yet" : formatCurrency(ctx.prevBalance)}
                </p>
              </div>
              {ctx.sameDateCount > 0 && (
                <div>
                  <p className="text-xs text-text-muted">Already entered for this date</p>
                  <p className="text-gold">{ctx.sameDateCount}</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Mode */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">What are you entering</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("earnings")}
            className={mode === "earnings" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          >
            Earnings for the period
          </button>
          <button
            type="button"
            onClick={() => setMode("correction")}
            className={mode === "correction" ? "btn-primary text-xs" : "btn-secondary text-xs"}
          >
            Correct the balance
          </button>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {mode === "earnings"
            ? "Enter what they earned. Their balance goes up by that amount."
            : "Enter what their balance should be. Use this to fix a wrong entry or set a starting balance."}
        </p>
      </div>

      {/* The single number */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">
          {mode === "earnings" ? "Earnings amount" : "Correct balance"}
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={mode === "earnings" ? "e.g. 28.00" : "e.g. 2448.13"}
          className="input-field"
        />
        {amount.trim() !== "" && !amountValid && (
          <p className="mt-1 text-xs text-danger">Enter a number.</p>
        )}
      </div>

      {/* Guard: the exact shape that caused the 22 Aug incident */}
      {blockedNoBaseline && (
        <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div className="text-xs text-text-primary/90">
            <p className="font-medium text-danger">No starting balance to add to</p>
            <p className="mt-1">
              This client has no balance before {snapshotDate}, so earnings would be added to zero
              and their balance would drop to just this amount. Switch to{" "}
              <button
                type="button"
                onClick={() => setMode("correction")}
                className="text-gold underline"
              >
                Correct the balance
              </button>{" "}
              and set their starting balance first.
            </p>
          </div>
        </div>
      )}

      {/* Preview */}
      {newBalance !== null && !blockedNoBaseline && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center gap-3 text-lg">
            <span className="text-text-muted">
              {prevBalance === null ? "—" : formatCurrency(prevBalance)}
            </span>
            <ArrowRight className="h-4 w-4 text-text-muted" />
            <span className="font-semibold text-text-primary">{formatCurrency(newBalance)}</span>
            {gain !== null && gain !== 0 && (
              <span className={gain > 0 ? "text-sm text-success" : "text-sm text-danger"}>
                {gain > 0 ? "+" : ""}
                {formatCurrency(gain)}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-muted">
            {periodPct !== null && <span>This period: {periodPct.toFixed(2)}%</span>}
            {cumulativePct !== null && <span>Total return: {cumulativePct.toFixed(2)}%</span>}
          </div>
          <p className="mt-3 text-xs text-text-muted">
            This is what the client will see as their balance.
          </p>
          {belowDeposits && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Below their deposits of {formatCurrency(ctx!.deposits)}, so this records a loss.
            </p>
          )}
        </div>
      )}

      {/* Settlement */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSettlement}
            onChange={(e) => setIsSettlement(e.target.checked)}
            className="mt-0.5 rounded border-white/20 bg-white/5"
          />
          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-gold">
              <TrendingUp className="h-4 w-4" /> Pay profit share on this entry
            </span>
            <p className="mt-1 text-xs text-text-muted">
              Only tick this when closing a commission period. It pays the client&apos;s upline and
              cannot be undone by deleting the entry. Leave it off for routine weekly updates.
            </p>
          </div>
        </label>
        {isSettlement && (
          <input
            value={settlementPeriod}
            onChange={(e) => setSettlementPeriod(e.target.value)}
            placeholder="Which period is this closing? e.g. August 2026"
            className="input-field mt-3"
          />
        )}
      </div>

      <button onClick={handleSave} disabled={!canSave} className="btn-primary">
        <Save className="h-4 w-4" />
        {saving
          ? "Saving…"
          : newBalance !== null && !blockedNoBaseline
          ? `Save — balance becomes ${formatCurrency(newBalance)}`
          : "Save entry"}
      </button>
    </div>
  );
}
