"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * A real, warm landing point before the data starts -- previously the
 * dashboard jumped straight from the page title into KPI cards with no
 * human moment in between. First name only (not full name) for a
 * genuinely personal, not formal, tone.
 */
export default function WelcomeHero({ fullName }: { fullName: string | null }) {
  const firstName = fullName?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card-gold relative overflow-hidden p-6"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <div className="relative flex items-center gap-2 text-xs font-medium text-gold">
        <Sparkles className="h-3.5 w-3.5" />
        {getGreeting()}
      </div>
      <h1 className="relative mt-1.5 text-2xl font-bold text-text-primary">
        Welcome back, {firstName}
      </h1>
      <p className="relative mt-1 text-sm text-text-muted">{today}, here&apos;s where your account stands.</p>
    </motion.div>
  );
}
