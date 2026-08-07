"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Activity, Globe2, LineChart, ShieldCheck } from "lucide-react";

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

const stats = [
  { icon: Activity, value: 5, suffix: "+", label: "Strategies Running" },
  { icon: LineChart, value: null, label: "Assets Traded", custom: "XAUUSD · Forex · Commodities" },
  { icon: ShieldCheck, value: null, label: "PAMM Structure", custom: "Transparent Allocation" },
  { icon: Globe2, value: 20, suffix: "+", label: "Investor Countries" },
];

export default function KeyStats() {
  return (
    <section className="border-y border-white/5 bg-slate-surface/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <stat.icon className="mx-auto mb-3 h-6 w-6 text-gold" />
              <div className="text-2xl font-bold text-text-primary sm:text-3xl">
                {stat.value !== null ? (
                  <Counter target={stat.value} suffix={stat.suffix} />
                ) : (
                  <span className="text-lg sm:text-xl">{stat.custom}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-muted">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
