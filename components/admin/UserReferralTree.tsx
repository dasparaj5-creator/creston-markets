import Link from "next/link";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ReferralNode {
  id: string;
  full_name: string | null;
  email: string;
  kyc_status: string;
  created_at: string;
}

export default function UserReferralTree({
  referredBy,
  referredUsers,
}: {
  referredBy: ReferralNode | null;
  referredUsers: ReferralNode[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-text-muted">
          <ArrowUpRight className="h-3.5 w-3.5" /> Referred By
        </p>
        {referredBy ? (
          <Link
            href={`/admin/users/${referredBy.id}`}
            className="block rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-gold/40"
          >
            <p className="text-sm text-text-primary">{referredBy.full_name || referredBy.email}</p>
            <p className="text-xs text-text-muted">{referredBy.email}</p>
          </Link>
        ) : (
          <p className="text-sm text-text-muted">Not referred by anyone (direct signup)</p>
        )}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-text-muted">
          <ArrowDownRight className="h-3.5 w-3.5" /> Direct Referrals ({referredUsers.length})
        </p>
        {referredUsers.length > 0 ? (
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {referredUsers.map((u) => (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="block rounded-lg border border-white/10 bg-white/[0.03] p-3 hover:border-gold/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-primary">{u.full_name || u.email}</p>
                  <span
                    className={
                      u.kyc_status === "approved" ? "badge-success" : u.kyc_status === "rejected" ? "badge-danger" : "badge-warning"
                    }
                  >
                    {u.kyc_status}
                  </span>
                </div>
                <p className="text-xs text-text-muted">Joined {formatDate(u.created_at)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Has not referred anyone yet.</p>
        )}
      </div>
    </div>
  );
}
