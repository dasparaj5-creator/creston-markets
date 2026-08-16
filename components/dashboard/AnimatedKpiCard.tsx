"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Genuine visual upgrade over the plain KpiCard, not just a recolor:
 * staggered entrance animation (via the `index` prop, used to offset
 * each card's delay so they animate in sequence rather than all at
 * once), and a subtle gold glow behind the number itself.
 *
 * IMPORTANT: takes `icon` as an already-rendered JSX element (React.ReactNode),
 * NOT a component reference (LucideIcon). This component has "use client"
 * (needed for framer-motion), and its parent (the dashboard page) is a
 * Server Component -- passing a raw component reference like `icon={Wallet}`
 * across that server/client boundary is not allowed in React Server
 * Components (functions can't be serialized across that boundary), and
 * caused a real production crash on every single dashboard page load
 * ("Functions cannot be passed directly to Client Components"). The fix is
 * for the Server Component parent to render the icon itself into JSX
 * (e.g. `icon={<Wallet className="h-4 w-4" />}`) and pass that finished
 * element down instead of the bare component.
 */
export default function AnimatedKpiCard({
  icon,
  label,
  value,
  trend,
  trendPositive,
  index = 0,
  accent = false,
}: {
  icon: React.ReactNode;
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
          {icon}
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
