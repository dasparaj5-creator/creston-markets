# Creston Markets — Admin Panel QA Test Case Suite

**Target:** `https://www.crestonmarkets.com/admin/*`
**Companion to:** `crestonmarkets_test_cases.md` (public-facing suite). This
suite covers everything behind `/admin/login` — reconciliation, plan
allocation, the 5-layer referral & earnings engine, and admin-side account
management. Section 6 of the public suite (Dashboard) was written without
authenticated access; this suite replaces/extends it with real, verified
selectors and actual system behavior, since these were built and are
known precisely.

**Prerequisite accounts** (seeded — confirm these still exist before running):
- Admin: `admin@crestonmarkets.com`
- Clients: `alice@example.com`, `ben@example.com` (Alice → Ben referral
  already exists), `chloe@example.com`

Legend — Priority: P1 (blocker/critical), P2 (major), P3 (minor)
Type: SMOKE / FUNC / NEG (negative) / UI / SEC (security) / DATA (data
integrity) / MONEY (financial calculation correctness — treat every
MONEY-tagged case as P1 regardless of listed priority, since these touch
real commission math)

---

## 1. Admin Smoke Suite (run on every deploy)

| ID | Priority | Scenario | Steps | Expected Result |
|---|---|---|---|---|
| ASMK-01 | P1 | Admin login page loads | Navigate to `/admin/login` | Login form renders, distinct from client `/login` |
| ASMK-02 | P1 | Admin login succeeds | Log in with admin credentials | Redirects to `/admin` dashboard |
| ASMK-03 | P1 | Client cannot reach admin panel | Log in as `alice@example.com`, navigate directly to `/admin` | Redirected away — client-role users must never see admin UI, even by direct URL |
| ASMK-04 | P1 | Non-admin cannot log in at `/admin/login` | Attempt admin login with `alice@example.com` credentials | Rejected with a clear "not authorized" message, not a silent redirect to client dashboard |
| ASMK-05 | P1 | All admin nav sections load without error | Click through every sidebar item (Dashboard, Users, Reconciliation, Referral & Earnings, Approvals, Plans, Announcements, Support, Reports, Settings) | Each page renders, zero console errors |
| ASMK-06 | P1 | Admin logout works | Click Log Out | Session cleared, redirected to `/admin/login`; direct nav back to `/admin` afterward redirects to login again |

---

## 2. User & Account Management

| ID | Priority | Type | Scenario | Steps | Expected Result |
|---|---|---|---|---|---|
| AUSR-01 | P1 | FUNC | User list loads with correct data | Navigate to Admin → Users | All registered clients listed with name, email, plan, KYC status, account status |
| AUSR-02 | P2 | FUNC | Search/filter on user list | Search by partial name/email | List filters correctly, no false positives/negatives |
| AUSR-03 | P1 | FUNC | User detail page opens | Click "View" on any user row | Full profile loads: contact info, KYC docs, referral network, earnings summary, deposits, withdrawals, statement history, support tickets |
| AUSR-04 | P1 | FUNC | KYC approve action | On a user with pending KYC, click Approve | Status updates to "approved" immediately, reflected on client's own dashboard on next load |
| AUSR-05 | P1 | FUNC | KYC reject action | On a user with pending KYC, click Reject | Status updates to "rejected", client sees rejected status |
| AUSR-06 | P2 | DATA | KYC status change is audit-logged | Approve/reject a KYC, then check `admin_audit_log` (or wherever audit trail surfaces in UI) | Action recorded with admin ID, timestamp, before/after state |
| AUSR-07 | P1 | FUNC | Account "Put on Hold" | Open a test client's detail page → Put on Hold → confirm | Account `is_active` becomes false; **critically**, attempt to log in as that client afterward — login must be blocked/signed out, not merely hidden from admin's list |
| AUSR-08 | P1 | FUNC | Account reactivation | On a held account, click Reactivate | Client can log in again immediately |
| AUSR-09 | P2 | NEG | Cannot put an admin account on hold via the same control | Verify the hold/reactivate control is absent or disabled for `role: admin` rows | Admin accounts are not exposed to this action |
| AUSR-10 | P2 | FUNC | KYC document viewer opens documents | On a user with uploaded KYC docs, click a document | Signed URL generated, document opens/downloads correctly, front/back per document type shown separately |
| AUSR-11 | P3 | SEC | KYC signed URLs expire | Copy a KYC document signed URL, wait past its expiry window (5 min per current implementation), try to reopen it | URL no longer works — confirms documents aren't permanently publicly accessible |

---

## 3. Plan Allocation

