"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  { name: "J. Alderman", role: "Silver Plan Investor", quote: "The dashboard makes it simple to see exactly where things stand with my account." },
  { name: "R. Okafor", role: "Gold Plan Investor", quote: "Clear reporting and responsive support, exactly what I look for in a platform." },
  { name: "M. Lindqvist", role: "Bronze Plan Investor", quote: "Onboarding was straightforward, and the risk disclosures were refreshingly upfront." },
  { name: "S. Patel", role: "Silver Plan Investor", quote: "I appreciate that the platform is clear about what's live and what's still coming." },
];

export default function Testimonials() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">What Investors Say</h2>
          <p className="mt-2 text-xs text-text-muted">Placeholder testimonials for demonstration purposes.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass-card flex flex-col p-6"
            >
              <Quote className="mb-3 h-5 w-5 text-gold/60" />
              <p className="flex-1 text-sm text-text-primary/90">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 border-t border-white/5 pt-4">
                <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                <p className="text-xs text-text-muted">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
