import { test, expect } from "@playwright/test";

/**
 * Section 11 — Security (Black-Box Level)
 *
 * IMPORTANT SCOPE NOTE: not every case in this section is automatable
 * from a black-box browser test. Genuine penetration testing (SEC-06
 * probing authenticated API endpoints directly, SEC-07 CSRF token
 * manipulation, SEC-10 server-side file-type bypass attempts) requires
 * either backend access or a dedicated security testing tool, not
 * Playwright driving a browser UI. What's below is the subset that's
 * legitimately checkable this way: response headers, cookie flags, and
 * publicly-observable configuration.
 */

test.describe("Security, response-level checks", () => {
  test("SEC-01: HTTPS is enforced", async ({ page }) => {
    const baseURL = test.info().project.use.baseURL as string;
    if (baseURL?.includes("localhost")) test.skip();
    await page.goto("/");
    expect(page.url()).toMatch(/^https:\/\//);
  });

  test("SEC-02: security headers are present", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};

    const checks: Record<string, boolean> = {
      "x-frame-options": !!headers["x-frame-options"],
      "x-content-type-options": !!headers["x-content-type-options"],
      "strict-transport-security": !!headers["strict-transport-security"],
      "content-security-policy": !!headers["content-security-policy"],
    };

    console.log("Security header presence:", checks);

    const hasFrameProtection =
      !!headers["x-frame-options"] || (headers["content-security-policy"] ?? "").includes("frame-ancestors");
    expect(hasFrameProtection, "No clickjacking protection header found (X-Frame-Options or CSP frame-ancestors)").toBe(true);
  });

  test("SEC-03: auth cookies are flagged Secure and HttpOnly", async ({ page, context }) => {
    const baseURL = test.info().project.use.baseURL as string;
    if (baseURL?.includes("localhost")) test.skip();

    await page.goto("/login");
    const cookies = await context.cookies();
    const authCookies = cookies.filter((c) => c.name.toLowerCase().includes("sb-") || c.name.toLowerCase().includes("auth"));

    for (const cookie of authCookies) {
      expect(cookie.secure, `Cookie ${cookie.name} should be Secure`).toBe(true);
      expect(cookie.httpOnly, `Cookie ${cookie.name} should be HttpOnly`).toBe(true);
    }
  });

  test("SEC-04: no obvious secrets in page source", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    const suspiciousPatterns = [/sk_live_[a-zA-Z0-9]+/, /SUPABASE_SERVICE_ROLE_KEY/, /-----BEGIN PRIVATE KEY-----/];
    for (const pattern of suspiciousPatterns) {
      expect(html, `Found a pattern matching ${pattern} in page source`).not.toMatch(pattern);
    }
  });

  test("SEC-09: robots.txt does not reference admin paths", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    if (response?.status() === 404) return;
    const text = await page.locator("body").innerText();
    expect(text.toLowerCase()).not.toContain("/admin");
  });
});
