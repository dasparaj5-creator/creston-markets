import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import PlanCard from "@/components/admin/PlanCard";

export default async function AdminPlansPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const { data: plans } = await supabase.from("plans").select("*").order("min_deposit");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Plans Management</h1>
        <p className="mt-1 text-sm text-text-muted">View and toggle plan availability.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {(plans ?? []).map((p) => (
          <PlanCard key={p.id} plan={p} adminId={admin.id} />
        ))}
      </div>
    </div>
  );
}
