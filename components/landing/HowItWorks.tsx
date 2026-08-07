"use client";

import { motion } from "framer-motion";
import { UserPlus, Wallet, Cpu, BarChart3 } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Register & Complete KYC", desc: "Create your account and verify your identity." },
  { icon: Wallet, title: "Choose Investment Plan & Fund Account", desc: "Select Bronze, Silver, or Gold based on your goals." },
  { icon: Cpu, title: "PAMM Algorithms Trade on Your Behalf", desc: "Your allocation is managed within the PAMM structure." },
  { icon: BarChart3, title: "Monitor Performance via Dashboard", desc: "Track your portfolio through your dashboard." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-white/5 bg-slate-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">How It Works</h2>
          <p className="mt-3 text-text-muted">Four steps from registration to ongoing monitoring.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/30 bg-gold/5">
                <step.icon className="h-6 w-6 text-gold" />
              </div>
              <span className="text-xs font-semibold text-gold">STEP {i + 1}</span>
              <h3 className="mt-2 font-semibold text-text-primary">{step.title}</h3>
              <p className="mt-2 text-sm text-text-muted">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
