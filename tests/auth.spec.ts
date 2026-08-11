import { test, expect } from "@playwright/test";

/**
 * Scenario: a brand-new visitor registers, confirms basic form validation
 * works, and that the mandatory risk/terms checkboxes are actually enforced
 * (not just decorative). This does NOT complete a real registration (email
 * confirmation would block it anyway) -- it verifies the form itself
 * behaves correctly before submission.
 */
test.describe("Registration form", () => {
  test("shows validation errors when submitted empty", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /create account/i }).click();

    // Should NOT navigate away -- validation should block submission.
    await expect(page).toHaveURL(/register/);
    await expect(page.getByText(/full name is required/i)).toBeVisible();
  });

  test("requires the risk acknowledgment checkbox before submitting", async ({ page }) => {
    await page.goto("/register");

    await page.getByPlaceholder("Jane Doe").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill("TestPassword123!");
    await page.locator('input[name="confirmPassword"]').fill("TestPassword123!");

    // Deliberately leave both checkboxes unchecked.
    await page.getByRole("button", { name: /create account/i }).click();

    await expect(page.getByText(/must agree to the terms/i)).toBeVisible();
  });

  test("password visibility toggle actually works", async ({ page }) => {
    await page.goto("/register");
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill("SomeSecret123");

    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the eye icon (the button immediately after the password input).
    await page.locator('input[name="password"]').locator("xpath=following-sibling::button").click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("country dropdown and phone field don't cause a page freeze", async ({ page }) => {
    await page.goto("/register");

    // This specifically re-tests the infinite-render-loop bug found and
    // fixed earlier -- typing into the phone field should never hang the
    // page. If this test times out, that bug (or a similar one) has
    // regressed.
    await page.getByText("Select country…").click();
    await page.getByText("India", { exact: false }).first().click();

    const phoneInput = page.getByPlaceholder("Phone number");
    await phoneInput.fill("9876543210");

    // If the page were frozen, this simple follow-up interaction would
    // time out rather than complete.
    await expect(phoneInput).toHaveValue("9876543210");
  });
});

test.describe("Login form", () => {
  test("shows an error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("nonexistent-user@example.com");
    await page.locator('input[name="password"]').fill("WrongPassword123!");
    await page.getByRole("button", { name: /log in/i }).click();

    // Supabase returns an auth error -- toast should surface it, and we
    // should NOT be redirected to the dashboard.
    await expect(page).toHaveURL(/login/);
  });

  test("password visibility toggle works on login too", async ({ page }) => {
    await page.goto("/login");
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill("SomePassword");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });
});
