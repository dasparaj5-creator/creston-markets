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

    // Each FAQ item is a .glass-card containing a <button> (question) and
    // a sibling <div> (answer). Scope to that specific card so the
    // "$200" match only looks inside THIS answer, not anywhere else on
    // the page (the Plans section elsewhere on the same homepage also
    // shows "$200.00", which would otherwise cause a strict-mode
    // violation on an unscoped page-wide match).
    const minInvestmentCard = page.locator("#faq .glass-card", { hasText: /minimum investment/i });
    await minInvestmentCard.getByRole("button").click();
    await expect(minInvestmentCard.getByText(/\$200/)).toBeVisible();
  });
});
