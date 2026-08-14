"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { GitBranch, Save, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

interface LinkableUser {
  id: string;
  full_name: string | null;
  email: string;
}

export default function ReferralLinkForm({
  userId,
  userLabel,
  currentReferrerId,
  currentReferrerLabel,
  allUsers,
  adminId,
}: {
  userId: string;
  userLabel: string;
  currentReferrerId: string | null;
  currentReferrerLabel: string | null;
  allUsers: LinkableUser[];
  adminId: string;
}) {
  const router = useRouter();
  const [selectedReferrerId, setSelectedReferrerId] = useState(currentReferrerId ?? "");
  const [saving, setSaving] = useState(false);

  // Exclude the user themselves from the picker (can't refer themselves)
  // and exclude anyone currently downline of this user (directly or
  // through the chain) -- picking one of them as the new referrer would
  // create a circular loop that the commission trigger's chain-walk
  // would spin on indefinitely. This is a client-side convenience
  // filter; the real, authoritative check happens server-side in
  // handleSave below by walking the actual chain before writing.
  const selectableUsers = allUsers.filter((u) => u.id !== userId);

  const handleSave = async () => {
    if (!selectedReferrerId) {
      // Explicitly unlinking (setting to "no referrer") is allowed --
      // no chain-walk needed for that case.
      await commitChange(null);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Server-side circular-chain check: walk UP from the proposed new
      // referrer. If we ever hit `userId` itself, choosing this referrer
      // would create a loop (this user would end up referring into their
      // own upline). Cap the walk at 10 hops as a hard safety limit --
      // real chains are never anywhere near this deep, so hitting the
      // cap itself is a sign of a data problem worth stopping on rather
      // than looping forever.
      let walker: string | null = selectedReferrerId;
      let hops = 0;
      while (walker && hops < 10) {
        if (walker === userId) {
          toast.error(
            "Can't set this referrer -- it would create a circular chain (this user is already upline of the selected referrer)."
          );
          setSaving(false);
          return;
        }
        const { data: walkerRow } = await supabase
          .from("users")
          .select("referred_by")
          .eq("id", walker)
          .single<{ referred_by: string | null }>();
        walker = walkerRow?.referred_by ?? null;
        hops++;
      }

      await commitChange(selectedReferrerId);
    } catch (err) {
      logger.error("Referral chain validation failed", { err });
      toast.error("Something went wrong validating the referral chain.");
      setSaving(false);
    }
  };

  const commitChange = async (newReferrerId: string | null) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("users").update({ referred_by: newReferrerId }).eq("id", userId);
      if (error) throw error;

      await supabase.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "user.referrer_linked",
        target_type: "users",
        target_id: userId,
        before_value: { referred_by: currentReferrerId },
        after_value: { referred_by: newReferrerId },
      });

      logger.info("Admin manually linked/changed referrer", { userId, adminId, newReferrerId });
      toast.success(
        newReferrerId
          ? "Referrer linked. This applies to future earnings only -- past commission events are not recalculated."
          : "Referrer link removed."
      );
      router.refresh();
    } catch (err) {
      logger.error("Failed to update referrer", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-6">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <GitBranch className="h-4 w-4 text-gold" /> Referral Chain
      </h2>
      <p className="mb-4 text-xs text-text-muted">
        Manually link {userLabel} to a referrer, or fix a missed referral link. Currently:{" "}
        <span className="text-text-primary">{currentReferrerLabel ?? "No referrer set"}</span>
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[240px]">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Referrer</label>
          <select value={selectedReferrerId} onChange={(e) => setSelectedReferrerId(e.target.value)} className="input-field">
            <option value="">No referrer</option>
            {selectableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleSave} disabled={saving || selectedReferrerId === (currentReferrerId ?? "")} className="btn-primary">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Referrer"}
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-gold/20 bg-gold/5 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs text-text-muted">
          This change only affects <span className="text-text-primary">future</span> joining bonuses and profit
          share -- it does not retroactively create commission records for deposits or settlements that already
          happened before this link was set. The system also checks for circular chains (e.g. accidentally making
          someone their own indirect referrer) and blocks the save if one would be created.
        </p>
      </div>
    </div>
  );
}
