"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Info } from "lucide-react";
import type { PortfolioSnapshot } from "@/types";

/**
 * Renders portfolio performance. Per spec section 4, only snapshots with
 * source === 'mt5_api' may ever be shown here as live performance. In
 * Phase 1 no such rows exist (MT5 not connected), so this always falls
 * back to the clearly-labeled placeholder state — it does NOT render
 * 'reconciliation' data even if passed in by mistake.
 */
export default function PerformanceChart({ snapshots }: { snapshots: PortfolioSnapshot[] }) {
  const liveSnapshots = snapshots.filter((s) => s.source === "mt5_api");

  if (liveSnapshots.length === 0) {
    const placeholderData = Array.from({ length: 8 }, (_, i) => ({
      label: `W${i + 1}`,
      value: 0,
    }));

    return (
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-gold" />
          <p className="text-sm font-medium text-text-primary">PAMM Performance Data — Updated periodically</p>
        </div>
        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={placeholderData}>
              <defs>
                <linearGradient id="dashPerfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B7280" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6B7280" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip content={() => null} />
              <Area type="monotone" dataKey="value" stroke="#6B7280" strokeWidth={1.5} fill="url(#dashPerfGradient)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="max-w-xs rounded-lg border border-white/10 bg-navy/90 px-4 py-2 text-center text-xs text-text-muted">
              Live data will display once PAMM connection is established
            </p>
          </div>
        </div>
      </div>
    );
  }

  const chartData = liveSnapshots
    .slice()
    .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime())
    .map((s) => ({ label: s.snapshot_date, value: s.balance }));

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Info className="h-4 w-4 text-success" />
        <p className="text-sm font-medium text-text-primary">PAMM Performance Data — Live (MT5)</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="livePerfGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: "#111827", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8 }}
            labelStyle={{ color: "#F9FAFB" }}
          />
          <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="url(#livePerfGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
