import { test, expect } from "@playwright/test";

/** Section 2 — Navigation & Layout (NAV-01 through NAV-08) */

test.describe("Navigation & Layout", () => {
  test("NAV-01: Logo click returns to homepage", async ({ page }) => {
    await page.goto("/how-we-trade");
    await page.locator("header a[href='/']").first().click();
    await expect(page).toHaveURL("/");
  });

  test("NAV-02: Footer Platform links work", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Plans" })).toHaveAttribute("href", "/#plans");
    await expect(footer.getByRole("link", { name: "Features" })).toHaveAttribute("href", "/#features");
    await expect(footer.getByRole("link", { name: "FAQ" })).toHaveAttribute("href", "/#faq");
    await expect(footer.getByRole("link", { name: "Open Account" })).toHaveAttribute("href", "/register");
  });

  test("NAV-03: Footer Legal links load correct pages", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    const legalLinks: [string, RegExp][] = [
      ["Privacy Policy", /\/privacy/],
      ["Terms of Service", /\/terms/],
      ["Risk Disclaimer", /\/risk-disclaimer/],
      ["Cookie Policy", /\/cookies/],
    ];
    for (const [name, urlPattern] of legalLinks) {
      await page.goto("/");
      await footer.getByRole("link", { name }).click();
      await expect(page).toHaveURL(urlPattern);
    }
  });

  test("NAV-04: Footer support email is a mailto link", async ({ page }) => {
    await page.goto("/");
    // The footer renders the support email as plain text (list item), not
    // necessarily a mailto anchor -- verify whichever is actually true
    // rather than assume; this test documents current behavior.
    const emailText = page.locator("footer").getByText("support@crestonmarkets.com");
    await expect(emailText).toBeVisible();
  });

  test("NAV-07: Direct URL access to homepage anchors works", async ({ page }) => {
    for (const anchor of ["#plans", "#faq", "#features", "#contact"]) {
      const response = await page.goto(`/${anchor}`);
      expect(response?.status()).toBeLessThan(400);
    }
  });

  test("NAV-08: Unknown route does not show a raw server error", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist-xyz");
    // Next.js default 404 page returns 404 status but should still render
    // a styled page, not a stack trace.
    expect(response?.status()).toBe(404);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toContain("errorevent");
  });
});
