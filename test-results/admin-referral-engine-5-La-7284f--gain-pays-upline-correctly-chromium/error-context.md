# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> 5.3 second settlement with a gain pays upline correctly
- Location: tests\admin\referral-engine.spec.ts:208:7

# Error details

```
Error: locator.getAttribute: Error: strict mode violation: locator('select').first().locator('option').filter({ hasText: /Test Chain F/i }) resolved to 42 elements:
    1) <option value="0d763391-111c-41c3-ba7c-ce6e994d69a5">Test Chain F</option> aka getByRole('combobox')
    2) <option value="32f0fd5f-b550-48e0-be83-3efa8e0e242f">Test Chain F</option> aka getByRole('combobox')
    3) <option value="9141d26b-b3c8-43f3-abb5-6f5292cd213a">Test Chain F</option> aka getByRole('combobox')
    4) <option value="6b013766-ab63-4895-a317-83e0fc3e1090">Test Chain F</option> aka getByRole('combobox')
    5) <option value="1d679306-5016-4659-a6bf-1aa91474bb24">Test Chain F</option> aka getByRole('combobox')
    6) <option value="8235db09-d7cf-4400-a0ac-c935bb76a0ec">Test Chain F</option> aka getByRole('combobox')
    7) <option value="21b7110f-5a2e-47bc-9ea5-b01bfa75c7e0">Test Chain F</option> aka getByRole('combobox')
    8) <option value="1b113599-76a2-4990-9337-4ca282d59148">Test Chain F</option> aka getByRole('combobox')
    9) <option value="cc23c8f0-c7ca-4624-b992-bee3b74d4546">Test Chain F</option> aka getByRole('combobox')
    10) <option value="1d62805d-6eda-4591-a21b-c296aa0675c1">Test Chain F</option> aka getByRole('combobox')
    ...

Call log:
  - waiting for locator('select').first().locator('option').filter({ hasText: /Test Chain F/i })

```

# Page snapshot

