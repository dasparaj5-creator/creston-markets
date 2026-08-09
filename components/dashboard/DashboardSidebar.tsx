"use client";

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

export function DashboardBottomNav() {
  const pathname = usePathname();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/5 bg-slate-surface/95 backdrop-blur-glass lg:hidden">
      {mobileItems.map((item) => {
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
    </nav>
  );
}
