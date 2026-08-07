"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import RiskBanner from "@/components/shared/RiskBanner";
import TickerTape from "@/components/landing/TickerTape";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-hero-mesh px-4 pt-16"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70 transition-all duration-300"
        style={{
          background: `radial-gradient(600px circle at ${glow.x}% ${glow.y}%, rgba(212,175,55,0.12), transparent 40%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl text-center"
      >
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-medium text-gold">
          Phase 1 · Demonstration & Onboarding Environment
        </span>

        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-6xl">
          Algorithmic Trading,{" "}
          <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
            Professionally Managed.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
          Access institutional-grade PAMM-powered trading strategies. Your capital,
          actively managed by algorithms.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register" className="btn-primary w-full sm:w-auto">
            Open Account
          </Link>
          <a href="#how-it-works" className="btn-secondary w-full sm:w-auto">
            How It Works
          </a>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="relative z-10 mt-16 w-full max-w-5xl"
      >
        <TickerTape />
        <div className="mt-4">
          <RiskBanner variant="line" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 z-10"
      >
        <ChevronDown className="h-6 w-6 text-text-muted" />
      </motion.div>
    </section>
  );
}
