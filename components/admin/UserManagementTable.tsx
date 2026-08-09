"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import KycActions from "@/components/admin/KycActions";
import type { UserProfile } from "@/types";

const kycBadge: Record<string, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
};

export default function UserManagementTable({
  users,
  planNames,
  adminId,
}: {
  users: UserProfile[];
  planNames: Record<string, string>;
  adminId: string;
}) {
  const [query, setQuery] = useState("");
  const [kycFilter, setKycFilter] = useState("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesKyc = kycFilter === "all" || u.kyc_status === kycFilter;
      return matchesQuery && matchesKyc;
    });
  }, [users, query, kycFilter]);

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="input-field pl-10"
          />
        </div>
        <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className="input-field w-auto">
          <option value="all">All KYC Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase text-text-muted">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Plan</th>
              <th className="pb-3 font-medium">KYC Status</th>
              <th className="pb-3 font-medium">Account Status</th>
              <th className="pb-3 font-medium">Joined</th>
              <th className="pb-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-white/5 last:border-0">
                <td className="py-3 text-text-primary/90">{u.full_name || "—"}</td>
                <td className="py-3 text-text-primary/90">{u.email}</td>
                <td className="py-3 text-text-primary/90">{u.plan_id ? planNames[u.plan_id] ?? "—" : "—"}</td>
                <td className="py-3"><span className={kycBadge[u.kyc_status]}>{u.kyc_status}</span></td>
                <td className="py-3">
                  <span className={u.is_active ? "badge-success" : "badge-neutral"}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 text-text-primary/90">{formatDate(u.created_at)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="btn-secondary !py-1 !px-2 text-xs"
                      title="View full profile"
                    >
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                    <KycActions userId={u.id} currentStatus={u.kyc_status} adminId={adminId} />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-text-muted">
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
