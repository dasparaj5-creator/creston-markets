"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Database,
  Gift,
  CheckSquare,
  Layers,
  Megaphone,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/shared/Logo";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reconciliation", label: "Reconciliation", icon: Database },
  { href: "/admin/referrals", label: "Referral Bonuses", icon: Gift },
  { href: "/admin/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/admin/earnings", label: "Referral & Earnings", icon: Gift },
  { href: "/admin/plans", label: "Plans", icon: Layers },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/5 bg-slate-surface/60 backdrop-blur-glass lg:flex">
      <div className="flex h-16 items-center px-6">
        <Logo href="/admin" />
      </div>
      <div className="px-6 pb-2">
        <span className="badge-warning">Admin Panel</span>
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
