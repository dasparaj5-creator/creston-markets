"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Trash2, Users, Settings2, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { ClientGroup, ClientGroupMember } from "@/types";

interface LiteUser {
  id: string;
  full_name: string | null;
  email: string;
  plan_id: string | null;
}

export default function GroupManager({
  groups,
  allUsers,
  memberships,
  adminId,
}: {
  groups: ClientGroup[];
  allUsers: LiteUser[];
  memberships: ClientGroupMember[];
  adminId: string;
}) {
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const membersOf = (groupId: string) => {
    const memberIds = memberships.filter((m) => m.group_id === groupId).map((m) => m.user_id);
    return allUsers.filter((u) => memberIds.includes(u.id));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Enter a group name.");
      return;
    }
    setCreating(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("client_groups").insert({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || null,
        created_by: adminId,
      });
      if (error) throw error;

      logger.info("Client group created", { adminId, name: newGroupName });
      toast.success("Group created.");
      setNewGroupName("");
      setNewGroupDesc("");
      router.refresh();
    } catch (err) {
      logger.error("Failed to create group", { err });
      toast.error("Something went wrong.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Delete "${groupName}"? This removes the group and all its member associations, it does not affect the members' accounts themselves.`)) {
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.from("client_groups").delete().eq("id", groupId);
      if (error) throw error;
      toast.success("Group deleted.");
      router.refresh();
    } catch (err) {
      logger.error("Failed to delete group", { err });
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Plus className="h-4 w-4 text-gold" /> Create a New Group
        </h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Group name (e.g. VIP Clients)"
            className="input-field"
          />
          <input
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            placeholder="Description (optional)"
            className="input-field"
          />
          <button onClick={handleCreateGroup} disabled={creating} className="btn-primary whitespace-nowrap">
            {creating ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => {
          const members = membersOf(group.id);
          const isExpanded = expandedGroupId === group.id;
          return (
            <div key={group.id} className="glass-card overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <div>
                  <p className="font-semibold text-text-primary">{group.name}</p>
                  {group.description && <p className="mt-0.5 text-sm text-text-muted">{group.description}</p>}
                  <p className="mt-1 text-xs text-text-muted">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    className="btn-secondary text-xs"
                  >
                    <Users className="h-3.5 w-3.5" /> Manage
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-danger/20 text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <GroupDetailPanel
                  group={group}
                  members={members}
                  allUsers={allUsers}
                  adminId={adminId}
                  onChange={() => router.refresh()}
                />
              )}
            </div>
          );
        })}
        {groups.length === 0 && (
          <div className="glass-card p-8 text-center text-sm text-text-muted">
            No groups yet, create one above to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function GroupDetailPanel({
  group,
  members,
  allUsers,
  adminId,
  onChange,
}: {
  group: ClientGroup;
  members: LiteUser[];
  allUsers: LiteUser[];
  adminId: string;
  onChange: () => void;
}) {
  const [addUserId, setAddUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [showBulkReconciliation, setShowBulkReconciliation] = useState(false);
  const [showRateOverride, setShowRateOverride] = useState(false);

  const nonMembers = allUsers.filter((u) => !members.find((m) => m.id === u.id));

  const handleAddMember = async () => {
    if (!addUserId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("client_group_members")
        .insert({ group_id: group.id, user_id: addUserId, added_by: adminId });
      if (error) throw error;
      toast.success("Member added.");
      setAddUserId("");
      onChange();
    } catch (err) {
      logger.error("Failed to add group member", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("client_group_members")
        .delete()
        .eq("group_id", group.id)
        .eq("user_id", userId);
      if (error) throw error;
      toast.success("Member removed.");
      onChange();
    } catch (err) {
      logger.error("Failed to remove group member", { err });
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="border-t border-white/5 p-5">
      <div className="mb-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">Members</p>
        <div className="space-y-1.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
              <span className="text-sm text-text-primary/90">{m.full_name || m.email}</span>
              <button onClick={() => handleRemoveMember(m.id)} className="text-text-muted hover:text-danger">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {members.length === 0 && <p className="text-xs text-text-muted">No members yet.</p>}
        </div>
        <div className="mt-3 flex gap-2">
          <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className="input-field flex-1">
            <option value="">Select a client to add…</option>
            {nonMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name || u.email}
              </option>
            ))}
          </select>
          <button onClick={handleAddMember} disabled={saving || !addUserId} className="btn-secondary whitespace-nowrap">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/5 pt-4">
        <button onClick={() => setShowBulkReconciliation((v) => !v)} className="btn-secondary text-xs">
          <Send className="h-3.5 w-3.5" /> Bulk Reconciliation Update
        </button>
        <button onClick={() => setShowRateOverride((v) => !v)} className="btn-secondary text-xs">
          <Settings2 className="h-3.5 w-3.5" /> Group Commission Rates
        </button>
      </div>

      {showBulkReconciliation && (
        <BulkReconciliationForm groupId={group.id} members={members} adminId={adminId} />
      )}
      {showRateOverride && <GroupRateOverrideForm groupId={group.id} adminId={adminId} />}
    </div>
  );
}

function BulkReconciliationForm({
  groupId,
  members,
  adminId,
}: {
  groupId: string;
  members: LiteUser[];
  adminId: string;
}) {
  const [returnPercent, setReturnPercent] = useState("");
  const [isSettlement, setIsSettlement] = useState(false);
  const [settlementPeriod, setSettlementPeriod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    if (!returnPercent) {
      toast.error("Enter a return percentage to apply.");
      return;
    }
    if (isSettlement && !settlementPeriod.trim()) {
      toast.error("Enter a settlement period label.");
      return;
    }
    if (members.length === 0) {
      toast.error("This group has no members to apply an update to.");
      return;
    }
    if (
      !confirm(
        `Apply a ${returnPercent}% return update to all ${members.length} member(s) of this group${
          isSettlement ? ", as an OFFICIAL SETTLEMENT (this will trigger profit-share commissions for their upline)" : ""
        }? This cannot be bulk-undone.`
      )
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      let successCount = 0;
      let failCount = 0;

      for (const member of members) {
        const { data: latestSnapshot } = await supabase
          .from("portfolio_snapshots")
          .select("balance")
          .eq("user_id", member.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const previousBalance = latestSnapshot?.balance ?? 0;
        const pct = parseFloat(returnPercent);
        const newBalance = previousBalance * (1 + pct / 100);
        const pnl = newBalance - previousBalance;

        const { error } = await supabase.from("portfolio_snapshots").insert({
          user_id: member.id,
          balance: newBalance,
          return_percent: pct,
          pnl_total: pnl,
          pnl_today: pnl,
          pnl_this_month: pnl,
          is_settlement: isSettlement,
          settlement_period: isSettlement ? settlementPeriod.trim() : null,
          updated_by: adminId,
        });

        if (error) {
          failCount++;
          logger.error("Bulk reconciliation entry failed for one member", { userId: member.id, err: error });
        } else {
          successCount++;
        }
      }

      logger.info("Bulk reconciliation applied to group", { groupId, adminId, successCount, failCount });
      if (failCount === 0) {
        toast.success(`Applied to all ${successCount} member(s).`);
      } else {
        toast.error(`Applied to ${successCount}, failed for ${failCount}. Check individual accounts.`);
      }
    } catch (err) {
      logger.error("Bulk reconciliation failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 text-xs text-text-muted">
        Applies the same percentage return to every member's most recent balance, individually, in one action.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Return % to Apply</label>
          <input
            value={returnPercent}
            onChange={(e) => setReturnPercent(e.target.value)}
            type="number"
            step="0.01"
            placeholder="e.g. 4.5"
            className="input-field"
          />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-xs text-text-muted">
            <input type="checkbox" checked={isSettlement} onChange={(e) => setIsSettlement(e.target.checked)} />
            Mark as official settlement
          </label>
        </div>
        {isSettlement && (
          <input
            value={settlementPeriod}
            onChange={(e) => setSettlementPeriod(e.target.value)}
            placeholder="Settlement period label (e.g. January 2026)"
            className="input-field sm:col-span-2"
          />
        )}
      </div>
      <button onClick={handleApply} disabled={submitting} className="btn-primary mt-3">
        {submitting ? "Applying..." : `Apply to ${members.length} Member(s)`}
      </button>
    </div>
  );
}

function GroupRateOverrideForm({ groupId, adminId }: { groupId: string; adminId: string }) {
  const [chainDepth, setChainDepth] = useState("1");
  const [position, setPosition] = useState("1");
  const [bonusAmount, setBonusAmount] = useState("");
  const [profitPercent, setProfitPercent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("group_commission_overrides").insert({
        group_id: groupId,
        chain_depth: parseInt(chainDepth, 10),
        position: parseInt(position, 10),
        joining_bonus_amount: bonusAmount ? parseFloat(bonusAmount) : null,
        profit_share_percent: profitPercent ? parseFloat(profitPercent) : null,
        created_by: adminId,
      });
      if (error) throw error;
      toast.success("Group rate override saved, applies to future commissions for this group's members only.");
      setBonusAmount("");
      setProfitPercent("");
    } catch (err) {
      logger.error("Failed to save group rate override", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <p className="mb-3 text-xs text-text-muted">
        Override the joining bonus and/or profit share rate for this group's members at a specific chain depth
        and position, replacing the platform-wide default for them only.
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Chain Depth</label>
          <select value={chainDepth} onChange={(e) => setChainDepth(e.target.value)} className="input-field">
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}-layer
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Position</label>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-field">
            {Array.from({ length: parseInt(chainDepth, 10) }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                Position {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Joining Bonus ($)</label>
          <input value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} type="number" step="0.01" className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Profit Share (%)</label>
          <input value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} type="number" step="0.01" className="input-field" />
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary mt-3">
        {saving ? "Saving..." : "Save Override"}
      </button>
    </div>
  );
}
