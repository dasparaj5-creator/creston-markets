"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Genuine visual upgrade over the plain KpiCard, not just a recolor:
 * staggered entrance animation (via the `index` prop, used to offset
 * each card's delay so they animate in sequence rather than all at
 * once), and a subtle gold glow behind the number itself -- treating
 * the gold accent as a real signature element rather than flat text,
 * matching the same design language already established in the
 * marketing decks earlier in this project.
 */
export default function AnimatedKpiCard({
  icon: Icon,
  label,
  value,
  trend,
  trendPositive,
  index = 0,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  trendPositive?: boolean;
  index?: number;
  /** When true, renders with a stronger gold treatment -- use for the
   *  single most important figure on the page (e.g. Portfolio Value),
   *  not every card, so it still reads as a highlight rather than
   *  uniform noise. */
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
      className={cn(
        "glass-card relative overflow-hidden p-5",
        accent && "border-gold/30"
      )}
    >
      {accent && (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gold/20 blur-2xl"
          aria-hidden="true"
        />
      )}
      <div className="relative flex items-center justify-between">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            accent ? "bg-gold/20 text-gold" : "bg-gold/10 text-gold"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {trend && (
          <span className={cn("text-xs font-medium", trendPositive ? "text-success" : "text-danger")}>
            {trend}
          </span>
        )}
      </div>
      <p
        className={cn(
          "relative mt-4 font-bold text-text-primary",
          accent ? "text-3xl" : "text-2xl"
        )}
      >
        {value}
      </p>
      <p className="relative mt-1 text-xs text-text-muted">{label}</p>
    </motion.div>
  );
}
