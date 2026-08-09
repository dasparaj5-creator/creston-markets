import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import ApprovalsTabs from "@/components/admin/ApprovalsTabs";

export default async function AdminApprovalsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: deposits }, { data: withdrawals }] = await Promise.all([
    supabase
      .from("deposits")
      .select("*, user:users!deposits_user_id_fkey(full_name, email), deposit_proofs(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("withdrawals")
      .select("*, user:users!withdrawals_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Deposit & Withdrawal Approvals</h1>
        <p className="mt-1 text-sm text-text-muted">
          Approving a client&apos;s first deposit starts their 30-day referral maturity clock, if referred.
        </p>
      </div>
      <ApprovalsTabs deposits={(deposits as any) ?? []} withdrawals={(withdrawals as any) ?? []} adminId={admin.id} />
    </div>
  );
}
