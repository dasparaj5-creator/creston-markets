"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send, Megaphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatDateTime } from "@/lib/utils";
import type { Announcement } from "@/types";

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  body: z.string().min(5, "Message is required"),
  target: z.enum(["all", "specific_user"]),
});
type FormValues = z.infer<typeof schema>;

export default function AnnouncementManager({ announcements, adminId }: { announcements: Announcement[]; adminId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { target: "all" } });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("announcements").insert({
        title: values.title,
        body: values.body,
        target: values.target,
        is_active: true,
        created_by: adminId,
      });
      if (error) throw error;

      logger.info("Announcement created", { adminId, title: values.title });
      toast.success("Announcement published.");
      reset();
      router.refresh();
    } catch (err) {
      logger.error("Announcement creation failed", { err });
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const supabase = createClient();
      await supabase.from("announcements").update({ is_active: !current }).eq("id", id);
      logger.info("Announcement toggled", { id, adminId });
      router.refresh();
    } catch (err) {
      logger.error("Announcement toggle failed", { err });
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-text-primary">New Announcement</h2>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Title</label>
          <input {...register("title")} className="input-field" />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Message</label>
          <textarea {...register("body")} rows={3} className="input-field resize-none" />
          {errors.body && <p className="mt-1 text-xs text-danger">{errors.body.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Target</label>
          <select {...register("target")} className="input-field">
            <option value="all">All Users</option>
            <option value="specific_user">Specific User</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          <Send className="h-4 w-4" /> {saving ? "Publishing..." : "Publish Announcement"}
        </button>
      </form>

      <div className="glass-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">All Announcements</h2>
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                <div>
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{a.body}</p>
                  <p className="mt-1 text-[11px] text-text-muted/70">{formatDateTime(a.created_at)}</p>
                </div>
              </div>
              <button
                onClick={() => toggleActive(a.id, a.is_active)}
                className={a.is_active ? "badge-success" : "badge-neutral"}
              >
                {a.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">No announcements yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
