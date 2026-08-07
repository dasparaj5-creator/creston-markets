"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function ContactForm() {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Public contact form: store as an unauthenticated-style ticket.
      // If the user happens to be logged in, associate it with their account.
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user?.id ?? null,
        subject: `[Contact Form] ${values.subject}`,
        message: `From: ${values.name} <${values.email}>\n\n${values.message}`,
        status: "open",
      });

      if (error) throw error;

      logger.info("Contact form submitted", { subject: values.subject });
      toast.success("Message sent. Our team will be in touch soon.");
      reset();
    } catch (err) {
      logger.error("Contact form submission failed", { err });
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Get in Touch</h2>
          <p className="mt-3 text-text-muted">Questions about Creston Markets? Send us a message.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass-card space-y-4 p-8">
          <div>
            <input {...register("name")} placeholder="Full Name" className="input-field" />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <input {...register("email")} placeholder="Email Address" className="input-field" />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register("subject")} placeholder="Subject" className="input-field" />
            {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
          </div>
          <div>
            <textarea {...register("message")} placeholder="Message" rows={5} className="input-field resize-none" />
            {errors.message && <p className="mt-1 text-xs text-danger">{errors.message.message}</p>}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
}
