"use client";

import { motion } from "framer-motion";
import { Coins, TrendingUp, Fuel, Bitcoin } from "lucide-react";

const instruments = [
  { icon: Coins, name: "XAUUSD (Gold)", desc: "Precious metals strategies tracking gold volatility." },
  { icon: TrendingUp, name: "Forex Majors", desc: "EUR/USD, GBP/USD, and other major currency pairs." },
  { icon: Fuel, name: "Commodities", desc: "Crude oil and broader commodities exposure." },
  { icon: Bitcoin, name: "Crypto", desc: "BTC, ETH, and select digital asset strategies." },
];

export default function TradingInstruments() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Trading Instruments</h2>
          <p className="mt-3 text-text-muted">
            Diversified algorithmic strategies across global markets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {instruments.map((inst, i) => (
            <motion.div
              key={inst.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass-card p-6 transition-transform hover:-translate-y-1"
            >
              <inst.icon className="mb-4 h-7 w-7 text-gold" />
              <h3 className="font-semibold text-text-primary">{inst.name}</h3>
              <p className="mt-2 text-sm text-text-muted">{inst.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
