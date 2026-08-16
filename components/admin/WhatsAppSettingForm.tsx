"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MessageCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function WhatsAppSettingForm({
  currentNumber,
  adminId,
}: {
  currentNumber: string;
  adminId: string;
}) {
  const router = useRouter();
  const [number, setNumber] = useState(currentNumber);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("platform_settings").upsert({
        key: "whatsapp_number",
        value: number.trim(),
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      logger.info("WhatsApp number updated", { adminId });
      toast.success("WhatsApp number updated, live on the site immediately.");
      router.refresh();
    } catch (err) {
      logger.error("Failed to update WhatsApp number", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card space-y-4 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp Contact Number
      </h2>
      <p className="text-xs text-text-muted">
        Shown in the site footer with a WhatsApp icon, linking directly to a chat. Include the
        country code (e.g. +1 555 123 4567). Leave blank to hide it entirely.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Number</label>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="+1 555 123 4567"
            className="input-field"
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary whitespace-nowrap">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Number"}
        </button>
      </div>
    </div>
  );
}
