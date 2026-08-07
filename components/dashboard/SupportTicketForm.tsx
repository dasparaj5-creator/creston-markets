"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

const schema = z.object({
  category: z.string().min(1, "Select a category"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function SupportTicketForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("support_tickets").insert({
        user_id: userId,
        subject: `[${values.category}] ${values.subject}`,
        message: values.message,
        status: "open",
      });
      if (error) throw error;

      logger.info("Support ticket raised", { userId, category: values.category });
      toast.success("Ticket submitted. Our team will respond soon.");
      reset();
      router.refresh();
    } catch (err) {
      logger.error("Support ticket submission failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-6">
      <h2 className="text-sm font-semibold text-text-primary">Raise a Ticket</h2>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Category</label>
        <select {...register("category")} className="input-field">
          <option value="">Select category…</option>
          <option value="Account">Account</option>
          <option value="Deposits">Deposits</option>
          <option value="Withdrawals">Withdrawals</option>
          <option value="Referral">Referral Program</option>
          <option value="KYC">KYC Verification</option>
          <option value="Other">Other</option>
        </select>
        {errors.category && <p className="mt-1 text-xs text-danger">{errors.category.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Subject</label>
        <input {...register("subject")} className="input-field" />
        {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-text-muted">Message</label>
        <textarea {...register("message")} rows={4} className="input-field resize-none" />
        {errors.message && <p className="mt-1 text-xs text-danger">{errors.message.message}</p>}
      </div>
      <button type="submit" disabled={submitting} className="btn-primary">
        <Send className="h-4 w-4" /> {submitting ? "Submitting..." : "Submit Ticket"}
      </button>
    </form>
  );
}
