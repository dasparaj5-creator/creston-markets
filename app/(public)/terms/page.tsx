import LegalPage from "@/components/shared/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 2026">
      <p>
        This is a placeholder Terms of Service for the Creston Markets Phase 1 demonstration
        environment. Replace this content with counsel-reviewed terms — including eligibility,
        account conduct, the referral program's single-tier flat-bonus structure, and applicable
        law — before any public or production launch.
      </p>
      <p>
        Phase 1 deposit and withdrawal features are interest-registration flows only. No client
        funds are accepted or transferred until live PAMM/MT5 connectivity is confirmed and any
        required regulatory licensing is in place.
      </p>
    </LegalPage>
  );
}
