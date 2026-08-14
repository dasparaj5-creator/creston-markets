"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  PieChart,
  Gift,
  DollarSign,
  Bell,
  LifeBuoy,
  FileText,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GuideSection {
  icon: typeof Wallet;
  title: string;
  summary: string;
  details: string[];
  link?: { href: string; label: string };
}

const sections: GuideSection[] = [
  {
    icon: UserPlus,
    title: "Your Profile & KYC",
    summary: "Where your identity documents and account details live.",
    details: [
      "Upload and manage your KYC documents (front & back per document type) from your Profile page.",
      "Once approved by our team, your KYC status updates automatically, you'll see it reflected right on your dashboard.",
      "Your phone, country, and contact details can be updated here at any time.",
    ],
    link: { href: "/dashboard/profile", label: "Go to Profile" },
  },
  {
    icon: Wallet,
    title: "Plans & Deposits",
    summary: "How your capital gets allocated and funded.",
    details: [
      "Your current plan (Bronze, Silver, or Gold) determines your withdrawal schedule and statement frequency.",
      "Want to move to a higher plan? You can upgrade at any time by paying the difference between your current and target plan's minimum.",
      "Every deposit is made via USDT (ERC20/TRC20/BEP20) and manually verified by our team, typically within 6-8 hours.",
    ],
    link: { href: "/dashboard/deposit", label: "Go to Deposit" },
  },
  {
    icon: PieChart,
    title: "Portfolio & Statements",
    summary: "Tracking your account's real performance.",
    details: [
      "Your Portfolio page shows your live balance, profit/loss, and return percentage, updated as our team reconciles account performance.",
      "Custom date-range account summaries can be exported to Excel or PDF at any time.",
      "Depending on your plan, you'll also automatically receive a statement by email, weekly (Gold), every 15 days (Silver), or monthly (Bronze).",
    ],
    link: { href: "/dashboard/portfolio", label: "Go to Portfolio" },
  },
  {
    icon: ArrowUpFromLine,
    title: "Withdrawals",
    summary: "Getting your funds out, securely.",
    details: [
      "Withdrawals are processed in USDT to a wallet address you provide, choose your network (ERC20/TRC20/BEP20) at request time.",
      "Double-check your wallet address and network before submitting, incorrect details can't be recovered once a payment is sent.",
      "Your plan determines how often you can withdraw: monthly (Bronze), bi-weekly (Silver), or weekly (Gold).",
    ],
    link: { href: "/dashboard/withdraw", label: "Go to Withdraw" },
  },
  {
    icon: Gift,
    title: "Referrals",
    summary: "Growing, and earning from, your own network.",
    details: [
      "Your personal referral link is on the Referral page, share it, and anyone who signs up through it becomes part of your network.",
      "Rewards flow across up to 5 levels deep. The person closest to a new joiner always earns the most; positions further away earn progressively less.",
      "If someone in your network refers someone new, you'll get a notification the moment they earn their first commission from it.",
    ],
    link: { href: "/dashboard/referral", label: "Go to Referral" },
  },
  {
    icon: DollarSign,
    title: "My Earnings",
    summary: "Exactly what you've earned, and from whom.",
    details: [
      "See your total joining bonuses and profit share, broken down by position (Nearest through 5th) in your network.",
      "The 'Your Network' table shows every person in your downline and exactly which position you currently hold relative to them, this is what determines your share whenever they trigger a payout.",
      "Every commission is calculated once and frozen at that rate permanently, even if rates change later, your past earnings are never recalculated.",
    ],
    link: { href: "/dashboard/earnings", label: "Go to My Earnings" },
  },
  {
    icon: Bell,
    title: "Notifications",
    summary: "Staying on top of what's happening in your network.",
    details: [
      "The bell icon in your dashboard header shows real-time alerts whenever you earn a new commission.",
      "Each notification tells you who triggered it and which position you earned it at.",
    ],
  },
  {
    icon: LifeBuoy,
    title: "Support",
    summary: "Getting help directly from our team.",
    details: [
      "Raise a support ticket any time from the Support page, our team responds directly within the same thread.",
      "You'll see status updates (Open, In Progress, Resolved) as your ticket is handled.",
    ],
    link: { href: "/dashboard/support", label: "Go to Support" },
  },
];

export default function DashboardHowItWorksPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">How This Platform Works</h1>
        <p className="mt-1 text-sm text-text-muted">
          A complete, feature-by-feature walkthrough of your dashboard, click any section to
          expand it.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={section.title} className="glass-card overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <section.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-text-primary">{section.title}</p>
                    <p className="mt-0.5 text-sm text-text-muted">{section.summary}</p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-text-muted transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-white/5 px-5 pb-5 pt-4">
                  <ul className="space-y-2.5">
                    {section.details.map((d, di) => (
                      <li key={di} className="flex gap-2.5 text-sm text-text-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                  {section.link && (
                    <Link
                      href={section.link.href}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline"
                    >
                      {section.link.label} <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="glass-card flex items-start gap-3 p-5">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-sm text-text-muted">
          Still have a question this guide doesn't answer? Reach out any time through{" "}
          <Link href="/dashboard/support" className="text-gold hover:underline">
            Support
          </Link>
          , our team is glad to help directly.
        </p>
      </div>
    </div>
  );
}
