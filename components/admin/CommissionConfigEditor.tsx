"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { CommissionConfigRow } from "@/types";

interface PositionDraft {
  chain_depth: number;
  position: number;
  joining_bonus_amount: number;
  joining_bonus_enabled: boolean;
  profit_share_percent: number;
  profit_share_enabled: boolean;
}

const CHAIN_DEPTHS = [1, 2, 3, 4, 5];

function buildInitialDrafts(currentConfig: CommissionConfigRow[]): PositionDraft[] {
  const drafts: PositionDraft[] = [];
  for (const depth of CHAIN_DEPTHS) {
    for (let position = 1; position <= depth; position++) {
      const existing = currentConfig.find((c) => c.chain_depth === depth && c.position === position);
      drafts.push({
        chain_depth: depth,
        position,
        joining_bonus_amount: existing?.joining_bonus_amount ?? 0,
        joining_bonus_enabled: existing?.joining_bonus_enabled ?? true,
        profit_share_percent: existing?.profit_share_percent ?? 0,
        profit_share_enabled: existing?.profit_share_enabled ?? true,
      });
    }
  }
  return drafts;
}

function positionLabel(position: number): string {
  if (position === 1) return "Nearest";
  const suffixes: Record<number, string> = { 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
  return suffixes[position] ?? `${position}th`;
}

export default function CommissionConfigEditor({
  currentConfig,
  adminId,
}: {
  currentConfig: CommissionConfigRow[];
  adminId: string;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<PositionDraft[]>(() => buildInitialDrafts(currentConfig));
  const [saving, setSaving] = useState(false);

  const updateDraft = (
    depth: number,
    position: number,
    field: keyof Omit<PositionDraft, "chain_depth" | "position">,
    value: number | boolean
  ) => {
    setDrafts((prev) =>
      prev.map((d) => (d.chain_depth === depth && d.position === position ? { ...d, [field]: value } : d))
    );
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Insert new versioned rows for every (depth, position) pair -- never
      // update in place, per the historical-earnings-protection
      // requirement. Also log each changed field for the audit history view.
      for (const draft of drafts) {
        const existing = currentConfig.find(
          (c) => c.chain_depth === draft.chain_depth && c.position === draft.position
        );

        const { error } = await supabase.from("commission_config").insert({
          chain_depth: draft.chain_depth,
          position: draft.position,
          joining_bonus_amount: draft.joining_bonus_amount,
          joining_bonus_enabled: draft.joining_bonus_enabled,
          profit_share_percent: draft.profit_share_percent,
          profit_share_enabled: draft.profit_share_enabled,
          effective_from: now,
          created_by: adminId,
        });
        if (error) throw error;

        const auditEntries = [];
        if (existing?.joining_bonus_amount !== draft.joining_bonus_amount) {
          auditEntries.push({
            changed_by: adminId,
            chain_depth: draft.chain_depth,
            position: draft.position,
            field_changed: "joining_bonus_amount",
            old_value: String(existing?.joining_bonus_amount ?? "—"),
            new_value: String(draft.joining_bonus_amount),
          });
        }
        if (existing?.profit_share_percent !== draft.profit_share_percent) {
          auditEntries.push({
            changed_by: adminId,
            chain_depth: draft.chain_depth,
            position: draft.position,
            field_changed: "profit_share_percent",
            old_value: String(existing?.profit_share_percent ?? "—"),
            new_value: String(draft.profit_share_percent),
          });
        }
        if (auditEntries.length > 0) {
          await supabase.from("commission_config_audit").insert(auditEntries);
        }
      }

      logger.info("Commission config updated (new versioned rows inserted)", { adminId });
      toast.success("Commission config saved. Past earnings are unaffected.");
      router.refresh();
    } catch (err) {
      logger.error("Commission config save failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Referral & Earnings Configuration</h2>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <History className="h-3.5 w-3.5" /> Changes apply to future earnings only
        </span>
      </div>
      <p className="text-xs text-text-muted">
        Each chain depth (1 through 5 layers) has its own independent split. The table used for any
        given payout is whichever matches the ACTUAL number of people in that referral chain — a
        3-person chain always uses the 3-layer table below, never a partial slice of the 5-layer one.
      </p>

      {CHAIN_DEPTHS.map((depth) => {
        const rows = drafts.filter((d) => d.chain_depth === depth);
        const totalBonus = rows.reduce((sum, r) => sum + (r.joining_bonus_enabled ? r.joining_bonus_amount : 0), 0);
        const totalPct = rows.reduce((sum, r) => sum + (r.profit_share_enabled ? r.profit_share_percent : 0), 0);

        return (
          <div key={depth} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gold">
                {depth} Layer{depth > 1 ? "s" : ""}
              </h3>
              <span className="text-xs text-text-muted">
                Total: ${totalBonus.toFixed(2)} · {totalPct.toFixed(1)}%
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                    <th className="pb-2 font-medium">Position</th>
                    <th className="pb-2 font-medium">Joining Bonus ($)</th>
                    <th className="pb-2 font-medium">Enabled</th>
                    <th className="pb-2 font-medium">Profit Share (%)</th>
                    <th className="pb-2 font-medium">Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.position} className="border-b border-white/5 last:border-0">
                      <td className="py-2.5 font-medium text-text-primary">{positionLabel(r.position)}</td>
                      <td className="py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={r.joining_bonus_amount}
                          onChange={(e) => updateDraft(depth, r.position, "joining_bonus_amount", Number(e.target.value))}
                          className="input-field !w-24 !py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={r.joining_bonus_enabled}
                          onChange={(e) => updateDraft(depth, r.position, "joining_bonus_enabled", e.target.checked)}
                          className="rounded border-white/20 bg-white/5"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="number"
                          step="0.01"
                          value={r.profit_share_percent}
                          onChange={(e) => updateDraft(depth, r.position, "profit_share_percent", Number(e.target.value))}
                          className="input-field !w-24 !py-1.5 text-sm"
                        />
                      </td>
                      <td className="py-2.5">
                        <input
                          type="checkbox"
                          checked={r.profit_share_enabled}
                          onChange={(e) => updateDraft(depth, r.position, "profit_share_enabled", e.target.checked)}
                          className="rounded border-white/20 bg-white/5"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <button onClick={handleSaveAll} disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save All Tables"}
      </button>
    </div>
  );
}
