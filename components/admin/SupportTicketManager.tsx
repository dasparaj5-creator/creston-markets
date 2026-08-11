"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MessageSquare, Send, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatDateTime } from "@/lib/utils";
import type { SupportTicket, TicketStatus } from "@/types";

interface EnrichedTicket extends SupportTicket {
  user?: { full_name: string | null; email: string } | null;
}

const statusBadge: Record<TicketStatus, string> = {
  open: "badge-warning",
  in_progress: "badge-neutral",
  resolved: "badge-success",
};

function TicketReplyForm({ ticket, adminId }: { ticket: EnrichedTicket; adminId: string }) {
  const router = useRouter();
  const [reply, setReply] = useState(ticket.admin_reply ?? "");
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("support_tickets")
        .update({ admin_reply: reply, status })
        .eq("id", ticket.id);
      if (error) throw error;

      logger.info("Support ticket updated by admin", { ticketId: ticket.id, adminId, status });
      toast.success("Ticket updated.");
      router.refresh();
    } catch (err) {
      logger.error("Support ticket update failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Write a reply…"
        rows={3}
        className="input-field resize-none text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="input-field !w-auto !py-1.5 text-xs">
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <button onClick={handleSave} disabled={saving} className="btn-primary !py-1.5 !px-4 text-xs">
          <Send className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save & Reply"}
        </button>
      </div>
    </div>
  );
}

export default function SupportTicketManager({ tickets, adminId }: { tickets: EnrichedTicket[]; adminId: string }) {
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(
    () => tickets.filter((t) => statusFilter === "all" || t.status === statusFilter),
    [tickets, statusFilter]
  );

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Support Tickets</h2>
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                statusFilter === s ? "bg-gold text-navy" : "bg-white/5 text-text-muted"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((t) => {
          const isExpanded = expandedId === t.id;
          return (
            <div key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpandedId(isExpanded ? null : t.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedId(isExpanded ? null : t.id);
                  }
                }}
                className="flex w-full cursor-pointer items-start justify-between gap-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.subject}</p>
                    <Link
                      href={`/admin/users/${t.user_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="relative z-10 text-xs text-text-muted hover:text-gold hover:underline"
                    >
                      {t.user?.full_name || t.user?.email}
                    </Link>
                    <p className="mt-1 text-xs text-text-muted/70">{formatDateTime(t.created_at)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={statusBadge[t.status]}>{t.status.replace("_", " ")}</span>
                  <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>

              {isExpanded && (
                <>
                  <p className="mt-3 whitespace-pre-wrap border-t border-white/5 pt-3 text-sm text-text-primary/80">
                    {t.message}
                  </p>
                  <TicketReplyForm ticket={t} adminId={adminId} />
                </>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">No tickets match this filter.</p>
        )}
      </div>
    </div>
  );
}
