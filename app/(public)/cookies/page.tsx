import LegalPage from "@/components/shared/LegalPage";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 2026">
      <p>
        This Cookie Policy explains how Creston Markets uses cookies and similar technologies when
        you visit our website and use our platform.
      </p>

      <h3>What Are Cookies</h3>
      <p>
        Cookies are small text files stored on your device that help websites remember information
        about your visit, such as your login session or preferences.
      </p>

      <h3>How We Use Cookies</h3>
      <p>We use cookies and browser storage for the following essential purposes only:</p>
      <ul>
        <li><strong>Authentication</strong>: to keep you securely logged in to your account.</li>
        <li><strong>Preferences</strong>: to remember settings such as your preferred theme (light or dark) and whether you've dismissed certain informational banners.</li>
        <li><strong>Security</strong>: to help protect the platform and your account against unauthorized access.</li>
      </ul>

      <h3>What We Don't Use</h3>
      <p>
        We do not use third-party advertising or tracking cookies, and we do not sell any
        information collected through cookies to advertisers or data brokers.
      </p>

      <h3>Managing Cookies</h3>
      <p>
        Most browsers let you control cookies through their settings, including blocking or
        deleting them. Please note that blocking essential cookies (such as those used for
        authentication) will prevent you from logging in or using core features of the platform.
      </p>

      <h3>Changes to This Policy</h3>
      <p>
        We may update this Cookie Policy from time to time. The "Last updated" date at the top of
        this page reflects the most recent revision.
      </p>

      <h3>Contact Us</h3>
      <p>
        If you have questions about our use of cookies, please reach out via our Contact page or
        support@crestonmarkets.com.
      </p>
    </LegalPage>
  );
}
