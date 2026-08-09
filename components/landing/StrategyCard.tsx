"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export default function StrategyCard({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="glass-card-gold p-8"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
        <Icon className="h-6 w-6 text-gold" />
      </div>
      <h3 className="text-xl font-bold text-text-primary">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{children}</p>
    </motion.div>
  );
}
