# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\data-integrity.spec.ts >> Cross-Cutting Data Integrity >> ADATA-02: a client cannot see another client's commission records (RLS enforcement)
- Location: tests\admin\data-integrity.spec.ts:56:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard/
Received string:  "https://www.crestonmarkets.com/login"
Timeout: 15000ms

Call log:
  - Expect "toHaveURL" with timeout 15000ms
    32 × locator resolved to <html lang="en" class="dark">…</html>
       - unexpected value "https://www.crestonmarkets.com/login"

```

```yaml
- banner:
  - navigation:
    - link "Creston Markets":
      - /url: /
      - img "Creston Markets"
    - link "About":
      - /url: /#about
    - link "How We Trade":
      - /url: /how-we-trade
    - link "Plans":
      - /url: /#plans
    - link "Features":
      - /url: /#features
    - link "FAQ":
      - /url: /#faq
    - link "Contact":
      - /url: /#contact
    - button "Toggle theme":
      - img
    - link "Log In":
      - /url: /login
    - link "Open Account":
      - /url: /register
- main:
  - link "Creston Markets":
    - /url: /
    - img "Creston Markets"
  - heading "Welcome back" [level=1]
  - paragraph: Log in to access your dashboard
  - text: Email
  - img
  - textbox "you@example.com": crestontest-b-1786655384300@example.com
  - text: Password
  - img
  - textbox "••••••••": TestChainPass123!
  - button "Show password":
    - img
  - checkbox "Remember Me"
  - text: Remember Me
  - link "Forgot Password?":
    - /url: /forgot-password
  - button "Log In":
    - img
    - text: Log In
  - text: or
  - button "Continue with Google"
  - paragraph:
    - text: Don't have an account?
    - link "Open Account":
      - /url: /register
- contentinfo:
  - link "Creston Markets":
    - /url: /
    - img "Creston Markets"
  - paragraph: Institutional-grade algorithmic trading. Built for serious investors.
  - heading "Platform" [level=4]
  - list:
    - listitem:
      - link "Plans":
        - /url: /#plans
    - listitem:
      - link "Features":
        - /url: /#features
    - listitem:
      - link "FAQ":
        - /url: /#faq
    - listitem:
      - link "Open Account":
        - /url: /register
  - heading "Legal" [level=4]
  - list:
    - listitem:
      - link "Privacy Policy":
        - /url: /privacy
    - listitem:
      - link "Terms of Service":
        - /url: /terms
    - listitem:
      - link "Risk Disclaimer":
        - /url: /risk-disclaimer
    - listitem:
      - link "Cookie Policy":
        - /url: /cookies
  - heading "Contact" [level=4]
  - list:
    - listitem: support@crestonmarkets.com
    - listitem:
      - link "Contact Form":
        - /url: /#contact
  - paragraph: Trading in financial instruments involves significant risk of loss and may not be suitable for all investors. Past performance does not guarantee future results. The value of your investment can go down as well as up. Please ensure you fully understand the risks before investing. Creston Markets is not a licensed financial advisor. This platform connects investors to a PAMM-managed fund — capital is actively traded in live markets.
  - paragraph: Creston Markets is not a regulated financial advisor. Investments involve risk.
  - paragraph: © 2026 Creston Markets. All rights reserved.
- alert
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * Shared login helpers for the admin test suite. Deliberately kept in a
  5  |  * plain .ts file (NOT a .spec.ts file) -- Playwright disallows one spec
  6  |  * file importing from another spec file, since spec files are meant to
  7  |  * contain only tests, not double as shared modules. This file exists
  8  |  * specifically so every admin test file can import adminLogin/clientLogin
  9  |  * without triggering that error.
  10 |  */
  11 | 
  12 | const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
  13 | const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  14 | const CLIENT_EMAIL = process.env.TEST_CLIENT_EMAIL || "alice@example.com";
  15 | const CLIENT_PASSWORD = process.env.TEST_CLIENT_PASSWORD || "ClientPass123!";
  16 | 
  17 | export async function adminLogin(page: Page) {
  18 |   await page.goto("/admin/login");
  19 |   await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  20 |   await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  21 |   await page.getByRole("button", { name: /log in/i }).click();
  22 |   await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
  23 | }
  24 | 
  25 | export async function clientLogin(page: Page, email = CLIENT_EMAIL, password = CLIENT_PASSWORD) {
  26 |   await page.goto("/login");
  27 |   await page.getByPlaceholder("you@example.com").fill(email);
  28 |   await page.locator('input[name="password"]').fill(password);
  29 |   await page.getByRole("button", { name: /log in/i }).click();
> 30 |   await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  31 | }
  32 | 
```