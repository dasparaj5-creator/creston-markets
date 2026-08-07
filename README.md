# Creston Markets — Phase 1 (Demonstration & Onboarding Environment)

Full-stack fintech web platform for an algorithmic trading investment
product, built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and
Supabase.

**This is a Phase 1 base build.** Deposit and withdrawal flows are
interest-registration only — no real funds move, and no live PAMM/MT5
trading connection is active. Real money movement, live performance data,
and a payment gateway are Phase 2 work that requires the underlying
PAMM/MT5 connection to be confirmed **and** any required regulatory
licensing for accepting client funds to be obtained by the platform
operator. This build does not provide that licensing — it is the
operator's responsibility before enabling live deposits.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Auth | Supabase Auth |
| Database | Supabase (PostgreSQL) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Notifications | React Hot Toast |
| State | Zustand |

## Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A Supabase project (free tier is fine for Phase 1)
- npm

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project
credentials:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server-only, never expose to client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

You can find these under **Project Settings → API** in your Supabase
dashboard. The service role key is required for the seed script and for
privileged server-side operations — keep it out of any client bundle.

### 3. Set up the database

In the Supabase SQL Editor, run the schema file:

```
supabase/schema.sql
```

This creates all tables, enums, indexes, RLS policies, and the
deposit-approval trigger that starts the 30-day referral maturity clock.

Then create a **private** Storage bucket named `kyc-documents` (used for
KYC upload signed URLs — Profile page).

### 4. Seed demo data (optional but recommended)

```bash
npm run seed
```

This creates:
- 3 plans (Bronze $200, Silver $350, Gold $500)
- Referral config ($25 flat bonus, 30-day maturity)
- 1 admin account: `admin@crestonmarkets.com` / `AdminPass123!`
- 3 client accounts, including one referral relationship
  (Alice → Ben, bonus pending maturity):
  - `alice@example.com` / `ClientPass123!`
  - `ben@example.com` / `ClientPass123!`
  - `chloe@example.com` / `ClientPass123!`

**Change these passwords or delete the seeded accounts before any
non-local use.**

### 5. Run the dev server

```bash
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Client dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) (requires login)
- Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin) (requires admin login at `/admin/login`)

Press **Ctrl+Shift+D** in development mode to open the floating debug
panel (last 20 log entries, color-coded by level).

---

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, import the repo and set the same environment variables from
   `.env.local` in **Project Settings → Environment Variables**.
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain (used to build
   referral links).
4. Deploy. Vercel will run `next build` automatically.
5. In Supabase, add your Vercel domain to **Auth → URL Configuration →
   Redirect URLs** (needed for password reset and Google OAuth redirects).

---

## Project Structure

```
/app
  /(public)         — landing page, login, register, forgot-password, legal pages
  /(dashboard)       — protected client dashboard (layout enforces auth)
  /(admin-auth)      — admin login (outside the admin auth-gated layout)
  /(admin)           — protected admin panel (layout enforces admin role)
  /api               — route handlers (extend as needed for server-side mutations)
/components
  /landing           — landing page sections
  /dashboard         — client dashboard widgets
  /admin             — admin panel widgets
  /shared            — cross-cutting UI (RiskBanner, Logo, ErrorBoundary, DebugPanel)
  /layout            — public navbar/footer
/lib
  supabase/          — browser + server Supabase clients
  logger.ts          — global INFO/WARN/ERROR/DEBUG logger (console + DB + debug panel)
  referral.ts         — referral bonus business logic
  auth.ts             — requireUser() / requireAdmin() server helpers
  utils.ts            — formatting helpers
  plans-data.ts       — static plan display data (mirrors seeded `plans` table)
/supabase
  schema.sql          — full Postgres schema, RLS policies, triggers
  seed.ts             — demo data seed script
/types/index.ts        — shared TypeScript types matching the schema
middleware.ts           — route protection for /dashboard/* and /admin/*
```

## Key Compliance Design Decisions (carried through from spec v2.0)

- **Referral program is single-tier only.** No multi-level chains. A flat,
  configurable bonus (`referral_config`) is paid once, 30 days after the
  referred user's first deposit is approved — not on deposit alone. This
  is enforced by both the `handle_deposit_approval` Postgres trigger and
  the referral display-status logic in `lib/referral.ts`.
- **`portfolio_snapshots.source = 'reconciliation'` rows are never shown
  to clients.** This isn't just a UI convention — it's enforced in the
  RLS policy itself (`snapshots_select_self_mt5_or_admin`), so even a bug
  in the client code can't leak internal reconciliation figures as if
  they were live performance.
- **Deposit and withdrawal pages never process real payment or funds
  movement in Phase 1.** They write `pending` interest-registration rows
  only. The payment gateway area is an explicitly labeled placeholder
  shell for Phase 2 integration.
- **Risk disclosures** appear in all 6 spec-mandated locations via the
  shared `<RiskBanner />` component (landing page, plans section, register
  page, deposit page, dashboard home — dismissible, and portfolio page).

## What's Next (Phase 2 — not built here)

- MT5 live sync → replaces all placeholder/reconciliation-only data
- Live PAMM performance feed
- Payment gateway integration (client-supplied 3D-secure gateway)
- Two-Factor Authentication (UI placeholder exists in Profile page)
- Automated referral bonus processing (currently admin-triggered "Pay Now")
- **Regulatory licensing for accepting client deposits and paying
  investment returns**, which is a prerequisite for enabling any of the
  above in a production environment — outside the scope of this codebase.

## Debugging

- All API/auth/referral/reconciliation actions log via `lib/logger.ts` to
  both the browser console and the `error_logs` table (server-side only).
- React Error Boundaries wrap the root layout and every dashboard/admin
  page body.
- The floating debug panel (dev mode, Ctrl+Shift+D) shows the last 20 log
  entries in real time.
# creston-markets
