import LegalPage from "@/components/shared/LegalPage";
import RiskBanner from "@/components/shared/RiskBanner";

export default function RiskDisclaimerPage() {
  return (
    <LegalPage title="Risk Disclaimer" updated="August 2026">
      <RiskBanner variant="full" />
      <p>
        Creston Markets operates a Phase 1 demonstration and onboarding environment. In this
        phase, deposit and withdrawal flows are interest-registration only — no real funds are
        transferred, and no live PAMM or MT5 trading connection is active.
      </p>
      <p>
        Trading in financial instruments, including through a PAMM (Percentage Allocation
        Management Module) structure, involves significant risk of loss. Past performance,
        including any illustrative figures shown on this platform, is not indicative of future
        results and should not be relied upon as a guarantee of any outcome.
      </p>
      <p>
        The value of an investment can go down as well as up, and it is possible to lose some or
        all of the capital invested. Creston Markets is not a licensed financial advisor and does
        not provide personalized investment advice. Prospective investors should conduct their
        own due diligence and, where appropriate, consult an independent, licensed financial
        advisor before making any investment decision.
      </p>
      <p>
        Any real-money deposit or withdrawal functionality, and any live performance data, will
        only be enabled once the underlying PAMM/MT5 connection has been established and
        confirmed, and once any required regulatory licensing for accepting client funds has been
        obtained.
      </p>
    </LegalPage>
  );
}
