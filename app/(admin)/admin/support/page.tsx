import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import SupportTicketManager from "@/components/admin/SupportTicketManager";

export default async function AdminSupportPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("*, user:users!support_tickets_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Support Tickets</h1>
        <p className="mt-1 text-sm text-text-muted">Respond to and manage client support requests.</p>
      </div>
      <SupportTicketManager tickets={(tickets as any) ?? []} adminId={admin.id} />
    </div>
  );
}
