"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "@/components/shared/Logo";
import ThemeToggle from "@/components/shared/ThemeToggle";

const links = [
  { href: "/#about", label: "About" },
  { href: "/how-we-trade", label: "How We Trade" },
  { href: "/#plans", label: "Plans" },
  { href: "/#features", label: "Features" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
];

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-navy/80 backdrop-blur-glass">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-text-muted transition-colors hover:text-text-primary"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/login" className="text-sm text-text-muted hover:text-text-primary">
            Log In
          </Link>
          <Link href="/register" className="btn-primary !px-5 !py-2 text-sm">
            Open Account
          </Link>
        </div>

        <button
          className="flex h-9 w-9 items-center justify-center text-text-primary md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-navy px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-text-muted hover:text-text-primary"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <Link href="/login" className="btn-secondary flex-1 !py-2 text-sm">
                Log In
              </Link>
              <Link href="/register" className="btn-primary flex-1 !py-2 text-sm">
                Open Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
