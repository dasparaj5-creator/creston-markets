import { test, expect } from "@playwright/test";

/** Section 8 — FAQ Section (FAQ-01 through FAQ-03) */

test.describe("FAQ Accordion", () => {
  test("FAQ-01: FAQ items expand and collapse on click", async ({ page }) => {
    await page.goto("/#faq");
    await page.locator("#faq").scrollIntoViewIfNeeded();
    const secondQuestion = page.locator("#faq button").nth(1);
    await secondQuestion.click();
    await expect(secondQuestion.locator("xpath=following-sibling::div")).toBeVisible();
  });

  test("FAQ-03: minimum investment answer mentions the correct figures", async ({ page }) => {
    await page.goto("/#faq");
    await page.locator("#faq").scrollIntoViewIfNeeded();
    const minInvestmentQuestion = page.getByText(/minimum investment/i);
    await minInvestmentQuestion.click();
    await expect(page.getByText(/\$200/)).toBeVisible();
  });
});
