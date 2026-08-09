"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { CommissionConfigRow } from "@/types";

interface LevelDraft {
  level: number;
  joining_bonus_amount: number;
  joining_bonus_enabled: boolean;
  profit_share_percent: number;
  profit_share_enabled: boolean;
}

export default function CommissionConfigEditor({
  currentConfig,
  adminId,
}: {
  currentConfig: CommissionConfigRow[];
  adminId: string;
}) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<LevelDraft[]>(() =>
    [1, 2, 3, 4, 5].map((level) => {
      const existing = currentConfig.find((c) => c.level === level);
      return {
        level,
        joining_bonus_amount: existing?.joining_bonus_amount ?? 0,
        joining_bonus_enabled: existing?.joining_bonus_enabled ?? true,
        profit_share_percent: existing?.profit_share_percent ?? 0,
        profit_share_enabled: existing?.profit_share_enabled ?? true,
      };
    })
  );
  const [saving, setSaving] = useState(false);

  const updateDraft = (level: number, field: keyof LevelDraft, value: number | boolean) => {
    setDrafts((prev) => prev.map((d) => (d.level === level ? { ...d, [field]: value } : d)));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      // Insert new versioned rows for every level -- never update in place,
      // per the historical-earnings-protection requirement. Also log each
      // changed field to commission_config_audit for the human-readable
      // change history view.
      for (const draft of drafts) {
        const existing = currentConfig.find((c) => c.level === draft.level);

        const { error } = await supabase.from("commission_config").insert({
          level: draft.level,
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
            level: draft.level,
            field_changed: "joining_bonus_amount",
            old_value: String(existing?.joining_bonus_amount ?? "—"),
            new_value: String(draft.joining_bonus_amount),
          });
        }
        if (existing?.profit_share_percent !== draft.profit_share_percent) {
          auditEntries.push({
            changed_by: adminId,
            level: draft.level,
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

  const totalJoiningBonus = drafts.reduce((sum, d) => sum + (d.joining_bonus_enabled ? d.joining_bonus_amount : 0), 0);

  return (
    <div className="glass-card space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">5-Level Commission Configuration</h2>
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <History className="h-3.5 w-3.5" /> Changes apply to future earnings only
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-2 font-medium">Level</th>
              <th className="pb-2 font-medium">Joining Bonus ($)</th>
              <th className="pb-2 font-medium">Enabled</th>
              <th className="pb-2 font-medium">Profit Share (%)</th>
              <th className="pb-2 font-medium">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((d) => (
              <tr key={d.level} className="border-b border-white/5 last:border-0">
                <td className="py-2.5 font-medium text-text-primary">L{d.level}</td>
                <td className="py-2.5">
                  <input
                    type="number"
                    step="0.01"
                    value={d.joining_bonus_amount}
                    onChange={(e) => updateDraft(d.level, "joining_bonus_amount", Number(e.target.value))}
                    className="input-field !w-24 !py-1.5 text-sm"
                  />
                </td>
                <td className="py-2.5">
                  <input
                    type="checkbox"
                    checked={d.joining_bonus_enabled}
                    onChange={(e) => updateDraft(d.level, "joining_bonus_enabled", e.target.checked)}
                    className="rounded border-white/20 bg-white/5"
                  />
                </td>
                <td className="py-2.5">
                  <input
                    type="number"
                    step="0.01"
                    value={d.profit_share_percent}
                    onChange={(e) => updateDraft(d.level, "profit_share_percent", Number(e.target.value))}
                    className="input-field !w-24 !py-1.5 text-sm"
                  />
                </td>
                <td className="py-2.5">
                  <input
                    type="checkbox"
                    checked={d.profit_share_enabled}
                    onChange={(e) => updateDraft(d.level, "profit_share_enabled", e.target.checked)}
                    className="rounded border-white/20 bg-white/5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted">
        Total joining bonus pool (enabled levels): <span className="text-gold">${totalJoiningBonus.toFixed(2)}</span>
      </p>

      <button onClick={handleSaveAll} disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  );
}
