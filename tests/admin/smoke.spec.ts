import { test, expect } from "@playwright/test";
import { adminLogin, clientLogin } from "./helpers";

/**
 * Section 1 — Admin Smoke Suite (ASMK-01 through ASMK-06)
 *
 * REQUIRES: ADMIN_EMAIL, ADMIN_PASSWORD env vars. Also uses CLIENT_EMAIL /
 * CLIENT_PASSWORD (defaults to the seeded alice@example.com) for the
 * cross-role access checks.
 *
 * adminLogin/clientLogin now live in ./helpers.ts, not in this file --
 * Playwright doesn't allow one spec file to import from another.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || "alice@example.com";
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || "ClientPass123!";

test.describe("Admin Smoke Suite", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("ASMK-01: admin login page loads", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByText(/admin access/i)).toBeVisible();
  });

  test("ASMK-02: admin login succeeds", async ({ page }) => {
    await adminLogin(page);
    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
  });

  test("ASMK-03: a client-role user cannot reach the admin panel by direct URL", async ({ page }) => {
    await clientLogin(page);
    await page.goto("/admin");
    // middleware should redirect a non-admin away from /admin entirely.
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("ASMK-04: a non-admin cannot log in at /admin/login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[type="email"]').fill(CLIENT_EMAIL);
    await page.locator('input[name="password"]').fill(CLIENT_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    // Should show an explicit "not authorized" error, not silently land
    // on the client dashboard.
    await expect(page.getByText(/does not have admin access/i)).toBeVisible();
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test("ASMK-05: all admin nav sections load without error", async ({ page }) => {
    await adminLogin(page);
    const sections = [
      "/admin",
      "/admin/users",
      "/admin/reconciliation",
      "/admin/earnings",
      "/admin/approvals",
      "/admin/plans",
      "/admin/announcements",
      "/admin/support",
      "/admin/reports",
      "/admin/settings",
    ];
    for (const path of sections) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should load successfully`).toBeLessThan(400);
    }
  });

  test("ASMK-06: admin logout clears the session", async ({ page }) => {
    await adminLogin(page);
    await page.getByRole("button", { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    // Direct nav back to /admin should bounce to login again.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
