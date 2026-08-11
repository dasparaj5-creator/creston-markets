"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Info } from "lucide-react";

// Deterministic illustrative dataset — NOT live performance data.
const illustrativeData = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2026, i, 1).toLocaleString("en-US", { month: "short" }),
  value: 100 + Math.round(Math.sin(i / 2) * 6 + i * 1.4),
}));

export default function PerformancePlaceholder() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Illustrative Performance</h2>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gold">
            <Info className="h-4 w-4" /> Illustrative performance — live data connected post-launch
          </p>
        </div>

        <div className="glass-card p-6">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={illustrativeData}>
              <defs>
                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8 }}
                labelStyle={{ color: "#F9FAFB" }}
                formatter={() => ["Illustrative only", "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="url(#perfGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
