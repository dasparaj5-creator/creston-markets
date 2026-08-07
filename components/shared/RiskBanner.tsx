"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const RISK_DISCLOSURE_TEXT =
  "Trading in financial instruments involves significant risk of loss and may not be suitable for all investors. Past performance does not guarantee future results. The value of your investment can go down as well as up. Please ensure you fully understand the risks before investing. Creston Markets is not a licensed financial advisor. This platform connects investors to a PAMM-managed fund — capital is actively traded in live markets.";

interface RiskBannerProps {
  variant?: "full" | "compact" | "line";
  dismissible?: boolean;
  storageKey?: string;
  className?: string;
}

/**
 * Mandatory risk disclosure banner. Required per spec on: landing page,
 * plans section, register page, deposit page, dashboard home (dismissible),
 * and portfolio page (below every performance figure).
 */
export default function RiskBanner({
  variant = "full",
  dismissible = false,
  storageKey = "cm_risk_banner_dismissed",
  className,
}: RiskBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissible && typeof window !== "undefined") {
      setDismissed(localStorage.getItem(storageKey) === "true");
    }
  }, [dismissible, storageKey]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
    }
  };

  if (variant === "line") {
    return (
      <p className={cn("text-center text-xs text-text-muted", className)}>
        Capital at risk. Past performance is not indicative of future results.
      </p>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("risk-banner flex items-start gap-2", className)}>
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-xs leading-relaxed">{RISK_DISCLOSURE_TEXT}</p>
      </div>
    );
  }

  return (
    <div className={cn("risk-banner flex items-start gap-3", className)}>
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <p className="flex-1 text-sm leading-relaxed text-text-primary/90">
        {RISK_DISCLOSURE_TEXT}
      </p>
      {dismissible && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss risk warning"
          className="shrink-0 rounded-md p-1 text-text-muted hover:bg-white/10 hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
