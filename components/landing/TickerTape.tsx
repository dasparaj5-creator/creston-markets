"use client";

import { useEffect, useRef } from "react";
import { useThemeStore } from "@/lib/theme-store";

const SYMBOLS = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FOREXCOM:NSXUSD", title: "US 100" },
  { proName: "FOREXCOM:DJI", title: "Dow 30" },
  { proName: "FX:EURUSD", title: "EUR/USD" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
  { proName: "OANDA:XAUUSD", title: "Gold" },
  { proName: "OANDA:GBPUSD", title: "GBP/USD" },
  { proName: "OANDA:USDJPY", title: "USD/JPY" },
  { proName: "OANDA:AUDUSD", title: "AUD/USD" },
  { proName: "OANDA:NZDUSD", title: "NZD/USD" },
  { proName: "OANDA:USDCHF", title: "USD/CHF" },
  { proName: "OANDA:USDCAD", title: "USD/CAD" },
];

/**
 * TradingView ticker tape via the classic iframe-embed widget script.
 * This is TradingView's officially documented embed pattern -- it
 * auto-scrolls on its own (no hover needed) and supports a genuinely
 * transparent background via isTransparent, unlike the newer
 * <tv-ticker-tape> custom element which doesn't expose that reliably.
 *
 * The script must be re-injected whenever config (like colorTheme) needs
 * to change, since TradingView's embed scripts read their JSON config once
 * at injection time and render a static iframe from it.
 */
export default function TickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: SYMBOLS,
      showSymbolLogo: true,
      colorTheme: theme,
      isTransparent: true,
      displayMode: "adaptive",
      locale: "en",
    });
    container.appendChild(script);
  }, [theme]);

  return (
    <div className="overflow-hidden rounded-xl">
      <div ref={containerRef} className="tradingview-widget-container min-h-[46px]" />
    </div>
  );
}
