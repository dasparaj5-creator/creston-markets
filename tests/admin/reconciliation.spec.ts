import { test, expect, type Page } from "@playwright/test";
import { adminLogin, clientLogin } from "./helpers";

/**
 * Section 4 — Portfolio Reconciliation (AREC-01 through AREC-08)
 * Covers the user's scenario #1 (P&L for users, client-visible) and
 * #2 (editing reconciliation figures).
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

async function fillReconciliationForm(
  page: Page,
  userLabel: string,
  values: { balance: string; returnPercent: string; pnlTotal: string; pnlToday: string; pnlThisMonth: string }
) {
  await page.goto("/admin/reconciliation");
  await page.locator("select").first().selectOption({ label: new RegExp(userLabel, "i") });
  await page.getByLabel(/balance/i).fill(values.balance);
  await page.getByLabel(/return %/i).fill(values.returnPercent);
  await page.getByLabel(/p&l total/i).fill(values.pnlTotal);
  await page.getByLabel(/p&l today/i).fill(values.pnlToday);
  await page.getByLabel(/p&l this month/i).fill(values.pnlThisMonth);
}

test.describe("Portfolio Reconciliation", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("AREC-01: entering P&L for a client makes it visible on their own dashboard", async ({ page, context }) => {
    await adminLogin(page);
    const testBalance = (1000 + Math.floor(Math.random() * 500)).toString();

    await fillReconciliationForm(page, "Alice", {
      balance: testBalance,
      returnPercent: "5.5",
      pnlTotal: "100",
      pnlToday: "10",
      pnlThisMonth: "50",
    });
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/entry saved/i)).toBeVisible();

    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientLogin(clientPage, "alice@example.com", "ClientPass123!");
      await clientPage.goto("/dashboard/portfolio");
      await expect(clientPage.getByText(`$${Number(testBalance).toLocaleString()}`)).toBeVisible({ timeout: 10000 });
      await clientContext.close();
    }
  });

  test("AREC-02: a brand-new client with no prior statement shows a real figure after first entry", async ({
    page,
    context,
  }) => {
    await adminLogin(page);
    await fillReconciliationForm(page, "Chloe", {
      balance: "500",
      returnPercent: "2",
      pnlTotal: "10",
      pnlToday: "5",
      pnlThisMonth: "10",
    });
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/entry saved/i)).toBeVisible();

    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientLogin(clientPage, "chloe@example.com", "ClientPass123!");
      await clientPage.goto("/dashboard/portfolio");
      await expect(clientPage.getByText("$500")).toBeVisible({ timeout: 10000 });
      await clientContext.close();
    }
  });

  test("AREC-03: a new reconciliation entry supersedes the previous one on the client's dashboard", async ({
    page,
    context,
  }) => {
    await adminLogin(page);
    const secondBalance = "9999";

    await fillReconciliationForm(page, "Alice", {
      balance: secondBalance,
      returnPercent: "8.2",
      pnlTotal: "500",
      pnlToday: "20",
      pnlThisMonth: "150",
    });
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/entry saved/i)).toBeVisible();

    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientLogin(clientPage, "alice@example.com", "ClientPass123!");
      await clientPage.goto("/dashboard/portfolio");
      await expect(clientPage.getByText("$9,999")).toBeVisible({ timeout: 10000 });
      await clientContext.close();
    }
  });

  test("AREC-05: routine (non-settlement) entries do not create commission records", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/earnings");
    const recordsBefore = await page.locator("table tbody tr").count();

    await fillReconciliationForm(page, "Ben", {
      balance: "750",
      returnPercent: "3",
      pnlTotal: "20",
      pnlToday: "5",
      pnlThisMonth: "15",
    });
    const settlementCheckbox = page.getByRole("checkbox", { name: /mark as official settlement/i });
    await expect(settlementCheckbox).not.toBeChecked();
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/entry saved/i)).toBeVisible();

    await page.goto("/admin/earnings");
    const recordsAfter = await page.locator("table tbody tr").count();
    expect(recordsAfter, "A routine reconciliation entry should not create new commission records").toBe(recordsBefore);
  });

  test("AREC-08: settlement checkbox reveals a required period field", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/reconciliation");
    const settlementCheckbox = page.getByRole("checkbox", { name: /mark as official settlement/i });
    await settlementCheckbox.check();
    await expect(page.getByPlaceholder(/january 2026/i)).toBeVisible();

    await page.locator("select").first().selectOption({ label: /alice/i });
    await page.getByLabel(/balance/i).fill("1000");
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/enter a settlement period label/i)).toBeVisible();
  });

  test("AREC-04: the reconciliation log/history table shows newly-saved entries", async ({ page }) => {
    await adminLogin(page);
    const uniqueBalance = (2000 + Math.floor(Math.random() * 999)).toString();

    await fillReconciliationForm(page, "Ben", {
      balance: uniqueBalance,
      returnPercent: "4.4",
      pnlTotal: "44",
      pnlToday: "4",
      pnlThisMonth: "44",
    });
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/entry saved/i)).toBeVisible();

    // The same admin reconciliation page should show a log/table of past
    // entries somewhere below the form -- look for the fresh balance
    // value appearing in it as confirmation the log actually updates.
    await expect(page.getByText(new RegExp(`\\$${uniqueBalance}`))).toBeVisible({ timeout: 10000 });
  });

  test("AREC-06: a zero or negative balance is accepted, not silently blocked", async ({ page, context }) => {
    await adminLogin(page);
    await fillReconciliationForm(page, "Ben", {
      balance: "0",
      returnPercent: "-2.5",
      pnlTotal: "-50",
      pnlToday: "-10",
      pnlThisMonth: "-50",
    });
    await page.getByRole("button", { name: /save reconciliation entry/i }).click();
    await expect(page.getByText(/entry saved/i)).toBeVisible();

    const clientContext = await context.browser()?.newContext();
    if (clientContext) {
      const clientPage = await clientContext.newPage();
      await clientLogin(clientPage, "ben@example.com", "ClientPass123!");
      await clientPage.goto("/dashboard/portfolio");
      // The client should see the real (accurate) $0 figure, not a
      // hidden/blocked state -- accuracy matters more than optics here.
      await expect(clientPage.getByText("$0")).toBeVisible({ timeout: 10000 });
      await clientContext.close();
    }
  });

  test("AREC-07: non-numeric input in the Balance field is rejected", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/reconciliation");
    await page.locator("select").first().selectOption({ label: /alice/i });

    const balanceField = page.getByLabel(/balance/i);
    await balanceField.fill("not-a-number");
    // Browser-level number input constraints typically strip non-numeric
    // characters on type rather than allowing them through -- confirm
    // the field never actually holds the invalid string.
    const actualValue = await balanceField.inputValue();
    expect(actualValue, "Balance field should not accept non-numeric characters").not.toBe("not-a-number");
  });
});
