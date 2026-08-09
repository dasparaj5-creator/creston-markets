"use client";

import { motion } from "framer-motion";
import { Share2, UserCheck, Gift } from "lucide-react";

const steps = [
  { icon: Share2, title: "Share Your Link", desc: "Every account gets a unique referral link." },
  { icon: UserCheck, title: "Friend Registers & Invests", desc: "They sign up and complete their first deposit." },
  { icon: Gift, title: "Stay Active 30 Days", desc: "After 30 days of active status, you earn a flat bonus." },
];

export default function ReferralExplainer() {
  return (
    <section className="border-y border-white/5 bg-slate-surface/40 py-20">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Referral Program</h2>
        <p className="mx-auto mt-3 max-w-2xl text-text-muted">
          Refer a friend. When they invest and remain active for 30 days, you earn a flat bonus.
          Single tier only — no downlines, no multi-level structure.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-6"
            >
              <s.icon className="mx-auto mb-3 h-6 w-6 text-gold" />
              <h3 className="font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
