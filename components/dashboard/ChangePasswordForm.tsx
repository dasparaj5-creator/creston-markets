"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
import PasswordInput from "@/components/shared/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

export default function ChangePasswordForm() {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });
      if (error) throw error;

      logger.info("Password changed");
      toast.success("Password updated.");
      reset();
    } catch (err) {
      logger.error("Password change failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <h2 className="text-sm font-semibold text-text-primary">Change Password</h2>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">New Password</label>
        <PasswordInput {...register("newPassword")} />
        {errors.newPassword && <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Confirm New Password</label>
        <PasswordInput {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>}
      </div>
      <button type="submit" disabled={saving} className="btn-secondary">
        <KeyRound className="h-4 w-4" /> {saving ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}
