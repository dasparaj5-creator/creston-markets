import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import AnnouncementManager from "@/components/admin/AnnouncementManager";

export default async function AdminAnnouncementsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Announcements</h1>
        <p className="mt-1 text-sm text-text-muted">Create and manage platform-wide or targeted announcements.</p>
      </div>
      <AnnouncementManager announcements={announcements ?? []} adminId={admin.id} />
    </div>
  );
}
