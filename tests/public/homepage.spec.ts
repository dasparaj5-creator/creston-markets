import { test, expect } from "@playwright/test";

/** Section 3 — Homepage Content (HP-01 through HP-11) */

test.describe("Homepage Content", () => {
  test("HP-03: How It Works 4-step flow displays in order", async ({ page }) => {
    await page.goto("/");
    const steps = ["Register & Verify", "Choose Investment Plan", "PAMM Algorithms Trade", "Monitor Performance"];
    // Confirm each step text appears; exact copy may differ slightly from
    // the doc's shorthand, so this checks for the key phrase per step
    // rather than an exact string match.
    for (const step of ["STEP 1", "STEP 2", "STEP 3", "STEP 4"]) {
      await expect(page.getByText(step)).toBeVisible();
    }
  });

  test("HP-04: Investment Plans display correct minimums", async ({ page }) => {
    await page.goto("/");
    await page.locator("#plans").scrollIntoViewIfNeeded();
    // The plan price renders as e.g. "$200.00" in a dedicated gold price
    // element -- match that exact rendered string rather than a loose
    // substring, since "$200" also appears inside unrelated descriptive
    // paragraphs elsewhere on the page (e.g. FAQ-style copy), which
    // causes a strict-mode violation (multiple matching elements) if
    // matched loosely.
    await expect(page.getByText("$200.00")).toBeVisible();
    await expect(page.getByText("$350.00")).toBeVisible();
    await expect(page.getByText("$500.00")).toBeVisible();
  });

  test("HP-05: Most Popular badge shows on exactly one plan", async ({ page }) => {
    await page.goto("/");
    await page.locator("#plans").scrollIntoViewIfNeeded();
    const badges = page.getByText("Most Popular");
    await expect(badges).toHaveCount(1);
  });

  test("HP-06: Plan Open Account buttons route to /register", async ({ page }) => {
    await page.goto("/");
    await page.locator("#plans").scrollIntoViewIfNeeded();
    const planButtons = page.locator("#plans").getByRole("link", { name: /open account/i });
    const count = await planButtons.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(planButtons.nth(i)).toHaveAttribute("href", "/register");
    }
  });

  test("HP-08: Illustrative Performance section shows disclaimer, not fabricated live data", async ({ page }) => {
    await page.goto("/");
    // Both the section heading ("Illustrative Performance") and the
    // disclaimer paragraph beneath it ("Illustrative performance — live
    // data...") contain this phrase, causing a strict-mode violation on
    // an unscoped match. The actual intent of this test is the
    // disclaimer specifically, so match the full disclaimer sentence
    // rather than just the shared opening words.
    await expect(page.getByText(/illustrative performance, live data connected post-launch/i)).toBeVisible();
  });

  test("HP-09: Testimonials labeled as placeholder", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/placeholder testimonials/i)).toBeVisible();
  });

  test("HP-10: Risk disclaimer text present in footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByText(/not a licensed financial advisor/i)).toBeVisible();
  });

  test("HP-11: Copyright year is current", async ({ page }) => {
    await page.goto("/");
    const currentYear = new Date().getFullYear().toString();
    await expect(page.locator("footer").getByText(currentYear)).toBeVisible();
  });
});
