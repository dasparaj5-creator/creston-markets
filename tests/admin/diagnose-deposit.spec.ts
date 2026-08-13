import { test } from "@playwright/test";
import { registerChainMember, submitDeposit, type TestChainMember } from "./chain-setup";

/**
 * ISOLATED DIAGNOSTIC -- not part of the main suite. Registers ONE fresh
 * test account and attempts ONE deposit submission, nothing else. Run
 * this headed (--headed flag) so you can literally watch what happens
 * on the deposit page and see exactly where it breaks, rather than
 * inferring from a timeout three steps later in the full 16-minute
 * chain-building suite.
 *
 * Run with:
 *   npx playwright test tests/admin/diagnose-deposit.spec.ts --headed --project=chromium
 *
 * No ADMIN_EMAIL or RUN_REFERRAL_CHAIN_TESTS needed for this one --
 * it doesn't touch the admin panel or build a chain, just registration
 * + deposit as a single throwaway account.
 */

test("DIAGNOSTIC: register one account and submit one deposit, watch it happen", async ({ page }) => {
  const member: TestChainMember = {
    label: "Diag-Test",
    email: `diag-test-${Date.now()}@example.com`,
    password: "TestChainPass123!",
    fullName: "Diagnostic Test User",
  };

  console.log(`\n>>> Registering ${member.email}...`);
  await registerChainMember(page, member);
  console.log(">>> Registration step completed. Now attempting deposit submission...\n");

  // Slow this step down deliberately so it's actually watchable, not a
  // blur of instant actions.
  await page.waitForTimeout(2000);

  await submitDeposit(page, member);
  console.log(">>> Deposit submission completed successfully.\n");
});
