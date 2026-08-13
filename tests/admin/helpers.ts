import { expect, type Page } from "@playwright/test";

/**
 * Shared login helpers for the admin test suite. Deliberately kept in a
 * plain .ts file (NOT a .spec.ts file) -- Playwright disallows one spec
 * file importing from another spec file, since spec files are meant to
 * contain only tests, not double as shared modules. This file exists
 * specifically so every admin test file can import adminLogin/clientLogin
 * without triggering that error.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || "alice@example.com";
const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || "ClientPass123!";

export async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
}

export async function clientLogin(page: Page, email = CLIENT_EMAIL, password = CLIENT_PASSWORD) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
}
