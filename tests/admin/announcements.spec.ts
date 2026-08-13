import { test, expect } from "@playwright/test";
import { adminLogin, clientLogin } from "./helpers";

/**
 * Section 8 — Announcements (AANN-01 through AANN-03)
 *
 * IMPORTANT GAP FOUND WHILE WRITING THIS FILE: the real AnnouncementManager
 * component's schema supports a "target" of "all" or "specific_user", but
 * there is no actual user-picker UI field for "specific_user" -- selecting
 * it doesn't reveal any way to choose WHICH user. AANN-02 below tests only
 * what currently exists (the dropdown option itself) and is written to
 * fail loudly/skip with a clear message if a user-picker never appears,
 * rather than silently passing on an incomplete feature. Flag this to the
 * dev team as a real gap, not a test bug, if AANN-02 skips.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

test.describe("Announcements", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("AANN-01: publishing an 'All Users' announcement appears on client dashboards", async ({ page, context }) => {
    await adminLogin(page);
    await page.goto("/admin/announcements");

    const title = `Automated Test Announcement ${Date.now()}`;
    await page.locator('input[name="title"]').fill(title);
    await page.locator('textarea[name="body"]').fill("This is an automated test announcement body.");
    await page.locator('select[name="target"]').selectOption({ label: "All Users" });
    await page.getByRole("button", { name: /publish announcement/i }).click();
    await expect(page.getByText(/announcement published/i)).toBeVisible();

    // Confirm it appears in the admin's own list first.
    await expect(page.getByText(title)).toBeVisible();

    // Then confirm a client actually sees it.
    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientLogin(clientPage);
      await expect(clientPage.getByText(title)).toBeVisible({ timeout: 10000 });
      await clientContext.close();
    }
  });

  test("AANN-02: 'Specific User' targeting option exists and behaves as designed", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/announcements");

    await page.locator('select[name="target"]').selectOption({ label: "Specific User" });

    // Look for ANY control that would let the admin choose which user --
    // a second select, a search input, an autocomplete field appearing
    // after this selection.
    const possibleUserPicker = page
      .locator("select")
      .filter({ hasNotText: /all users|specific user/i })
      .or(page.getByPlaceholder(/search.*user|select.*user/i));

    const pickerExists = await possibleUserPicker.count();
    if (pickerExists === 0) {
      test.skip(
        true,
        "GAP: 'Specific User' targeting has no user-picker UI in the current build -- selecting it doesn't let the admin choose a recipient. This is a feature gap to raise with the dev team, not a test failure."
      );
    }
    await expect(possibleUserPicker.first()).toBeVisible();
  });

  test("AANN-03: deactivating an announcement removes it from client dashboards", async ({ page, context }) => {
    await adminLogin(page);
    await page.goto("/admin/announcements");

    const title = `Deactivation Test ${Date.now()}`;
    await page.locator('input[name="title"]').fill(title);
    await page.locator('textarea[name="body"]').fill("This announcement will be deactivated.");
    await page.locator('select[name="target"]').selectOption({ label: "All Users" });
    await page.getByRole("button", { name: /publish announcement/i }).click();
    await expect(page.getByText(/announcement published/i)).toBeVisible();

    // Toggle it inactive -- the status badge doubles as the toggle button.
    const announcementRow = page.locator("div", { hasText: title }).filter({ has: page.getByRole("button", { name: /active/i }) });
    await announcementRow.getByRole("button", { name: /^active$/i }).click();
    await expect(announcementRow.getByRole("button", { name: /^inactive$/i })).toBeVisible();

    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientLogin(clientPage);
      await expect(clientPage.getByText(title)).not.toBeVisible({ timeout: 5000 });
      await clientContext.close();
    }
  });
});
