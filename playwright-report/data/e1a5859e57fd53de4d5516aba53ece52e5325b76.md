# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> 5.6 client sees their live network with correct positions
- Location: tests\admin\referral-engine.spec.ts:300:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/your network/i)
Expected: visible
Error: strict mode violation: getByText(/your network/i) resolved to 2 elements:
    1) <h2 class="mb-1 flex items-center gap-2 text-sm font-semibold text-text-primary">…</h2> aka getByRole('heading', { name: 'Your Network' })
    2) <td colspan="2" class="py-6 text-center text-text-muted">No one in your network yet — share your referral …</td> aka getByRole('cell', { name: 'No one in your network yet —' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/your network/i)

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary [ref=f1e3]:
      - link [ref=f1e5] [cursor=pointer]:
        - /url: /dashboard
        - img "Creston Markets" [ref=f1e6]
      - navigation [ref=f1e7]:
        - link "Dashboard" [ref=f1e8] [cursor=pointer]:
          - /url: /dashboard
        - link "Portfolio" [ref=f1e14] [cursor=pointer]:
          - /url: /dashboard/portfolio
        - link "Referral" [ref=f1e18] [cursor=pointer]:
          - /url: /dashboard/referral
        - link "My Earnings" [ref=f1e23] [cursor=pointer]:
          - /url: /dashboard/earnings
        - link "Deposit" [ref=f1e26] [cursor=pointer]:
          - /url: /dashboard/deposit
        - link "Withdraw" [ref=f1e29] [cursor=pointer]:
          - /url: /dashboard/withdraw
        - link "Transactions" [ref=f1e32] [cursor=pointer]:
          - /url: /dashboard/transactions
        - link "Profile" [ref=f1e36] [cursor=pointer]:
          - /url: /dashboard/profile
        - link "Support" [ref=f1e41] [cursor=pointer]:
          - /url: /dashboard/support
    - generic [ref=f1e49]:
      - banner [ref=f1e50]:
        - paragraph [ref=f1e52]: Welcome back, Test Chain A
        - generic [ref=f1e53]:
          - button "Toggle theme" [ref=f1e54] [cursor=pointer]
          - button [ref=f1e62] [cursor=pointer]
          - button "T" [ref=f1e67] [cursor=pointer]
      - main [ref=f1e71]:
        - generic [ref=f1e73]:
          - generic [ref=f1e74]:
            - heading "My Earnings" [level=1] [ref=f1e75]
            - paragraph [ref=f1e76]: Joining bonuses and profit share across your referral network — up to 5 positions deep.
          - generic [ref=f1e77]:
            - generic [ref=f1e78]:
              - paragraph [ref=f1e83]: $0.00
              - paragraph [ref=f1e84]: Total Paid
            - generic [ref=f1e85]:
              - paragraph [ref=f1e92]: $0.00
              - paragraph [ref=f1e93]: Total Pending
            - generic [ref=f1e94]:
              - paragraph [ref=f1e102]: $0.00
              - paragraph [ref=f1e103]: Joining Bonuses
            - generic [ref=f1e104]:
              - paragraph [ref=f1e110]: $0.00
              - paragraph [ref=f1e111]: Profit Share
          - generic [ref=f1e112]:
            - heading "Earnings by Position" [level=2] [ref=f1e113]
            - generic [ref=f1e114]:
              - generic [ref=f1e115]:
                - paragraph [ref=f1e116]: Nearest
                - paragraph [ref=f1e117]: $0.00
                - paragraph [ref=f1e118]: 0 records
              - generic [ref=f1e119]:
                - paragraph [ref=f1e120]: 2nd
                - paragraph [ref=f1e121]: $0.00
                - paragraph [ref=f1e122]: 0 records
              - generic [ref=f1e123]:
                - paragraph [ref=f1e124]: 3rd
                - paragraph [ref=f1e125]: $0.00
                - paragraph [ref=f1e126]: 0 records
              - generic [ref=f1e127]:
                - paragraph [ref=f1e128]: 4th
                - paragraph [ref=f1e129]: $0.00
                - paragraph [ref=f1e130]: 0 records
              - generic [ref=f1e131]:
                - paragraph [ref=f1e132]: 5th
                - paragraph [ref=f1e133]: $0.00
                - paragraph [ref=f1e134]: 0 records
          - generic [ref=f1e135]:
            - heading "Your Network" [level=2] [ref=f1e136]
            - paragraph [ref=f1e142]: The position shown is where you sit relative to that person — this is exactly what determines your share whenever they trigger a joining bonus or profit share event.
            - table [ref=f1e144]:
              - rowgroup [ref=f1e145]:
                - row [ref=f1e146]:
                  - columnheader "Person" [ref=f1e147]
                  - columnheader "Your Position" [ref=f1e148]
              - rowgroup [ref=f1e149]:
                - row [ref=f1e150]:
                  - cell "No one in your network yet — share your referral link to get started." [ref=f1e151]
          - generic [ref=f1e152]:
            - heading "Earnings Breakdown" [level=2] [ref=f1e153]
            - table [ref=f1e155]:
              - rowgroup [ref=f1e156]:
                - row [ref=f1e157]:
                  - columnheader "From" [ref=f1e158]
                  - columnheader "Position" [ref=f1e159]
                  - columnheader "Type" [ref=f1e160]
                  - columnheader "Rate" [ref=f1e161]
                  - columnheader "Amount" [ref=f1e162]
                  - columnheader "Period" [ref=f1e163]
                  - columnheader "Date" [ref=f1e164]
                  - columnheader "Status" [ref=f1e165]
              - rowgroup [ref=f1e166]:
                - row [ref=f1e167]:
                  - cell "No earnings yet. Refer investors to start earning across up to 5 levels." [ref=f1e168]
  - alert [ref=f1e169]
```

# Test source

```ts
  203 |   test("5.3 first settlement establishes a baseline, pays nothing yet", async ({ page }) => {
  204 |     await adminLogin(page);
  205 |     await page.goto("/admin/reconciliation");
  206 |     const userSelect = page.locator("select").first();
  207 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
  208 |     await userSelect.selectOption(fValue!);
  209 |     await page.getByLabel(/balance/i).fill("1000");
  210 |     await page.getByRole("checkbox", { name: /mark as official settlement/i }).check();
  211 |     await page.getByPlaceholder(/january 2026/i).fill("Test Period 1");
  212 |     await page.getByRole("button", { name: /save reconciliation entry/i }).click();
  213 |     // Real toast text for a settlement entry differs from a routine one
  214 |     // (confirmed in ReconciliationForm.tsx) -- these tests all check
  215 |     // the settlement checkbox, so the correct text is "Settlement
  216 |     // recorded...", never the generic "Entry saved".
  217 |     await expect(page.getByText(/settlement recorded/i)).toBeVisible();
  218 | 
  219 |     await page.goto("/admin/earnings");
  220 |     const profitShareRows = page.locator("tr", { hasText: "Test Chain F" }).filter({ hasText: /profit share/i });
  221 |     await expect(
  222 |       profitShareRows,
  223 |       "First settlement has no prior baseline -- should create zero profit-share records"
  224 |     ).toHaveCount(0);
  225 |   });
  226 | 
  227 |   test("5.3 second settlement with a gain pays upline correctly", async ({ page }) => {
  228 |     await adminLogin(page);
  229 |     await page.goto("/admin/reconciliation");
  230 |     const userSelect = page.locator("select").first();
  231 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
  232 |     await userSelect.selectOption(fValue!);
  233 |     await page.getByLabel(/balance/i).fill("1200"); // $200 gain from the 1000 baseline
  234 |     await page.getByRole("checkbox", { name: /mark as official settlement/i }).check();
  235 |     await page.getByPlaceholder(/january 2026/i).fill("Test Period 2");
  236 |     await page.getByRole("button", { name: /save reconciliation entry/i }).click();
  237 |     // Real toast text for a settlement entry differs from a routine one
  238 |     // (confirmed in ReconciliationForm.tsx) -- these tests all check
  239 |     // the settlement checkbox, so the correct text is "Settlement
  240 |     // recorded...", never the generic "Entry saved".
  241 |     await expect(page.getByText(/settlement recorded/i)).toBeVisible();
  242 | 
  243 |     await page.goto("/admin/earnings");
  244 |     const eProfitRow = page.locator("tr", { hasText: "Test Chain E" }).filter({ hasText: /profit share/i });
  245 |     await expect(eProfitRow, "E (nearest to F) should have a profit-share record from the $200 gain").toBeVisible({
  246 |       timeout: 10000,
  247 |     });
  248 |   });
  249 | 
  250 |   test("5.3 a settlement with a LOWER balance pays nothing", async ({ page }) => {
  251 |     await adminLogin(page);
  252 |     await page.goto("/admin/reconciliation");
  253 |     const userSelect = page.locator("select").first();
  254 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
  255 |     await userSelect.selectOption(fValue!);
  256 |     await page.getByLabel(/balance/i).fill("900"); // below the 1200 from the prior settlement
  257 |     await page.getByRole("checkbox", { name: /mark as official settlement/i }).check();
  258 |     await page.getByPlaceholder(/january 2026/i).fill("Test Period 3 (Loss)");
  259 |     await page.getByRole("button", { name: /save reconciliation entry/i }).click();
  260 |     // Real toast text for a settlement entry differs from a routine one
  261 |     // (confirmed in ReconciliationForm.tsx) -- these tests all check
  262 |     // the settlement checkbox, so the correct text is "Settlement
  263 |     // recorded...", never the generic "Entry saved".
  264 |     await expect(page.getByText(/settlement recorded/i)).toBeVisible();
  265 | 
  266 |     await page.goto("/admin/earnings");
  267 |     const period3Rows = page.locator("tr", { hasText: "Test Period 3" });
  268 |     await expect(period3Rows, "A settlement showing a loss should create zero new commission records").toHaveCount(0);
  269 |   });
  270 | 
  271 |   test("5.4 config change does not alter already-created commission records", async ({ page }) => {
  272 |     await adminLogin(page);
  273 |     await page.goto("/admin/earnings");
  274 | 
  275 |     const bRowBefore = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "1-layer" }).first();
  276 |     const amountBefore = await bRowBefore.locator("td").filter({ hasText: "$" }).first().textContent();
  277 | 
  278 |     const oneLayerSection = page.locator("text=1 Layer").locator("xpath=ancestor::div[contains(@class,'rounded-xl')]");
  279 |     await oneLayerSection.locator('input[type="number"]').first().fill("999");
  280 |     await page.getByRole("button", { name: /save all tables/i }).click();
  281 |     await expect(page.getByText(/commission config saved/i)).toBeVisible();
  282 | 
  283 |     await page.goto("/admin/earnings");
  284 |     const bRowAfter = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "1-layer" }).first();
  285 |     const amountAfter = await bRowAfter.locator("td").filter({ hasText: "$" }).first().textContent();
  286 |     expect(amountAfter, "Historical commission record changed after a config update -- rate-freezing is broken").toBe(
  287 |       amountBefore
  288 |     );
  289 |   });
  290 | 
  291 |   test("5.5 notification fires for the beneficiary after a joining bonus event", async ({ page }) => {
  292 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B, earned from C's deposit
  293 |     // Use the same reliable bell selector as ARLY-21/22 below, rather
  294 |     // than a positional "2nd icon button in the header" guess, which is
  295 |     // fragile to any unrelated header change.
  296 |     await page.locator("button").filter({ has: page.locator("svg.lucide-bell") }).first().click();
  297 |     await expect(page.getByText(/joining bonus/i)).toBeVisible({ timeout: 10000 });
  298 |   });
  299 | 
  300 |   test("5.6 client sees their live network with correct positions", async ({ page }) => {
  301 |     await clientLogin(page, CHAIN[0].email, CHAIN[0].password); // Test-A
  302 |     await page.goto("/dashboard/earnings");
> 303 |     await expect(page.getByText(/your network/i)).toBeVisible();
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  304 |     const bRow = page.locator("tr", { hasText: "Test Chain B" });
  305 |     await expect(bRow.getByText(/nearest/i)).toBeVisible();
  306 |   });
  307 | 
  308 |   test("ARLY-19: config editor shows all 5 depth tables with the correct row count each", async ({ page }) => {
  309 |     await adminLogin(page);
  310 |     await page.goto("/admin/earnings");
  311 | 
  312 |     for (const depth of [1, 2, 3, 4, 5]) {
  313 |       const tableSection = page.locator("text=" + `${depth} Layer${depth > 1 ? "s" : ""}`).locator(
  314 |         "xpath=ancestor::div[contains(@class,'rounded-xl')]"
  315 |       );
  316 |       await expect(tableSection).toBeVisible();
  317 |       const rowCount = await tableSection.locator("tbody tr").count();
  318 |       expect(rowCount, `${depth}-layer table should have exactly ${depth} position row(s)`).toBe(depth);
  319 |     }
  320 |   });
  321 | 
  322 |   test("ARLY-20: disabling a position's joining bonus doesn't affect its profit share", async ({ page }) => {
  323 |     await adminLogin(page);
  324 |     await page.goto("/admin/earnings");
  325 | 
  326 |     const twoLayerSection = page.locator("text=2 Layers").locator("xpath=ancestor::div[contains(@class,'rounded-xl')]");
  327 |     const firstRowBonusCheckbox = twoLayerSection.locator("tbody tr").first().locator('input[type="checkbox"]').first();
  328 |     await firstRowBonusCheckbox.uncheck();
  329 |     await page.getByRole("button", { name: /save all tables/i }).click();
  330 |     await expect(page.getByText(/commission config saved/i)).toBeVisible();
  331 | 
  332 |     // The profit-share checkbox in the same row should remain untouched.
  333 |     const firstRowProfitCheckbox = twoLayerSection.locator("tbody tr").first().locator('input[type="checkbox"]').last();
  334 |     await expect(firstRowProfitCheckbox).toBeChecked();
  335 | 
  336 |     // Re-enable it afterward so this test doesn't leave live config in a
  337 |     // degraded state for anyone running the suite again.
  338 |     await firstRowBonusCheckbox.check();
  339 |     await page.getByRole("button", { name: /save all tables/i }).click();
  340 |   });
  341 | 
  342 |   test("ARLY-21/22: notification correctly names the source user and the position earned", async ({ page }) => {
  343 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B
  344 |     await page.locator("button").filter({ has: page.locator("svg.lucide-bell") }).first().click();
  345 | 
  346 |     await expect(page.getByText(/notifications/i).first()).toBeVisible();
  347 |     await expect(page.getByText(/joining bonus/i)).toBeVisible({ timeout: 10000 });
  348 |     // The message should reference the masked name of whoever triggered
  349 |     // it (Test-C in this case) and the position earned (Nearest/1st).
  350 |     await expect(page.getByText(/nearest|1st/i)).toBeVisible();
  351 |   });
  352 | 
  353 |   test("ARLY-23: opening the bell clears the unread badge", async ({ page }) => {
  354 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B
  355 |     const bellButton = page.locator("button").filter({ has: page.locator("svg.lucide-bell") }).first();
  356 | 
  357 |     // Look for an unread count badge before opening.
  358 |     const badgeBefore = bellButton.locator("span").filter({ hasText: /^\d+\+?$/ });
  359 |     const hadBadge = (await badgeBefore.count()) > 0;
  360 |     if (!hadBadge) {
  361 |       test.skip(true, "No unread notifications for Test-B at this point in the suite run");
  362 |     }
  363 | 
  364 |     await bellButton.click();
  365 |     await page.waitForTimeout(1000); // allow the mark-as-read update to complete
  366 |     await page.reload();
  367 | 
  368 |     const badgeAfter = bellButton.locator("span").filter({ hasText: /^\d+\+?$/ });
  369 |     await expect(badgeAfter, "Unread badge should be gone after opening and re-loading").toHaveCount(0);
  370 |   });
  371 | 
  372 |   test("ARLY-24: every position in a multi-layer event receives its own notification, not just the nearest", async ({
  373 |     page,
  374 |   }) => {
  375 |     // After the depth-5 chain (F's deposit) earlier in this suite, C, D,
  376 |     // and E should ALL have a notification, not only B (the nearest).
  377 |     for (const member of [CHAIN[2], CHAIN[3], CHAIN[4]]) {
  378 |       // Test-C, Test-D, Test-E
  379 |       const memberPage = await page.context().newPage();
  380 |       await clientLogin(memberPage, member.email, member.password);
  381 |       await memberPage.locator("button").filter({ has: memberPage.locator("svg.lucide-bell") }).first().click();
  382 |       await expect(
  383 |         memberPage.getByText(/joining bonus/i),
  384 |         `${member.label} should have a notification, not just the nearest upline member`
  385 |       ).toBeVisible({ timeout: 10000 });
  386 |       await memberPage.close();
  387 |     }
  388 |   });
  389 | 
  390 |   test("ARLY-25: weekly statement email -- status check, not an assumed feature", async ({ page }) => {
  391 |     // This is intentionally NOT a pass/fail test of email delivery --
  392 |     // there is no confirmed scheduled-email feature in the current
  393 |     // codebase for weekly statements. This test exists to make that gap
  394 |     // explicit and trackable rather than silently absent from the suite.
  395 |     test.skip(
  396 |       true,
  397 |       "GAP: no scheduled weekly statement email feature exists in the current build (confirmed by code review, not just untested). This needs to be logged as a feature request with the dev team, not run as a test until it's built."
  398 |     );
  399 |   });
  400 | 
  401 |   test("ARLY-26: notification bell remains usable on a mobile viewport", async ({ browser }) => {
  402 |     const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  403 |     const page = await context.newPage();
```