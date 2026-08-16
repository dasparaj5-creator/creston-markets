import LegalPage from "@/components/shared/LegalPage";
import RiskBanner from "@/components/shared/RiskBanner";

export default function RiskDisclaimerPage() {
  return (
    <LegalPage title="Risk Disclaimer" updated="August 2026">
      <RiskBanner variant="full" />
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
        Deposits are made via cryptocurrency (USDT) and are manually verified by our team before
        being credited to an account. Withdrawals are processed via cryptocurrency to a wallet
        address you provide. It is your responsibility to ensure all wallet and network details
        you submit are accurate, Creston Markets is not responsible for funds lost due to
        incorrect account or wallet information supplied by the client.
      </p>
      <p>
        Account balances and performance figures are reviewed and recorded by our team as part of
        our standard reconciliation process.
      </p>
    </LegalPage>
  );
}
