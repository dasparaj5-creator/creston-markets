"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Activity,
  Layers,
  Cpu,
  BrainCircuit,
  ShieldAlert,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import StrategyCard from "@/components/landing/StrategyCard";
import TechFeature from "@/components/landing/TechFeature";
import RiskBanner from "@/components/shared/RiskBanner";

export default function HowWeTradePage() {
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
            How We Trade
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl"
          >
            Precision. Diversification.{" "}
            <span className="bg-gradient-to-r from-gold to-gold-light bg-clip-text text-transparent">
              Technology.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-text-muted"
          >
            At Creston Markets, we don&apos;t rely on a single strategy or a single
            market condition. Our trading infrastructure is built around multiple
            independent approaches, each designed to perform across different
            market environments, and each validated before it ever touches live
            capital.
          </motion.p>
        </div>
      </section>

      {/* Core Strategies */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Our Core Strategies</h2>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <StrategyCard icon={Zap} title="Arbitrage Execution" delay={0}>
              We systematically identify and capture pricing inefficiencies across
              correlated instruments and liquidity pools. When the same asset is
              mispriced across venues, even for fractions of a second, our systems
              act. These opportunities are small by nature, which is why we&apos;ve
              engineered our execution infrastructure for speed and precision.
              Arbitrage forms the foundation of our approach: low directional
              risk, rule-based entry and exit, and results that are largely
              independent of broader market direction.
            </StrategyCard>

            <StrategyCard icon={Activity} title="Volatility-Based Market Reading" delay={0.12}>
              Markets move in phases — compression, expansion, and extension. Our
              second strategy family operates by identifying when volatility
              shifts from one phase to another, and positioning accordingly. We
              study price structure, session behavior, liquidity levels, and
              volatility signatures across timeframes to determine when
              conditions are favorable for directional exposure. We don&apos;t
              force trades — we wait for the market to present a clearly defined
              setup, then act with defined risk parameters.
            </StrategyCard>

            <StrategyCard icon={Layers} title="PAMM-Managed Allocation" delay={0.24}>
              All investor capital is allocated through a PAMM (Percentage
              Allocation Management Module) structure, hosted at a regulated
              broker. This means every investor&apos;s allocation mirrors the
              master account proportionally — gains and losses are distributed
              transparently based on your allocation size. There is no pooled
              fund where returns are manufactured; your capital participates in
              the same live trades our desk executes.
            </StrategyCard>
          </div>
        </div>
      </section>

      {/* Technology & Oversight */}
      <section className="border-y border-white/5 bg-slate-surface/40 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-center">
            <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Technology & Oversight</h2>
            <p className="mx-auto mt-3 max-w-2xl text-text-muted">
              We believe serious trading operations require serious
              infrastructure. Our desk operates with:
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <TechFeature icon={Cpu} title="Algorithmic Execution" delay={0}>
              Built in-house for speed, consistency, and elimination of
              emotional bias.
            </TechFeature>
            <TechFeature icon={BrainCircuit} title="AI-Assisted Market Analysis" delay={0.08}>
              Real-time volatility mapping, pattern recognition across
              historical data, and anomaly detection in price behavior.
            </TechFeature>
            <TechFeature icon={ShieldAlert} title="Automated Risk Controls" delay={0.16}>
              Hard stop parameters, drawdown limits, and position sizing rules
              enforced at the system level — not left to discretion.
            </TechFeature>
            <TechFeature icon={LineChart} title="Continuous Performance Monitoring" delay={0.24}>
              Every strategy is tracked independently, with clear metrics
              reviewed regularly to determine whether it remains viable under
              current market conditions.
            </TechFeature>
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-text-muted">
            We use technology as a force multiplier for human judgment, not as a
            replacement for it. Final oversight and risk governance remain with
            our senior desk.
          </p>
        </div>
      </section>

      {/* Risk Management First */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card-gold flex flex-col items-center gap-4 p-10 text-center">
            <ShieldCheck className="h-8 w-8 text-gold" />
            <h2 className="text-2xl font-bold text-text-primary sm:text-3xl">Risk Management First</h2>
            <p className="text-sm leading-relaxed text-text-muted">
              Every strategy we run is subject to the same discipline: defined
              risk per trade, maximum drawdown thresholds, and mandatory review
              periods. If a strategy underperforms against its benchmark for a
              defined period, it is paused and reassessed before resuming.
              Capital preservation is not a secondary objective — it is built
              into every layer of how we operate.
            </p>
          </div>
        </div>
      </section>

      {/* Why This Approach — animated background */}
      <section className="relative overflow-hidden border-y border-white/5 bg-hero-mesh px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-60"
          animate={{
            background: [
              "radial-gradient(600px circle at 20% 30%, rgba(212,175,55,0.10), transparent 40%)",
              "radial-gradient(600px circle at 80% 60%, rgba(0,212,255,0.10), transparent 40%)",
              "radial-gradient(600px circle at 20% 30%, rgba(212,175,55,0.10), transparent 40%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Why This Approach</h2>
          <p className="mt-6 text-sm leading-relaxed text-text-muted">
            Most PAMM offerings rely on a single style of trading. When that
            style falls out of favor with market conditions, performance
            suffers. Our multi-strategy framework is designed specifically to
            reduce this dependency — arbitrage runs when markets are ranging,
            volatility strategies activate when conditions extend, and our risk
            controls ensure no single drawdown event can compromise the overall
            portfolio structure.
          </p>
          <p className="mt-6 text-base font-semibold text-gold">
            We are not promising outcomes. We are demonstrating process.
          </p>
        </div>
      </section>

      {/* Risk disclaimer */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <RiskBanner variant="line" />
          <p className="mt-4 text-center text-xs text-text-muted">
            All trading involves risk. Capital allocated through Creston
            Markets participates in live market activity and is subject to
            loss. Past strategy performance does not guarantee future results.
          </p>
        </div>
      </section>
    </div>
  );
}
