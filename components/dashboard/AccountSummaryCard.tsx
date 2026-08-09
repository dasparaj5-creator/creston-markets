"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, FileText, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { computeAccountSummary, getPresetRange } from "@/lib/account-summary";
import { formatCurrency, formatDate } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { PortfolioSnapshot } from "@/types";

const presets = [
  { key: "week", label: "Last 7 Days" },
  { key: "month", label: "Last Month" },
  { key: "quarter", label: "Last Quarter" },
  { key: "ytd", label: "Year to Date" },
] as const;

export default function AccountSummaryCard({
  snapshots,
  clientName,
}: {
  snapshots: PortfolioSnapshot[];
  clientName: string;
}) {
  const [preset, setPreset] = useState<(typeof presets)[number]["key"] | "custom">("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { start, end } = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    if (preset === "custom") return { start: undefined, end: undefined };
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  const summary = useMemo(() => computeAccountSummary(snapshots, start, end), [snapshots, start, end]);

  const periodLabel =
    summary.periodStart && summary.periodEnd
      ? `${formatDate(summary.periodStart)} — ${formatDate(summary.periodEnd)}`
      : "No data in this range";

  const handleExportExcel = () => {
    try {
      const rows = summary.dailyChanges.map((d) => ({
        Date: formatDate(d.date),
        Balance: d.balance,
        "Change ($)": Number(d.changeAmount.toFixed(2)),
        "Change (%)": Number(d.changePercent.toFixed(2)),
      }));
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Account Summary");
      XLSX.writeFile(workbook, `creston-markets-statement-${summary.periodStart}-to-${summary.periodEnd}.xlsx`);
      logger.info("Account summary exported to Excel", { periodStart: summary.periodStart, periodEnd: summary.periodEnd });
    } catch (err) {
      logger.error("Excel export failed", { err });
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Creston Markets — Account Statement", 14, 18);
      doc.setFontSize(10);
      doc.text(`Client: ${clientName}`, 14, 26);
      doc.text(`Period: ${periodLabel}`, 14, 32);
      doc.text(`Starting Balance: ${formatCurrency(summary.startingBalance)}`, 14, 40);
      doc.text(`Ending Balance: ${formatCurrency(summary.endingBalance)}`, 14, 46);
      doc.text(
        `Net Change: ${formatCurrency(summary.netChangeAmount)} (${summary.netChangePercent.toFixed(2)}%)`,
        14,
        52
      );

      autoTable(doc, {
        startY: 60,
        head: [["Date", "Balance", "Change ($)", "Change (%)"]],
        body: summary.dailyChanges.map((d) => [
          formatDate(d.date),
          formatCurrency(d.balance),
          formatCurrency(d.changeAmount),
          `${d.changePercent.toFixed(2)}%`,
        ]),
        headStyles: { fillColor: [212, 175, 55] },
        styles: { fontSize: 9 },
      });

      doc.setFontSize(8);
      doc.text(
        "Trading involves risk. Past performance does not guarantee future results.",
        14,
        doc.internal.pageSize.height - 10
      );

      doc.save(`creston-markets-statement-${summary.periodStart}-to-${summary.periodEnd}.pdf`);
      logger.info("Account summary exported to PDF", { periodStart: summary.periodStart, periodEnd: summary.periodEnd });
    } catch (err) {
      logger.error("PDF export failed", { err });
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Account Summary</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={summary.dailyChanges.length === 0}
            title="Export as Excel"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-success hover:bg-white/10 disabled:opacity-40"
          >
            <FileSpreadsheet className="h-4 w-4" />
          </button>
          <button
            onClick={handleExportPdf}
            disabled={summary.dailyChanges.length === 0}
            title="Export as PDF"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-danger hover:bg-white/10 disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              preset === p.key ? "bg-gold text-navy" : "bg-white/5 text-text-muted hover:text-text-primary"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setPreset("custom")}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
            preset === "custom" ? "bg-gold text-navy" : "bg-white/5 text-text-muted hover:text-text-primary"
          }`}
        >
          <Calendar className="h-3 w-3" /> Custom
        </button>
      </div>

      {preset === "custom" && (
        <div className="mb-4 flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-[11px] text-text-muted">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="input-field !py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-text-muted">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="input-field !py-1.5 text-sm"
            />
          </div>
        </div>
      )}

      <p className="mb-4 text-xs text-text-muted">{periodLabel}</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-text-muted">Starting Balance</p>
          <p className="mt-1 font-semibold text-text-primary">{formatCurrency(summary.startingBalance)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Ending Balance</p>
          <p className="mt-1 font-semibold text-text-primary">{formatCurrency(summary.endingBalance)}</p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Net Change</p>
          <p className={`mt-1 font-semibold ${summary.netChangeAmount >= 0 ? "text-success" : "text-danger"}`}>
            {formatCurrency(summary.netChangeAmount)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-text-muted">Net Change %</p>
          <p className={`mt-1 font-semibold ${summary.netChangePercent >= 0 ? "text-success" : "text-danger"}`}>
            {summary.netChangePercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {summary.dailyChanges.length > 0 && (
        <div className="mt-6 max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-navy">
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Balance</th>
                <th className="pb-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {summary.dailyChanges.map((d) => (
                <tr key={d.date} className="border-b border-white/5 last:border-0">
                  <td className="py-2 text-text-primary/90">{formatDate(d.date)}</td>
                  <td className="py-2 text-text-primary/90">{formatCurrency(d.balance)}</td>
                  <td className={`py-2 ${d.changeAmount >= 0 ? "text-success" : "text-danger"}`}>
                    {d.changeAmount >= 0 ? "+" : ""}
                    {formatCurrency(d.changeAmount)} ({d.changePercent.toFixed(2)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
