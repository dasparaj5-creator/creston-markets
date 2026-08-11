"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Gift,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  UserCircle,
  LifeBuoy,
  DollarSign,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/shared/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/dashboard/referral", label: "Referral", icon: Gift },
  { href: "/dashboard/earnings", label: "My Earnings", icon: DollarSign },
  { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { href: "/dashboard/transactions", label: "Transactions", icon: Receipt },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/5 bg-slate-surface/60 backdrop-blur-glass lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-text-muted hover:bg-white/5 hover:text-text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// Mobile bottom nav only has room for a handful of icons -- pin the 4 most
// frequently used, and put everything else (including Withdraw, which was
// previously silently cut off once the nav grew past 5 items) behind a
// "More" sheet so nothing is ever inaccessible on mobile again as items
// are added in the future.
const PINNED_MOBILE_ITEMS = ["/dashboard", "/dashboard/deposit", "/dashboard/withdraw", "/dashboard/earnings"];

export function DashboardBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const pinnedItems = navItems.filter((item) => PINNED_MOBILE_ITEMS.includes(item.href));
  const overflowItems = navItems.filter((item) => !PINNED_MOBILE_ITEMS.includes(item.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/5 bg-slate-surface/95 backdrop-blur-glass lg:hidden">
        {pinnedItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                active ? "text-gold" : "text-text-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-text-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-white/10 bg-slate-surface p-4 pb-8">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">More</p>
              <button onClick={() => setMoreOpen(false)} className="text-text-muted hover:text-text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {overflowItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium",
                      active
                        ? "border-gold/30 bg-gold/10 text-gold"
                        : "border-white/10 bg-white/[0.02] text-text-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
