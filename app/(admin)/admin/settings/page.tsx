import { requireAdmin } from "@/lib/auth";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Platform configuration. Referral bonus config lives under Referral Bonus Management.
        </p>
      </div>
      <AdminSettingsForm />
    </div>
  );
}
