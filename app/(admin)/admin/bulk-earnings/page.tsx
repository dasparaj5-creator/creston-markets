import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import WeeklyEarningsForm from "@/components/admin/WeeklyEarningsForm";

export const dynamic = "force-dynamic";

export default async function AdminBulkEarningsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const { data: allClients } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("role", "client")
    .order("full_name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Weekly Earnings Update</h1>
        <p className="mt-1 text-sm text-text-muted">
          Enter each client&apos;s earnings for the week, exactly as they appear in the
          statement. Balances update by the amount you enter. Leave a client blank to skip
          them.
        </p>
      </div>

      <WeeklyEarningsForm clients={allClients ?? []} adminId={admin.id} />
    </div>
  );
}
