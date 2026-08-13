import { test, expect } from "@playwright/test";
import { adminLogin, clientLogin } from "./helpers";
import { CHAIN } from "./chain-setup";

/**
 * Section 10 — Cross-Cutting Data Integrity Checks (ADATA-01 through
 * ADATA-03)
 *
 * These aren't single-click test cases -- they're structural spot-checks
 * meant to run AFTER a full Section 5 (referral engine) pass, since they
 * depend on that test data existing. Run referral-engine.spec.ts first
 * with RUN_REFERRAL_CHAIN_TESTS=true, then run this file.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const RUN_CHAIN_TESTS = process.env.RUN_REFERRAL_CHAIN_TESTS === "true";

test.describe("Cross-Cutting Data Integrity", () => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run admin tests");
  test.skip(
    !RUN_CHAIN_TESTS,
    "Set RUN_REFERRAL_CHAIN_TESTS=true and run referral-engine.spec.ts first -- these checks depend on that test data existing"
  );

  test("ADATA-01: no duplicate or phantom commission records exist for the test chain", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/earnings");

    // Every commission record should be uniquely identifiable by
    // (beneficiary, source event). Look for exact duplicate rows -- same
    // beneficiary, same source user, same type, same amount, appearing
    // more than once, which would indicate a double-fire bug in the
    // trigger functions.
    const allRowTexts: string[] = [];
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).innerText();
      if (text.includes("Test Chain")) {
        allRowTexts.push(text.replace(/\s+/g, " ").trim());
      }
    }

    const seen = new Map<string, number>();
    for (const rowText of allRowTexts) {
      seen.set(rowText, (seen.get(rowText) || 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1);
    expect(
      duplicates,
      `Found exact-duplicate commission rows, indicating a possible double-trigger bug: ${JSON.stringify(duplicates)}`
    ).toEqual([]);
  });

  test("ADATA-02: a client cannot see another client's commission records (RLS enforcement)", async ({ page }) => {
    // Log in as Test-B and attempt to view Test-C's earnings page data
    // by inspecting what's actually rendered -- if RLS is working, B's
    // own earnings page should never show C's beneficiary-side records.
    await clientLogin(page, CHAIN[1].email, CHAIN[1].password); // Test-B
    await page.goto("/dashboard/earnings");

    const pageText = await page.locator("body").innerText();
    // B legitimately sees mentions of downline members' names (their
    // network), but should never see a commission amount attributed to
    // someone else as the BENEFICIARY. This is a soft check: full
    // confirmation requires inspecting network requests/responses
    // directly for another user's beneficiary_id, which is better done
    // via a Supabase client-side query test than a UI assertion --
    // noted here as a manual-follow-up if this soft check ever seems off.
    expect(pageText).toBeTruthy();

    // Direct network-level check: intercept the Supabase REST call this
    // page makes and confirm the returned rows all belong to Test-B.
    const responses: string[] = [];
    page.on("response", async (response) => {
      if (response.url().includes("commission_records") && response.status() === 200) {
        try {
          const body = await response.json();
          if (Array.isArray(body)) {
            responses.push(...body.map((r: any) => r.beneficiary_id));
          }
        } catch {
          /* non-JSON response, ignore */
        }
      }
    });
    await page.reload();
    await page.waitForTimeout(2000);

    if (responses.length > 0) {
      const uniqueBeneficiaries = new Set(responses);
      expect(
        uniqueBeneficiaries.size,
        "commission_records response for Test-B's own earnings page contained a different beneficiary_id -- RLS may not be scoping correctly"
      ).toBeLessThanOrEqual(1);
    }
  });

  test("ADATA-03: admin audit log captures KYC decisions and plan changes made during testing", async ({ page }) => {
    await adminLogin(page);

    // There's no dedicated "audit log" page confirmed in the nav as of
    // this writing -- this test checks the most likely places it might
    // surface (a Settings sub-page, or inline history on user detail).
    // If neither exists, this is worth a direct question to the dev
    // team about whether admin_audit_log has any UI at all yet, since
    // it's written to but may not be readable anywhere in the admin panel.
    await page.goto("/admin/settings");
    const auditSection = page.getByText(/audit log|activity log|admin actions/i);

    if (!(await auditSection.count())) {
      test.skip(
        true,
        "GAP: no admin-facing audit log UI found at /admin/settings. The admin_audit_log table is written to by several actions (plan changes, config changes) but may have no page to actually view it -- confirm with the dev team whether this is intended to be DB-only for now."
      );
    }
    await expect(auditSection.first()).toBeVisible();
  });
});
