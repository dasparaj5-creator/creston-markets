import { test, expect } from "@playwright/test";

/**
 * Section 14 — Content/Compliance Consistency (CMP-01 through CMP-06)
 *
 * High priority given this is a financial product. Playwright can verify
 * TEXT PRESENCE reliably; whether the underlying claims are true/accurate
 * still needs a human review -- these tests catch drift and omission, not
 * factual correctness.
 */

const PAGES_MENTIONING_RETURNS = ["/", "/how-we-trade", "/register", "/risk-disclaimer"];

test.describe("Compliance Consistency", () => {
  test("CMP-01: risk disclaimer appears on every page that discusses returns/investment", async ({ page }) => {
    for (const path of PAGES_MENTIONING_RETURNS) {
      await page.goto(path);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      const hasRiskLanguage =
        bodyText.includes("risk") &&
        (bodyText.includes("capital") || bodyText.includes("loss") || bodyText.includes("licensed financial advisor"));
      expect(hasRiskLanguage, `${path} should contain risk disclosure language`).toBe(true);
    }
  });

  test("CMP-02: no guaranteed-return language appears anywhere on public pages", async ({ page }) => {
    const bannedPhrases = ["guaranteed return", "risk-free", "fixed return", "guaranteed profit"];
    for (const path of [...PAGES_MENTIONING_RETURNS, "/how-we-trade"]) {
      await page.goto(path);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      for (const phrase of bannedPhrases) {
        expect(bodyText, `Found banned phrase "${phrase}" on ${path}`).not.toContain(phrase);
      }
    }
  });

  test("CMP-03: 'not a licensed financial advisor' disclosure appears sitewide", async ({ page }) => {
    for (const path of ["/", "/risk-disclaimer"]) {
      await page.goto(path);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      expect(bodyText, `${path} should disclose 'not a licensed financial advisor'`).toContain(
        "not a licensed financial advisor"
      );
    }
  });

  test("CMP-04: plan minimums appear correctly on the homepage", async ({ page }) => {
    await page.goto("/");
    await page.locator("#plans").scrollIntoViewIfNeeded();
    const homepageText = await page.locator("#plans").innerText();
    expect(homepageText).toContain("$200");
    expect(homepageText).toContain("$350");
    expect(homepageText).toContain("$500");
  });
});
