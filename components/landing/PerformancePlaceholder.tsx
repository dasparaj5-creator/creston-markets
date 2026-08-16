"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Info } from "lucide-react";

// Deterministic illustrative dataset -- NOT live performance data.
// Covers Aug 1, 2026 through today (the day before real launch), ending
// at exactly $100 so tomorrow's genuine live data continues naturally
// from that same starting point, and starting in the requested ~$97.8
// range. This means the TOTAL cumulative return across the whole
// window is roughly 1.5%-2.2% (matching the requested overall
// performance figure for this stretch), spread across each day with
// small, realistic day-to-day variation rather than a flat straight
// line -- not 1.5%-2.2% compounding EVERY SINGLE DAY, which would
// produce an unrealistically steep ~30%+ total gain over just 16 days.
function seededRandom(seed: number): number {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const LAUNCH_VALUE = 100; // tomorrow's (Aug 17) real starting point
const TOTAL_RETURN_PCT_MIN = 1.5; // overall cumulative return across the whole illustrative window
const TOTAL_RETURN_PCT_MAX = 2.2;

function buildIllustrativeData() {
  const start = new Date(2026, 7, 1); // August 1, 2026
  const today = new Date();

  const dayCount = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;

  // Pick one fixed total return within the requested range (deterministic,
  // not randomized per load), then distribute it across all the days with
  // small day-to-day variation so it doesn't look like a perfectly
  // straight line, while the CUMULATIVE effect still lands in range.
  const totalReturnPct = TOTAL_RETURN_PCT_MIN + seededRandom(9999) * (TOTAL_RETURN_PCT_MAX - TOTAL_RETURN_PCT_MIN);
  const avgDailyReturnPct = totalReturnPct / (dayCount - 1);

  // Each day's individual return wobbles around that average (small
  // variation, some days slightly up, some slightly down) rather than
  // being perfectly identical every day, while the whole series still
  // compounds to land on the fixed total return calculated above.
  const dailyReturns: number[] = [];
  for (let i = 0; i < dayCount; i++) {
    const wobble = (seededRandom(i) - 0.5) * (avgDailyReturnPct * 0.6); // +/-30% variation around the average
    dailyReturns.push(avgDailyReturnPct + wobble);
  }

  const values: number[] = new Array(dayCount);
  values[dayCount - 1] = LAUNCH_VALUE;
  for (let i = dayCount - 2; i >= 0; i--) {
    values[i] = values[i + 1] / (1 + dailyReturns[i + 1] / 100);
  }

  const data: { date: string; value: number }[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(values[i] * 100) / 100,
    });
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
            <Info className="h-4 w-4" /> Illustrative performance
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
