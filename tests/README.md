# Creston Markets — Automated Testing

Playwright scenario tests covering both the public-facing site and the
authenticated admin panel. Runs against your **live site** by default
(`https://www.crestonmarkets.com`), since that's where you're currently
testing.

**Companion documents:** `crestonmarkets_test_cases.md` (public-facing
manual test case reference) and `crestonmarkets_admin_test_cases.md`
(admin-side manual test case reference). Every automated test below maps
to a specific case ID in one of those two documents — the ID is in the
test name, so a failing test tells you exactly which documented scenario
broke.

## One-time setup

```bash
npm install
npx playwright install chromium
```

The second command downloads the actual browser Playwright drives — only
needed once per machine.

## Running the tests

**Run everything (public site only — admin tests auto-skip without credentials):**
```bash
npm test
```

**Run with a visual UI (recommended — lets you watch it click through the site):**
```bash
npm run test:ui
```

**Run against localhost instead of the live site:**
```bash
TEST_BASE_URL=http://localhost:3000 npm test
```

**Run the admin test suite:**
```bash
ADMIN_EMAIL=admin@crestonmarkets.com ADMIN_PASSWORD=your-real-admin-password npm test tests/admin
```
Without these two env vars, every admin-dependent test is automatically
skipped rather than failing — safe to run the public suite alone without
them.

**Run the full 5-layer referral chain suite** (registers real test
accounts — see the warning below before running this one). Note the file
order below is deliberate: `referral-engine.spec.ts` must run FIRST since
it builds the actual test chain; `data-integrity.spec.ts` depends on that
chain already existing and will find nothing to check if run first:
```bash
ADMIN_EMAIL=admin@crestonmarkets.com ADMIN_PASSWORD=your-real-admin-password RUN_REFERRAL_CHAIN_TESTS=true PWDEBUG=1 npm test tests/admin/referral-engine.spec.ts tests/admin/data-integrity.spec.ts
```
`PWDEBUG=1` is required for this run specifically -- the chain-building
step pauses for manual yopmail email confirmation (see
`tests/admin/chain-setup.ts`), and that pause only shows an interactive
window in debug mode. Without it, the pause happens with no visible way
to resume it.

## What's covered

### Public site (`tests/public/`)

| File | Covers |
|---|---|
| `smoke.spec.ts` | Section 1 — homepage, register/login pages load, legal pages, nav, no console errors, no broken images |
| `navigation.spec.ts` | Section 2 — logo, footer links, anchors, 404 handling |
| `homepage.spec.ts` | Section 3 — plan minimums, Most Popular badge, disclaimers, copyright year |
| `registration.spec.ts` | Section 4 — validation, password toggle, phone/country freeze regression test, referral code capture, XSS/SQL injection resistance |
| `login.spec.ts` | Section 5 — invalid credential handling, no user enumeration, password toggle |
| `security.spec.ts` | Section 11 — HTTPS, security headers, cookie flags, no secrets in page source |
| `contact.spec.ts` | Section 7 — form validation |
| `faq.spec.ts` | Section 8 — accordion behavior |
| `compliance.spec.ts` | Section 14 — risk language present, no guaranteed-return claims, plan minimums consistent |
| `mobile-nav.spec.ts` | Regression test for the Withdraw-disappeared-from-mobile-nav bug |

### Admin panel (`tests/admin/`)

| File | Covers |
|---|---|
| `smoke.spec.ts` | Section 1 — admin login, role separation (clients can't reach admin, admins-only login), all nav sections load, logout. **Also exports the shared `adminLogin()` and `clientLogin()` helpers every other admin file imports.** |
| `user-management.spec.ts` | Section 2 — user list, search, detail page, KYC approve/reject, account hold (confirms login is actually blocked, not just hidden from the list), KYC document viewer |
| `plan-allocation.spec.ts` | Section 3 — changing a client's plan, removing a plan, Save button disabled with no changes |
| `reconciliation.spec.ts` | Section 4 — P&L entry visible on client dashboard, new-user first entry, superseding entries, routine entries don't trigger commissions, zero/negative balances accepted, non-numeric input rejected, log/history table updates |
| `referral-engine.spec.ts` | Section 5 — **the centerpiece file.** All 5 depth tables tested individually (joining bonus + profit share), roll-off beyond depth 5, sum-checks per table, historical-rate protection on config change, notifications per position (not just the nearest), mobile notification bell, client-side network position display |
| `chain-setup.ts` | Not a test file — shared helper that builds the real A→B→C→D→E→F→G test chain via actual referral-link registration |
| `approvals.spec.ts` | Section 6 — deposit/withdrawal approval, crypto-only withdrawal fields, no double-processing, pending-count badge accuracy |
| `support-tickets.spec.ts` | Section 7 — ticket list, expand-on-click (regression test for the nested-Link bug), reply + status change reflects on client side, status filter, link to client profile |
| `announcements.spec.ts` | Section 8 — publish to all users, deactivation removes it from client view. **Flags a real gap:** "Specific User" targeting has no user-picker UI in the current build |
| `reports.spec.ts` | Section 9 — KPI cards load with real data. **Flags a real gap:** the "Referral Bonuses Paid" figure likely still queries the legacy single-tier table, not the current 5-layer commission engine |
| `data-integrity.spec.ts` | Section 10 — no duplicate/phantom commission records, RLS prevents cross-client data leakage, audit log coverage (flags if no admin-facing audit log UI exists) |

## Two real feature gaps found while writing these tests

Writing tests against the actual component code (not just clicking
around) surfaced two things worth fixing, independent of testing:

1. **Announcements → "Specific User" targeting** has a dropdown option
   but no way to actually pick which user — the UI to choose a recipient
   was never built. `announcements.spec.ts` → `AANN-02` will skip with an
   explanation rather than false-pass on this.
2. **Reports → "Referral Bonuses Paid"** queries the old
   `referral_bonuses` table, not `commission_records` — since the 5-layer
   engine rebuild, this number is very likely undercounting real payouts.
   `reports.spec.ts` → `AREP-02` checks for this specifically.

Neither is a test bug — flag both to whoever's tracking the build backlog.

## Important honest limitations

**Email confirmation blocks full registration automation.** The referral
chain suite (`chain-setup.ts`) registers real accounts via real referral
links — but if your Supabase project requires email confirmation before
login, these tests will stall waiting for a login that can't complete
without a human clicking a confirmation link. Either disable email
confirmation on a **dedicated test project** (never production) or expect
to manually confirm each test account's email between steps.

**Deposit approval still requires manual crypto verification by design.**
`referral-engine.spec.ts`'s `approveFirstDeposit()` helper only clicks the
Approve button — it assumes a deposit with proof has already been
submitted through the real client-side flow first. This suite doesn't
(and shouldn't) automate away the human judgment call of verifying a
transaction hash.

**For anything touching real commission math**, the safest practice is
still: after any change to that logic, manually walk through one real
multi-person referral chain yourself, independent of these automated
tests — they catch regressions quickly, but a human sanity-check on money
math after a code change is worth keeping as a habit, not a formality.

**Weekly statement emails are not yet a built feature** — `ARLY-25` in
`referral-engine.spec.ts` is intentionally written as a skip-with-explanation
rather than a real test, since this needs to be scoped as a feature
request first, not assumed to exist and tested as broken.

## Viewing test results

After a run, an HTML report is generated. Open it with:
```bash
npx playwright show-report
```
This shows screenshots and video recordings of anything that failed.
