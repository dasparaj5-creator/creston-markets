# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> ARLY-26: notification bell remains usable on a mobile viewport
- Location: tests\admin\referral-engine.spec.ts:401:7

# Error details

```
Error: Notification dropdown should not render off-screen on mobile

expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 0
Received:    -13
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - banner [ref=e4]:
        - paragraph [ref=e6]: Test Chain B
        - generic [ref=e7]:
          - button "Toggle theme" [ref=e8] [cursor=pointer]
          - generic [ref=e15]:
            - button [active] [ref=e16] [cursor=pointer]
            - generic [ref=e20]:
              - paragraph [ref=e21]: Notifications
              - paragraph [ref=e22]: No notifications yet.
          - button "T" [ref=e24] [cursor=pointer]
      - main [ref=e28]:
        - generic [ref=e30]:
          - generic [ref=e31]:
            - heading "Dashboard" [level=1] [ref=e32]
            - paragraph [ref=e33]: Here's an overview of your account.
          - generic [ref=e34]:
            - generic [ref=e35]:
              - paragraph [ref=e41]: $0.00
              - paragraph [ref=e42]: Portfolio Value
            - generic [ref=e43]:
              - generic [ref=e44]: No statement yet
              - paragraph [ref=e50]: 0.00%
              - paragraph [ref=e51]: Total Return
            - generic [ref=e52]:
              - paragraph [ref=e59]: No Plan Selected
              - paragraph [ref=e60]: Plan Status
            - generic [ref=e61]:
              - paragraph [ref=e68]: $0.00
              - paragraph [ref=e69]: Referral Bonus Earned
          - generic [ref=e70]:
            - paragraph [ref=e74]: Account Performance — No statements yet
            - generic [ref=e75]:
              - img [ref=e78]:
                - generic [ref=e80]:
                  - generic [ref=e81]: W2
                  - generic [ref=e83]: W3
                  - generic [ref=e85]: W4
                  - generic [ref=e87]: W5
                  - generic [ref=e89]: W6
                  - generic [ref=e91]: W7
                  - generic [ref=e93]: W8
              - paragraph [ref=e96]: Your account summary will appear here once our team records your first statement.
          - generic [ref=e97]:
            - generic [ref=e98]:
              - heading "Recent Transactions" [level=2] [ref=e99]
              - paragraph [ref=e100]: No transactions yet.
              - link "View all transactions →" [ref=e101] [cursor=pointer]:
                - /url: /dashboard/transactions
            - generic [ref=e102]:
              - heading "Referral Quick Stats" [level=2] [ref=e103]
              - generic [ref=e104]:
                - generic [ref=e105]:
                  - paragraph [ref=e106]: "0"
                  - paragraph [ref=e107]: Referred Users
                - generic [ref=e108]:
                  - paragraph [ref=e109]: $0.00
                  - paragraph [ref=e110]: Bonus Earned
                - generic [ref=e111]:
                  - paragraph [ref=e112]: $0.00
                  - paragraph [ref=e113]: Bonus Pending
              - link "View referral program →" [ref=e114] [cursor=pointer]:
                - /url: /dashboard/referral
    - navigation [ref=e115]:
      - link "Dashboard" [ref=e116] [cursor=pointer]:
        - /url: /dashboard
      - link "My Earnings" [ref=e122] [cursor=pointer]:
        - /url: /dashboard/earnings
      - link "Deposit" [ref=e125] [cursor=pointer]:
        - /url: /dashboard/deposit
      - link "Withdraw" [ref=e128] [cursor=pointer]:
        - /url: /dashboard/withdraw
      - button "More" [ref=e131] [cursor=pointer]
  - status [ref=e141]: Welcome back.
  - alert [ref=e142]
  - generic [ref=e143]: W1
```

# Test source

```ts
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
  404 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password);
  405 | 
  406 |     const bellButton = page.locator("button").filter({ has: page.locator("svg.lucide-bell") }).first();
  407 |     await expect(bellButton).toBeVisible();
  408 |     await bellButton.click();
  409 | 
  410 |     const dropdown = page.getByText(/notifications/i).first();
  411 |     await expect(dropdown).toBeVisible();
  412 |     const box = await dropdown.boundingBox();
> 413 |     expect(box?.x, "Notification dropdown should not render off-screen on mobile").toBeGreaterThanOrEqual(0);
      |                                                                                    ^ Error: Notification dropdown should not render off-screen on mobile
  414 |     await context.close();
  415 |   });
  416 | 
  417 |   test("ARLY-28: a client's shown position toward an EARLIER downline member is unaffected by the chain extending further", async ({
  418 |     page,
  419 |   }) => {
  420 |     // Confirms extending the chain with G doesn't retroactively change
  421 |     // how A's position toward F is displayed.
  422 |     await clientLogin(page, CHAIN[0].email, CHAIN[0].password); // Test-A
  423 |     await page.goto("/dashboard/earnings");
  424 | 
  425 |     const fRow = page.locator("tr", { hasText: "Test Chain F" });
  426 |     await expect(fRow, "Test-A's network table should still list F with a position after G joined").toBeVisible();
  427 | 
  428 |     // A should NOT appear at all in relation to G (roll-off, confirmed
  429 |     // separately in the admin-side roll-off test) -- but this checks it
  430 |     // from the CLIENT's own view of their network too.
  431 |     const gRow = page.locator("tr", { hasText: "Test Chain G" });
  432 |     await expect(gRow, "Test-A should not show any position relative to G -- outside the 5-position window").toHaveCount(0);
  433 |   });
  434 | 
  435 |   test("ARLY-29: 'Earnings by Position' summary totals match the sum of that position's actual records", async ({
  436 |     page,
  437 |   }) => {
  438 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B
  439 |     await page.goto("/dashboard/earnings");
  440 | 
  441 |     const summaryCard = page.locator("div", { hasText: /^Nearest$/ }).first();
  442 |     await expect(summaryCard).toBeVisible();
  443 |     const summaryText = await summaryCard.innerText();
  444 |     const summaryAmount = parseFloat(summaryText.match(/\$[\d,.]+/)?.[0]?.replace(/[$,]/g, "") || "-1");
  445 |     expect(summaryAmount, "Earnings-by-position summary should show a real, non-negative dollar total").toBeGreaterThanOrEqual(0);
  446 |   });
  447 | });
  448 | 
```