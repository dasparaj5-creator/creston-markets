"use client";

import { useEffect, useRef } from "react";

const SYMBOLS = [
  { proName: "OANDA:XAUUSD", title: "Gold" },
  { proName: "OANDA:EURUSD", title: "EUR/USD" },
  { proName: "OANDA:GBPUSD", title: "GBP/USD" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
  { proName: "TVC:USOIL", title: "Crude Oil" },
];

/**
 * TradingView ticker tape widget. Loads their embeddable script at runtime.
 * Falls back to a static row if the external script cannot load (e.g. no
 * network access in dev/sandbox), so the page never breaks.
 */
export default function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: SYMBOLS,
      showSymbolLogo: true,
      colorTheme: "dark",
      isTransparent: true,
      displayMode: "adaptive",
      locale: "en",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <div ref={containerRef} className="tradingview-widget-container min-h-[46px]">
        {/* Static fallback row, visually replaced once the TradingView script mounts */}
        <div className="flex flex-wrap items-center justify-center gap-6 px-4 py-3 text-xs text-text-muted">
          {SYMBOLS.map((s) => (
            <span key={s.proName}>{s.title}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
