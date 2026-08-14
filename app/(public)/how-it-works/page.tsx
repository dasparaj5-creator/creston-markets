"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  UserPlus,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import RiskBanner from "@/components/shared/RiskBanner";

const steps = [
  {
    icon: UserPlus,
    title: "1. Create Your Account",
    body: "Register with your email (or Google), then verify your identity through our KYC process, required before any deposit can be made.",
  },
  {
    icon: Wallet,
    title: "2. Choose a Plan & Fund Your Account",
    body: "Select Bronze, Silver, or Gold based on your investment goals, then deposit via USDT. Every deposit is manually verified by our team before it's credited.",
  },
  {
    icon: TrendingUp,
    title: "3. Your Capital Trades, Live",
    body: "Once funded, your allocation mirrors our master trading account under the PAMM structure, no separate manual trading required on your part.",
  },
  {
    icon: BarChart3,
    title: "4. Track Performance Anytime",
    body: "Your dashboard shows real-time account performance, statements, and transaction history, full transparency into how your capital is performing.",
  },
  {
    icon: Users,
    title: "5. Earn Through Referrals",
    body: "Invite others to join, and earn a share of joining bonuses and profit share across up to five levels of your referral network.",
  },
  {
    icon: ShieldCheck,
    title: "6. Withdraw With Confidence",
    body: "Request a withdrawal to your USDT wallet whenever you're ready, processed by our team, typically within 6-8 hours.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-navy">
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-mesh px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold"
          >
            How It Works
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-bold text-text-primary sm:text-5xl"
          >
            From Registration to Ongoing Returns
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-text-muted"
          >
            A clear, six-step path from your first visit to an actively managed, transparently
            tracked investment account.
          </motion.p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-card p-6"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mb-2 text-base font-semibold text-text-primary">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gold/20 bg-gold/[0.04] p-10 text-center">
          <h2 className="text-2xl font-bold text-text-primary">Ready to get started?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted">
            Once you register and log in, you'll get access to a full interactive walkthrough of
            every dashboard feature, tailored to your account.
          </p>
          <Link
            href="/register"
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            Open Your Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <RiskBanner variant="line" />
      </div>
    </div>
  );
}
