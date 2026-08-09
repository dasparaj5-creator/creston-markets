import LegalPage from "@/components/shared/LegalPage";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 2026">
      <p>
        This is a placeholder Cookie Policy for the Creston Markets Phase 1 demonstration
        environment. Replace this content with counsel-reviewed language before any public or
        production launch.
      </p>
      <p>
        Creston Markets uses essential cookies for authentication (via Supabase Auth) and local
        storage for theme preference and dismissible banner state. No third-party advertising
        cookies are used.
      </p>
    </LegalPage>
  );
}
