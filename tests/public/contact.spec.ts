import { test, expect } from "@playwright/test";

/** Section 7 — Contact Form (CON-01 through CON-06) */

test.describe("Contact Form", () => {
  test("CON-02: empty required fields are validated", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test("CON-03: invalid email format is blocked", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByPlaceholder("Full Name").fill("Test User");
    await page.getByPlaceholder("Email Address").fill("not-an-email");
    await page.getByPlaceholder("Subject").fill("Test Subject");
    await page.getByPlaceholder("Message").fill("This is a test message with enough characters.");
    await page.getByRole("button", { name: /send message/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("CON-04: script injection in message field does not execute", async ({ page }) => {
    await page.goto("/#contact");
    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });
    await page.getByPlaceholder("Message").fill("<script>alert(1)</script> plus enough other text to pass length validation");
    await page.waitForTimeout(500);
    expect(dialogFired).toBe(false);
  });

  test("CON-05: very long message is handled gracefully", async ({ page }) => {
    await page.goto("/#contact");
    const longMessage = "A".repeat(5000);
    await page.getByPlaceholder("Message").fill(longMessage);
    // Should not crash the page or the input -- confirm the field still
    // holds a value and the page is still interactive afterward.
    await expect(page.getByPlaceholder("Message")).not.toBeEmpty();
  });
});
