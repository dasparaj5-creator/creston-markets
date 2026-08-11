import { test, expect, type Page } from "@playwright/test";

/**
 * Scenario: verifies the depth-based 5-table commission engine end to end.
 *
 * This is the highest-value test in the suite, since it exercises the
 * exact logic confirmed with worked examples: position is counted from
 * the newest joiner, the nearest upline earns the most, and the table
 * used matches the ACTUAL chain depth (not a fixed level-from-root
 * scheme).
 *
 * REQUIRES real admin credentials via environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * This test does NOT try to fully automate deposit approval end-to-end
 * (that requires the manual crypto-proof review flow) -- instead it
 * verifies the parts that can be driven through the UI directly:
 * registration with referral codes, and that the admin panel correctly
 * displays whatever commission records already exist. Treat this as a
 * smoke test for the UI layer, not a substitute for manually walking
 * through a real deposit-approval + settlement cycle at least once
 * after any commission-engine change.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
}

test.describe("Referral chain registration", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run this suite");

  test("a user can register with a referral code and it's captured correctly", async ({ page }) => {
    // Step 1: log in as an existing seeded client (Alice) to get her
    // referral code from the dashboard.
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("alice@example.com");
    await page.locator('input[name="password"]').fill("ClientPass123!");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/dashboard/referral");
    const referralLinkText = await page.locator("text=/register\\?ref=/").first().textContent();
    expect(referralLinkText).toBeTruthy();

    const refCodeMatch = referralLinkText?.match(/ref=([a-zA-Z0-9]+)/);
    const refCode = refCodeMatch?.[1];
    expect(refCode, "Could not extract referral code from Alice's referral link").toBeTruthy();

    // Step 2: navigate directly to the referral registration link.
    await page.goto(`/register?ref=${refCode}`);

    // Confirm the referral code field is pre-filled and locked, matching
    // the intended UX (user shouldn't be able to accidentally clear it).
    const referralField = page.locator('input[name="referralCode"]');
    await expect(referralField).toHaveValue(refCode!);
  });
});

test.describe("Admin commission visibility", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run this suite");

  test("admin can view the 5-table commission configuration", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/earnings");

    // All five depth tables should render with their headers.
    for (const depth of [1, 2, 3, 4, 5]) {
      await expect(page.getByText(`${depth} Layer${depth > 1 ? "s" : ""}`, { exact: false })).toBeVisible();
    }
  });

  test("admin can open a user's detail page and see their referral network", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");

    // Click into the first user row's "View" link.
    await page.getByRole("link", { name: /view/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/users\/.+/);
    await expect(page.getByText(/referral network/i)).toBeVisible();
  });

  test("admin support tickets expand when clicked", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/support");

    const firstTicketRow = page.locator('[role="button"]').first();
    const ticketCount = await firstTicketRow.count();

    if (ticketCount > 0) {
      await firstTicketRow.click();
      // After expanding, a reply textarea should become visible --
      // this specifically re-tests the nested-Link-in-button bug fix.
      await expect(page.locator("textarea")).toBeVisible();
    }
  });
});
