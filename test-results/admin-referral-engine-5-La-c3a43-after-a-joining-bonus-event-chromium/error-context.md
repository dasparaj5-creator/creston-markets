# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> 5.5 notification fires for the beneficiary after a joining bonus event
- Location: tests\admin\referral-engine.spec.ts:264:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://www.crestonmarkets.com/register
Call log:
  - navigating to "https://www.crestonmarkets.com/register", waiting until "load"

```

# Test source

```ts
  1   | import { type Page, type BrowserContext, expect } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Shared helpers for the 5-layer referral chain test suite. Builds a real
  5   |  * A -> B -> C -> D -> E -> F chain via actual referral-link registration,
  6   |  * matching exactly how a real user would sign up -- not seeded directly
  7   |  * into the database, so this exercises the real registration + referral
  8   |  * capture code path end to end.
  9   |  *
  10  |  * EMAIL CONFIRMATION: this version assumes "Confirm email" is TEMPORARILY
  11  |  * DISABLED in Supabase (Authentication -> Providers -> Email -> toggle
  12  |  * off), so a freshly registered account can log in immediately with no
  13  |  * confirmation step at all. This was the right call after three
  14  |  * different attempts at automating/semi-automating the confirmation step
  15  |  * itself (yopmail scraping, a terminal keypress prompt, a file-based
  16  |  * signal) all hit real friction specific to this VPS/Windows
  17  |  * environment -- rather than keep fighting that, removing the need for
  18  |  * confirmation entirely is simpler and fully unattended.
  19  |  *
  20  |  * IMPORTANT: turn "Confirm email" back ON in Supabase immediately after
  21  |  * this test run finishes. Leaving it off is a real security/spam
  22  |  * exposure on a production auth setup, not just a testing convenience --
  23  |  * it should only be off for the few minutes this suite actually runs.
  24  |  */
  25  | 
  26  | export interface TestChainMember {
  27  |   label: string;
  28  |   email: string;
  29  |   password: string;
  30  |   fullName: string;
  31  | }
  32  | 
  33  | const TIMESTAMP = Date.now();
  34  | export const CHAIN: TestChainMember[] = ["A", "B", "C", "D", "E", "F", "G"].map((letter) => ({
  35  |   label: `Test-${letter}`,
  36  |   email: `crestontest-${letter.toLowerCase()}-${TIMESTAMP}@example.com`,
  37  |   password: "TestChainPass123!",
  38  |   fullName: `Test Chain ${letter}`,
  39  | }));
  40  | 
  41  | /**
  42  |  * Registers one chain member. If referralCode is omitted, registers
  43  |  * without one (an independent signup -- used for the chain root).
  44  |  * Assumes email confirmation is disabled (see file header), so no
  45  |  * confirmation step happens here -- straight from submit to usable
  46  |  * account.
  47  |  */
  48  | export async function registerChainMember(page: Page, member: TestChainMember, referralCode?: string): Promise<void> {
  49  |   const url = referralCode ? `/register?ref=${referralCode}` : "/register";
> 50  |   await page.goto(url);
      |              ^ Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at https://www.crestonmarkets.com/register
  51  | 
  52  |   await page.getByPlaceholder("Jane Doe").fill(member.fullName);
  53  |   await page.getByPlaceholder("you@example.com").fill(member.email);
  54  | 
  55  |   await page.getByRole("combobox").click();
  56  |   await page.getByText("United States", { exact: false }).first().click();
  57  |   await page.getByPlaceholder("Phone number").fill("2025550100");
  58  | 
  59  |   await page.locator('input[name="password"]').fill(member.password);
  60  |   await page.locator('input[name="confirmPassword"]').fill(member.password);
  61  | 
  62  |   await page.getByRole("checkbox", { name: /terms of service/i }).check();
  63  |   await page.getByRole("checkbox", { name: /understand that trading/i }).check();
  64  | 
  65  |   await page.getByRole("button", { name: /create account/i }).click();
  66  |   await page.waitForTimeout(2000);
  67  | }
  68  | 
  69  | /** Extracts a user's referral code from their own Referral dashboard page. */
  70  | export async function getReferralCode(page: Page, member: TestChainMember): Promise<string> {
  71  |   await page.goto("/login");
  72  |   await page.getByPlaceholder("you@example.com").fill(member.email);
  73  |   await page.locator('input[name="password"]').fill(member.password);
  74  |   await page.getByRole("button", { name: /log in/i }).click();
  75  |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  76  | 
  77  |   await page.goto("/dashboard/referral");
  78  |   const linkText = await page.locator("text=/register\\?ref=/").first().textContent();
  79  |   const match = linkText?.match(/ref=([a-zA-Z0-9]+)/);
  80  |   if (!match) throw new Error(`Could not extract referral code for ${member.label}`);
  81  |   return match[1];
  82  | }
  83  | 
  84  | /**
  85  |  * Logs in as the given member and submits a crypto deposit -- this is a
  86  |  * required step this suite was missing: approveFirstDeposit() (in
  87  |  * referral-engine.spec.ts) can only approve a deposit that already
  88  |  * exists as a pending row, but nothing was ever creating one. This
  89  |  * fills the minimum required fields (network defaults to TRC20, picks
  90  |  * the first available plan, a fixed amount comfortably above any plan's
  91  |  * minimum, and a fake-but-valid-format transaction hash) -- the
  92  |  * screenshot upload is genuinely optional per the real form's schema
  93  |  * (confirmed by reading CryptoDepositForm.tsx directly), so this
  94  |  * doesn't attempt a file upload at all.
  95  |  */
  96  | export async function submitDeposit(page: Page, member: TestChainMember): Promise<void> {
  97  |   await page.goto("/login");
  98  |   await page.getByPlaceholder("you@example.com").fill(member.email);
  99  |   await page.locator('input[name="password"]').fill(member.password);
  100 |   await page.getByRole("button", { name: /log in/i }).click();
  101 |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  102 | 
  103 |   await page.goto("/dashboard/deposit");
  104 | 
  105 |   // Pick whichever plan is first in the list (not "-- select a plan --").
  106 |   const planSelect = page.locator('select[name="planId"]');
  107 |   const options = await planSelect.locator("option").all();
  108 |   for (const option of options) {
  109 |     const value = await option.getAttribute("value");
  110 |     if (value) {
  111 |       await planSelect.selectOption(value);
  112 |       break;
  113 |     }
  114 |   }
  115 | 
  116 |   // $1000 comfortably clears every current plan's minimum deposit
  117 |   // (Bronze $200 / Silver $350 / Gold $500) without needing to look up
  118 |   // which plan was actually selected above.
  119 |   await page.locator('input[name="amount"]').fill("1000");
  120 |   await page.getByPlaceholder(/0x\.\.\. or transaction id/i).fill(`test-tx-${Date.now()}-${member.label}`);
  121 | 
  122 |   await page.getByRole("button", { name: /submit deposit for verification/i }).click();
  123 |   await page.waitForTimeout(1500);
  124 | }
  125 | 
  126 | /**
  127 |  * Builds the full A->B->C->D->E->F chain (6 people, 5 layers deep from
  128 |  * F's perspective). Call once and reuse across depth-specific test
  129 |  * cases -- re-registering 6 real accounts per test would be slow.
  130 |  */
  131 | export async function buildFullChain(context: BrowserContext): Promise<void> {
  132 |   const [rootMember, ...rest] = CHAIN.slice(0, 6); // A through F
  133 | 
  134 |   const page = await context.newPage();
  135 |   await registerChainMember(page, rootMember); // A, no referrer
  136 | 
  137 |   let previousMember = rootMember;
  138 |   for (const member of rest) {
  139 |     const referralCode = await getReferralCode(page, previousMember);
  140 |     await registerChainMember(page, member, referralCode);
  141 |     previousMember = member;
  142 |   }
  143 | 
  144 |   await page.close();
  145 | }
  146 | 
  147 | export async function extendChainWithG(context: BrowserContext): Promise<void> {
  148 |   const memberF = CHAIN[5];
  149 |   const memberG = CHAIN[6];
  150 |   const page = await context.newPage();
```