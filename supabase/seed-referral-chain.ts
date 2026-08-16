import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Creston Markets — Multi-branch referral stress test seeder
 *
 * Builds TWO branches off the same root account, to test how the
 * commission engine handles a person (A) being upline of two entirely
 * separate downline paths at once:
 *
 *   Main trunk:  A -> B -> C -> D -> E -> F -> G -> H   (8 people)
 *   Second branch, off A directly:  A -> R -> S -> T     (4 people)
 *
 * This directly tests: does A correctly receive commissions from BOTH
 * branches independently and correctly (A is "nearest" to both B and R,
 * since each branch counts UPWARD from its own newest joiner -- this is
 * exactly the kind of multi-branch case worth confirming explicitly,
 * since the whole position-counting design is per-chain, not per-root).
 *
 * Every account gets a real, working login, is correctly linked via
 * referred_by, submits and has approved a first deposit (triggering
 * joining bonus commissions), AND gets 10 days of backdated, randomized
 * daily P&L seeded automatically.
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

interface ChainMember {
  label: string;
  email: string;
}

function buildChainDefinition(letters: string[]): ChainMember[] {
  return letters.map((letter) => ({
    label: `Test Chain ${letter}`,
    email: `seedtest-${letter.toLowerCase()}-${TIMESTAMP}@example.com`,
  }));
}

// The main trunk (8 people, deep enough to show 5-layer + roll-off
// twice over) and the second branch, sharing A as their common root.
const MAIN_TRUNK = buildChainDefinition(["A", "B", "C", "D", "E", "F", "G", "H"]);
const SECOND_BRANCH = buildChainDefinition(["R", "S", "T"]); // A -> R is implied, A already exists in MAIN_TRUNK

async function createAuthUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
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

async function createAndLinkMember(
  member: ChainMember,
  referrerId: string | null,
  createdIds: Record<string, string>
): Promise<void> {
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

  if (referrerId) {
    const { error: linkError } = await supabase.from("users").update({ referred_by: referrerId }).eq("id", id);
    if (linkError) throw linkError;
  }
  console.log(`✔ Created ${member.label}${referrerId ? " (linked to referrer)" : " (root, no referrer)"}`);
}

async function submitAndApproveDeposit(userId: string, label: string, planId: string, amount: number): Promise<void> {
  const { data: deposit, error: depositError } = await supabase
    .from("deposits")
    .insert({ user_id: userId, plan_id: planId, amount, status: "pending" })
    .select()
    .single();
  if (depositError) throw depositError;

  const { error: approveError } = await supabase
    .from("deposits")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", deposit.id);
  if (approveError) throw approveError;

  console.log(`✔ ${label}'s deposit ($${amount}) submitted and approved`);
}

async function seedBackdatedHistory(userId: string, label: string, startingBalance: number): Promise<void> {
  let runningBalance = startingBalance;
  const todayDate = new Date();

  for (let daysAgo = 10; daysAgo >= 1; daysAgo--) {
    const entryDate = new Date(todayDate);
    entryDate.setDate(entryDate.getDate() - daysAgo);
    const snapshotDate = entryDate.toISOString().slice(0, 10);

    const pct = Math.random() * 6 - 2; // -2% to +4%, slightly skewed positive
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
      is_settlement: false,
    });
    if (error) throw error;
  }
  console.log(`✔ ${label}: 10 days of backdated P&L seeded (ending balance $${runningBalance.toFixed(2)})`);
}

async function main() {
  console.log("Seeding multi-branch referral stress test...\n");

  const { data: plans } = await supabase.from("plans").select("id, name, min_deposit").eq("is_active", true).order("min_deposit");
  const plan = plans?.[0];
  if (!plan) {
    console.error("No active plan found -- run the main seed.ts first, or create at least one plan.");
    process.exit(1);
  }
  console.log(`Using plan: ${plan.name} (min deposit $${plan.min_deposit})\n`);

  const createdIds: Record<string, string> = {};

  // --- Main trunk: A -> B -> C -> D -> E -> F -> G -> H ---
  console.log("Building main trunk (A through H)...");
  await createAndLinkMember(MAIN_TRUNK[0], null, createdIds); // A, root
  for (let i = 1; i < MAIN_TRUNK.length; i++) {
    await createAndLinkMember(MAIN_TRUNK[i], createdIds[MAIN_TRUNK[i - 1].label], createdIds);
  }

  // --- Second branch, off A directly: A -> R -> S -> T ---
  console.log("\nBuilding second branch off A (R -> S -> T)...");
  await createAndLinkMember(SECOND_BRANCH[0], createdIds["Test Chain A"], createdIds); // R, referred by A
  for (let i = 1; i < SECOND_BRANCH.length; i++) {
    await createAndLinkMember(SECOND_BRANCH[i], createdIds[SECOND_BRANCH[i - 1].label], createdIds);
  }

  // --- Deposits: everyone except the two roots' own signup (A has no
  // upline; R's deposit DOES trigger commissions for A, so R is
  // included here, only A itself is skipped) ---
  console.log("\nSubmitting and approving deposits, in chain order (this is what triggers commissions)...");
  const ALL_NON_ROOT = [...MAIN_TRUNK.slice(1), ...SECOND_BRANCH];
  for (const member of ALL_NON_ROOT) {
    await submitAndApproveDeposit(createdIds[member.label], member.label, plan.id, plan.min_deposit);
  }

  console.log("\n✅ Chain structure:");
  console.log("   A (root, no upline)");
  for (let i = 1; i < MAIN_TRUNK.length; i++) {
    console.log(`   ${"  ".repeat(i)}└─ ${MAIN_TRUNK[i].label} (main trunk)`);
  }
  console.log("   └─ R (second branch, also referred by A)");
  for (let i = 1; i < SECOND_BRANCH.length; i++) {
    console.log(`   ${"  ".repeat(i + 1)}└─ ${SECOND_BRANCH[i].label} (second branch)`);
  }

  console.log("\nWhat to check now in Admin -> Referral & Earnings:");
  console.log("MAIN TRUNK (A is upline of all of these, up to 5 positions back):");
  console.log("  - B's deposit -> A gets $25 (1-layer)");
  console.log("  - F's deposit -> full 5-layer table (E/D/C/B/A)");
  console.log("  - G's deposit -> roll-off, A gets NOTHING (A is now 6 steps from G)");
  console.log("  - H's deposit -> roll-off continues, still no A, B also now excluded");
  console.log("SECOND BRANCH (independent of the trunk, A is nearest to R):");
  console.log("  - R's deposit -> A gets $25 (1-layer, SEPARATE event from anything in the trunk)");
  console.log("  - S's deposit -> A + R split 2-layer table");
  console.log("  - T's deposit -> A + R + S split 3-layer table");
  console.log("KEY THING TO CONFIRM: A's total earnings should be the SUM of both branches'");
  console.log("contributions -- check A's My Earnings page shows entries from BOTH B's/G's/etc");
  console.log("activity AND R's/S's/T's activity, correctly combined, not one overwriting the other.");

  // --- Backdated 10-day P&L history for every account ---
  console.log("\nSeeding 10 days of backdated daily P&L for every account...");
  const ALL_MEMBERS = [...MAIN_TRUNK, ...SECOND_BRANCH];
  for (const member of ALL_MEMBERS) {
    await seedBackdatedHistory(createdIds[member.label], member.label, plan.min_deposit);
  }

  console.log("\nLogin credentials for every account: password is", PASSWORD);
  console.log("Emails:", ALL_MEMBERS.map((m) => m.email).join(", "));
}

main().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});