```yaml
- generic [active] [ref=f1e1]:
  - generic [ref=f1e2]:
    - complementary [ref=f1e3]:
      - link [ref=f1e5] [cursor=pointer]:
        - /url: /admin
        - img "Creston Markets" [ref=f1e6]
      - generic [ref=f1e7]: Admin Panel
      - navigation [ref=f1e9]:
        - link "Dashboard" [ref=f1e10] [cursor=pointer]:
          - /url: /admin
        - link "Users" [ref=f1e16] [cursor=pointer]:
          - /url: /admin/users
        - link "Reconciliation" [ref=f1e22] [cursor=pointer]:
          - /url: /admin/reconciliation
        - link "Referral Bonuses" [ref=f1e27] [cursor=pointer]:
          - /url: /admin/referrals
        - link "Approvals" [ref=f1e32] [cursor=pointer]:
          - /url: /admin/approvals
        - link "Referral & Earnings" [ref=f1e36] [cursor=pointer]:
          - /url: /admin/earnings
        - link "Plans" [ref=f1e41] [cursor=pointer]:
          - /url: /admin/plans
        - link "Announcements" [ref=f1e46] [cursor=pointer]:
          - /url: /admin/announcements
        - link "Support Tickets" [ref=f1e50] [cursor=pointer]:
          - /url: /admin/support
        - link "Reports" [ref=f1e58] [cursor=pointer]:
          - /url: /admin/reports
        - link "Settings" [ref=f1e61] [cursor=pointer]:
          - /url: /admin/settings
    - generic [ref=f1e65]:
      - banner [ref=f1e66]:
        - paragraph [ref=f1e67]: Signed in as admin@crestonmarkets.com
        - button "Log Out" [ref=f1e68] [cursor=pointer]
      - main [ref=f1e72]:
        - generic [ref=f1e74]:
          - heading "Portfolio Reconciliation" [level=1] [ref=f1e76]
          - paragraph [ref=f1e80]: CLIENT-VISIBLE — Entries saved here are shown directly to the client as their account statement. Double-check figures before saving. This will be replaced by live automated data once connected, with no change to how it looks on the client's side.
          - generic [ref=f1e81]:
            - heading "New Reconciliation Entry" [level=2] [ref=f1e82]
            - generic [ref=f1e83]:
              - generic [ref=f1e84]: User
              - combobox [ref=f1e85]:
                - option "Select user…" [selected]
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Alice Nakamura"
                - option "Ben Whitfield"
                - option "Chloe Martins"
                - option "Test Chain C"
                - option "Anup Kumar"
                - option "Epita dun"
                - option "Test Chain A"
                - option "f|I|"
                - option "jgfdvj"
                - option "Test Chain A"
                - option "Riley Williams"
                - option "Shashi"
                - option "shyam sheety"
                - option "Test Chain A"
                - option "jatinnainani777@gmail.com"
                - option "f|I|"
                - option "rgfg"
                - option "Test Chain A"
                - option "Gffd"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "manoj sharma"
                - option "Gk"
                - option "Test Chain D"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain D"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain D"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain D"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain G"
                - option "Test Chain C"
                - option "Test Chain E"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain E"
                - option "Test Chain B"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain F"
                - option "Test Chain E"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain G"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain B"
                - option "Test Chain A"
                - option "Test Chain E"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain E"
                - option "Test Chain C"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain D"
                - option "Test Chain F"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Diagnostic Test User"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain G"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain C"
                - option "Test Chain D"
                - option "Test Chain E"
                - option "Test Chain F"
                - option "Test Chain A"
                - option "Test Chain B"
                - option "Test Chain D"
                - option "Test Chain F"
                - option "Test Chain C"
                - option "Test Chain E"
            - generic [ref=f1e86]:
              - generic [ref=f1e87]:
                - generic [ref=f1e88]: Balance
                - spinbutton [ref=f1e89]
              - generic [ref=f1e90]:
                - generic [ref=f1e91]: Return %
                - spinbutton [ref=f1e92]
              - generic [ref=f1e93]:
                - generic [ref=f1e94]: P&L Total
                - spinbutton [ref=f1e95]
              - generic [ref=f1e96]:
                - generic [ref=f1e97]: P&L Today
                - spinbutton [ref=f1e98]
              - generic [ref=f1e99]:
                - generic [ref=f1e100]: P&L This Month
                - spinbutton [ref=f1e101]
            - generic [ref=f1e103]:
              - checkbox "Mark as official settlement This will trigger profit share calculations for all upline members based on this user's gain since their last settlement. Leave unchecked for routine balance corrections — those save normally without triggering any commissions." [ref=f1e104]
              - generic [ref=f1e105]:
                - generic [ref=f1e106]: Mark as official settlement
                - paragraph [ref=f1e110]: This will trigger profit share calculations for all upline members based on this user's gain since their last settlement. Leave unchecked for routine balance corrections — those save normally without triggering any commissions.
            - button "Save Reconciliation Entry" [ref=f1e111] [cursor=pointer]
          - generic [ref=f1e116]:
            - paragraph [ref=f1e117]: CSV Bulk Upload
            - paragraph [ref=f1e118]: Bulk reconciliation upload — coming soon.
          - generic [ref=f1e124]:
            - paragraph [ref=f1e125]: Live Sync Integration
            - paragraph [ref=f1e126]: UI only, non-functional — Phase 2.
          - generic [ref=f1e127]:
            - heading "Reconciliation Log" [level=2] [ref=f1e128]
            - table [ref=f1e130]:
              - rowgroup [ref=f1e131]:
                - row [ref=f1e132]:
                  - columnheader "User" [ref=f1e133]
                  - columnheader "Balance" [ref=f1e134]
                  - columnheader "Return %" [ref=f1e135]
                  - columnheader "Recorded" [ref=f1e136]
              - rowgroup [ref=f1e137]:
                - row [ref=f1e138]:
                  - cell "jatinnainani777@gmail.com" [ref=f1e139]
                  - cell "$300.00" [ref=f1e140]
                  - cell "4%" [ref=f1e141]
                  - cell "Aug 11, 2026, 06:39 PM" [ref=f1e142]
                - row [ref=f1e143]:
                  - cell "jgfdvj" [ref=f1e144]
                  - cell "$200.00" [ref=f1e145]
                  - cell "6%" [ref=f1e146]
                  - cell "Aug 11, 2026, 05:47 PM" [ref=f1e147]
                - row [ref=f1e148]:
                  - cell "Alice Nakamura" [ref=f1e149]
                  - cell "$405.00" [ref=f1e150]
                  - cell "10%" [ref=f1e151]
                  - cell "Aug 9, 2026, 06:53 PM" [ref=f1e152]
                - row [ref=f1e153]:
                  - cell "Alice Nakamura" [ref=f1e154]
                  - cell "$5,000.00" [ref=f1e155]
                  - cell "10%" [ref=f1e156]
                  - cell "Aug 6, 2026, 08:13 PM" [ref=f1e157]
  - alert [ref=f1e158]
```

