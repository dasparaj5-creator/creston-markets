import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { RISK_DISCLOSURE_TEXT } from "@/components/shared/RiskBanner";

export default function PublicFooter() {
  return (
    <footer className="border-t border-white/5 bg-slate-surface/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 text-sm text-text-muted">
              Institutional-grade algorithmic trading. Built for serious investors.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-text-primary">Platform</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="/#plans" className="hover:text-gold">Plans</Link></li>
              <li><Link href="/#features" className="hover:text-gold">Features</Link></li>
              <li><Link href="/#faq" className="hover:text-gold">FAQ</Link></li>
              <li><Link href="/register" className="hover:text-gold">Open Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-text-primary">Legal</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li><Link href="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-gold">Terms of Service</Link></li>
              <li><Link href="/risk-disclaimer" className="hover:text-gold">Risk Disclaimer</Link></li>
              <li><Link href="/cookies" className="hover:text-gold">Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-text-primary">Contact</h4>
            <ul className="space-y-2 text-sm text-text-muted">
              <li>support@crestonmarkets.com</li>
              <li><Link href="/#contact" className="hover:text-gold">Contact Form</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6">
          <p className="text-xs leading-relaxed text-text-muted">{RISK_DISCLOSURE_TEXT}</p>
          <p className="mt-3 text-xs font-medium text-text-muted">
            Creston Markets is not a regulated financial advisor. Investments involve risk.
          </p>
          <p className="mt-4 text-xs text-text-muted/70">
            © {new Date().getFullYear()} Creston Markets. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
