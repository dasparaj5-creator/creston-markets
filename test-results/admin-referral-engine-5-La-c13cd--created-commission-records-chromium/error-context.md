# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\referral-engine.spec.ts >> 5-Layer Referral & Earnings Engine >> 5.4 config change does not alter already-created commission records
- Location: tests\admin\referral-engine.spec.ts:244:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.textContent: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('tr').filter({ hasText: 'Test Chain B' }).filter({ hasText: '1-layer' }).first().locator('td').filter({ hasText: '$' }).first()

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
          - generic [ref=f1e75]:
            - heading "Referral & Earnings Management" [level=1] [ref=f1e76]
            - paragraph [ref=f1e77]: 5-table (1 through 5 layers) joining bonus and profit share configuration. Changes only affect future earnings — all past commission records remain frozen at the rate active when they were calculated.
          - generic [ref=f1e78]:
            - generic [ref=f1e79]:
              - heading "Referral & Earnings Configuration" [level=2] [ref=f1e80]
              - generic [ref=f1e81]: Changes apply to future earnings only
            - paragraph [ref=f1e86]: Each chain depth (1 through 5 layers) has its own independent split. The table used for any given payout is whichever matches the ACTUAL number of people in that referral chain — a 3-person chain always uses the 3-layer table below, never a partial slice of the 5-layer one.
            - generic [ref=f1e87]:
              - generic [ref=f1e88]:
                - heading "1 Layer" [level=3] [ref=f1e89]
                - generic [ref=f1e90]: "Total: $25.00 · 10.0%"
              - table [ref=f1e92]:
                - rowgroup [ref=f1e93]:
                  - row [ref=f1e94]:
                    - columnheader "Position" [ref=f1e95]
                    - columnheader "Joining Bonus ($)" [ref=f1e96]
                    - columnheader "Enabled" [ref=f1e97]
                    - columnheader "Profit Share (%)" [ref=f1e98]
                    - columnheader "Enabled" [ref=f1e99]
                - rowgroup [ref=f1e100]:
                  - row [ref=f1e101]:
                    - cell "Nearest" [ref=f1e102]
                    - cell [ref=f1e103]:
                      - spinbutton [ref=f1e104]: "25"
                    - cell [ref=f1e105]:
                      - checkbox [checked] [ref=f1e106]
                    - cell [ref=f1e107]:
                      - spinbutton [ref=f1e108]: "10"
                    - cell [ref=f1e109]:
                      - checkbox [checked] [ref=f1e110]
            - generic [ref=f1e111]:
              - generic [ref=f1e112]:
                - heading "2 Layers" [level=3] [ref=f1e113]
                - generic [ref=f1e114]: "Total: $25.00 · 10.0%"
              - table [ref=f1e116]:
                - rowgroup [ref=f1e117]:
                  - row [ref=f1e118]:
                    - columnheader "Position" [ref=f1e119]
                    - columnheader "Joining Bonus ($)" [ref=f1e120]
                    - columnheader "Enabled" [ref=f1e121]
                    - columnheader "Profit Share (%)" [ref=f1e122]
                    - columnheader "Enabled" [ref=f1e123]
                - rowgroup [ref=f1e124]:
                  - row [ref=f1e125]:
                    - cell "Nearest" [ref=f1e126]
                    - cell [ref=f1e127]:
                      - spinbutton [ref=f1e128]: "15"
                    - cell [ref=f1e129]:
                      - checkbox [checked] [ref=f1e130]
                    - cell [ref=f1e131]:
                      - spinbutton [ref=f1e132]: "6"
                    - cell [ref=f1e133]:
                      - checkbox [checked] [ref=f1e134]
                  - row [ref=f1e135]:
                    - cell "2nd" [ref=f1e136]
                    - cell [ref=f1e137]:
                      - spinbutton [ref=f1e138]: "10"
                    - cell [ref=f1e139]:
                      - checkbox [checked] [ref=f1e140]
                    - cell [ref=f1e141]:
                      - spinbutton [ref=f1e142]: "4"
                    - cell [ref=f1e143]:
                      - checkbox [checked] [ref=f1e144]
            - generic [ref=f1e145]:
              - generic [ref=f1e146]:
                - heading "3 Layers" [level=3] [ref=f1e147]
                - generic [ref=f1e148]: "Total: $25.00 · 10.0%"
              - table [ref=f1e150]:
                - rowgroup [ref=f1e151]:
                  - row [ref=f1e152]:
                    - columnheader "Position" [ref=f1e153]
                    - columnheader "Joining Bonus ($)" [ref=f1e154]
                    - columnheader "Enabled" [ref=f1e155]
                    - columnheader "Profit Share (%)" [ref=f1e156]
                    - columnheader "Enabled" [ref=f1e157]
                - rowgroup [ref=f1e158]:
                  - row [ref=f1e159]:
                    - cell "Nearest" [ref=f1e160]
                    - cell [ref=f1e161]:
                      - spinbutton [ref=f1e162]: "15"
                    - cell [ref=f1e163]:
                      - checkbox [checked] [ref=f1e164]
                    - cell [ref=f1e165]:
                      - spinbutton [ref=f1e166]: "4"
                    - cell [ref=f1e167]:
                      - checkbox [checked] [ref=f1e168]
                  - row [ref=f1e169]:
                    - cell "2nd" [ref=f1e170]
                    - cell [ref=f1e171]:
                      - spinbutton [ref=f1e172]: "6"
                    - cell [ref=f1e173]:
                      - checkbox [checked] [ref=f1e174]
                    - cell [ref=f1e175]:
                      - spinbutton [ref=f1e176]: "3.5"
                    - cell [ref=f1e177]:
                      - checkbox [checked] [ref=f1e178]
                  - row [ref=f1e179]:
                    - cell "3rd" [ref=f1e180]
                    - cell [ref=f1e181]:
                      - spinbutton [ref=f1e182]: "4"
                    - cell [ref=f1e183]:
                      - checkbox [checked] [ref=f1e184]
                    - cell [ref=f1e185]:
                      - spinbutton [ref=f1e186]: "2.5"
                    - cell [ref=f1e187]:
                      - checkbox [checked] [ref=f1e188]
            - generic [ref=f1e189]:
              - generic [ref=f1e190]:
                - heading "4 Layers" [level=3] [ref=f1e191]
                - generic [ref=f1e192]: "Total: $25.00 · 10.0%"
              - table [ref=f1e194]:
                - rowgroup [ref=f1e195]:
                  - row [ref=f1e196]:
                    - columnheader "Position" [ref=f1e197]
                    - columnheader "Joining Bonus ($)" [ref=f1e198]
                    - columnheader "Enabled" [ref=f1e199]
                    - columnheader "Profit Share (%)" [ref=f1e200]
                    - columnheader "Enabled" [ref=f1e201]
                - rowgroup [ref=f1e202]:
                  - row [ref=f1e203]:
                    - cell "Nearest" [ref=f1e204]
                    - cell [ref=f1e205]:
                      - spinbutton [ref=f1e206]: "15"
                    - cell [ref=f1e207]:
                      - checkbox [checked] [ref=f1e208]
                    - cell [ref=f1e209]:
                      - spinbutton [ref=f1e210]: "5"
                    - cell [ref=f1e211]:
                      - checkbox [checked] [ref=f1e212]
                  - row [ref=f1e213]:
                    - cell "2nd" [ref=f1e214]
                    - cell [ref=f1e215]:
                      - spinbutton [ref=f1e216]: "6"
                    - cell [ref=f1e217]:
                      - checkbox [checked] [ref=f1e218]
                    - cell [ref=f1e219]:
                      - spinbutton [ref=f1e220]: "2.5"
                    - cell [ref=f1e221]:
                      - checkbox [checked] [ref=f1e222]
                  - row [ref=f1e223]:
                    - cell "3rd" [ref=f1e224]
                    - cell [ref=f1e225]:
                      - spinbutton [ref=f1e226]: "3"
                    - cell [ref=f1e227]:
                      - checkbox [checked] [ref=f1e228]
                    - cell [ref=f1e229]:
                      - spinbutton [ref=f1e230]: "1.5"
                    - cell [ref=f1e231]:
                      - checkbox [checked] [ref=f1e232]
                  - row [ref=f1e233]:
                    - cell "4th" [ref=f1e234]
                    - cell [ref=f1e235]:
                      - spinbutton [ref=f1e236]: "1"
                    - cell [ref=f1e237]:
                      - checkbox [checked] [ref=f1e238]
                    - cell [ref=f1e239]:
                      - spinbutton [ref=f1e240]: "1"
                    - cell [ref=f1e241]:
                      - checkbox [checked] [ref=f1e242]
            - generic [ref=f1e243]:
              - generic [ref=f1e244]:
                - heading "5 Layers" [level=3] [ref=f1e245]
                - generic [ref=f1e246]: "Total: $26.00 · 10.0%"
              - table [ref=f1e248]:
                - rowgroup [ref=f1e249]:
                  - row [ref=f1e250]:
                    - columnheader "Position" [ref=f1e251]
                    - columnheader "Joining Bonus ($)" [ref=f1e252]
                    - columnheader "Enabled" [ref=f1e253]
                    - columnheader "Profit Share (%)" [ref=f1e254]
                    - columnheader "Enabled" [ref=f1e255]
                - rowgroup [ref=f1e256]:
                  - row [ref=f1e257]:
                    - cell "Nearest" [ref=f1e258]
                    - cell [ref=f1e259]:
                      - spinbutton [ref=f1e260]: "15"
                    - cell [ref=f1e261]:
                      - checkbox [checked] [ref=f1e262]
                    - cell [ref=f1e263]:
                      - spinbutton [ref=f1e264]: "5"
                    - cell [ref=f1e265]:
                      - checkbox [checked] [ref=f1e266]
                  - row [ref=f1e267]:
                    - cell "2nd" [ref=f1e268]
                    - cell [ref=f1e269]:
                      - spinbutton [ref=f1e270]: "5"
                    - cell [ref=f1e271]:
                      - checkbox [checked] [ref=f1e272]
                    - cell [ref=f1e273]:
                      - spinbutton [ref=f1e274]: "2"
                    - cell [ref=f1e275]:
                      - checkbox [checked] [ref=f1e276]
                  - row [ref=f1e277]:
                    - cell "3rd" [ref=f1e278]
                    - cell [ref=f1e279]:
                      - spinbutton [ref=f1e280]: "3"
                    - cell [ref=f1e281]:
                      - checkbox [checked] [ref=f1e282]
                    - cell [ref=f1e283]:
                      - spinbutton [ref=f1e284]: "1"
                    - cell [ref=f1e285]:
                      - checkbox [checked] [ref=f1e286]
                  - row [ref=f1e287]:
                    - cell "4th" [ref=f1e288]
                    - cell [ref=f1e289]:
                      - spinbutton [ref=f1e290]: "2"
                    - cell [ref=f1e291]:
                      - checkbox [checked] [ref=f1e292]
                    - cell [ref=f1e293]:
                      - spinbutton [ref=f1e294]: "1"
                    - cell [ref=f1e295]:
                      - checkbox [checked] [ref=f1e296]
                  - row [ref=f1e297]:
                    - cell "5th" [ref=f1e298]
                    - cell [ref=f1e299]:
                      - spinbutton [ref=f1e300]: "1"
                    - cell [ref=f1e301]:
                      - checkbox [checked] [ref=f1e302]
                    - cell [ref=f1e303]:
                      - spinbutton [ref=f1e304]: "1"
                    - cell [ref=f1e305]:
                      - checkbox [checked] [ref=f1e306]
            - button "Save All Tables" [ref=f1e307] [cursor=pointer]
          - generic [ref=f1e312]:
            - generic [ref=f1e313]:
              - heading "Per-User Earnings Breakdown" [level=2] [ref=f1e314]
              - generic [ref=f1e315]:
                - combobox [ref=f1e316]:
                  - option "All Types" [selected]
                  - option "Joining Bonus"
                  - option "Profit Share"
                - combobox [ref=f1e317]:
                  - option "Pending" [selected]
                  - option "Paid"
                  - option "All Statuses"
            - table [ref=f1e319]:
              - rowgroup [ref=f1e320]:
                - row [ref=f1e321]:
                  - columnheader [ref=f1e322]:
                    - button [ref=f1e323] [cursor=pointer]
                  - columnheader "Beneficiary" [ref=f1e326]
                  - columnheader "Source User" [ref=f1e327]
                  - columnheader "Position" [ref=f1e328]
                  - columnheader "Type" [ref=f1e329]
                  - columnheader "Rate" [ref=f1e330]
                  - columnheader "Amount" [ref=f1e331]
                  - columnheader "Period" [ref=f1e332]
                  - columnheader "Date" [ref=f1e333]
                  - columnheader "Status" [ref=f1e334]
              - rowgroup [ref=f1e335]:
                - row [ref=f1e336]:
                  - cell "No commission records match this filter." [ref=f1e337]
          - generic [ref=f1e338]:
            - heading "Config Change History" [level=2] [ref=f1e339]
            - table [ref=f1e341]:
              - rowgroup [ref=f1e342]:
                - row [ref=f1e343]:
                  - columnheader "When" [ref=f1e344]
                  - columnheader "Who" [ref=f1e345]
                  - columnheader "Table" [ref=f1e346]
                  - columnheader "Position" [ref=f1e347]
                  - columnheader "Field" [ref=f1e348]
                  - columnheader "Change" [ref=f1e349]
              - rowgroup [ref=f1e350]:
                - row [ref=f1e351]:
                  - cell "No config changes recorded yet." [ref=f1e352]
  - alert [ref=f1e353]
