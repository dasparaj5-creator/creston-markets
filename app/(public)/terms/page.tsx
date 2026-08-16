import LegalPage from "@/components/shared/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of the Creston Markets
        website and platform. By creating an account or otherwise using our services, you agree to
        be bound by these Terms.
      </p>

      <h3>Eligibility</h3>
      <p>
        You must be at least 18 years old and legally capable of entering into a binding agreement
        to use this platform. You are responsible for ensuring that your use of the platform
        complies with the laws applicable in your jurisdiction.
      </p>

      <h3>Account Registration &amp; Verification</h3>
      <p>
        You agree to provide accurate and complete information when registering, and to keep your
        account credentials secure. Identity verification (KYC) is required before deposits can be
        approved. We reserve the right to suspend or hold an account where verification cannot be
        completed or where activity appears inconsistent with these Terms.
      </p>

      <h3>Deposits &amp; Withdrawals</h3>
      <p>
        Deposits are accepted in USDT across supported networks and are manually verified by our
        team before being credited to your account. Withdrawals are processed to a wallet address
        you provide, according to the schedule associated with your plan. You are solely
        responsible for the accuracy of any wallet address and network you provide; transactions
        sent to an incorrect address cannot be recovered.
      </p>

      <h3>Investment Plans &amp; Returns</h3>
      <p>
        Creston Markets offers multiple investment plans with differing minimum deposits and
        withdrawal schedules. All returns are variable and are not guaranteed. Past performance
        does not guarantee future results, and your capital is at risk of loss.
      </p>

      <h3>Referral &amp; Earnings Program</h3>
      <p>
        Our referral program distributes joining bonuses and profit-share earnings across up to
        five levels of an active referral chain. Commission rates are configurable by Creston
        Markets and apply prospectively: a rate change never retroactively alters a commission
        already calculated and recorded. Participation in the referral program does not create an
        employment, agency, or partnership relationship between you and Creston Markets.
      </p>

      <h3>Prohibited Conduct</h3>
      <p>You agree not to:</p>
      <ul>
        <li>Provide false or misleading information during registration or verification</li>
        <li>Use the platform for any unlawful purpose, including money laundering or fraud</li>
        <li>Attempt to circumvent, disable, or interfere with the security or proper functioning of the platform</li>
        <li>Create multiple accounts to exploit the referral program</li>
      </ul>

      <h3>Risk Acknowledgment</h3>
      <p>
        Trading and investment activity carries inherent risk, including the possible loss of some
        or all invested capital. Please review our{" "}
        <a href="/risk-disclaimer" className="text-gold hover:underline">Risk Disclaimer</a> in
        full before depositing funds.
      </p>

      <h3>Account Suspension &amp; Termination</h3>
      <p>
        We reserve the right to suspend or terminate an account, at our discretion, for violation
        of these Terms, suspected fraudulent activity, or as required by applicable law or
        regulatory obligation.
      </p>

      <h3>Limitation of Liability</h3>
      <p>
        To the fullest extent permitted by law, Creston Markets shall not be liable for any
        indirect, incidental, or consequential damages arising from your use of the platform,
        including losses resulting from market performance, third-party wallet errors, or events
        outside our reasonable control.
      </p>

      <h3>Changes to These Terms</h3>
      <p>
        We may update these Terms from time to time. The "Last updated" date at the top of this
        page reflects the most recent revision. Continued use of the platform after changes take
        effect constitutes acceptance of the revised Terms.
      </p>

      <h3>Contact Us</h3>
      <p>
        If you have questions about these Terms, please reach out via our Contact page or
        support@crestonmarkets.com.
      </p>
    </LegalPage>
  );
}
