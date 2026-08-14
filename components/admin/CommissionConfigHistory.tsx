import { formatDateTime } from "@/lib/utils";
import type { CommissionConfigAudit } from "@/types";

export default function CommissionConfigHistory({
  entries,
  adminNames,
}: {
  entries: CommissionConfigAudit[];
  adminNames: Record<string, string>;
}) {
  return (
    <div className="glass-card p-6">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">Config Change History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-2 font-medium">When</th>
              <th className="pb-2 font-medium">Who</th>
              <th className="pb-2 font-medium">Table</th>
              <th className="pb-2 font-medium">Position</th>
              <th className="pb-2 font-medium">Field</th>
              <th className="pb-2 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-white/5 last:border-0">
                <td className="py-2.5 text-text-primary/90">{formatDateTime(e.changed_at)}</td>
                <td className="py-2.5 text-text-primary/90">
                  {e.changed_by ? adminNames[e.changed_by] ?? "Unknown admin" : ","}
                </td>
                <td className="py-2.5 text-text-primary/90">{e.chain_depth}-layer</td>
                <td className="py-2.5 text-text-primary/90">Position {e.position}</td>
                <td className="py-2.5 text-text-primary/90">{e.field_changed}</td>
                <td className="py-2.5">
                  <span className="text-text-muted">{e.old_value}</span>
                  <span className="mx-1.5 text-text-muted">→</span>
                  <span className="text-gold">{e.new_value}</span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-muted">
                  No config changes recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
