# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> 5.2 depth 5 chain: F's deposit pays E through A, all 5 positions
- Location: tests\admin\referral-engine.spec.ts:158:7

# Error details

```
Error: Deposit row for Test Chain D (crestontest-d-1786655587511@example.com) never appeared on /admin/approvals even after a reload -- submitDeposit() reported success, so this points to either a delay in the deposit actually being written, or the approvals page filtering it out for a reason not yet understood (e.g. status, pagination). Worth checking that deposit directly in the database.
```

# Page snapshot

```yaml
- generic [active] [ref=f2e1]:
  - generic [ref=f2e3]:
    - generic [ref=f2e4]:
      - link [ref=f2e5] [cursor=pointer]:
        - /url: /
        - img "Creston Markets" [ref=f2e6]
      - heading "Admin Access" [level=1] [ref=f2e11]
      - paragraph [ref=f2e12]: Restricted area. Authorized personnel only.
    - generic [ref=f2e13]:
      - generic [ref=f2e14]:
        - generic [ref=f2e15]: Admin Email
        - textbox [ref=f2e16]
      - generic [ref=f2e17]:
        - generic [ref=f2e18]: Password
        - generic [ref=f2e19]:
          - textbox [ref=f2e20]
          - button "Show password" [ref=f2e21] [cursor=pointer]
      - button "Log In" [ref=f2e25] [cursor=pointer]
  - alert [ref=f2e26]
```

# Test source

