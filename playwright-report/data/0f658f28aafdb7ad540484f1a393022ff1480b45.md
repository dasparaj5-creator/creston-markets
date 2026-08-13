# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> ARLY-09: sum-check -- total joining bonus paid across all positions equals exactly $25, at every depth
- Location: tests\admin\referral-engine.spec.ts:126:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('tr').filter({ hasText: 'Test Chain B' }).filter({ hasText: '2-layer' }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('tr').filter({ hasText: 'Test Chain B' }).filter({ hasText: '2-layer' }).first()

```

```yaml
- complementary:
  - link "Creston Markets":
    - /url: /admin
    - img "Creston Markets"
  - text: Admin Panel
  - navigation:
    - link "Dashboard":
      - /url: /admin
      - img
      - text: Dashboard
    - link "Users":
      - /url: /admin/users
      - img
      - text: Users
    - link "Reconciliation":
      - /url: /admin/reconciliation
      - img
      - text: Reconciliation
    - link "Referral Bonuses":
      - /url: /admin/referrals
      - img
      - text: Referral Bonuses
    - link "Approvals":
      - /url: /admin/approvals
      - img
      - text: Approvals
    - link "Referral & Earnings":
      - /url: /admin/earnings
      - img
      - text: Referral & Earnings
    - link "Plans":
      - /url: /admin/plans
      - img
      - text: Plans
    - link "Announcements":
      - /url: /admin/announcements
      - img
      - text: Announcements
    - link "Support Tickets":
      - /url: /admin/support
      - img
      - text: Support Tickets
    - link "Reports":
      - /url: /admin/reports
      - img
      - text: Reports
    - link "Settings":
      - /url: /admin/settings
      - img
      - text: Settings
- banner:
  - paragraph: Signed in as admin@crestonmarkets.com
  - button "Log Out":
    - img
    - text: Log Out
- main:
  - heading "Referral & Earnings Management" [level=1]
  - paragraph: 5-table (1 through 5 layers) joining bonus and profit share configuration. Changes only affect future earnings — all past commission records remain frozen at the rate active when they were calculated.
  - heading "Referral & Earnings Configuration" [level=2]
  - img
  - text: Changes apply to future earnings only
  - paragraph: Each chain depth (1 through 5 layers) has its own independent split. The table used for any given payout is whichever matches the ACTUAL number of people in that referral chain — a 3-person chain always uses the 3-layer table below, never a partial slice of the 5-layer one.
  - heading "1 Layer" [level=3]
  - text: "Total: $25.00 · 10.0%"
  - table:
    - rowgroup:
      - row "Position Joining Bonus ($) Enabled Profit Share (%) Enabled":
        - columnheader "Position"
        - columnheader "Joining Bonus ($)"
        - columnheader "Enabled"
        - columnheader "Profit Share (%)"
        - columnheader "Enabled"
    - rowgroup:
      - row "Nearest 25 10":
        - cell "Nearest"
        - cell "25":
          - spinbutton: "25"
        - cell:
          - checkbox [checked]
        - cell "10":
          - spinbutton: "10"
        - cell:
          - checkbox [checked]
  - heading "2 Layers" [level=3]
  - text: "Total: $25.00 · 10.0%"
  - table:
    - rowgroup:
      - row "Position Joining Bonus ($) Enabled Profit Share (%) Enabled":
        - columnheader "Position"
        - columnheader "Joining Bonus ($)"
        - columnheader "Enabled"
        - columnheader "Profit Share (%)"
        - columnheader "Enabled"
    - rowgroup:
      - row "Nearest 15 6":
        - cell "Nearest"
        - cell "15":
          - spinbutton: "15"
        - cell:
          - checkbox [checked]
        - cell "6":
          - spinbutton: "6"
        - cell:
          - checkbox [checked]
      - row "2nd 10 4":
        - cell "2nd"
        - cell "10":
          - spinbutton: "10"
        - cell:
          - checkbox [checked]
        - cell "4":
          - spinbutton: "4"
        - cell:
          - checkbox [checked]
  - heading "3 Layers" [level=3]
  - text: "Total: $25.00 · 10.0%"
  - table:
    - rowgroup:
      - row "Position Joining Bonus ($) Enabled Profit Share (%) Enabled":
        - columnheader "Position"
        - columnheader "Joining Bonus ($)"
        - columnheader "Enabled"
        - columnheader "Profit Share (%)"
        - columnheader "Enabled"
    - rowgroup:
      - row "Nearest 15 4":
        - cell "Nearest"
        - cell "15":
          - spinbutton: "15"
        - cell:
          - checkbox [checked]
        - cell "4":
          - spinbutton: "4"
        - cell:
          - checkbox [checked]
      - row "2nd 6 3.5":
        - cell "2nd"
        - cell "6":
          - spinbutton: "6"
        - cell:
          - checkbox [checked]
        - cell "3.5":
          - spinbutton: "3.5"
        - cell:
          - checkbox [checked]
      - row "3rd 4 2.5":
        - cell "3rd"
        - cell "4":
          - spinbutton: "4"
        - cell:
          - checkbox [checked]
        - cell "2.5":
          - spinbutton: "2.5"
        - cell:
          - checkbox [checked]
  - heading "4 Layers" [level=3]
  - text: "Total: $25.00 · 10.0%"
  - table:
    - rowgroup:
      - row "Position Joining Bonus ($) Enabled Profit Share (%) Enabled":
        - columnheader "Position"
        - columnheader "Joining Bonus ($)"
        - columnheader "Enabled"
        - columnheader "Profit Share (%)"
        - columnheader "Enabled"
    - rowgroup:
      - row "Nearest 15 5":
        - cell "Nearest"
        - cell "15":
          - spinbutton: "15"
        - cell:
          - checkbox [checked]
        - cell "5":
          - spinbutton: "5"
        - cell:
          - checkbox [checked]
      - row "2nd 6 2.5":
        - cell "2nd"
        - cell "6":
          - spinbutton: "6"
        - cell:
          - checkbox [checked]
        - cell "2.5":
          - spinbutton: "2.5"
        - cell:
          - checkbox [checked]
      - row "3rd 3 1.5":
        - cell "3rd"
        - cell "3":
          - spinbutton: "3"
        - cell:
          - checkbox [checked]
        - cell "1.5":
          - spinbutton: "1.5"
        - cell:
          - checkbox [checked]
      - row "4th 1 1":
        - cell "4th"
        - cell "1":
          - spinbutton: "1"
        - cell:
          - checkbox [checked]
        - cell "1":
          - spinbutton: "1"
        - cell:
          - checkbox [checked]
  - heading "5 Layers" [level=3]
  - text: "Total: $26.00 · 10.0%"
  - table:
    - rowgroup:
      - row "Position Joining Bonus ($) Enabled Profit Share (%) Enabled":
        - columnheader "Position"
        - columnheader "Joining Bonus ($)"
        - columnheader "Enabled"
        - columnheader "Profit Share (%)"
        - columnheader "Enabled"
    - rowgroup:
      - row "Nearest 15 5":
        - cell "Nearest"
        - cell "15":
          - spinbutton: "15"
        - cell:
          - checkbox [checked]
        - cell "5":
          - spinbutton: "5"
        - cell:
          - checkbox [checked]
      - row "2nd 5 2":
        - cell "2nd"
        - cell "5":
          - spinbutton: "5"
        - cell:
          - checkbox [checked]
        - cell "2":
          - spinbutton: "2"
        - cell:
          - checkbox [checked]
      - row "3rd 3 1":
        - cell "3rd"
        - cell "3":
          - spinbutton: "3"
        - cell:
          - checkbox [checked]
        - cell "1":
          - spinbutton: "1"
        - cell:
          - checkbox [checked]
      - row "4th 2 1":
        - cell "4th"
        - cell "2":
          - spinbutton: "2"
        - cell:
          - checkbox [checked]
        - cell "1":
          - spinbutton: "1"
        - cell:
          - checkbox [checked]
      - row "5th 1 1":
        - cell "5th"
        - cell "1":
          - spinbutton: "1"
        - cell:
          - checkbox [checked]
        - cell "1":
          - spinbutton: "1"
        - cell:
          - checkbox [checked]
  - button "Save All Tables":
    - img
    - text: Save All Tables
  - heading "Per-User Earnings Breakdown" [level=2]
  - combobox:
    - option "All Types" [selected]
    - option "Joining Bonus"
    - option "Profit Share"
  - combobox:
    - option "Pending" [selected]
    - option "Paid"
    - option "All Statuses"
  - table:
    - rowgroup:
      - row "Beneficiary Source User Position Type Rate Amount Period Date Status":
        - columnheader:
          - button:
            - img
        - columnheader "Beneficiary"
        - columnheader "Source User"
        - columnheader "Position"
        - columnheader "Type"
        - columnheader "Rate"
        - columnheader "Amount"
        - columnheader "Period"
        - columnheader "Date"
        - columnheader "Status"
    - rowgroup:
      - row "No commission records match this filter.":
        - cell "No commission records match this filter."
  - heading "Config Change History" [level=2]
  - table:
    - rowgroup:
      - row "When Who Table Position Field Change":
        - columnheader "When"
        - columnheader "Who"
        - columnheader "Table"
        - columnheader "Position"
        - columnheader "Field"
        - columnheader "Change"
    - rowgroup:
      - row "No config changes recorded yet.":
        - cell "No config changes recorded yet."
- alert
```

# Test source

```ts
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
  58  |       throw new Error(
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
> 147 |     await expect(bRow).toBeVisible({ timeout: 10000 });
      |                        ^ Error: expect(locator).toBeVisible() failed
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
  159 |     await adminLogin(page);
  160 |     await approveFirstDeposit(page, context, CHAIN[3].email); // D
  161 |     await approveFirstDeposit(page, context, CHAIN[4].email); // E
  162 |     await approveFirstDeposit(page, context, CHAIN[5].email); // F
  163 | 
  164 |     await page.goto("/admin/earnings");
  165 |     for (const label of ["Test Chain E", "Test Chain D", "Test Chain C", "Test Chain B", "Test Chain A"]) {
  166 |       const row = page.locator("tr", { hasText: label }).filter({ hasText: "5-layer" });
  167 |       await expect(row, `${label} should have a 5-layer commission record`).toBeVisible({ timeout: 10000 });
  168 |     }
  169 |   });
  170 | 
  171 |   test("5.2 roll-off: G's deposit pays only the nearest 5 (F,E,D,C,B), NOT A", async ({ page, context }) => {
  172 |     await extendChainWithG(context);
  173 |     await adminLogin(page);
  174 |     await approveFirstDeposit(page, context, CHAIN[6].email); // G
  175 | 
  176 |     await page.goto("/admin/earnings");
  177 |     for (const label of ["Test Chain F", "Test Chain E", "Test Chain D", "Test Chain C", "Test Chain B"]) {
  178 |       const row = page.locator("tr", { hasText: label }).filter({ hasText: "Test Chain G" });
  179 |       await expect(row, `${label} should be paid on G's deposit`).toBeVisible({ timeout: 10000 });
  180 |     }
  181 |     const aRowForG = page.locator("tr", { hasText: "Test Chain A" }).filter({ hasText: "Test Chain G" });
  182 |     await expect(
  183 |       aRowForG,
  184 |       "Test Chain A should receive NOTHING from G's deposit -- 6 steps away, outside the 5-position window"
  185 |     ).toHaveCount(0);
  186 |   });
  187 | 
  188 |   test("5.3 first settlement establishes a baseline, pays nothing yet", async ({ page }) => {
  189 |     await adminLogin(page);
  190 |     await page.goto("/admin/reconciliation");
  191 |     const userSelect = page.locator("select").first();
  192 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
  193 |     await userSelect.selectOption(fValue!);
  194 |     await page.getByLabel(/balance/i).fill("1000");
  195 |     await page.getByRole("checkbox", { name: /mark as official settlement/i }).check();
  196 |     await page.getByPlaceholder(/january 2026/i).fill("Test Period 1");
  197 |     await page.getByRole("button", { name: /save reconciliation entry/i }).click();
  198 |     await expect(page.getByText(/entry saved/i)).toBeVisible();
  199 | 
  200 |     await page.goto("/admin/earnings");
  201 |     const profitShareRows = page.locator("tr", { hasText: "Test Chain F" }).filter({ hasText: /profit share/i });
  202 |     await expect(
  203 |       profitShareRows,
  204 |       "First settlement has no prior baseline -- should create zero profit-share records"
  205 |     ).toHaveCount(0);
  206 |   });
  207 | 
  208 |   test("5.3 second settlement with a gain pays upline correctly", async ({ page }) => {
  209 |     await adminLogin(page);
  210 |     await page.goto("/admin/reconciliation");
  211 |     const userSelect = page.locator("select").first();
  212 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
  213 |     await userSelect.selectOption(fValue!);
  214 |     await page.getByLabel(/balance/i).fill("1200"); // $200 gain from the 1000 baseline
  215 |     await page.getByRole("checkbox", { name: /mark as official settlement/i }).check();
  216 |     await page.getByPlaceholder(/january 2026/i).fill("Test Period 2");
  217 |     await page.getByRole("button", { name: /save reconciliation entry/i }).click();
  218 |     await expect(page.getByText(/entry saved/i)).toBeVisible();
  219 | 
  220 |     await page.goto("/admin/earnings");
  221 |     const eProfitRow = page.locator("tr", { hasText: "Test Chain E" }).filter({ hasText: /profit share/i });
  222 |     await expect(eProfitRow, "E (nearest to F) should have a profit-share record from the $200 gain").toBeVisible({
  223 |       timeout: 10000,
  224 |     });
  225 |   });
  226 | 
  227 |   test("5.3 a settlement with a LOWER balance pays nothing", async ({ page }) => {
  228 |     await adminLogin(page);
  229 |     await page.goto("/admin/reconciliation");
  230 |     const userSelect = page.locator("select").first();
  231 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
  232 |     await userSelect.selectOption(fValue!);
  233 |     await page.getByLabel(/balance/i).fill("900"); // below the 1200 from the prior settlement
  234 |     await page.getByRole("checkbox", { name: /mark as official settlement/i }).check();
  235 |     await page.getByPlaceholder(/january 2026/i).fill("Test Period 3 (Loss)");
  236 |     await page.getByRole("button", { name: /save reconciliation entry/i }).click();
  237 |     await expect(page.getByText(/entry saved/i)).toBeVisible();
  238 | 
  239 |     await page.goto("/admin/earnings");
  240 |     const period3Rows = page.locator("tr", { hasText: "Test Period 3" });
  241 |     await expect(period3Rows, "A settlement showing a loss should create zero new commission records").toHaveCount(0);
  242 |   });
  243 | 
  244 |   test("5.4 config change does not alter already-created commission records", async ({ page }) => {
  245 |     await adminLogin(page);
  246 |     await page.goto("/admin/earnings");
  247 | 
```