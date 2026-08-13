import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers";

/** Section 3 — Plan Allocation (APLN-01 through APLN-06) */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

test.describe("Plan Allocation", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");

  test("APLN-01: admin changes a client's plan and it reflects on their profile", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    await page.getByText("chloe@example.com").click();

    const planSelect = page.locator("select").filter({ hasText: /no plan|bronze|silver|gold/i }).first();
    await planSelect.selectOption({ label: /silver/i });
    await page.getByRole("button", { name: /save plan/i }).click();
    await expect(page.getByText(/plan set to silver/i)).toBeVisible();

    await page.reload();
    await expect(page.locator("text=Silver")).toBeVisible();
  });

  test("APLN-03: removing a client's plan sets it back to 'No plan'", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    await page.getByText("chloe@example.com").click();

    const planSelect = page.locator("select").filter({ hasText: /no plan|bronze|silver|gold/i }).first();
    await planSelect.selectOption({ label: /no plan/i });
    await page.getByRole("button", { name: /save plan/i }).click();
    await expect(page.getByText(/plan removed/i)).toBeVisible();
  });

  test("APLN-05: Save button is disabled when no change has been made", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/users");
    await page.getByText("alice@example.com").click();

    const saveButton = page.getByRole("button", { name: /save plan/i });
    await expect(saveButton).toBeDisabled();
  });
});
