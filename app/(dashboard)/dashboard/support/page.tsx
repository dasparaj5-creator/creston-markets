import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import SupportTicketForm from "@/components/dashboard/SupportTicketForm";

const statusBadge: Record<string, string> = {
  open: "badge-warning",
  in_progress: "badge-neutral",
  resolved: "badge-success",
};

export default async function SupportPage() {
  const profile = await requireUser();
  const supabase = createClient();

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Support</h1>
        <p className="mt-1 text-sm text-text-muted">Raise a ticket or review past conversations.</p>
      </div>

      <SupportTicketForm userId={profile.id} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Your Tickets</h2>
        {tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.subject}</p>
                    <p className="mt-1 text-xs text-text-muted">{formatDateTime(t.created_at)}</p>
                  </div>
                  <span className={statusBadge[t.status]}>{t.status.replace("_", " ")}</span>
                </div>
                <p className="mt-3 text-sm text-text-primary/80">{t.message}</p>
                {t.admin_reply && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-gold/20 bg-gold/5 p-3">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    <div>
                      <p className="text-xs font-medium text-gold">Support Team</p>
                      <p className="mt-1 text-sm text-text-primary/90">{t.admin_reply}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-text-muted">No tickets yet.</p>
        )}
      </div>
    </div>
  );
}
