# Creston Markets — Admin Panel Standard Operating Procedure

This is a complete walkthrough of every section of the admin panel, in the order it appears in the sidebar, what each one does, and the exact steps for the things you'll do most often.

---

## 1. Dashboard (`/admin`)

Your landing page after login. Shows at-a-glance totals: registered users, pending approvals, total commissions paid, recent activity. Nothing to configure here, it's a summary view only.

---

## 2. Users (`/admin/users`)

The master list of every registered client. Search by name/email, click into any client to see their full profile.

**On a client's detail page, you can:**
- View and approve/reject their KYC documents
- **Set or change their plan** (Plan Allocation section), as of this update, a client's first deposit approval automatically assigns their chosen plan, so this is now mainly for manual corrections or changing an existing client's plan
- **Put an account on hold** or reactivate it, this genuinely blocks their login, not just hides them from your list
- **Manually link a referrer** (Referral Chain section), use this if a client signed up without using someone's referral link but should have been part of their downline. The system checks for circular chains automatically and blocks anything that would create a loop
- View their deposits, withdrawals, KYC documents, and support tickets, all in one place

---

## 3. Client Groups (`/admin/groups`)

Create named groups of clients (e.g., "VIP Clients") for two purposes:
- **Bulk reconciliation updates**, apply the same return % to every member at once
- **Custom commission rates**, override the standard joining bonus / profit share percentages for just that group's members, without affecting the platform-wide default for everyone else

**To create a group:** enter a name, click Create Group, then click "Manage" on the new group to add members and set up bulk actions.

---

## 4. Bulk Earnings Update (`/admin/bulk-earnings`)

The fastest way to update many clients' account performance at once. Three modes:
- **All Clients**, update literally everyone in one action
- **By Group**, target a specific Client Group
- **Select Individually**, hand-pick specific accounts from a checklist

**Every bulk update requires:**
1. Choose who to update (one of the three modes above)
2. **Set the date this entry applies to**, defaults to today, but can be backdated to correct a past date. When backdating, the system calculates the % change against each client's real balance as of that date, not just their most recent entry
3. Enter the return % to apply
4. Decide whether this is an official settlement (see Section 5 for what that means) or a routine update
5. Click Apply

---

## 5. Reconciliation (`/admin/reconciliation`)

This is where you enter individual client account performance, the single most important recurring task on this platform. Two very different modes live on this same form:

### Routine update (checkbox unchecked)
Use this for normal daily/regular updates. Enter the client's current balance, return %, and P&L figures. **This never triggers any commission payout** to their referral network, it's purely for keeping the client's own dashboard accurate.

### Official settlement (checkbox checked)
Use this only when you want to formally "close out" a period and trigger profit-share commissions to the client's upline. Requires a settlement period label (e.g. "January 2026"). The system calculates the **gain since the last settlement** and distributes the appropriate percentage up the referral chain.

**Important distinction to keep in mind:**
- A settlement only pays commissions if the new balance is **higher** than the previous settlement, a loss never claws back money already paid
- The **very first** settlement for any client never pays anything, since there's no prior settlement to compare against yet, it just establishes the baseline

### The new "Date This Entry Applies To" field
Same backdating capability as Bulk Earnings Update, you can enter a correction for a past date, and the system will correctly slot it into that client's real history rather than treating it as "most recent" just because you entered it today.

---

## 6. Referral Bonuses (`/admin/referrals`)

This shows the **legacy** single-tier bonus system from before the current 5-layer engine was built. It's mostly historical now, the real, current referral/commission activity lives under **Referral & Earnings** (Section 8). This page still exists for reference but isn't where you manage the active commission structure.

---

## 7. Approvals (`/admin/approvals`)

Two tabs: **Deposits** and **Withdrawals**. Every pending request shows here with the client's submitted proof (transaction hash, screenshot for deposits; wallet address and network for withdrawals).

**To approve a deposit:**
1. Verify the transaction hash actually shows the correct amount on the relevant blockchain explorer
2. Click Approve
3. This automatically: marks it as their first deposit if applicable, assigns their chosen plan, creates their starting portfolio balance, and distributes joining bonus commissions to their upline, all in one action, no further manual steps needed

**To approve a withdrawal:** verify the request is legitimate, then click Approve once you've actually sent the funds. There's no automatic payment processing, this only marks it as approved in the system after you've completed the real transfer yourself.

---

## 8. Referral & Earnings (`/admin/earnings`)

This is the real, current commission engine, both the configuration and the live records.

**Configuration section:** five tables (1-layer through 5-layer), each showing the joining bonus dollar amount and profit-share percentage for every position. You can edit these, but changing a rate here **only affects future commissions**, anything already paid out keeps the rate it was calculated at, permanently.

**Records table:** every commission ever calculated, who earned it, from whose activity, at what position and depth.

---

## 9. Plans (`/admin/plans`)

Manage the Bronze/Silver/Gold tiers, minimum deposit, withdrawal frequency, features list. Changes here affect what's shown to clients going forward; existing clients keep whatever plan they're already on.

---

## 10. Announcements (`/admin/announcements`)

Publish messages that appear on client dashboards. Can target "All Users." (Note: "Specific User" targeting exists as an option but currently has no way to actually pick which user, this is a known gap, not yet built out.)

---

## 11. Support Tickets (`/admin/support`)

Every client support request. Click a ticket to expand it, reply, and change its status (Open / In Progress / Resolved). Your reply and status change are visible to the client immediately on their own Support page.

---

## 12. Reports (`/admin/reports`)

High-level platform statistics, total users, deposit volume, growth over time. Useful for a quick health check, not for day-to-day operational tasks.

---

## 13. Settings (`/admin/settings`)

- **Change Password**, update your own admin login password (requires your current password to confirm)
- **Crypto Deposit Addresses**, manage the wallet addresses shown to clients for each network (ERC20/TRC20/BEP20)

---

## 14. Activity Log (`/admin/activity-log`)

A record of admin actions, who did what, when, from what device/browser and IP address. Useful for accountability and tracing back what happened if something needs investigating later.

---

## Your most common weekly/daily workflow, in order

1. **Approvals**, clear any pending deposits and withdrawals first
2. **Reconciliation** (or **Bulk Earnings Update** if updating many clients at once), enter the day's account performance
3. **Support Tickets**, respond to anything open
4. Periodically check **Referral & Earnings** to confirm commission records look correct, and **Activity Log** if you ever need to trace back a specific change
