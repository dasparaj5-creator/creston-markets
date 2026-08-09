import LegalPage from "@/components/shared/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <p>
        This is a placeholder Privacy Policy for the Creston Markets Phase 1 demonstration
        environment. Replace this content with counsel-reviewed language covering data
        collection, KYC document handling, storage, retention, and user rights before any public
        or production launch.
      </p>
      <p>
        In Phase 1, personal data collected includes account registration details (name, email,
        phone, country) and, where submitted, KYC verification documents stored in a private
        Supabase Storage bucket accessed only via signed URLs.
      </p>
    </LegalPage>
  );
}
