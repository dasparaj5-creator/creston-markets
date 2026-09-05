"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, AlertTriangle, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/utils";

interface LiteUser {
  id: string;
  full_name: string | null;
  email: string;
}

interface RowState {
  deposits: number;
  prevBalance: number | null;
  prevDate: string | null;
  alreadyEntered: number;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Weekly earnings entry for the whole client book on one screen.
 *
 * Replaces the percentage-based BulkEarningsForm, which applied a single
 * rate to every selected client and compounded it on their running
 * balance. Two problems with that: the earnings figures actually come
 * from the trading account as per-client AMOUNTS that differ per client,
 * and compounding on balance silently diverges from simple interest on
 * deposits (~$530 on a $2,400 account over a year).
 *
 * This form takes the amounts as they appear in the weekly spreadsheet,
 * one row per client, and shows the resulting balance before saving.
 */
export default function WeeklyEarningsForm({
  clients,
  adminId,
}: {
  clients: LiteUser[];
  adminId: string;
}) {
  const router = useRouter();

  const [snapshotDate, setSnapshotDate] = useState(today());
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Everyone's position as of the chosen date, in three queries rather
  // than three per client.
  const loadRows = useCallback(async () => {
    if (!snapshotDate) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const ids = clients.map((c) => c.id);
      if (ids.length === 0) {
        setRows({});
        return;
      }

      const [{ data: deps }, { data: snaps }] = await Promise.all([
        supabase
          .from("deposits")
          .select("user_id, amount, approved_at")
          .in("user_id", ids)
          .eq("status", "approved"),
        supabase
          .from("portfolio_snapshots")
          .select("user_id, balance, snapshot_date, created_at")
          .in("user_id", ids),
      ]);

      const next: Record<string, RowState> = {};
      for (const c of clients) {
        const deposits = (deps ?? [])
          .filter(
            (d: any) =>
              d.user_id === c.id &&
              (!d.approved_at || d.approved_at.slice(0, 10) <= snapshotDate)
          )
          .reduce((s: number, d: any) => s + Number(d.amount), 0);

        const mine = (snaps ?? []).filter((s: any) => s.user_id === c.id);

        const prior = mine
          .filter((s: any) => s.snapshot_date < snapshotDate)
          .sort((a: any, b: any) => {
            const d =
              new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime();
            if (d !== 0) return d;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })[0];

        next[c.id] = {
          deposits,
          prevBalance: prior ? Number(prior.balance) : null,
          prevDate: prior?.snapshot_date ?? null,
          alreadyEntered: mine.filter((s: any) => s.snapshot_date === snapshotDate).length,
        };
      }
      setRows(next);
    } catch (err) {
      logger.error("Failed to load weekly earnings rows", { err });
      toast.error("Could not load client balances.");
    } finally {
      setLoading(false);
    }
  }, [clients, snapshotDate]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // A row is entered only if it has a usable amount AND a sane starting
  // point. Missing or zero prior balance is the shape that collapsed four
  // live clients to $0 on 22 Aug, so those rows are refused here.
  const prepared = useMemo(() => {
    return clients.map((c) => {
      const row = rows[c.id];
      const raw = (amounts[c.id] ?? "").trim();
      const value = raw === "" ? null : Number(raw);
      const valid = value !== null && Number.isFinite(value);

      const noBaseline =
        !!row && (row.prevBalance === null || row.prevBalance === 0);
      const duplicate = !!row && row.alreadyEntered > 0;
      const blocked = noBaseline || duplicate;

      const newBalance =
        valid && row && !blocked ? (row.prevBalance ?? 0) + (value as number) : null;
      const pct =
        newBalance !== null && row && row.deposits > 0
          ? ((value as number) / row.deposits) * 100
          : null;
      const cumulative =
        newBalance !== null && row && row.deposits > 0
          ? ((newBalance - row.deposits) / row.deposits) * 100
          : null;

      return {
        client: c,
        row,
        raw,
        value,
        valid,
        noBaseline,
        duplicate,
        blocked,
        newBalance,
        pct,
        cumulative,
        willSave: valid && !blocked && newBalance !== null,
      };
    });
  }, [clients, rows, amounts]);

  const toSave = prepared.filter((p) => p.willSave);
  const totalEarnings = toSave.reduce((s, p) => s + (p.value as number), 0);
  const blockedCount = prepared.filter((p) => p.blocked && p.raw !== "").length;

  const handleSave = async () => {
    if (toSave.length === 0) return;

    const lines = toSave
      .map(
        (p) =>
          `  ${p.client.full_name || p.client.email}: ${formatCurrency(
            p.value as number
          )} → ${formatCurrency(p.newBalance as number)}`
      )
      .join("\n");

    const msg = [
      `Save ${toSave.length} entr${toSave.length === 1 ? "y" : "ies"} dated ${snapshotDate}?`,
      lines,
      `Total earnings: ${formatCurrency(totalEarnings)}`,
      "No referral commission is paid by these entries.",
    ].join("\n\n");

    if (!confirm(msg)) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const payload = toSave.map((p) => ({
        user_id: p.client.id,
        snapshot_date: snapshotDate,
        balance: Number((p.newBalance as number).toFixed(2)),
        pnl_total: Number((p.value as number).toFixed(2)),
        pnl_today: Number((p.value as number).toFixed(2)),
        pnl_this_month: Number((p.value as number).toFixed(2)),
        return_percent: p.pct === null ? 0 : Number(p.pct.toFixed(4)),
        source: "reconciliation",
        is_settlement: false,
        settlement_period: null,
        updated_by: adminId,
      }));

      const { error } = await supabase.from("portfolio_snapshots").insert(payload);
      if (error) throw error;

      logger.info("Weekly earnings batch saved", {
        adminId,
        snapshotDate,
        count: payload.length,
        totalEarnings,
      });

      toast.success(`Saved ${payload.length} entries for ${snapshotDate}.`);
      setAmounts({});
      await loadRows();
      router.refresh();
    } catch (err) {
      logger.error("Weekly earnings batch failed", { err });
      toast.error("Could not save. Nothing was changed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Date */}
      <div className="glass-card flex flex-wrap items-end gap-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">
            Week ending
          </label>
          <input
            type="date"
            value={snapshotDate}
            max={today()}
            onChange={(e) => setSnapshotDate(e.target.value)}
            className="input-field"
          />
        </div>
        <button onClick={loadRows} disabled={loading} className="btn-secondary text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh balances
        </button>
        <p className="text-xs text-text-muted">
          Enter each client&apos;s earnings for this week. Leave a client blank to skip them.
        </p>
      </div>

      {/* Grid */}
      <div className="glass-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 text-right font-medium">Deposits</th>
              <th className="px-4 py-3 text-right font-medium">Current balance</th>
              <th className="px-4 py-3 text-right font-medium">Earnings</th>
              <th className="px-4 py-3 text-right font-medium">New balance</th>
              <th className="px-4 py-3 text-right font-medium">Total return</th>
            </tr>
          </thead>
          <tbody>
            {prepared.map((p) => (
              <tr key={p.client.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-text-primary">{p.client.full_name || "—"}</p>
                  <p className="text-xs text-text-muted">{p.client.email}</p>
                  {p.duplicate && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-gold">
                      <AlertTriangle className="h-3 w-3" />
                      Already entered for this date
                    </p>
                  )}
                  {p.noBaseline && !p.duplicate && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle className="h-3 w-3" />
                      No starting balance — fix in Reconciliation first
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-text-muted">
                  {p.row ? formatCurrency(p.row.deposits) : "—"}
                </td>
                <td className="px-4 py-3 text-right text-text-muted">
                  {p.row?.prevBalance === null || p.row === undefined
                    ? "None"
                    : formatCurrency(p.row.prevBalance)}
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    step="0.01"
                    disabled={p.blocked || loading}
                    value={p.raw}
                    onChange={(e) =>
                      setAmounts((a) => ({ ...a, [p.client.id]: e.target.value }))
                    }
                    placeholder="—"
                    className="input-field w-28 text-right disabled:opacity-40"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  {p.newBalance === null ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <span className="font-medium text-text-primary">
                      {formatCurrency(p.newBalance)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {p.cumulative === null ? (
                    <span className="text-text-muted">—</span>
                  ) : (
                    <span className={p.cumulative >= 0 ? "text-success" : "text-danger"}>
                      {p.cumulative.toFixed(2)}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary + save */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="text-sm">
          <p className="text-text-primary">
            {toSave.length} client{toSave.length === 1 ? "" : "s"} ready ·{" "}
            {formatCurrency(totalEarnings)} total earnings
          </p>
          {blockedCount > 0 && (
            <p className="mt-1 text-xs text-gold">
              {blockedCount} row{blockedCount === 1 ? "" : "s"} will be skipped.
            </p>
          )}
          <p className="mt-1 text-xs text-text-muted">
            These entries do not pay referral commission. Use Reconciliation to close a
            commission period.
          </p>
        </div>
        <button onClick={handleSave} disabled={toSave.length === 0 || saving} className="btn-primary">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : `Save ${toSave.length} entr${toSave.length === 1 ? "y" : "ies"}`}
        </button>
      </div>
    </div>
  );
}
