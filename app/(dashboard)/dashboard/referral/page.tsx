import Link from "next/link";
import { Share2, UserCheck, Gift, ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import ReferralLinkCard from "@/components/dashboard/ReferralLinkCard";

/**
 * This page previously also showed stats and a table pulled from the
 * legacy `referral_bonuses` table (the original single-tier bonus system
 * from before the 5-layer depth-based commission engine was built) --
 * that data is now confusing and out of date next to the real numbers
 * on My Earnings, so it's been removed from here entirely. This page's
 * job now is just sharing your referral link and explaining how the
 * program works at a glance; My Earnings is the one accurate source for
 * actual amounts earned.
 */
export default async function ReferralPage() {
  const profile = await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Referral Program</h1>
        <p className="mt-1 text-sm text-text-muted">
          Share your link and earn across up to 5 levels of your network. For exact amounts
          earned, see My Earnings.
        </p>
      </div>

      <ReferralLinkCard referralCode={profile.referral_code} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">How It Works</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-medium text-text-primary">1. Share Link</p>
              <p className="text-xs text-text-muted">Send your unique referral link to a friend.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-medium text-text-primary">2. They Register & Invest</p>
              <p className="text-xs text-text-muted">They sign up and complete their first deposit.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Gift className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-medium text-text-primary">3. You Earn, Instantly</p>
              <p className="text-xs text-text-muted">
                A joining bonus is distributed across your active upline chain the moment their
                deposit is approved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card flex items-center justify-between p-6">
        <div>
          <p className="text-sm font-semibold text-text-primary">See exactly what you've earned</p>
          <p className="mt-1 text-xs text-text-muted">
            Your network, your position with each person, and every commission, broken down.
          </p>
        </div>
        <Link href="/dashboard/earnings" className="btn-primary whitespace-nowrap">
          View My Earnings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
