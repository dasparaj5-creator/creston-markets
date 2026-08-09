import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import UserManagementTable from "@/components/admin/UserManagementTable";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: users }, { data: plans }] = await Promise.all([
    supabase.from("users").select("*").eq("role", "client").order("created_at", { ascending: false }),
    supabase.from("plans").select("id, name"),
  ]);

  const planNames: Record<string, string> = {};
  (plans ?? []).forEach((p) => (planNames[p.id] = p.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
        <p className="mt-1 text-sm text-text-muted">
          Search, review, and manage client accounts and KYC verification.
        </p>
      </div>

      <div className="glass-card border-gold/20 p-4 text-xs text-text-muted">
        Note: manual balance reconciliation is handled separately under{" "}
        <span className="font-medium text-gold">Portfolio Reconciliation</span> — internal
        record-keeping only, never shown to clients as live performance.
      </div>

      <UserManagementTable users={users ?? []} planNames={planNames} adminId={admin.id} />
    </div>
  );
}
