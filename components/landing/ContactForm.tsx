"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

// Same WhatsApp brand icon as the footer, kept local to this file since
// it's the only other place it's used.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 4.99L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2m0 1.67a8.23 8.23 0 0 1 8.24 8.24c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.19-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.24 8.23-8.24m-2.98 4.71c-.15 0-.4.06-.61.29-.21.24-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.6 2.44 3.9 3.42 1.93.82 2.33.66 2.75.62.42-.04 1.35-.55 1.54-1.08.19-.53.19-.98.13-1.08-.06-.09-.21-.15-.44-.26-.24-.12-1.4-.69-1.62-.77-.22-.08-.37-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.51.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.18-1.4-1.31-1.63-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.35-.76-1.84-.2-.48-.4-.42-.55-.42h-.13" />
    </svg>
  );
}

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function ContactForm({ whatsappNumber }: { whatsappNumber?: string }) {
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

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-text-muted sm:flex-row sm:justify-center sm:gap-6">
          <a href="mailto:support@crestonmarkets.com" className="hover:text-gold">
            support@crestonmarkets.com
          </a>
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-gold"
            >
              <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
              {whatsappNumber}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
