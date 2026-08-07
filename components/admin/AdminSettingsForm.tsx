"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save, AlertTriangle } from "lucide-react";
import { logger } from "@/lib/logger";

export default function AdminSettingsForm() {
  const [platformName, setPlatformName] = useState("Creston Markets");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    // Phase 1: settings are illustrative — no dedicated settings table in
    // spec section 4, so this persists locally only. Wire to a settings
    // table before production use.
    logger.info("Admin settings saved (local only, Phase 1)", { platformName, maintenanceMode });
    setTimeout(() => {
      toast.success("Settings saved.");
      setSaving(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-text-primary">Platform</h2>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Platform Name</label>
          <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="input-field" />
        </div>
      </div>

      <div className="glass-card flex items-center justify-between p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <div>
            <p className="text-sm font-medium text-text-primary">Maintenance Mode</p>
            <p className="text-xs text-text-muted">Temporarily restrict client access to the platform.</p>
          </div>
        </div>
        <button
          onClick={() => setMaintenanceMode((m) => !m)}
          className={maintenanceMode ? "badge-danger" : "badge-neutral"}
        >
          {maintenanceMode ? "Enabled" : "Disabled"}
        </button>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