```

# Test source

```ts
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
  248 |     const bRowBefore = page.locator("tr", { hasText: "Test Chain B" }).filter({ hasText: "1-layer" }).first();
> 249 |     const amountBefore = await bRowBefore.locator("td").filter({ hasText: "$" }).first().textContent();
      |                                                                                          ^ Error: locator.textContent: Test timeout of 30000ms exceeded.
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
  313 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B
  314 |     await page.locator("button").filter({ has: page.locator("svg.lucide-bell") }).first().click();
  315 | 
  316 |     await expect(page.getByText(/notifications/i).first()).toBeVisible();
  317 |     await expect(page.getByText(/joining bonus/i)).toBeVisible({ timeout: 10000 });
  318 |     // The message should reference the masked name of whoever triggered
  319 |     // it (Test-C in this case) and the position earned (Nearest/1st).
  320 |     await expect(page.getByText(/nearest|1st/i)).toBeVisible();
  321 |   });
  322 | 
  323 |   test("ARLY-23: opening the bell clears the unread badge", async ({ page }) => {
  324 |     await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B
  325 |     const bellButton = page.locator("button").filter({ has: page.locator("svg.lucide-bell") }).first();
  326 | 
  327 |     // Look for an unread count badge before opening.
  328 |     const badgeBefore = bellButton.locator("span").filter({ hasText: /^\d+\+?$/ });
  329 |     const hadBadge = (await badgeBefore.count()) > 0;
  330 |     if (!hadBadge) {
  331 |       test.skip(true, "No unread notifications for Test-B at this point in the suite run");
  332 |     }
  333 | 
  334 |     await bellButton.click();
  335 |     await page.waitForTimeout(1000); // allow the mark-as-read update to complete
  336 |     await page.reload();
  337 | 
  338 |     const badgeAfter = bellButton.locator("span").filter({ hasText: /^\d+\+?$/ });
  339 |     await expect(badgeAfter, "Unread badge should be gone after opening and re-loading").toHaveCount(0);
  340 |   });
  341 | 
  342 |   test("ARLY-24: every position in a multi-layer event receives its own notification, not just the nearest", async ({
  343 |     page,
  344 |   }) => {
  345 |     // After the depth-5 chain (F's deposit) earlier in this suite, C, D,
  346 |     // and E should ALL have a notification, not only B (the nearest).
  347 |     for (const member of [CHAIN[2], CHAIN[3], CHAIN[4]]) {
  348 |       // Test-C, Test-D, Test-E
  349 |       const memberPage = await page.context().newPage();
```