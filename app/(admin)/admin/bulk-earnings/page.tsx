import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import BulkEarningsForm from "@/components/admin/BulkEarningsForm";

export const dynamic = "force-dynamic";

export default async function AdminBulkEarningsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: allClients }, { data: groups }, { data: memberships }] = await Promise.all([
    supabase.from("users").select("id, full_name, email").eq("role", "client").order("full_name"),
    supabase.from("client_groups").select("id, name").order("name"),
    supabase.from("client_group_members").select("group_id, user_id"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Bulk Earnings Update</h1>
        <p className="mt-1 text-sm text-text-muted">
          Apply a return update to many clients at once, either everyone, a specific group, or a
          hand-picked set of accounts. Supports backdating for corrections to a past date.
        </p>
      </div>

      <BulkEarningsForm
        allClients={allClients ?? []}
        groups={groups ?? []}
        memberships={memberships ?? []}
        adminId={admin.id}
      />
    </div>
  );
}
