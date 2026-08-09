import type { PortfolioSnapshot } from "@/types";

export interface DailyChange {
  date: string;
  balance: number;
  changeAmount: number;
  changePercent: number;
}

export interface AccountSummary {
  periodStart: string | null;
  periodEnd: string | null;
  startingBalance: number;
  endingBalance: number;
  netChangeAmount: number;
  netChangePercent: number;
  dailyChanges: DailyChange[];
}

/**
 * Computes a client-facing account summary for a given date range from raw
 * portfolio_snapshots rows. Works identically whether the underlying data
 * came from admin reconciliation entries or a live MT5 feed -- the client
 * only ever sees the computed summary, never has to do the math themselves.
 */
export function computeAccountSummary(
  snapshots: PortfolioSnapshot[],
  rangeStart?: Date,
  rangeEnd?: Date
): AccountSummary {
  const filtered = snapshots
    .filter((s) => {
      const d = new Date(s.snapshot_date);
      if (rangeStart && d < rangeStart) return false;
      if (rangeEnd && d > rangeEnd) return false;
      return true;
    })
    .sort((a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime());

  if (filtered.length === 0) {
    return {
      periodStart: null,
      periodEnd: null,
      startingBalance: 0,
      endingBalance: 0,
      netChangeAmount: 0,
      netChangePercent: 0,
      dailyChanges: [],
    };
  }

  const startingBalance = filtered[0].balance;
  const endingBalance = filtered[filtered.length - 1].balance;
  const netChangeAmount = endingBalance - startingBalance;
  const netChangePercent = startingBalance !== 0 ? (netChangeAmount / startingBalance) * 100 : 0;

  const dailyChanges: DailyChange[] = filtered.map((s, i) => {
    const prevBalance = i === 0 ? startingBalance : filtered[i - 1].balance;
    const changeAmount = s.balance - prevBalance;
    const changePercent = prevBalance !== 0 ? (changeAmount / prevBalance) * 100 : 0;
    return {
      date: s.snapshot_date,
      balance: s.balance,
      changeAmount,
      changePercent,
    };
  });

  return {
    periodStart: filtered[0].snapshot_date,
    periodEnd: filtered[filtered.length - 1].snapshot_date,
    startingBalance,
    endingBalance,
    netChangeAmount,
    netChangePercent,
    dailyChanges,
  };
}

/** Common preset ranges for the statement export UI. */
export function getPresetRange(preset: "week" | "month" | "quarter" | "ytd"): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case "week":
      start.setDate(end.getDate() - 7);
      break;
    case "month":
      start.setMonth(end.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(end.getMonth() - 3);
      break;
    case "ytd":
      start.setMonth(0, 1);
      break;
  }

  return { start, end };
}
