import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import GroupManager from "@/components/admin/GroupManager";

export const dynamic = "force-dynamic";

export default async function AdminGroupsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: groups }, { data: allUsers }, { data: memberships }] = await Promise.all([
    supabase.from("client_groups").select("*").order("created_at", { ascending: false }),
    supabase.from("users").select("id, full_name, email, plan_id").eq("role", "client").order("full_name"),
    supabase.from("client_group_members").select("*"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Client Groups</h1>
        <p className="mt-1 text-sm text-text-muted">
          Group clients together for bulk reconciliation updates or group-specific commission rates.
        </p>
      </div>

      <GroupManager
        groups={groups ?? []}
        allUsers={allUsers ?? []}
        memberships={memberships ?? []}
        adminId={admin.id}
      />
    </div>
  );
}
