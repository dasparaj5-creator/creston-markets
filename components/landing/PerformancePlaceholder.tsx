"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Info } from "lucide-react";

// Deterministic illustrative dataset -- NOT live performance data.
// Daily returns from Aug 1, 2026 through today, each day's individual
// return randomized (via a fixed seed, not Math.random(), so this
// renders identically on every page load/refresh rather than showing a
// different chart to every visitor) within a 1.5%-2.2% band, compounded
// daily starting from a base index of 100.
function seededRandom(seed: number): number {
  // Simple deterministic pseudo-random generator (mulberry32) -- same
  // seed always produces the same sequence, unlike Math.random().
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function buildIllustrativeData() {
  const start = new Date(2026, 7, 1); // August 1, 2026
  const today = new Date();
  const data: { date: string; value: number }[] = [];

  let value = 100;
  let dayIndex = 0;
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    // Daily return between 1.5% and 2.2%, deterministically varied per
    // day so the chart shows real-looking day-to-day variation rather
    // than a perfectly straight line, while staying within the
    // requested range every single day.
    const dailyReturnPct = 1.5 + seededRandom(dayIndex) * 0.7;
    value = value * (1 + dailyReturnPct / 100);
    data.push({
      date: new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(value * 100) / 100,
    });
    dayIndex++;
  }
  return data;
}

const illustrativeData = buildIllustrativeData();

export default function PerformancePlaceholder() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Illustrative Performance</h2>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-gold">
            <Info className="h-4 w-4" /> Illustrative performance, live data connected post-launch
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
              <XAxis dataKey="date" stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
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
