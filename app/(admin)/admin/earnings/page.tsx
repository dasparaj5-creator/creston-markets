import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import CommissionConfigEditor from "@/components/admin/CommissionConfigEditor";
import CommissionConfigHistory from "@/components/admin/CommissionConfigHistory";
import CommissionRecordsTable from "@/components/admin/CommissionRecordsTable";

// Commission records change frequently (every approved deposit and
// settlement creates new ones) and admins need to see them immediately,
// not a cached snapshot -- same reasoning as the approvals page.
export const dynamic = "force-dynamic";

export default async function AdminEarningsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: allConfig }, { data: auditEntries }, { data: records }, { data: admins }] = await Promise.all([
    supabase.from("commission_config").select("*").order("effective_from", { ascending: false }),
    supabase.from("commission_config_audit").select("*").order("changed_at", { ascending: false }).limit(50),
    supabase
      .from("commission_records")
      .select(
        "*, beneficiary:users!commission_records_beneficiary_id_fkey(full_name, email), source_user:users!commission_records_source_user_id_fkey(full_name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("users").select("id, full_name, email").eq("role", "admin"),
  ]);

  const adminNames: Record<string, string> = {};
  (admins ?? []).forEach((a) => (adminNames[a.id] = a.full_name || a.email));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Referral & Earnings Management</h1>
        <p className="mt-1 text-sm text-text-muted">
          5-table (1 through 5 layers) joining bonus and profit share configuration. Changes only
          affect future earnings — all past commission records remain frozen at the rate active
          when they were calculated.
        </p>
      </div>

      <CommissionConfigEditor currentConfig={allConfig ?? []} adminId={admin.id} />
      <CommissionRecordsTable records={(records as any) ?? []} adminId={admin.id} />
      <CommissionConfigHistory entries={auditEntries ?? []} adminNames={adminNames} />
    </div>
  );
}
