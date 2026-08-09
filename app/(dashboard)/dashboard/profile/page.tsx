import { ShieldOff } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/components/dashboard/ProfileEditForm";
import ChangePasswordForm from "@/components/dashboard/ChangePasswordForm";
import KycUpload from "@/components/dashboard/KycUpload";

export default async function ProfilePage() {
  const profile = await requireUser();
  const supabase = createClient();
  const { data: kycDocuments } = await supabase
    .from("kyc_documents")
    .select("*")
    .eq("user_id", profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Profile & Settings</h1>
        <p className="mt-1 text-sm text-text-muted">Manage your account details and preferences.</p>
      </div>

      <ProfileEditForm profile={profile} />
      <ChangePasswordForm />
      <KycUpload userId={profile.id} currentStatus={profile.kyc_status} existingDocuments={kycDocuments ?? []} />

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Notification Preferences</h2>
        <div className="space-y-3">
          {["Email notifications", "SMS notifications", "Product announcements"].map((label) => (
            <label key={label} className="flex items-center justify-between text-sm text-text-primary/90">
              {label}
              <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5" />
            </label>
          ))}
        </div>
      </div>

      <div className="glass-card flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-text-muted">
            <ShieldOff className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
            <p className="text-xs text-text-muted">Coming Soon</p>
          </div>
        </div>
        <button disabled className="btn-secondary !py-1.5 !px-3 text-xs opacity-50">
          Enable
        </button>
      </div>
    </div>
  );
}
