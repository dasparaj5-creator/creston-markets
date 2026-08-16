import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import ActivityLogTable from "@/components/admin/ActivityLogTable";

export const dynamic = "force-dynamic";

export default async function AdminActivityLogPage() {
  await requireAdmin();
  const supabase = createClient();

  const [{ data: entries }, { data: admins }] = await Promise.all([
    supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("users").select("id, full_name, email").eq("role", "admin"),
  ]);

  const adminNames: Record<string, string> = {};
  (admins ?? []).forEach((a) => (adminNames[a.id] = a.full_name || a.email));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Activity Log</h1>
        <p className="mt-1 text-sm text-text-muted">
          A complete record of every admin action, who took it, when, and from what device, showing the
          most recent 200 entries.
        </p>
      </div>

      <ActivityLogTable entries={entries ?? []} adminNames={adminNames} />
    </div>
  );
}
