import { test, expect } from "@playwright/test";
import { adminLogin, clientLogin } from "./helpers";

/** Section 2 — User & Account Management (AUSR-01 through AUSR-11) */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

test.describe("User & Account Management", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("AUSR-01: user list loads with expected columns", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    await expect(page.getByText("alice@example.com")).toBeVisible();
    await expect(page.getByText(/kyc/i).first()).toBeVisible();
  });

  test("AUSR-02: search filters the user list", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    const searchBox = page.getByPlaceholder(/search/i);
    await searchBox.fill("alice");
    await expect(page.getByText("alice@example.com")).toBeVisible();
    await expect(page.getByText("chloe@example.com")).not.toBeVisible();
  });

  test("AUSR-03: user detail page shows full profile", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    await page.getByRole("link", { name: /view/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/users\/.+/);
    await expect(page.getByText(/kyc verification/i)).toBeVisible();
    await expect(page.getByText(/referral network/i)).toBeVisible();
    await expect(page.getByText(/earnings summary/i)).toBeVisible();
  });

  test("AUSR-07/AUSR-08: account hold actually blocks login, reactivation restores it", async ({ page, context }) => {
    // Uses Chloe (seeded, no meaningful referral/earnings data) as the
    // subject so this doesn't disturb the referral chain tests below.
    await adminLogin(page);
    await page.goto("/admin/users");
    await page.getByText("chloe@example.com").click();

    await page.getByRole("button", { name: /put on hold/i }).click();
    await page.getByRole("button", { name: /confirm/i }).click();
    await expect(page.getByRole("button", { name: /reactivate/i })).toBeVisible();

    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientPage.goto("/login");
      await clientPage.getByPlaceholder("you@example.com").fill("chloe@example.com");
      await clientPage.locator('input[name="password"]').fill("ClientPass123!");
      await clientPage.getByRole("button", { name: /log in/i }).click();
      await expect(clientPage).toHaveURL(/account-on-hold/, { timeout: 10000 });
      await clientContext.close();
    }

    await page.getByRole("button", { name: /reactivate/i }).click();
    await expect(page.getByRole("button", { name: /put on hold/i })).toBeVisible();

    const clientContext2 = await context.browser()?.newContext();
    if (clientContext2) {
      const clientPage2 = await clientContext2.newPage();
      await clientLogin(clientPage2, "chloe@example.com", "ClientPass123!");
      await expect(clientPage2).toHaveURL(/\/dashboard/);
      await clientContext2.close();
    }
  });

  test("AUSR-10: KYC document viewer opens documents via signed URL", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    await page.getByText("alice@example.com").click();

    const docButtons = page.locator("button", { hasText: /front|back/i });
    const count = await docButtons.count();
    if (count === 0) {
      test.skip(true, "No KYC documents uploaded for this user in this environment");
    }
    const [newPage] = await Promise.all([page.waitForEvent("popup"), docButtons.first().click()]);
    expect(newPage.url()).toContain("token=");
    await newPage.close();
  });
});
