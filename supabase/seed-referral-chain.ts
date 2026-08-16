import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Creston Markets — Full referral chain test seeder
 *
 * Creates a complete A -> B -> C -> D -> E -> F -> G chain (7 accounts),
 * each with a real, working login (email confirmed automatically via the
 * service role, matching the pattern in seed.ts), correctly linked via
 * referred_by, each submitting and having approved a first deposit --
 * covering every depth from 1 through 5 layers, PLUS the roll-off case
 * (G's deposit, where A should earn nothing since A is 6 steps away).
 *
 * This exists specifically to avoid the slow, repetitive process of
 * registering 7 accounts one at a time through the actual website UI,
 * each needing a real login to fetch their own referral link before the
 * next person can register -- this script does the equivalent
 * end-state directly, in seconds, via the same admin API the existing
 * seed.ts script already uses.
 *
 * WHAT THIS DOES NOT TEST: the actual registration page's referral-code
 * capture logic itself (the bug just fixed in migration_011.sql) --
 * this script sets `referred_by` directly, bypassing that code path
 * entirely. This is intentional: the two things being tested are
 * different. Use this script to verify the COMMISSION ENGINE math is
 * correct across all 5 depths; separately, do at least one real
 * UI-based registration test (a fresh 2-person chain through the actual
 * /register?ref=... flow) to confirm the bug fix itself works. Both
 * matter; this script only covers the former.
 *
 * Run with: npx tsx supabase/seed-referral-chain.ts
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (same as seed.ts).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TIMESTAMP = Date.now();
const PASSWORD = "TestChainPass123!";

const CHAIN = ["A", "B", "C", "D", "E", "F", "G"].map((letter) => ({
  label: `Test Chain ${letter}`,
  email: `seedtest-${letter.toLowerCase()}-${TIMESTAMP}@example.com`,
}));

async function createAuthUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // bypasses email confirmation entirely -- account is immediately usable
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw error;
  }
  return data.user!.id;
}

