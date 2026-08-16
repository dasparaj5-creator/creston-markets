import LegalPage from "@/components/shared/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <p>
        This Privacy Policy explains how Creston Markets ("we," "us," or "our") collects, uses,
        stores, and protects your personal information when you use our website and platform. By
        registering for an account or otherwise using our services, you agree to the practices
        described in this policy.
      </p>

      <h3>Information We Collect</h3>
      <p>We collect the following categories of information:</p>
      <ul>
        <li><strong>Account registration details</strong>: your full name, email address, phone number, and country of residence, provided when you create an account.</li>
        <li><strong>Identity verification (KYC) documents</strong>: government-issued identification and any other documents you submit to verify your identity, as required by our compliance obligations.</li>
        <li><strong>Financial activity</strong>: records of deposits, withdrawals, plan selections, and account performance associated with your account.</li>
        <li><strong>Referral activity</strong>: if you participate in our referral program, we record referral relationships and associated commission activity.</li>
        <li><strong>Communications</strong>: any messages you send us through support tickets or our contact form.</li>
        <li><strong>Technical information</strong>: standard web request data such as browser type, device information, and IP address, collected automatically as part of normal website operation.</li>
      </ul>

      <h3>How We Store Your Data</h3>
      <p>
        Our platform is built on Supabase, a hosted database and backend infrastructure provider.
        Your account information is stored in a Supabase-managed Postgres database, protected by
        row-level security policies that restrict access so that, in the ordinary course of using
        the platform, you can only access your own data (and platform administrators can access
        what is necessary to operate and support the service).
      </p>
      <p>
        KYC identity documents you submit are stored in a private Supabase Storage bucket that is
        not publicly accessible. Access to these documents is granted only through short-lived,
        signed URLs generated on demand for authorized viewing (such as our compliance team
        reviewing your submission), and these links expire automatically after a short period.
      </p>

      <h3>How We Use Your Information</h3>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Create and manage your account</li>
        <li>Verify your identity and meet applicable regulatory and compliance obligations</li>
        <li>Process deposits, withdrawals, and calculate referral commissions</li>
        <li>Communicate with you about your account, transactions, and support requests</li>
        <li>Maintain the security and integrity of the platform</li>
        <li>Improve our services over time</li>
      </ul>

      <h3>Data Retention</h3>
      <p>
        We retain your personal information for as long as your account remains active, and for a
        reasonable period afterward as necessary to comply with our legal, regulatory, tax, and
        recordkeeping obligations, resolve disputes, and enforce our agreements. KYC documents in
        particular are typically subject to longer statutory retention requirements common to
        regulated financial services.
      </p>

      <h3>Who Can Access Your Data</h3>
      <p>
        Access to your personal information is limited to Creston Markets personnel who need it to
        operate the platform, verify identity, process transactions, or provide support. We do not
        sell your personal information. We may share information with third-party service
        providers who help us operate the platform (such as our infrastructure and hosting
        providers), and where required by law, regulation, or a valid legal process.
      </p>

      <h3>Your Rights</h3>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Request access to the personal information we hold about you</li>
        <li>Request correction of inaccurate information</li>
        <li>Request deletion of your information, subject to our legal and regulatory retention obligations</li>
        <li>Object to or restrict certain processing of your information</li>
      </ul>
      <p>
        To exercise any of these rights, please contact us using the details on our Contact page.
      </p>

      <h3>Cookies</h3>
      <p>
        Our website uses cookies for essential site functionality. See our{" "}
        <a href="/cookies" className="text-gold hover:underline">Cookie Policy</a> for details.
      </p>

      <h3>Security</h3>
      <p>
        We take reasonable technical and organizational measures to protect your personal
        information, including database-level access controls and secure, time-limited access to
        sensitive documents. No method of transmission or storage is completely secure, and we
        cannot guarantee absolute security.
      </p>

      <h3>Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. The "Last updated" date at the top of
        this page reflects the most recent revision. Continued use of the platform after changes
        take effect constitutes acceptance of the revised policy.
      </p>

      <h3>Contact Us</h3>
      <p>
        If you have questions about this Privacy Policy or how your information is handled, please
        reach out via our Contact page or support@crestonmarkets.com.
      </p>
    </LegalPage>
  );
}
