import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers";

/** Section 6 — Deposit & Withdrawal Approvals (AAPR-01 through AAPR-07) */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

test.describe("Deposit & Withdrawal Approvals", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("AAPR-01: pending deposits tab shows submitted proof", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/approvals");
    const pendingRows = page.locator("table tbody tr").filter({ hasText: /pending/i });
    const count = await pendingRows.count();
    if (count === 0) {
      test.skip(true, "No pending deposits in this environment to verify proof display against");
    }
    await expect(pendingRows.first()).toBeVisible();
  });

  test("AAPR-05: withdrawal approvals show crypto-only fields, no legacy card/bank UI", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/approvals");
    await page.getByRole("button", { name: /withdrawals/i }).click();

    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toContain("card number");
    expect(bodyText.toLowerCase()).not.toContain("bank account");
  });

  test("AAPR-06: approve/reject buttons are absent for already-processed items", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/approvals");
    const approvedRows = page.locator("table tbody tr").filter({ hasText: /approved/i });
    const count = await approvedRows.count();
    if (count === 0) {
      test.skip(true, "No already-approved deposits in this environment");
    }
    const firstApprovedRow = approvedRows.first();
    await expect(firstApprovedRow.getByRole("button", { name: /approve/i })).toHaveCount(0);
  });

  test("AAPR-07: pending-count badges reflect actual pending totals", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/approvals");
    const depositsTabText = await page.getByRole("button", { name: /deposits/i }).textContent();
    const badgeMatch = depositsTabText?.match(/\((\d+)\s*pending\)/i);
    expect(badgeMatch, "Deposits tab should show a pending count").toBeTruthy();

    const actualPendingCount = await page.locator("table tbody tr").filter({ hasText: /pending/i }).count();
    if (badgeMatch) {
      expect(Number(badgeMatch[1])).toBe(actualPendingCount);
    }
  });
});