# Test source

```ts
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
> 212 |     const fValue = await userSelect.locator("option", { hasText: /Test Chain F/i }).getAttribute("value");
      |                                                                                     ^ Error: locator.getAttribute: Error: strict mode violation: locator('select').first().locator('option').filter({ hasText: /Test Chain F/i }) resolved to 42 elements:
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
  248 |     const bRowBefore = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "1-layer" }).first();
  249 |     const amountBefore = await bRowBefore.locator("td").filter({ hasText: "$" }).first().textContent();
  250 | 
  251 |     const oneLayerSection = page.locator("text=1 Layer").locator("xpath=ancestor::div[contains(@class,'rounded-xl')]");
  252 |     await oneLayerSection.locator('input[type="number"]').first().fill("999");
  253 |     await page.getByRole("button", { name: /save all tables/i }).click();
  254 |     await expect(page.getByText(/commission config saved/i)).toBeVisible();
  255 | 
  256 |     await page.goto("/admin/earnings");
  257 |     const bRowAfter = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "1-layer" }).first();
  258 |     const amountAfter = await bRowAfter.locator("td").filter({ hasText: "$" }).first().textContent();
  259 |     expect(amountAfter, "Historical commission record changed after a config update -- rate-freezing is broken").toBe(
  260 |       amountBefore
  261 |     );
  262 |   });
  263 | 
  264 |   test("5.5 notification fires for the beneficiary after a joining bonus event", async ({ page }) => {
  265 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B, earned from C's deposit
  266 |     await page.locator("header button").filter({ has: page.locator("svg") }).nth(1).click();
  267 |     await expect(page.getByText(/joining bonus/i)).toBeVisible({ timeout: 10000 });
  268 |   });
  269 | 
  270 |   test("5.6 client sees their live network with correct positions", async ({ page }) => {
  271 |     await clientLogin(page, CHAIN[0].email, CHAIN[0].password); // Test-A
  272 |     await page.goto("/dashboard/earnings");
  273 |     await expect(page.getByText(/your network/i)).toBeVisible();
  274 |     const bRow = page.locator("tr", { hasText: "Test Chain B" });
  275 |     await expect(bRow.getByText(/nearest/i)).toBeVisible();
  276 |   });
  277 | 
  278 |   test("ARLY-19: config editor shows all 5 depth tables with the correct row count each", async ({ page }) => {
  279 |     await adminLogin(page);
  280 |     await page.goto("/admin/earnings");
  281 | 
  282 |     for (const depth of [1, 2, 3, 4, 5]) {
  283 |       const tableSection = page.locator("text=" + `${depth} Layer${depth > 1 ? "s" : ""}`).locator(
  284 |         "xpath=ancestor::div[contains(@class,'rounded-xl')]"
  285 |       );
  286 |       await expect(tableSection).toBeVisible();
  287 |       const rowCount = await tableSection.locator("tbody tr").count();
  288 |       expect(rowCount, `${depth}-layer table should have exactly ${depth} position row(s)`).toBe(depth);
  289 |     }
  290 |   });
  291 | 
  292 |   test("ARLY-20: disabling a position's joining bonus doesn't affect its profit share", async ({ page }) => {
  293 |     await adminLogin(page);
  294 |     await page.goto("/admin/earnings");
  295 | 
  296 |     const twoLayerSection = page.locator("text=2 Layers").locator("xpath=ancestor::div[contains(@class,'rounded-xl')]");
  297 |     const firstRowBonusCheckbox = twoLayerSection.locator("tbody tr").first().locator('input[type="checkbox"]').first();
  298 |     await firstRowBonusCheckbox.uncheck();
  299 |     await page.getByRole("button", { name: /save all tables/i }).click();
  300 |     await expect(page.getByText(/commission config saved/i)).toBeVisible();
  301 | 
  302 |     // The profit-share checkbox in the same row should remain untouched.
  303 |     const firstRowProfitCheckbox = twoLayerSection.locator("tbody tr").first().locator('input[type="checkbox"]').last();
  304 |     await expect(firstRowProfitCheckbox).toBeChecked();
  305 | 
  306 |     // Re-enable it afterward so this test doesn't leave live config in a
  307 |     // degraded state for anyone running the suite again.
  308 |     await firstRowBonusCheckbox.check();
  309 |     await page.getByRole("button", { name: /save all tables/i }).click();
  310 |   });
  311 | 
  312 |   test("ARLY-21/22: notification correctly names the source user and the position earned", async ({ page }) => {
```