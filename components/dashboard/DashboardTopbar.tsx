"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import ThemeToggle from "@/components/shared/ThemeToggle";
import type { UserProfile } from "@/types";

export default function DashboardTopbar({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking anywhere outside it, and on Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logger.info("User logged out", { userId: profile.id });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-navy/80 px-4 backdrop-blur-glass sm:px-6 lg:pl-6">
      <div className="min-w-0">
        <p className="truncate text-sm text-text-muted">
          <span className="hidden sm:inline">Welcome back, </span>
          <span className="text-text-primary font-medium">{profile.full_name || profile.email}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-muted hover:text-gold">
          <Bell className="h-4 w-4" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-text-primary"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold">
              {(profile.full_name || profile.email).slice(0, 1).toUpperCase()}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-white/10 bg-slate-surface p-1.5 shadow-glass">
              <a
                href="/dashboard/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-muted hover:bg-white/5 hover:text-text-primary"
              >
                <User className="h-4 w-4" /> Profile
              </a>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger hover:bg-danger/10"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
