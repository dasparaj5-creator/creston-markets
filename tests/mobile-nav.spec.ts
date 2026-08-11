import { test, expect } from "@playwright/test";

/**
 * Scenario: every dashboard page must be reachable from the mobile bottom
 * nav, either pinned directly or via the "More" sheet. This test exists
 * specifically because Withdraw silently disappeared from mobile once the
 * nav grew past 5 items (a hardcoded .slice(0, 5) cut it off) -- this
 * catches that class of bug automatically if it ever regresses.
 *
 * REQUIRES a logged-in session; run this against the "mobile-chrome"
 * Playwright project (configured in playwright.config.ts) so it actually
 * exercises the mobile bottom nav rather than the desktop sidebar.
 */

const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || "alice@example.com";
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || "ClientPass123!";

const EXPECTED_DASHBOARD_PAGES = [
  "/dashboard",
  "/dashboard/portfolio",
  "/dashboard/referral",
  "/dashboard/earnings",
  "/dashboard/deposit",
  "/dashboard/withdraw",
  "/dashboard/transactions",
  "/dashboard/profile",
  "/dashboard/support",
];

test.describe("Mobile bottom navigation completeness", () => {
  test("every dashboard page is reachable via pinned nav or the More sheet", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(CLIENT_EMAIL);
    await page.locator('input[name="password"]').fill(CLIENT_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Collect every href actually reachable from the mobile bottom nav,
    // including inside the "More" sheet.
    const reachableHrefs = new Set<string>();

    const pinnedLinks = page.locator("nav a[href^='/dashboard']");
    const pinnedCount = await pinnedLinks.count();
    for (let i = 0; i < pinnedCount; i++) {
      const href = await pinnedLinks.nth(i).getAttribute("href");
      if (href) reachableHrefs.add(href);
    }

    const moreButton = page.getByRole("button", { name: /^more$/i });
    if (await moreButton.count()) {
      await moreButton.click();
      const sheetLinks = page.locator("a[href^='/dashboard']");
      const sheetCount = await sheetLinks.count();
      for (let i = 0; i < sheetCount; i++) {
        const href = await sheetLinks.nth(i).getAttribute("href");
        if (href) reachableHrefs.add(href);
      }
    }

    const missing = EXPECTED_DASHBOARD_PAGES.filter((p) => !reachableHrefs.has(p));
    expect(missing, `These dashboard pages are NOT reachable from mobile nav: ${missing.join(", ")}`).toEqual([]);
  });
});