async function main() {
  console.log("Seeding full A-G referral test chain...\n");

  // Grab an active plan to use for every deposit -- reuses whatever
  // real plans already exist rather than assuming a specific one.
  const { data: plans } = await supabase.from("plans").select("id, name, min_deposit").eq("is_active", true).order("min_deposit");
  const plan = plans?.[0];
  if (!plan) {
    console.error("No active plan found -- run the main seed.ts first, or create at least one plan.");
    process.exit(1);
  }
  console.log(`Using plan: ${plan.name} (min deposit $${plan.min_deposit})\n`);

  const createdIds: Record<string, string> = {};

  // Step 1: create all 7 accounts, unlinked for now.
  for (const member of CHAIN) {
    const id = await createAuthUser(member.email, PASSWORD);
    const { error } = await supabase.from("users").upsert({
      id,
      email: member.email,
      full_name: member.label,
      role: "client",
      kyc_status: "approved",
      is_active: true,
    });
    if (error) throw error;
    createdIds[member.label] = id;
    console.log(`✔ Created ${member.label} (${member.email})`);
  }

  // Step 2: link the chain, A -> B -> C -> D -> E -> F -> G.
  console.log("\nLinking referral chain...");
  for (let i = 1; i < CHAIN.length; i++) {
    const current = CHAIN[i].label;
    const referrer = CHAIN[i - 1].label;
    const { error } = await supabase
      .from("users")
      .update({ referred_by: createdIds[referrer] })
      .eq("id", createdIds[current]);
    if (error) throw error;
    console.log(`✔ ${current} referred by ${referrer}`);
  }

  // Step 3: submit and immediately approve a first deposit for B through
  // G (A has no upline, so A's own deposit triggers nothing -- skipped
  // deliberately to match the real test plan's expectations).
  console.log("\nSubmitting and approving deposits, in chain order (this is what triggers commissions)...");
  for (let i = 1; i < CHAIN.length; i++) {
    const member = CHAIN[i];
    const userId = createdIds[member.label];

    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        amount: plan.min_deposit,
        status: "pending",
      })
      .select()
      .single();
    if (depositError) throw depositError;

    // Approving via UPDATE (not insert-as-approved) is what actually
    // fires the handle_deposit_approval() trigger -- it specifically
    // checks old.status <> 'approved', so this has to be a real status
    // transition, matching exactly how the real admin Approve button
    // works.
    const { error: approveError } = await supabase
      .from("deposits")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", deposit.id);
    if (approveError) throw approveError;

    console.log(`✔ ${member.label}'s deposit ($${plan.min_deposit}) submitted and approved`);
  }

  console.log("\n✅ Done. Chain summary:");
  console.log("   A (root, no upline)");
  for (let i = 1; i < CHAIN.length; i++) {
    console.log(`   ${"  ".repeat(i)}└─ ${CHAIN[i].label} (referred by ${CHAIN[i - 1].label})`);
  }
  console.log("\nWhat to check now in Admin -> Referral & Earnings:");
  console.log("  - B's deposit paid A $25 (1-layer)");
  console.log("  - C's deposit paid B $15 + A $10 (2-layer)");
  console.log("  - D's deposit paid C $15 + B $6 + A $4 (3-layer)");
  console.log("  - E's deposit paid D $15 + C $6 + B $3 + A $1 (4-layer)");
  console.log("  - F's deposit paid E $15 + D $5 + C $3 + B $2 + A $1 (5-layer, full table)");
  console.log("  - G's deposit paid F/E/D/C/B, but NOT A (roll-off -- A is now 6 steps away)");

  // Step 4: seed 10 days of backdated, randomized daily P&L for the
  // whole chain -- directly exercises the backdating fix from
  // migration_012/013, and gives you a real multi-day performance
  // history to look at on each test account's Portfolio page without
  // manually entering 10 days x 7 people by hand in the admin UI.
  console.log("\nSeeding 10 days of backdated daily P&L for the whole chain...");
  const todayDate = new Date();
  for (const member of CHAIN) {
    const userId = createdIds[member.label];
    let runningBalance = plan.min_deposit; // starting point matches their real first-deposit snapshot

    for (let daysAgo = 10; daysAgo >= 1; daysAgo--) {
      const entryDate = new Date(todayDate);
      entryDate.setDate(entryDate.getDate() - daysAgo);
      const snapshotDate = entryDate.toISOString().slice(0, 10);

      // Random daily return between -2% and +4% -- deliberately skewed
      // slightly positive so most test accounts show believable growth
      // over the 10-day window, while still including some down days.
      const pct = Math.random() * 6 - 2;
      const newBalance = runningBalance * (1 + pct / 100);
      const pnl = newBalance - runningBalance;
      runningBalance = newBalance;

      const { error } = await supabase.from("portfolio_snapshots").insert({
        user_id: userId,
        snapshot_date: snapshotDate,
        balance: Math.round(newBalance * 100) / 100,
        return_percent: Math.round(pct * 100) / 100,
        pnl_total: Math.round(pnl * 100) / 100,
        pnl_today: Math.round(pnl * 100) / 100,
        pnl_this_month: Math.round(pnl * 100) / 100,
        source: "reconciliation",
        is_settlement: false, // routine daily entries -- deliberately does NOT trigger profit-share commissions
      });
      if (error) throw error;
    }
    console.log(`✔ ${member.label}: 10 days of backdated P&L seeded (ending balance $${runningBalance.toFixed(2)})`);
  }

  console.log("\nLogin credentials for every account: password is", PASSWORD);
  console.log("Emails:", CHAIN.map((c) => c.email).join(", "));
  console.log("\nCheck any account's Portfolio page -- it should now show a real 10-day history,");
  console.log("all correctly backdated (not bunched up as if they all happened today).");
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
