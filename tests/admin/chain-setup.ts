import { type Page, type BrowserContext, expect } from "@playwright/test";

/**
 * Shared helpers for the 5-layer referral chain test suite. Builds a real
 * A -> B -> C -> D -> E -> F chain via actual referral-link registration,
 * matching exactly how a real user would sign up -- not seeded directly
 * into the database, so this exercises the real registration + referral
 * capture code path end to end.
 *
 * EMAIL CONFIRMATION: this version assumes "Confirm email" is TEMPORARILY
 * DISABLED in Supabase (Authentication -> Providers -> Email -> toggle
 * off), so a freshly registered account can log in immediately with no
 * confirmation step at all. This was the right call after three
 * different attempts at automating/semi-automating the confirmation step
 * itself (yopmail scraping, a terminal keypress prompt, a file-based
 * signal) all hit real friction specific to this VPS/Windows
 * environment -- rather than keep fighting that, removing the need for
 * confirmation entirely is simpler and fully unattended.
 *
 * IMPORTANT: turn "Confirm email" back ON in Supabase immediately after
 * this test run finishes. Leaving it off is a real security/spam
 * exposure on a production auth setup, not just a testing convenience --
 * it should only be off for the few minutes this suite actually runs.
 */

export interface TestChainMember {
  label: string;
  email: string;
  password: string;
  fullName: string;
}

const TIMESTAMP = Date.now();
export const CHAIN: TestChainMember[] = ["A", "B", "C", "D", "E", "F", "G"].map((letter) => ({
  label: `Test-${letter}`,
  email: `crestontest-${letter.toLowerCase()}-${TIMESTAMP}@example.com`,
  password: "TestChainPass123!",
  fullName: `Test Chain ${letter}`,
}));

/**
 * Registers one chain member. If referralCode is omitted, registers
 * without one (an independent signup -- used for the chain root).
 * Assumes email confirmation is disabled (see file header), so no
 * confirmation step happens here -- straight from submit to usable
 * account.
 */
export async function registerChainMember(page: Page, member: TestChainMember, referralCode?: string): Promise<void> {
  const url = referralCode ? `/register?ref=${referralCode}` : "/register";
  await page.goto(url);

  await page.getByPlaceholder("Jane Doe").fill(member.fullName);
  await page.getByPlaceholder("you@example.com").fill(member.email);

  await page.getByRole("combobox").click();
  await page.getByText("United States", { exact: false }).first().click();
  await page.getByPlaceholder("Phone number").fill("2025550100");

  await page.locator('input[name="password"]').fill(member.password);
  await page.locator('input[name="confirmPassword"]').fill(member.password);

  await page.getByRole("checkbox", { name: /terms of service/i }).check();
  await page.getByRole("checkbox", { name: /understand that trading/i }).check();

  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForTimeout(2000);
}

/** Extracts a user's referral code from their own Referral dashboard page. */
export async function getReferralCode(page: Page, member: TestChainMember): Promise<string> {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(member.email);
  await page.locator('input[name="password"]').fill(member.password);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await page.goto("/dashboard/referral");
  const linkText = await page.locator("text=/register\\?ref=/").first().textContent();
  const match = linkText?.match(/ref=([a-zA-Z0-9]+)/);
  if (!match) throw new Error(`Could not extract referral code for ${member.label}`);
  return match[1];
}

/**
 * Logs in as the given member and submits a crypto deposit -- this is a
 * required step this suite was missing: approveFirstDeposit() (in
 * referral-engine.spec.ts) can only approve a deposit that already
 * exists as a pending row, but nothing was ever creating one. This
 * fills the minimum required fields (network defaults to TRC20, picks
 * the first available plan, a fixed amount comfortably above any plan's
 * minimum, and a fake-but-valid-format transaction hash) -- the
 * screenshot upload is genuinely optional per the real form's schema
 * (confirmed by reading CryptoDepositForm.tsx directly), so this
 * doesn't attempt a file upload at all.
 */
export async function submitDeposit(page: Page, member: TestChainMember): Promise<void> {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(member.email);
  await page.locator('input[name="password"]').fill(member.password);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await page.goto("/dashboard/deposit");

  // Pick whichever plan is first in the list (not "-- select a plan --").
  const planSelect = page.locator('select[name="planId"]');
  const options = await planSelect.locator("option").all();
  for (const option of options) {
    const value = await option.getAttribute("value");
    if (value) {
      await planSelect.selectOption(value);
      break;
    }
  }

  // $1000 comfortably clears every current plan's minimum deposit
  // (Bronze $200 / Silver $350 / Gold $500) without needing to look up
  // which plan was actually selected above.
  await page.locator('input[name="amount"]').fill("1000");
  await page.getByPlaceholder(/0x\.\.\. or transaction id/i).fill(`test-tx-${Date.now()}-${member.label}`);

  await page.getByRole("button", { name: /submit deposit for verification/i }).click();
  await page.waitForTimeout(1500);
}

/**
 * Builds the full A->B->C->D->E->F chain (6 people, 5 layers deep from
 * F's perspective). Call once and reuse across depth-specific test
 * cases -- re-registering 6 real accounts per test would be slow.
 */
export async function buildFullChain(context: BrowserContext): Promise<void> {
  const [rootMember, ...rest] = CHAIN.slice(0, 6); // A through F

  const page = await context.newPage();
  await registerChainMember(page, rootMember); // A, no referrer

  let previousMember = rootMember;
  for (const member of rest) {
    const referralCode = await getReferralCode(page, previousMember);
    await registerChainMember(page, member, referralCode);
    previousMember = member;
  }

  await page.close();
}

export async function extendChainWithG(context: BrowserContext): Promise<void> {
  const memberF = CHAIN[5];
  const memberG = CHAIN[6];
  const page = await context.newPage();
  const referralCode = await getReferralCode(page, memberF);
  await registerChainMember(page, memberG, referralCode);
  await page.close();
}
