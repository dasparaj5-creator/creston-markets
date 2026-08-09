import { AlertTriangle, Cpu } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import ReconciliationForm from "@/components/admin/ReconciliationForm";

export default async function ReconciliationPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: users }, { data: log }] = await Promise.all([
    supabase.from("users").select("id, full_name, email").eq("role", "client"),
    supabase
      .from("portfolio_snapshots")
      .select("*, user:users!portfolio_snapshots_user_id_fkey(full_name, email)")
      .eq("source", "reconciliation")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Portfolio Reconciliation</h1>
      </div>

      <div className="glass-card flex items-start gap-3 border-gold/30 bg-gold/5 p-5">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-sm text-text-primary/90">
          <span className="font-semibold text-gold">CLIENT-VISIBLE</span> — Entries saved here are
          shown directly to the client as their account statement. Double-check figures before
          saving. This will be replaced by live MT5 data once connected, with no change to how it
          looks on the client&apos;s side.
        </p>
      </div>

      <ReconciliationForm users={users ?? []} adminId={admin.id} />

      {/* CSV bulk upload placeholder */}
      <div className="glass-card border-dashed border-white/20 p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-text-muted">CSV Bulk Upload</p>
        <p className="mt-2 text-sm text-text-muted">Bulk reconciliation upload — coming soon.</p>
      </div>

      {/* MT5 integration placeholder */}
      <div className="glass-card flex items-center gap-4 border-electric/20 p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-electric/10 text-electric">
          <Cpu className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text-primary">MT5 Integration</p>
          <p className="mt-0.5 text-xs text-text-muted">UI only, non-functional — Phase 2.</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Reconciliation Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Balance</th>
                <th className="pb-3 font-medium">Return %</th>
                <th className="pb-3 font-medium">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {(log ?? []).map((row: any) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">{row.user?.full_name || row.user?.email || "—"}</td>
                  <td className="py-3 text-text-primary/90">{formatCurrency(row.balance)}</td>
                  <td className="py-3 text-text-primary/90">{row.return_percent}%</td>
                  <td className="py-3 text-text-primary/90">{formatDateTime(row.created_at)}</td>
                </tr>
              ))}
              {(!log || log.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-text-muted">
                    No reconciliation entries yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
