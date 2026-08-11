"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS_DISPLAY } from "@/lib/plans-data";
import { formatCurrency, cn } from "@/lib/utils";
import RiskBanner from "@/components/shared/RiskBanner";

export default function PlansSection() {
  return (
    <section id="plans" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Investment Plans</h2>
          <p className="mt-3 text-text-muted">
            Choose the plan that matches your investment goals. All returns are variable.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {PLANS_DISPLAY.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={cn(
                "relative flex flex-col p-8",
                plan.popular ? "glass-card-gold scale-[1.02]" : "glass-card"
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-bold text-navy">
                  Most Popular
                </span>
              )}

              <h3 className="text-xl font-bold text-text-primary">{plan.name}</h3>
              <p className="mt-2">
                <span className="text-3xl font-bold text-gold">{formatCurrency(plan.minDeposit)}</span>
                <span className="text-sm text-text-muted"> min. deposit</span>
              </p>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                <li className="flex items-center gap-2 text-text-primary/90">
                  <Check className="h-4 w-4 shrink-0 text-success" /> {plan.allocation} PAMM Allocation
                </li>
                <li className="flex items-center gap-2 text-text-primary/90">
                  <Check className="h-4 w-4 shrink-0 text-success" /> Variable PAMM Performance Returns
                </li>
                <li className="flex items-center gap-2 text-text-primary/90">
                  <Check className="h-4 w-4 shrink-0 text-success" /> {plan.withdrawal} Withdrawal
                </li>
                <li className="flex items-center gap-2 text-text-primary/90">
                  <Check className="h-4 w-4 shrink-0 text-success" /> {plan.support} Support
                </li>
                <li className="flex items-center gap-2 text-text-primary/90">
                  <Check className="h-4 w-4 shrink-0 text-success" /> {plan.reporting}
                </li>
              </ul>

              <Link
                href="/register"
                className={cn("mt-8 w-full text-center", plan.popular ? "btn-primary" : "btn-secondary")}
              >
                Open Account
              </Link>
            </motion.div>
          ))}
        </div>

        <RiskBanner variant="line" className="mx-auto mt-10 max-w-3xl" />
      </div>
    </section>
  );
}
