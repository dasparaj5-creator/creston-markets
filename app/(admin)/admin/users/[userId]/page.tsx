import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe, Calendar, ShieldCheck, Database } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { formatCurrency, formatDate, formatDateTime, slugifyStatus } from "@/lib/utils";
import KycActions from "@/components/admin/KycActions";
import KycDocumentViewer from "@/components/admin/KycDocumentViewer";
import UserReferralTree from "@/components/admin/UserReferralTree";
import AccountStatusActions from "@/components/admin/AccountStatusActions";
import UserReconciliationForm from "@/components/admin/UserReconciliationForm";
import PlanAllocationForm from "@/components/admin/PlanAllocationForm";
import ReferralLinkForm from "@/components/admin/ReferralLinkForm";
import CustomBonusForm from "@/components/admin/CustomBonusForm";

const kycBadge: Record<string, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
};

export default async function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  const admin = await requireAdmin();
  const supabase = createClient();

  const { data: user } = await supabase.from("users").select("*").eq("id", params.userId).single();
  if (!user) notFound();

  const [
    { data: plan },
    { data: allPlans },
    { data: referredBy },
    { data: referredUsers },
    { data: deposits },
    { data: withdrawals },
    { data: kycDocuments },
    { data: snapshots },
    { data: earningsAsBeneficiary },
    { data: earningsAsSource },
    { data: tickets },
    { data: allUsersForReferralPicker },
  ] = await Promise.all([
    user.plan_id ? supabase.from("plans").select("name").eq("id", user.plan_id).single() : Promise.resolve({ data: null }),
    supabase.from("plans").select("*").eq("is_active", true).order("min_deposit"),
    user.referred_by
      ? supabase.from("users").select("id, full_name, email, kyc_status, created_at").eq("id", user.referred_by).single()
      : Promise.resolve({ data: null }),
    supabase.from("users").select("id, full_name, email, kyc_status, created_at").eq("referred_by", user.id),
    supabase.from("deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("kyc_documents").select("*").eq("user_id", user.id),
    supabase.from("portfolio_snapshots").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase
      .from("commission_records")
      .select("*, source_user:users!commission_records_source_user_id_fkey(full_name, email)")
      .eq("beneficiary_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("commission_records")
      .select("*, beneficiary:users!commission_records_beneficiary_id_fkey(full_name, email)")
      .eq("source_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    // For the referral-linking picker -- every other user, excluding this
    // one. Kept to a reasonable field set (no need for full profiles) and
    // ordered by name for a usable dropdown once the client base grows.
    supabase.from("users").select("id, full_name, email").neq("id", user.id).order("full_name"),
  ]);

  const totalDeposited = (deposits ?? []).filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);
  const totalWithdrawn = (withdrawals ?? []).filter((w) => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const totalEarned = (earningsAsBeneficiary ?? []).reduce((s, r) => s + Number(r.commission_earned), 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-gold">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Profile header */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{user.full_name || "N/A"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {user.phone}</span>}
              {user.country && <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> {user.country}</span>}
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {formatDate(user.created_at)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={kycBadge[user.kyc_status]}>KYC: {user.kyc_status}</span>
            <span className={user.is_active ? "badge-success" : "badge-neutral"}>
              {user.is_active ? "Active" : "Inactive"}
            </span>
            {user.role === "admin" && <span className="badge-warning">Admin</span>}
            {user.role !== "admin" && (
              <AccountStatusActions userId={user.id} isActive={user.is_active} adminId={admin.id} />
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-text-muted">Plan</p>
            <p className="mt-1 font-medium text-text-primary">{plan?.name ?? "None"}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Deposited</p>
            <p className="mt-1 font-medium text-text-primary">{formatCurrency(totalDeposited)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Total Withdrawn</p>
            <p className="mt-1 font-medium text-text-primary">{formatCurrency(totalWithdrawn)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Referral Code</p>
            <p className="mt-1 font-mono font-medium text-gold">{user.referral_code}</p>
          </div>
        </div>
      </div>

      {/* KYC verification */}
      <div className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ShieldCheck className="h-4 w-4 text-gold" /> KYC Verification
          </h2>
          <KycActions userId={user.id} currentStatus={user.kyc_status} adminId={admin.id} />
        </div>
        <KycDocumentViewer documents={kycDocuments ?? []} />
      </div>

      {/* Plan allocation */}
      <PlanAllocationForm userId={user.id} currentPlanId={user.plan_id} plans={allPlans ?? []} adminId={admin.id} />

      {/* Manual referral chain linking -- fixes a client who missed using
          a referral link during signup */}
      <ReferralLinkForm
        userId={user.id}
        userLabel={user.full_name || user.email}
        currentReferrerId={user.referred_by}
        currentReferrerLabel={referredBy ? referredBy.full_name || referredBy.email : null}
        allUsers={allUsersForReferralPicker ?? []}
        adminId={admin.id}
      />

      {/* Custom bonus -- Scenario C: a genuine, arbitrary bonus amount,
          for any reason, creating a real commission record rather than a
          balance adjustment workaround */}
      <CustomBonusForm userId={user.id} userLabel={user.full_name || user.email} adminId={admin.id} />

      {/* Referral relationships */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Referral Network</h2>
        <UserReferralTree referredBy={referredBy} referredUsers={referredUsers ?? []} />
      </div>

      {/* Reconciliation for this user */}
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Database className="h-4 w-4 text-gold" /> Reconciliation
        </h2>
        <UserReconciliationForm userId={user.id} adminId={admin.id} />
      </div>

      {/* Earnings summary */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Earnings Summary</h2>
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-text-muted">Total Earned (as referrer)</p>
            <p className="mt-1 font-medium text-gold">{formatCurrency(totalEarned)}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Commission Records Earned</p>
            <p className="mt-1 font-medium text-text-primary">{(earningsAsBeneficiary ?? []).length}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Generated for Upline</p>
            <p className="mt-1 font-medium text-text-primary">{(earningsAsSource ?? []).length} records</p>
          </div>
        </div>
        {(earningsAsBeneficiary ?? []).length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                  <th className="pb-2 font-medium">From</th>
                  <th className="pb-2 font-medium">Position</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(earningsAsBeneficiary ?? []).slice(0, 10).map((r: any) => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-text-primary/90">{r.source_user?.full_name || r.source_user?.email}</td>
                    <td className="py-2 text-text-primary/90">
                      {r.position === 1 ? "Nearest" : `${r.position}${["", "st", "nd", "rd"][r.position] ?? "th"}`}
                      <span className="text-text-muted"> ({r.chain_depth}-layer)</span>
                    </td>
                    <td className="py-2 text-text-primary/90">{r.commission_type === "joining_bonus" ? "Joining Bonus" : "Profit Share"}</td>
                    <td className="py-2 text-text-primary/90">{formatCurrency(r.commission_earned)}</td>
                    <td className="py-2"><span className={r.status === "paid" ? "badge-success" : "badge-warning"}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deposits & withdrawals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Deposits</h2>
          <div className="space-y-2">
            {(deposits ?? []).slice(0, 8).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                <span className="text-text-primary/90">{formatCurrency(d.amount)}</span>
                <span className="text-xs text-text-muted">{formatDate(d.created_at)}</span>
                <span className={d.status === "approved" ? "badge-success" : d.status === "rejected" ? "badge-danger" : "badge-warning"}>
                  {slugifyStatus(d.status)}
                </span>
              </div>
            ))}
            {(!deposits || deposits.length === 0) && <p className="text-sm text-text-muted">No deposits yet.</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Withdrawals</h2>
          <div className="space-y-2">
            {(withdrawals ?? []).slice(0, 8).map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm">
                <span className="text-text-primary/90">{formatCurrency(w.amount)}</span>
                <span className="text-xs text-text-muted">{formatDate(w.created_at)}</span>
                <span className={w.status === "approved" ? "badge-success" : w.status === "rejected" ? "badge-danger" : "badge-warning"}>
                  {slugifyStatus(w.status)}
                </span>
              </div>
            ))}
            {(!withdrawals || withdrawals.length === 0) && <p className="text-sm text-text-muted">No withdrawals yet.</p>}
          </div>
        </div>
      </div>

      {/* Account statements (reconciliation history) */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Account Statement History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Balance</th>
                <th className="pb-2 font-medium">Return %</th>
                <th className="pb-2 font-medium">Settlement</th>
              </tr>
            </thead>
            <tbody>
              {(snapshots ?? []).slice(0, 10).map((s) => (
                <tr key={s.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2 text-text-primary/90">{formatDateTime(s.created_at)}</td>
                  <td className="py-2 text-text-primary/90">{formatCurrency(s.balance)}</td>
                  <td className="py-2 text-text-primary/90">{s.return_percent}%</td>
                  <td className="py-2">
                    {s.is_settlement ? (
                      <span className="badge-success">{s.settlement_period}</span>
                    ) : (
                      <span className="badge-neutral">Routine</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!snapshots || snapshots.length === 0) && (
                <tr><td colSpan={4} className="py-6 text-center text-text-muted">No statements recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support tickets */}
      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Support Tickets</h2>
        <div className="space-y-2">
          {(tickets ?? []).map((t) => (
            <div key={t.id} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-text-primary">{t.subject}</p>
                <span className="badge-neutral">{t.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-xs text-text-muted">{formatDateTime(t.created_at)}</p>
            </div>
          ))}
          {(!tickets || tickets.length === 0) && <p className="text-sm text-text-muted">No tickets raised.</p>}
        </div>
      </div>
    </div>
  );
}
