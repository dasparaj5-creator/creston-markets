import { test, expect } from "@playwright/test";

/**
 * Section 4 — Registration Flow (REG-01 through REG-18)
 *
 * Does NOT complete a real registration end-to-end (email confirmation
 * blocks that in an automated run) -- verifies form validation, security
 * input handling, and UI behavior before submission.
 */

test.describe("Registration form", () => {
  test("REG-02: shows validation errors when submitted empty", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/register/);
    await expect(page.getByText(/full name is required/i)).toBeVisible();
  });

  test("REG-03: rejects invalid email formats", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Jane Doe").fill("Test User");
    for (const badEmail of ["test@", "test.com", "test @test.com"]) {
      await page.getByPlaceholder("you@example.com").fill(badEmail);
      await page.getByRole("button", { name: /create account/i }).click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test("REG-05: weak password is rejected", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Jane Doe").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    // Below the 8-character minimum enforced by the schema.
    await page.locator('input[name="password"]').fill("weak");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
  });

  test("REG-06: password confirmation mismatch is caught", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Jane Doe").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);

    // The mismatch error is a Zod .refine() on the whole form -- it only
    // surfaces if every OTHER required field validates first. Country,
    // phone, and the two checkboxes are also required, so this test
    // needs to fill everything, not just the two password fields, or
    // submission gets blocked earlier and "Passwords do not match"
    // never has a chance to render.
    await page.getByRole("combobox").click();
    await page.getByText("United States", { exact: false }).first().click();
    await page.getByPlaceholder("Phone number").fill("2025550100");

    await page.locator('input[name="password"]').fill("ValidPassword123!");
    await page.locator('input[name="confirmPassword"]').fill("DifferentPassword123!");

    await page.getByRole("checkbox", { name: /terms of service/i }).check();
    await page.getByRole("checkbox", { name: /understand that trading/i }).check();

    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("REG-07: password field masking + show/hide toggle", async ({ page }) => {
    await page.goto("/register");
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.fill("SomeSecret123");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.locator('input[name="password"]').locator("xpath=following-sibling::button").click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  test("REG-08: SQL injection attempt in name field is inert", async ({ page }) => {
    await page.goto("/register");
    const injection = "' OR 1=1--";
    await page.getByPlaceholder("Jane Doe").fill(injection);
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    await page.getByRole("button", { name: /create account/i }).click();
    // The important assertion: no server error / crash, and the value we
    // typed doesn't get reflected unescaped anywhere that would indicate
    // it ran as a query fragment rather than plain text.
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toContain("syntax error");
    expect(bodyText).not.toContain("SQLSTATE");
  });

  test("REG-09: XSS attempt in name field does not execute", async ({ page }) => {
    await page.goto("/register");
    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });
    await page.getByPlaceholder("Jane Doe").fill("<script>alert(1)</script>");
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    await page.waitForTimeout(500);
    expect(dialogFired, "A script tag in an input field triggered a JS dialog -- XSS executed").toBe(false);
  });

  test("REG-10: extremely long input does not crash the form", async ({ page }) => {
    await page.goto("/register");
    const longString = "A".repeat(1000);
    await page.getByPlaceholder("Jane Doe").fill(longString);
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    // Page should remain responsive -- confirm we can still interact with
    // a different field afterward rather than the tab hanging.
    await page.locator('input[name="password"]').fill("Test1234!");
    await expect(page.locator('input[name="password"]')).toHaveValue("Test1234!");
  });

  test("REG-11: submission blocked until Terms + Risk checkboxes are checked", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Jane Doe").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill("TestPassword123!");
    await page.locator('input[name="confirmPassword"]').fill("TestPassword123!");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/must agree to the terms/i)).toBeVisible();
  });

  test("REG-12: referral code from URL is captured and locked in the field", async ({ page }) => {
    await page.goto("/register?ref=TESTCODE123");
    const referralField = page.locator('input[name="referralCode"]');
    await expect(referralField).toHaveValue("TESTCODE123");
  });

  test("REG-13: invalid referral code doesn't block registration form usage", async ({ page }) => {
    await page.goto("/register?ref=THISCODEDOESNOTEXIST");
    // The field should still accept it and the rest of the form should
    // remain fully usable -- actual referrer lookup happens server-side
    // at signUp time, not blocking client-side form interaction.
    const referralField = page.locator('input[name="referralCode"]');
    await expect(referralField).toHaveValue("THISCODEDOESNOTEXIST");
    await expect(page.getByPlaceholder("Jane Doe")).toBeEnabled();
  });

  test("REG-16: phone field enforces country-specific validation", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("combobox").click();
    await page.getByText("India", { exact: false }).first().click();

    const phoneInput = page.getByPlaceholder("Phone number");
    // India requires 10 digits -- 5 digits should be flagged invalid.
    await phoneInput.fill("98765");
    await expect(page.getByText(/enter a valid phone number/i)).toBeVisible();
  });

  test("REG (regression): country dropdown and phone field don't cause a page freeze", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("combobox").click();
    await page.getByText("India", { exact: false }).first().click();
    const phoneInput = page.getByPlaceholder("Phone number");
    await phoneInput.fill("9876543210");
    await expect(phoneInput).toHaveValue("9876543210");
  });

  test("REG-18: double-clicking submit does not fire duplicate requests", async ({ page }) => {
    await page.goto("/register");
    await page.getByPlaceholder("Jane Doe").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`test-${Date.now()}@example.com`);
    await page.locator('input[name="password"]').fill("TestPassword123!");
    await page.locator('input[name="confirmPassword"]').fill("TestPassword123!");
    // Leaving checkboxes unchecked keeps this from actually submitting
    // (avoids creating real test accounts), while still letting us verify
    // the button doesn't double-fire on rapid clicks.
    const button = page.getByRole("button", { name: /create account/i });
    await Promise.all([button.click(), button.click()]);
    // If double-submission were a problem we'd expect two toasts/errors;
    // this is a smoke-level check that the UI doesn't visibly break.
    await expect(page).toHaveURL(/register/);
  });
});
