import Link from "next/link";
import Logo from "@/components/shared/Logo";
import { RISK_DISCLOSURE_TEXT } from "@/components/shared/RiskBanner";
import { createClient } from "@/lib/supabase/server";

// WhatsApp icon as inline SVG (not in the icon set already used
// elsewhere in this project) -- official brand mark, single color so it
// matches the rest of the footer's monochrome link styling.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 4.99L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2m0 1.67a8.23 8.23 0 0 1 8.24 8.24c0 4.55-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.19-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.24 8.23-8.24m-2.98 4.71c-.15 0-.4.06-.61.29-.21.24-.8.78-.8 1.9s.82 2.2.93 2.36c.12.15 1.6 2.44 3.9 3.42 1.93.82 2.33.66 2.75.62.42-.04 1.35-.55 1.54-1.08.19-.53.19-.98.13-1.08-.06-.09-.21-.15-.44-.26-.24-.12-1.4-.69-1.62-.77-.22-.08-.37-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.51.06-.24-.12-1-.37-1.9-1.17-.7-.62-1.18-1.4-1.31-1.63-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.35-.76-1.84-.2-.48-.4-.42-.55-.42h-.13" />
    </svg>
  );
}

export default async function PublicFooter() {
  const supabase = createClient();
  const { data: whatsappSetting } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "whatsapp_number")
    .maybeSingle();
  const whatsappNumber = whatsappSetting?.value?.trim();
  // WhatsApp's click-to-chat link needs digits only, no +/spaces/dashes.
  const whatsappDigits = whatsappNumber?.replace(/[^0-9]/g, "");

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
              {whatsappNumber && whatsappDigits && (
                <li>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gold"
                  >
                    <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
                    {whatsappNumber}
                  </a>
                </li>
              )}
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
