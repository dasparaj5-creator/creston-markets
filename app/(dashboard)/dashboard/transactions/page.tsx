import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import TransactionTable from "@/components/dashboard/TransactionTable";

export default async function TransactionsPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const [{ data: deposits }, { data: withdrawals }, { data: bonuses }] = await Promise.all([
    supabase.from("deposits").select("*").eq("user_id", profile.id),
    supabase.from("withdrawals").select("*").eq("user_id", profile.id),
    supabase.from("referral_bonuses").select("*").eq("referrer_id", profile.id),
  ]);

  const rows = [
    ...(deposits ?? []).map((d) => ({
      id: d.id,
      type: "Deposit" as const,
      amount: Number(d.amount),
      status: d.status,
      date: d.created_at,
    })),
    ...(withdrawals ?? []).map((w) => ({
      id: w.id,
      type: "Withdrawal" as const,
      amount: Number(w.amount),
      status: w.status,
      date: w.created_at,
    })),
    ...(bonuses ?? []).map((b) => ({
      id: b.id,
      type: "Referral Bonus" as const,
      amount: Number(b.bonus_amount),
      status: b.status,
      date: b.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Transaction History</h1>
        <p className="mt-1 text-sm text-text-muted">Full ledger of your account activity.</p>
      </div>
      <TransactionTable rows={rows} />
    </div>
  );
}