| ID | Priority | Type | Scenario | Steps | Expected Result |
|---|---|---|---|---|---|
| APLN-01 | P1 | FUNC | **[Your scenario #4]** Admin changes a client's plan | Open a test client (e.g. Chloe, currently no plan) → Plan Allocation section → select "Silver" → Save | Plan updates immediately; confirm on the client's own dashboard/profile it now shows "Silver" |
| APLN-02 | P2 | FUNC | Plan change from one paid tier to another | Change a client already on "Bronze" to "Gold" | Update succeeds, old plan fully replaced (not appended/duplicated) |
| APLN-03 | P2 | FUNC | Remove a client's plan entirely | Select "No plan" and save | Client's plan clears; dashboard reflects "No Plan Selected" without erroring |
| APLN-04 | P2 | DATA | Plan change is audit-logged | Change a plan, check audit log | `user.plan_changed` action recorded with before/after plan IDs |
| APLN-05 | P3 | UI | Save button disabled when no change made | Open Plan Allocation, don't change selection | Save button stays disabled/inert — prevents pointless no-op writes |
| APLN-06 | P2 | NEG | Plan change doesn't silently fail on network error | Simulate a failed save (e.g. via dev tools network throttling/offline toggle mid-request) | Clear error toast shown, plan not left in an inconsistent state |

---

## 4. Portfolio Reconciliation — Data Entry & Client Visibility

**Context:** This is currently the sole source of "live" account performance
shown to clients (no MT5 connection yet). Every reconciliation entry saved
here is directly client-visible on their Portfolio page — there is no
separate internal/external mode anymore (this changed from the original
Phase 1 design; confirm this is still accurate before running these cases).

| ID | Priority | Type | Scenario | Steps | Expected Result |
|---|---|---|---|---|---|
| AREC-01 | P1 | FUNC | **[Your scenario #1]** Fill in P&L for a client, confirm client sees it | Admin → Reconciliation → select Alice → enter Balance, Return %, P&L Total/Today/This Month → leave "Mark as official settlement" unchecked → Save | Entry saves; log in as Alice → Dashboard and Portfolio pages show the new balance/return figures immediately |
| AREC-02 | P1 | FUNC | Reconciliation for a brand-new test user | Register a fresh test client with no prior statement history → admin enters their first reconciliation entry | Client's Portfolio page transitions from "No statement yet" placeholder state to showing real figures |
| AREC-03 | P1 | FUNC | **[Your scenario #2]** Editing/overwriting reconciliation figures | For a client with an existing entry, submit a brand new entry with completely different Balance, P&L, and Return % values | New entry saves as a new row (this system **inserts** new snapshots rather than editing in place — confirm this is the intended behavior, not a bug, since "change everything" could be interpreted as edit-in-place); client's dashboard shows the LATEST entry's figures, not the old ones |
| AREC-04 | P2 | UI | Reconciliation log/history table reflects new entries | After AREC-01, check the reconciliation log/table on the same admin page | New entry appears with correct timestamp, values, and user attribution |
| AREC-05 | P1 | MONEY | Routine (non-settlement) entries do NOT trigger commissions | Save a reconciliation entry with "Mark as official settlement" left unchecked, for a client who has upline referrers | Check Admin → Referral & Earnings afterward — confirm **zero** new commission records were created from this entry |
| AREC-06 | P2 | NEG | Negative or zero balance entry | Enter a Balance of `0` or a negative number | Form accepts it (a real account can genuinely be at zero or in drawdown) without erroring; client sees the accurate figure, not a hidden/blocked one |
| AREC-07 | P3 | NEG | Non-numeric input in numeric fields | Attempt to type letters into Balance/P&L fields | Browser-level numeric input restriction blocks it, or clear validation error on submit |
| AREC-08 | P2 | UI | Settlement checkbox reveals period field | Check "Mark as official settlement" | Settlement Period text field appears; attempting to save without filling it shows a clear error (per current implementation) |

---

## 5. Settlement Events & the 5-Layer Referral/Earnings Engine

**This is the highest-stakes area in the entire admin panel — every case
here should be run with real attention, not just clicked through.** The
commission engine determines position by counting UP from whoever
triggered the event, not down from a fixed root — the test data below is
built specifically to exercise that rule at every depth from 1 to 5, per
your request.

### 5.1 — Test data setup (do this once, reuse across 5.2–5.5)

Register a fresh 6-person chain via referral links so each depth (1
through 5, plus one level beyond 5 to test roll-off) can be tested
cleanly without colliding with the pre-seeded Alice→Ben relationship:

| Step | Action |
|---|---|
| 1 | Register **Test-A** with no referral code (independent signup) |
| 2 | Log in as Test-A, copy their referral link |
| 3 | Register **Test-B** using Test-A's link |
| 4 | Log in as Test-B, copy their referral link → register **Test-C** |
| 5 | Repeat to build: Test-A → Test-B → Test-C → Test-D → Test-E → Test-F |
| 6 | As admin, approve KYC and a first deposit for every one of A–F (deposit approval is what triggers the joining bonus per person) |

### 5.2 — Joining Bonus distribution across all 5 depths

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| ARLY-01 | P1 | MONEY | **[Your scenario #3]** Depth 1 — Test-A has no upline | Approve Test-A's first deposit | Zero commission records created (no one is upline of A) |
| ARLY-02 | P1 | MONEY | Depth 1 chain — Test-B's upline is just Test-A | Approve Test-B's first deposit | Exactly 1 commission record created: Test-A receives the full 1-layer table amount ($25 joining bonus per current default config) |
| ARLY-03 | P1 | MONEY | Depth 2 chain — Test-C's upline is Test-B, Test-A | Approve Test-C's first deposit | Exactly 2 commission records: Test-B gets position-1 amount ($15 default), Test-A gets position-2 amount ($10 default) — **verify Test-B (nearer) gets MORE than Test-A, not the reverse** |
| ARLY-04 | P1 | MONEY | Depth 3 chain — Test-D's upline is C, B, A | Approve Test-D's first deposit | 3 records using the 3-layer table ($15 / $6 / $4 defaults), nearest-first ordering confirmed (C > B > A in amount) |
| ARLY-05 | P1 | MONEY | Depth 4 chain — Test-E's upline is D, C, B, A | Approve Test-E's first deposit | 4 records using the 4-layer table ($15 / $6 / $3 / $1 defaults) |
| ARLY-06 | P1 | MONEY | Depth 5 chain — Test-F's upline is E, D, C, B, A | Approve Test-F's first deposit | 5 records using the 5-layer table ($15 / $5 / $3 / $2 / $1 defaults); Test-A (the 5th/furthest position) still receives something |
| ARLY-07 | P1 | MONEY | Roll-off beyond depth 5 | Register **Test-G** under Test-F (chain is now 6 deep from Test-A's perspective), approve Test-G's deposit | Exactly 5 records created (F, E, D, C, B) — **Test-A receives nothing**, confirming the "only nearest 5 count" rule holds even though A is Test-G's ultimate root referrer |
| ARLY-08 | P2 | DATA | Every commission record stores the correct `chain_depth` and `position` | Inspect the records from ARLY-03 through ARLY-07 in Admin → Referral & Earnings or the user detail page | `chain_depth` matches the actual chain length at time of trigger; `position` correctly identifies 1=nearest through 5=furthest |
| ARLY-09 | P2 | MONEY | Sum-check per depth table | For each depth 1–5, sum all position amounts paid out on one trigger event | Total equals $25 exactly for every depth (per the confirmed pool-splitting design) |

### 5.3 — Profit Share distribution (settlement-gated)

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| ARLY-10 | P1 | MONEY | First settlement for a user has no prior baseline | As admin, mark Test-F's very first reconciliation entry as an official settlement | No profit-share commissions fire — there's no previous settlement balance to compare against yet |
| ARLY-11 | P1 | MONEY | Second settlement triggers profit share correctly | Record a second settlement for Test-F with a HIGHER balance than the first, using a clear settlement period label (e.g. "Test Period 1") | Profit share commissions fire for E, D, C, B (up to 5 positions), calculated as % of the balance GAIN since the prior settlement — not % of the total balance |
| ARLY-12 | P1 | MONEY | Settlement with a LOWER balance (a loss) | Record a third settlement for Test-F with a balance lower than the second | Zero profit-share commissions created — losses are not clawed back from upline per the confirmed design |
| ARLY-13 | P1 | MONEY | Routine entry between settlements doesn't corrupt the baseline | Between two real settlements, save several routine (non-settlement) entries with varying balances for Test-F | The NEXT settlement's gain calculation is still based on the last SETTLEMENT balance, not any of the routine entries in between |
| ARLY-14 | P2 | DATA | Settlement period label appears on resulting commission records | After ARLY-11, check the resulting commission records | Each carries the exact settlement period text entered on the reconciliation form |
| ARLY-15 | P1 | MONEY | Sum-check on profit share | For the ARLY-11 settlement, sum the profit-share amounts paid across all positions | Total equals exactly 10% of the balance gain (5-layer table: 5+2+1+1+1 = 10%) |

### 5.4 — Config changes and historical-rate protection

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| ARLY-16 | P1 | MONEY | Changing config does NOT alter past commission records | Note Test-B's existing commission amount from ARLY-02. As admin, go to Referral & Earnings config, change the 1-layer table's joining bonus to a different value (e.g. $30), save. Re-check Test-B's ARLY-02 record. | The old record's `bonus_amount_at_time` is unchanged — still shows the original amount, proving rates are frozen at calculation time |
| ARLY-17 | P1 | MONEY | New config applies only to FUTURE events | After ARLY-16's config change, trigger a brand-new joining bonus event (approve a new test user's deposit under the same chain position) | The new record uses the NEW config value, not the old one |
| ARLY-18 | P2 | DATA | Config change history log records the change | After ARLY-16, check the config change history section | Shows old value, new value, which admin made the change, and timestamp |
| ARLY-19 | P3 | UI | Config editor shows all 5 tables independently | Open Admin → Referral & Earnings config | All 5 depth tables (1 through 5 layers) render as separate editable sections, each showing the correct number of position rows (1 table has 1 row, 5 table has 5 rows) |
| ARLY-20 | P2 | NEG | Disabling a specific position/type via the enabled toggle | Uncheck "enabled" on one position's joining bonus (leave profit share enabled), save, then trigger a new event at that exact position | That position receives $0 joining bonus but still receives its normal profit-share % on a subsequent settlement |

### 5.5 — Notifications

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| ARLY-21 | P1 | FUNC | **[Your scenario #3, notifications]** Notification appears after a joining bonus event | After ARLY-03 (Test-C's deposit approved), log in as Test-B (who should have earned position 1) | Notification bell shows an unread badge; opening it shows a message naming Test-C's activity, the position (Nearest/1st), and the dollar amount earned |
| ARLY-22 | P2 | FUNC | Notification correctly identifies the SOURCE user, masked appropriately | Check the notification text from ARLY-21 | Shows the referred user's name in the same masked format used elsewhere (first name + last initial), not a raw ID |
| ARLY-23 | P2 | FUNC | Opening the bell marks notifications read | Click the bell to open it | Unread badge count clears; reopening later doesn't re-show them as unread |
| ARLY-24 | P1 | FUNC | Notification appears for EVERY position in a multi-layer event | After ARLY-06 (Test-F's deposit, 5-deep chain), check notifications for Test-B, Test-C, Test-D, and Test-E individually (not just the nearest) | All 4 (not just the nearest) receive a notification — confirms notifications fire per-record, not just for position 1 |
| ARLY-25 | P1 | FUNC | **[Your scenario #5]** Weekly report email — current implementation status | Attempt to trigger/observe a scheduled weekly statement email to a client | **Flag as not-yet-implemented if true** — confirm with the dev team whether this exists yet before writing this off as a bug; if it doesn't exist, this should be logged as a feature gap, not a defect |
| ARLY-26 | P3 | FUNC | Notification bell on mobile | Repeat ARLY-21 on a mobile viewport | Bell and dropdown remain usable, not clipped or overlapping other topbar elements |

### 5.6 — Client-facing "which position" visibility

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| ARLY-27 | P1 | FUNC | Client sees their own network with live positions | Log in as Test-A, navigate to My Earnings | "Your Network" table lists every downline member (B through F/G) with the CURRENT position Test-A holds relative to each — reflecting real-time chain depth, not stale/cached data |
| ARLY-28 | P1 | FUNC | Position shown updates after a chain extends | Before Test-G registered, note Test-A's shown position relative to Test-F. After Test-G registers (making Test-A now 6-deep from Test-G, but still correctly positioned relative to F), re-check | Test-A's position relative to F is unchanged (still accurate); Test-A does NOT appear in any earnings tied to Test-G, consistent with ARLY-07 |
| ARLY-29 | P2 | FUNC | Earnings-by-position summary strip is accurate | On My Earnings, check the "Earnings by Position" summary cards | Dollar totals per position match the sum of that user's actual commission records at each position |

---

## 6. Deposit & Withdrawal Approvals

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| AAPR-01 | P1 | FUNC | Pending deposit shows submitted proof | Have a test client submit a crypto deposit with a transaction hash + screenshot; check Admin → Approvals | Hash is visible/copyable, screenshot opens via signed URL |
| AAPR-02 | P1 | FUNC | Approving a deposit updates client status | Approve a pending deposit | Client's Transactions/Deposit page shows "approved" immediately |
| AAPR-03 | P1 | FUNC | Approving a client's FIRST deposit triggers the referral chain | If the depositing client has an upline, confirm this ties correctly into Section 5's commission logic | Cross-reference with ARLY-01 through ARLY-09 — this is the actual trigger point |
| AAPR-04 | P2 | FUNC | Rejecting a deposit | Reject a pending deposit | Status updates to "rejected", does NOT trigger any commission logic even if it's the client's first deposit |
| AAPR-05 | P1 | FUNC | Withdrawal approval — crypto-only fields | Client submits a withdrawal (network + wallet address only, no card/bank fields per current design); admin reviews and approves | Approval succeeds; confirm no legacy card/bank UI elements appear anywhere in this flow |
| AAPR-06 | P2 | NEG | Approving/rejecting an already-processed request | Attempt to approve a deposit/withdrawal that's already approved or rejected | Action buttons are absent/disabled for non-pending items — prevents double-processing |
| AAPR-07 | P3 | UI | Approvals tab pending-count badges | Check the Deposits/Withdrawals tab labels | Counts accurately reflect only PENDING items, update after an approve/reject action without requiring a manual page refresh |

---

## 7. Support Tickets (Admin Side)

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| ATIX-01 | P1 | FUNC | Ticket list loads with correct data | Admin → Support Tickets | All client tickets listed with subject, client name, status, timestamp |
| ATIX-02 | P1 | FUNC | Ticket expands on click | Click any ticket row | Full message body and reply form appear (this was a previously-fixed bug — regression test) |
| ATIX-03 | P2 | FUNC | Admin reply + status change | Type a reply, change status to "In Progress", save | Client sees the reply and updated status on their own Support page |
| ATIX-04 | P3 | FUNC | Status filter | Filter by Open/In Progress/Resolved | List correctly narrows to matching tickets only |
| ATIX-05 | P2 | FUNC | Link from ticket to client's full profile | Click the client's name within an expanded ticket | Navigates to that user's admin detail page |

---

## 8. Announcements

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| AANN-01 | P2 | FUNC | Create announcement targeted "All Users" | Publish a new announcement | Appears on every client's dashboard on next load |
| AANN-02 | P2 | FUNC | Create announcement targeted to a specific user | Publish targeted at one test client only | Only that client sees it; verify a different client does NOT see it |
| AANN-03 | P3 | FUNC | Deactivate an announcement | Toggle an existing announcement inactive | Disappears from client dashboards |

---

## 9. Reports

| ID | Priority | Type | Scenario | Expected Result |
|---|---|---|---|---|
| AREP-01 | P2 | FUNC | Reports page loads with real data | Admin → Reports | Total users, approved deposit volume, referral bonuses paid all reflect actual current data |
| AREP-02 | P3 | DATA | User growth chart accuracy | Cross-check the growth-by-month bars against the actual count of users in Admin → Users, grouped by join month | Numbers match |

---

## 10. Cross-Cutting Data Integrity Checks

These aren't single-click test cases — they're spot-checks worth running
after any batch of the above, especially Section 5.

| ID | Priority | Scenario | Expected Result |
|---|---|---|---|
| ADATA-01 | P1 | After running the full Section 5 chain (A–G), total commissions paid across ALL records | Manually sum every commission_earned value created during testing; confirm it's mathematically consistent with the deposit amounts × applicable table percentages — no phantom or duplicate records |
| ADATA-02 | P1 | RLS enforcement — a client cannot see another client's commission records | Log in as Test-B, attempt to directly query/view Test-C's earnings via URL manipulation or API inspection (dev tools network tab) | Blocked — Test-B only ever sees records where they are the `beneficiary_id` |
| ADATA-03 | P2 | Admin audit log completeness | After a full test run, review `admin_audit_log` | Every KYC decision, plan change, and bulk commission payout is represented — no silent/unlogged admin actions among the ones that should be logged |

---

## Suggested Execution Order

1. **Section 1 (Admin Smoke)** — every deploy, matches the existing public suite's cadence
2. **Section 5 in full, sequentially** — this is the highest-value new coverage requested; run 5.1's setup once, then 5.2 → 5.3 → 5.4 → 5.5 → 5.6 in order, since later cases depend on earlier ones' data existing
3. **Sections 2, 3, 6, 7** — standard regression, run alongside the public suite's P1 sweep
4. **Section 10** — run once after a full Section 5 pass, as a final sanity check on the batch rather than a per-deploy case

**Note on scenario #5 (weekly report emails):** I've flagged ARLY-25 as
needing a status check rather than assuming it exists — worth confirming
with whoever's tracking the build backlog whether scheduled statement
emails have actually been built yet, since that determines whether this
is a test case to run or a feature to request.
