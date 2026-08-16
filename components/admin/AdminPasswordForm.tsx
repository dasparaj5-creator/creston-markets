"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export default function AdminPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation don't match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      // Supabase's updateUser() doesn't ask for the current password
      // itself -- it trusts the existing session. As a real safety
      // check (so someone who left an admin session open on a shared
      // machine can't silently change the password without knowing the
      // current one), re-authenticate with the current password first
      // via a fresh sign-in check before applying the change.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.error("Could not verify your session. Please log in again.");
        setSaving(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        toast.error("Current password is incorrect.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      logger.info("Admin password changed", { adminId: user.id });
      toast.success("Password updated. Use your new password next time you log in.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      logger.error("Admin password change failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card space-y-4 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <KeyRound className="h-4 w-4 text-gold" /> Change Password
      </h2>
      <p className="text-xs text-text-muted">
        You'll need your current password to confirm this change.
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Current Password</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">New Password</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Confirm New Password</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowPasswords((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary"
        >
          {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPasswords ? "Hide" : "Show"} passwords
        </button>
        <button onClick={handleChangePassword} disabled={saving} className="btn-primary">
          {saving ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
  );
}
