"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

export default function TechFeature({
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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="glass-card p-6"
    >
      <Icon className="mb-4 h-6 w-6 text-electric" />
      <h4 className="font-semibold text-text-primary">{title}</h4>
      <p className="mt-2 text-sm text-text-muted">{children}</p>
    </motion.div>
  );
}
