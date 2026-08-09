"use client";

import { motion } from "framer-motion";
import { Cpu, Layers, LineChart, ShieldCheck, Gift, Headphones } from "lucide-react";

const features = [
  { icon: Cpu, title: "Algorithmic Precision Trading", desc: "Strategies executed systematically, without emotional bias." },
  { icon: Layers, title: "PAMM-Powered Allocation", desc: "Capital pooled and allocated within a transparent PAMM structure." },
  { icon: LineChart, title: "Transparent Performance Reporting", desc: "Clear statements and dashboards to track your account." },
  { icon: ShieldCheck, title: "Secure KYC-Verified Platform", desc: "Identity verification keeps the platform secure for all investors." },
  { icon: Gift, title: "Flat Referral Reward Program", desc: "Earn a fixed bonus for each active investor you refer." },
  { icon: Headphones, title: "Dedicated Support", desc: "Responsive support scaled to your plan tier." },
];

export default function Features() {
  return (
    <section id="features" className="border-y border-white/5 bg-slate-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Features & Benefits</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="glass-card p-6"
            >
              <f.icon className="mb-4 h-6 w-6 text-electric" />
              <h3 className="font-semibold text-text-primary">{f.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
