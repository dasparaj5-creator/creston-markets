import { Users, ShieldCheck, ArrowDownToLine, ArrowUpFromLine, Gift, LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { getReferralDisplayStatus } from "@/lib/referral";
import KpiCard from "@/components/dashboard/KpiCard";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { count: kycApproved },
    { count: pendingDeposits },
    { count: pendingWithdrawals },
    { data: referralBonuses },
    { count: openTickets },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("kyc_status", "approved"),
    supabase.from("deposits").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("withdrawals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("referral_bonuses").select("*"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase
      .from("users")
      .select("id, full_name, email, created_at")
      .eq("role", "client")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const bonusesDue = (referralBonuses ?? []).filter((b) => getReferralDisplayStatus(b) === "eligible").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Overview of platform activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={Users} label="Total Users" value={String(totalUsers ?? 0)} />
        <KpiCard icon={ShieldCheck} label="KYC Approved" value={String(kycApproved ?? 0)} />
        <KpiCard icon={ArrowDownToLine} label="Pending Deposits" value={String(pendingDeposits ?? 0)} />
        <KpiCard icon={ArrowUpFromLine} label="Pending Withdrawals" value={String(pendingWithdrawals ?? 0)} />
        <KpiCard icon={Gift} label="Referral Bonuses Due" value={String(bonusesDue)} />
        <KpiCard icon={LifeBuoy} label="Open Tickets" value={String(openTickets ?? 0)} />
      </div>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Email</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(recentUsers ?? []).map((u) => (
                <tr key={u.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 text-text-primary/90">{u.full_name || "—"}</td>
                  <td className="py-3 text-text-primary/90">{u.email}</td>
                  <td className="py-3 text-text-primary/90">{formatDateTime(u.created_at)}</td>
                </tr>
              ))}
              {(!recentUsers || recentUsers.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-text-muted">
                    No signups yet.
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
