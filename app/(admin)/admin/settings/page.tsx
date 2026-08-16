import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";
import AdminPasswordForm from "@/components/admin/AdminPasswordForm";
import WhatsAppSettingForm from "@/components/admin/WhatsAppSettingForm";
import CryptoAddressManager from "@/components/admin/CryptoAddressManager";

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const supabase = createClient();

  const [{ data: addresses }, { data: whatsappSetting }] = await Promise.all([
    supabase.from("crypto_deposit_addresses").select("*"),
    supabase.from("platform_settings").select("value").eq("key", "whatsapp_number").maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Admin Settings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Platform configuration. Referral bonus config lives under Referral Bonus Management.
        </p>
      </div>
      <AdminPasswordForm />
      <WhatsAppSettingForm currentNumber={whatsappSetting?.value ?? ""} adminId={admin.id} />
      <CryptoAddressManager addresses={addresses ?? []} adminId={admin.id} />
      <AdminSettingsForm />
    </div>
  );
}
