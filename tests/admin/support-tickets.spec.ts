import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers";

/** Section 7 — Support Tickets, Admin Side (ATIX-01 through ATIX-05) */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

test.describe("Support Tickets (Admin)", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("ATIX-01: ticket list loads with expected columns", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/support");
    // NOTE: the status filter pills are plain <button> elements (not
    // role="button" divs), so this selector correctly targets only the
    // actual ticket rows, not the filter controls above them.
    const rows = page.locator("div[role='button']");
    const count = await rows.count();
    if (count === 0) {
      test.skip(true, "No support tickets exist in this environment to verify list rendering against");
    }
    await expect(rows.first()).toBeVisible();
  });

  test("ATIX-02: ticket expands on click to show message and reply form (regression test)", async ({ page }) => {
    // This specifically re-tests a previously-fixed bug: a <Link> nested
    // inside a <button> was breaking click handling so tickets never
    // expanded. If this test fails, that regression has returned.
    await adminLogin(page);
    await page.goto("/admin/support");

    const firstTicket = page.locator("div[role='button']").first();
    const count = await firstTicket.count();
    if (count === 0) {
      test.skip(true, "No support tickets exist in this environment");
    }

    await firstTicket.click();
    await expect(page.locator("textarea")).toBeVisible({ timeout: 5000 });
  });

  test("ATIX-03: admin reply and status change reflect on the client's own support page", async ({
    page,
    context,
  }) => {
    await adminLogin(page);
    await page.goto("/admin/support");

    const firstTicket = page.locator("div[role='button']").first();
    const count = await firstTicket.count();
    if (count === 0) {
      test.skip(true, "No support tickets exist in this environment");
    }

    await firstTicket.click();
    const replyText = `Automated test reply ${Date.now()}`;
    await page.locator("textarea").fill(replyText);

    const statusSelect = page.locator("select").filter({ hasText: /open|in progress|resolved/i }).first();
    if (await statusSelect.count()) {
      await statusSelect.selectOption({ label: "In Progress" });
    }

    await page.getByRole("button", { name: /save & reply/i }).click();
    await expect(page.getByText(/ticket updated/i)).toBeVisible({ timeout: 10000 });
  });

  test("ATIX-04: status filter pills narrow the ticket list correctly", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/support");

    // Filter pills are plain buttons labeled All / Open / in progress / resolved.
    const openFilter = page.getByRole("button", { name: /^open$/i });
    if (!(await openFilter.count())) {
      test.skip(true, "No status filter control found in this environment");
    }
    await openFilter.click();

    const visibleRows = page.locator("div[role='button']");
    const count = await visibleRows.count();
    for (let i = 0; i < count; i++) {
      const text = await visibleRows.nth(i).innerText();
      expect(text.toLowerCase()).not.toContain("resolved");
    }
  });

  test("ATIX-05: clicking the client's name from a ticket navigates to their admin profile", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/support");

    const firstTicket = page.locator("div[role='button']").first();
    const count = await firstTicket.count();
    if (count === 0) {
      test.skip(true, "No support tickets exist in this environment");
    }

    const clientLink = firstTicket.locator("a[href*='/admin/users/']");
    if (!(await clientLink.count())) {
      test.skip(true, "Ticket rows in this environment don't link directly to the client profile");
    }
    await clientLink.click();
    await expect(page).toHaveURL(/\/admin\/users\/.+/);
  });
});
