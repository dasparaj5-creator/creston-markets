"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "How does the PAMM work?", a: "PAMM (Percentage Allocation Management Module) pools investor capital that is traded by algorithmic strategies, with performance allocated proportionally to each participant's contribution." },
  { q: "Is my capital safe?", a: "All trading carries risk, and capital invested in a PAMM structure can go down as well as up. Please review our full risk disclosure before investing." },
  { q: "How are returns generated?", a: "Returns are derived from the actual performance of algorithmic trading strategies executed within the PAMM. No return percentage is fixed or guaranteed." },
  { q: "What is the minimum investment?", a: "The minimum deposit starts at $200 for the Bronze plan, $350 for Silver, and $500 for Gold." },
  { q: "How do I withdraw?", a: "Withdrawal requests are submitted from your dashboard and processed according to your plan's withdrawal schedule. In Phase 1, withdrawal is an interest-registration flow only." },
  { q: "What is KYC and why is it required?", a: "KYC (Know Your Customer) verification confirms your identity and is required to help keep the platform secure and compliant." },
  { q: "How does the referral program work?", a: "You earn a flat, one-time bonus after someone you refer registers, makes their first deposit, and remains active for 30 days. It's single-tier, you don't earn from anyone they refer." },
  { q: "Is Creston Markets regulated?", a: "Creston Markets is not a licensed financial advisor. Please review our disclosures and conduct your own due diligence before investing." },
  { q: "What are the fees?", a: "Fee details will be published clearly ahead of any live deposit functionality being enabled." },
  { q: "Can I lose money?", a: "Yes. Trading involves risk, and it is possible to lose some or all of your invested capital." },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-y border-white/5 bg-slate-surface/40 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-text-primary sm:text-4xl">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.q} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-text-primary">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-gold transition-transform",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  openIndex === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm text-text-muted">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
