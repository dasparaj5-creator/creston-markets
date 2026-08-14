import { test, expect } from "@playwright/test";

/**
 * Section 1 — Smoke Suite (public test case doc: SMK-01 through SMK-10)
 * Run on every deploy. Fast, broad, catches total breakage.
 */

test.describe("Smoke Suite", () => {
  test("SMK-01: Homepage loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("SMK-02: Register page loads", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /open your account/i })).toBeVisible();
  });

  test("SMK-03: Login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("SMK-04: How We Trade page loads", async ({ page }) => {
    const response = await page.goto("/how-we-trade");
    expect(response?.status()).toBeLessThan(400);
  });

  test("SMK-05: Legal pages load", async ({ page }) => {
    for (const path of ["/privacy", "/terms", "/risk-disclaimer", "/cookies"]) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return < 400`).toBeLessThan(400);
    }
  });

  test("SMK-06: Nav anchors work", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Plans", exact: true }).first().click();
    await expect(page).toHaveURL(/#plans/);
  });

  test("SMK-07: Open Account CTA works", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /open account/i }).first().click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("SMK-08: Log In CTA works", async ({ page }) => {
    await page.goto("/");

    // On narrow viewports the desktop nav's "Log In" link is hidden
    // (md:flex) and only the version inside the hamburger menu is
    // reachable -- open that menu first if it's present, since a plain
    // click on "Log In" times out on mobile without this.
    const menuToggle = page.getByRole("button", { name: /toggle menu/i });
    if (await menuToggle.isVisible().catch(() => false)) {
      await menuToggle.click();
    }

    await page.getByRole("link", { name: "Log In", exact: true }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("SMK-09: No console errors on homepage load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // TradingView's own widget occasionally logs benign warnings -- filter
    // those out rather than failing on third-party noise we don't control.
    const ownErrors = errors.filter((e) => !e.toLowerCase().includes("tradingview"));
    expect(ownErrors, `Console errors found:\n${ownErrors.join("\n")}`).toEqual([]);
  });

  test("SMK-10: No broken images on homepage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const src = await img.getAttribute("src");
      expect(naturalWidth, `Image failed to load: ${src}`).toBeGreaterThan(0);
    }
  });
});
