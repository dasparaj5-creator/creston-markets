"use client";

import { useEffect, useState } from "react";
import { getRecentLogs, type LogEntry } from "@/lib/logger";
import { Bug, X } from "lucide-react";

const levelColor: Record<LogEntry["level"], string> = {
  INFO: "text-success",
  WARN: "text-gold",
  ERROR: "text-danger",
  DEBUG: "text-electric",
};

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    setLogs(getRecentLogs());

    const onLog = (e: Event) => {
      const detail = (e as CustomEvent<LogEntry>).detail;
      setLogs((prev) => [...prev.slice(-19), detail]);
    };
    window.addEventListener("cm:log", onLog);

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("cm:log", onLog);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (process.env.NODE_ENV !== "development" || !open) {
    if (process.env.NODE_ENV !== "development") return null;
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] flex h-10 w-10 items-center justify-center rounded-full bg-slate-surface border border-gold/30 text-gold shadow-gold"
        title="Open debug panel (Ctrl+Shift+D)"
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex max-h-[420px] w-[380px] flex-col overflow-hidden rounded-xl border border-white/10 bg-navy/95 shadow-glass backdrop-blur-glass">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-gold">
          <Bug className="h-3.5 w-3.5" /> Debug Panel — last {logs.length} entries
        </span>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2 font-mono text-[11px]">
        {logs.length === 0 && <p className="p-2 text-text-muted">No log entries yet.</p>}
        {[...logs].reverse().map((log, i) => (
          <div key={i} className="rounded border border-white/5 bg-white/[0.02] p-2">
            <div className="flex items-center justify-between">
              <span className={`font-bold ${levelColor[log.level]}`}>{log.level}</span>
              <span className="text-text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="mt-1 text-text-primary/90">{log.message}</p>
            {log.context && Object.keys(log.context).length > 0 && (
              <pre className="mt-1 overflow-x-auto text-text-muted">
                {JSON.stringify(log.context, null, 1)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
