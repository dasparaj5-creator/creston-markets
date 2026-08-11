# Creston Markets — Automated Testing

This folder contains Playwright scenario tests that run against your **live
site** by default (`https://www.crestonmarkets.com`), since that's where
you're currently testing.

## One-time setup

```bash
npm install
npx playwright install chromium
```

The second command downloads the actual browser Playwright drives — only
needed once per machine.

## Running the tests

**Run everything:**
```bash
npm test
```

**Run with a visual UI (recommended the first time — lets you watch it click through the site):**
```bash
npm run test:ui
```

**Run against localhost instead of the live site:**
```bash
TEST_BASE_URL=http://localhost:3000 npm test
```

**Run the admin-dependent tests** (commission config, user detail, support tickets):
```bash
ADMIN_EMAIL=admin@crestonmarkets.com ADMIN_PASSWORD=your-real-admin-password npm test
```
Without these two environment variables, admin-dependent tests are automatically
skipped rather than failing — safe to run the rest without them.

## What's covered right now

| File | What it checks |
|---|---|
| `auth.spec.ts` | Registration form validation, mandatory risk/terms checkboxes are actually enforced, password visibility toggles work, phone/country fields don't freeze the page (regression test for the bug found earlier), login error handling |
| `referral-commissions.spec.ts` | Referral link capture on registration, admin can view the 5-table commission config, admin user detail page shows referral network, support ticket expand/collapse works (regression test for the nested-Link bug) |
| `mobile-nav.spec.ts` | Every dashboard page is reachable from the mobile bottom nav — regression test for the Withdraw-disappeared-from-mobile bug |

## Important honest limitation

These tests verify the **UI layer** — that forms validate correctly, pages
load, navigation works, buttons do what they should. They do **not**
fully automate the deposit-approval → commission-calculation → payout
cycle end to end, because that flow deliberately requires manual review
(crypto transaction hash verification) by design, not something that
should be automated away.

**For anything touching real commission math** (the 5-table depth-based
engine), the safest practice is still: after any change to that logic,
manually walk through one real multi-person referral chain yourself —
register 2-3 test accounts referring each other, approve a deposit, mark
a settlement, and confirm the numbers match what the config tables say
they should. These automated tests catch UI regressions quickly; they
don't replace that one careful manual pass on money logic.

## Viewing test results

After a run, an HTML report is generated. Open it with:
```bash
npx playwright show-report
```
This shows screenshots and video recordings of anything that failed.