```ts
  1   | import { test, expect, type Page, type BrowserContext } from "@playwright/test";
  2   | import { adminLogin, clientLogin } from "./helpers";
  3   | import { buildFullChain, extendChainWithG, submitDeposit, CHAIN } from "./chain-setup";
  4   | 
  5   | /**
  6   |  * Section 5 — The 5-Layer Referral & Earnings Engine
  7   |  * Covers the user's scenario #3 in full: joining bonus and profit share
  8   |  * distribution at every depth from 1 to 5, roll-off beyond depth 5,
  9   |  * historical-rate protection, and notifications.
  10  |  *
  11  |  * This is the highest-stakes file in the suite -- it verifies real money
  12  |  * math, not just UI presence. Run it deliberately, not as a quick smoke
  13  |  * check, and read failures carefully rather than just re-running.
  14  |  *
  15  |  * REQUIRES: ADMIN_EMAIL, ADMIN_PASSWORD, and an environment where the
  16  |  * 6-7 test accounts built in chain-setup.ts can actually complete
  17  |  * registration (see that file's header for the email-confirmation caveat).
  18  |  */
  19  | 
  20  | const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
  21  | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  22  | const RUN_CHAIN_TESTS = process.env.RUN_REFERRAL_CHAIN_TESTS === "true";
  23  | 
  24  | async function approveFirstDeposit(page: Page, context: BrowserContext, clientEmail: string) {
  25  |   // First, actually SUBMIT the deposit as that client -- this step was
  26  |   // missing entirely in the original version of this suite, which
  27  |   // assumed a pending deposit already existed and only automated the
  28  |   // admin-side approval click. Uses a separate page/tab so the client's
  29  |   // login session doesn't clobber the admin session already active on
  30  |   // `page`.
  31  |   const clientPage = await context.newPage();
  32  |   const member = CHAIN.find((m) => m.email === clientEmail);
  33  |   if (!member) throw new Error(`No chain member found for email ${clientEmail}`);
  34  |   await submitDeposit(clientPage, member);
  35  |   await clientPage.close();
  36  | 
  37  |   // submitDeposit() already waits for the client-side "Deposit
  38  |   // submitted" confirmation toast before returning, so the write has
  39  |   // happened by this point. Always do a fresh navigation to /admin/
  40  |   // approvals, and retry once with a reload if the row doesn't show up
  41  |   // immediately -- cheap insurance against any real propagation delay.
  42  |   await page.goto("/admin/approvals");
  43  |   // IMPORTANT: the approvals table renders `full_name || email` per row
  44  |   // (confirmed by reading ApprovalsTabs.tsx directly) -- since every
  45  |   // chain member has a fullName set ("Test Chain B", etc.), the row's
  46  |   // visible text is the NAME, never the email. Searching by email here
  47  |   // was the actual root cause of every single depth test timing out
  48  |   // waiting for a row that could genuinely never match, regardless of
  49  |   // whether the deposit existed -- not a timing/propagation issue at
  50  |   // all, a wrong selector matching against the wrong field.
  51  |   const row = page.locator("tr", { hasText: member.fullName });
  52  | 
  53  |   const foundOnFirstTry = await row.isVisible({ timeout: 5000 }).catch(() => false);
  54  |   if (!foundOnFirstTry) {
  55  |     await page.reload();
  56  |     const foundAfterReload = await row.isVisible({ timeout: 10000 }).catch(() => false);
  57  |     if (!foundAfterReload) {
> 58  |       throw new Error(
      |             ^ Error: Deposit row for Test Chain D (crestontest-d-1786655587511@example.com) never appeared on /admin/approvals even after a reload -- submitDeposit() reported success, so this points to either a delay in the deposit actually being written, or the approvals page filtering it out for a reason not yet understood (e.g. status, pagination). Worth checking that deposit directly in the database.
  59  |         `Deposit row for ${member.fullName} (${clientEmail}) never appeared on /admin/approvals even after a reload -- submitDeposit() reported success, so this points to either a delay in the deposit actually being written, or the approvals page filtering it out for a reason not yet understood (e.g. status, pagination). Worth checking that deposit directly in the database.`
  60  |       );
  61  |     }
  62  |   }
  63  | 
  64  |   await row.getByRole("button", { name: /approve/i }).click();
  65  | }
  66  | 
  67  | test.describe("5-Layer Referral & Earnings Engine", () => {
  68  |   test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");
  69  |   test.skip(
  70  |     !RUN_CHAIN_TESTS,
  71  |     "Set RUN_REFERRAL_CHAIN_TESTS=true to run the full chain suite -- it registers 7 real test accounts and should be run deliberately, not on every CI trigger"
  72  |   );
  73  | 
  74  |   // Building the chain involves 6 real registrations, each pausing for a
  75  |   // human to manually confirm an email in Gmail before continuing --
  76  |   // Playwright's default 30s beforeAll timeout is nowhere near enough
  77  |   // time for that (it was hit mid-confirmation on the first account in
  78  |   // an earlier run, at exactly 30s). beforeAll/afterAll hooks have their
  79  |   // OWN separate timeout from regular tests, changed by calling
  80  |   // test.setTimeout() from INSIDE the hook -- 20 minutes here
  81  |   // comfortably covers 6 confirmations even at a relaxed, unhurried pace.
  82  |   test.beforeAll(async ({ browser }) => {
  83  |     test.setTimeout(20 * 60 * 1000);
  84  |     const context = await browser.newContext();
  85  |     await buildFullChain(context);
  86  |     await context.close();
  87  |   });
  88  | 
  89  |   test("5.2 depth 1: A has no upline, earns nothing on their own signup", async ({ page }) => {
  90  |     await adminLogin(page);
  91  |     await page.goto("/admin/earnings");
  92  |     const aRows = page.locator("tr", { hasText: "Test Chain A" });
  93  |     const countBefore = await aRows.count();
  94  |     expect(countBefore).toBe(0);
  95  |   });
  96  | 
  97  |   test("5.2 depth 1 chain: B's deposit pays A the full 1-layer amount", async ({ page, context }) => {
  98  |     await adminLogin(page);
  99  |     await approveFirstDeposit(page, context, CHAIN[1].email); // Test-B
  100 | 
  101 |     await page.goto("/admin/earnings");
  102 |     const aRow = page.locator("tr", { hasText: "Test Chain A" }).first();
  103 |     await expect(aRow).toBeVisible({ timeout: 10000 });
  104 |     await expect(aRow.getByText("$25")).toBeVisible();
  105 |     await expect(aRow.getByText(/nearest|1-layer/i)).toBeVisible();
  106 |   });
  107 | 
  108 |   test("5.2 depth 2 chain: C's deposit splits between B (nearest, more) and A (less)", async ({ page, context }) => {
  109 |     await adminLogin(page);
  110 |     await approveFirstDeposit(page, context, CHAIN[2].email); // Test-C
  111 | 
  112 |     await page.goto("/admin/earnings");
  113 |     const bRow = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "2-layer" });
  114 |     const aRow = page.locator("tr", { hasText: "Test Chain A" }).filter({ hasText: "2-layer" });
  115 | 
  116 |     await expect(bRow).toBeVisible({ timeout: 10000 });
  117 |     await expect(aRow).toBeVisible();
  118 | 
  119 |     const bAmountText = await bRow.locator("td").filter({ hasText: "$" }).first().textContent();
  120 |     const aAmountText = await aRow.locator("td").filter({ hasText: "$" }).first().textContent();
  121 |     const bAmount = parseFloat(bAmountText?.replace(/[^0-9.]/g, "") || "0");
  122 |     const aAmount = parseFloat(aAmountText?.replace(/[^0-9.]/g, "") || "0");
  123 |     expect(bAmount, "Nearer upline (B) should earn more than further upline (A)").toBeGreaterThan(aAmount);
  124 |   });
  125 | 
  126 |   test("ARLY-09: sum-check -- total joining bonus paid across all positions equals exactly $25, at every depth", async ({
  127 |     page,
  128 |   }) => {
  129 |     // Re-verifies depth 2 as a concrete sum-check rather than just a "B >
  130 |     // A" ordering check. Runs AFTER the depth-2 test above (not before),
  131 |     // since it depends on that test's approveFirstDeposit(C) call having
  132 |     // already created the 2-layer commission records it reads here --
  133 |     // this test was originally placed too early in the file, before that
  134 |     // data existed, causing it to hang waiting for elements that would
  135 |     // never appear until it hit the 30s timeout and failed. That failure
  136 |     // was destabilizing the Playwright worker process, forcing beforeAll
  137 |     // to re-run and rebuild the ENTIRE chain from scratch on the next
  138 |     // test -- which is what caused the repeated "confirm 6 more emails"
  139 |     // cycles seen during manual testing. Correct ordering fixes both the
  140 |     // false failure and the chain-rebuild loop in one fix.
  141 |     await adminLogin(page);
  142 |     await page.goto("/admin/earnings");
  143 | 
  144 |     const bRow = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "2-layer" }).first();
  145 |     const aRow = page.locator("tr", { hasText: "Test Chain A" }).filter({ hasText: "2-layer" }).first();
  146 | 
  147 |     await expect(bRow).toBeVisible({ timeout: 10000 });
  148 |     await expect(aRow).toBeVisible();
  149 | 
  150 |     const bText = await bRow.locator("td").filter({ hasText: "$" }).first().textContent();
  151 |     const aText = await aRow.locator("td").filter({ hasText: "$" }).first().textContent();
  152 |     const bAmount = parseFloat(bText?.replace(/[^0-9.]/g, "") || "0");
  153 |     const aAmount = parseFloat(aText?.replace(/[^0-9.]/g, "") || "0");
  154 | 
  155 |     expect(bAmount + aAmount, "2-layer joining bonus total should sum to exactly $25 across both positions").toBe(25);
  156 |   });
  157 | 
  158 |   test("5.2 depth 5 chain: F's deposit pays E through A, all 5 positions", async ({ page, context }) => {
```