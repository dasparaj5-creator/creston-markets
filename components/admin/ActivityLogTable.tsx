"use client";

import { useState, useMemo } from "react";
import { Monitor, Smartphone, Search } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  before_value: unknown;
  after_value: unknown;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

/**
 * Very lightweight user-agent parsing -- enough to show "Chrome on
 * Windows" / "Safari on iPhone" style labels without pulling in a full
 * UA-parsing dependency for what's a nice-to-have display detail, not
 * something the log's integrity depends on.
 */
function parseUserAgent(ua: string | null): { device: string; icon: typeof Monitor } {
  if (!ua) return { device: "Unknown device", icon: Monitor };

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let os = "Unknown OS";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Unknown browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

  return { device: `${browser} on ${os}`, icon: isMobile ? Smartphone : Monitor };
}

export default function ActivityLogTable({
  entries,
  adminNames,
}: {
  entries: AuditLogEntry[];
  adminNames: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const actionTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.action));
    return ["all", ...Array.from(types).sort()];
  }, [entries]);

  const filtered = entries.filter((e) => {
    const matchesAction = actionFilter === "all" || e.action === actionFilter;
    const adminName = adminNames[e.admin_id] || "";
    const matchesSearch =
      !search ||
      adminName.toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.target_type.toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by admin, action, or target..."
            className="input-field pl-10"
          />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-field w-auto">
          {actionTypes.map((a) => (
            <option key={a} value={a}>
              {a === "all" ? "All actions" : a}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-3 font-medium">When</th>
              <th className="pb-3 font-medium">Admin</th>
              <th className="pb-3 font-medium">Action</th>
              <th className="pb-3 font-medium">Target</th>
              <th className="pb-3 font-medium">Device</th>
              <th className="pb-3 font-medium">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const { device, icon: DeviceIcon } = parseUserAgent(entry.user_agent);
              return (
                <tr key={entry.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 text-text-primary/90">{formatDateTime(entry.created_at)}</td>
                  <td className="py-2.5 text-text-primary/90">{adminNames[entry.admin_id] || "Unknown admin"}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-text-muted">
                    {entry.target_type}
                    {entry.target_id && <span className="ml-1 font-mono text-xs">#{entry.target_id.slice(0, 8)}</span>}
                  </td>
                  <td className="py-2.5 text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <DeviceIcon className="h-3.5 w-3.5" /> {device}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-xs text-text-muted">{entry.ip_address || "N/A"}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  No activity matches this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
