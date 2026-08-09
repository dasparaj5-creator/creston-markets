"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { UserProfile } from "@/types";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(6, "Phone number is required"),
  country: z.string().min(2, "Country is required"),
});
type FormValues = z.infer<typeof schema>;

export default function ProfileEditForm({ profile }: { profile: UserProfile }) {
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile.full_name ?? "",
      phone: profile.phone ?? "",
      country: profile.country ?? "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({ full_name: values.fullName, phone: values.phone, country: values.country })
        .eq("id", profile.id);

      if (error) throw error;

      logger.info("Profile updated", { userId: profile.id });
      toast.success("Profile updated.");
    } catch (err) {
      logger.error("Profile update failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <h2 className="text-sm font-semibold text-text-primary">Personal Information</h2>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Full Name</label>
        <input {...register("fullName")} className="input-field" />
        {errors.fullName && <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Phone</label>
        <input {...register("phone")} className="input-field" />
        {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Country</label>
        <input {...register("country")} className="input-field" />
        {errors.country && <p className="mt-1 text-xs text-danger">{errors.country.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Email</label>
        <input value={profile.email} disabled className="input-field opacity-60" />
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
