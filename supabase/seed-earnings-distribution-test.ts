import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Creston Markets — Profit-share (earnings distribution) verification
 * script
 *
 * Distinct from seed-referral-chain.ts, which tests JOINING BONUS
 * distribution (the one-time reward on a first deposit). This script
 * tests PROFIT SHARE specifically -- the ongoing % of gain, paid only on
 * an official settlement -- since that's a genuinely different trigger
 * (handle_snapshot_profit_share(), not handle_deposit_approval()) with
 * its own math to verify independently.
 *
 * Builds the same two-branch structure as before:
 *   Main trunk:      A -> B -> C -> D -> E -> F -> G -> H  (8 people)
 *   Second branch:   A -> R -> S -> T -> U -> W -> X -> Y  (7 people,
 *                    off A directly, matching the letters you specified)
 *
 * For every single person, runs a REAL two-settlement sequence with a
 * FIXED, deliberately simple gain ($1,000 -> $1,200, a $200 gain) so the
 * resulting profit-share math is exactly calculable by hand, not random.
 * The console output prints, for every person, the EXACT dollar amount
 * every upline position should receive from their $200 gain -- so you
 * can tally this printed expectation directly against what Admin ->
 * Referral & Earnings actually shows, position by position.
 *
 * Run with: npx tsx supabase/seed-earnings-distribution-test.ts
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

// Confirmed exact rates from supabase/schema.sql -- profit_share_percent
// column, per (chain_depth, position). Used below to calculate and
// print the exact expected dollar amount for every commission.
const PROFIT_SHARE_TABLE: Record<number, number[]> = {
  1: [10],
  2: [6, 4],
  3: [4, 3.5, 2.5],
  4: [5, 2.5, 1.5, 1],
  5: [5, 2, 1, 1, 1],
};

const BASELINE_BALANCE = 1000;
const SETTLED_BALANCE = 1200;
const GAIN = SETTLED_BALANCE - BASELINE_BALANCE; // $200, deliberately simple

interface ChainMember {
  label: string;
  email: string;
}

function buildChainDefinition(letters: string[]): ChainMember[] {
  return letters.map((letter) => ({
    label: `Test Chain ${letter}`,
    email: `earntest-${letter.toLowerCase()}-${TIMESTAMP}@example.com`,
  }));
}

const MAIN_TRUNK = buildChainDefinition(["A", "B", "C", "D", "E", "F", "G", "H"]);
const SECOND_BRANCH = buildChainDefinition(["R", "S", "T", "U", "W", "X", "Y"]);

async function createAuthUser(email: string, password: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
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
  console.log(`✔ Created ${member.label}${referrerId ? "" : " (root, no referrer)"}`);
}

/**
 * Fetches the referred_by value for a single user. Pulled out as a
 * fully standalone, explicitly-typed function (not inlined in the loop
 * below) -- the same TypeScript "implicitly has type any because it is
 * referenced in its own initializer" error hit earlier in this project
 * (ReferralLinkForm.tsx) with the identical pattern: a query result
 * destructured inline inside a loop where that same result feeds back
 * into the loop's own condition variable. An isolated function with an
 * explicit return type has no shared scope for that inference problem
 * to occur in at all.
 */
async function fetchReferredBy(targetUserId: string): Promise<string | null> {
  const result = await supabase.from("users").select("referred_by").eq("id", targetUserId).maybeSingle();
  if (!result.data) return null;
  return result.data.referred_by;
}

/** Walks UP the referred_by chain from a given member, up to 5 hops -- mirrors the real trigger's own logic exactly, for computing expected values. */
async function getUpline(userId: string, createdIds: Record<string, string>): Promise<string[]> {
  const idToLabel = Object.fromEntries(Object.entries(createdIds).map(([label, id]) => [id, label]));
  const upline: string[] = [];
  let walker: string | null = userId;
  for (let hop = 0; hop < 5; hop++) {
    const nextReferredBy = await fetchReferredBy(walker);
    walker = nextReferredBy;
    if (!walker) break;
    upline.push(idToLabel[walker] ?? walker);
  }
  return upline;
}

async function runSettlementSequence(userId: string, label: string): Promise<void> {
  // First settlement: establishes the baseline. Per the real trigger's
  // design, this pays NOTHING -- there's no prior settlement to compare
  // against yet.
  const { error: firstError } = await supabase.from("portfolio_snapshots").insert({
    user_id: userId,
    balance: BASELINE_BALANCE,
    return_percent: 0,
    pnl_total: 0,
    pnl_today: 0,
    pnl_this_month: 0,
    snapshot_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), // yesterday
    source: "reconciliation",
    is_settlement: true,
    settlement_period: "Baseline",
  });
  if (firstError) throw firstError;

  // Second settlement: the real gain-triggering event. $1000 -> $1200,
  // a $200 gain, is_settlement: true -- this is what actually fires
  // handle_snapshot_profit_share() and pays upline.
  const returnPct = (GAIN / BASELINE_BALANCE) * 100;
  const { error: secondError } = await supabase.from("portfolio_snapshots").insert({
    user_id: userId,
    balance: SETTLED_BALANCE,
    return_percent: Math.round(returnPct * 100) / 100,
    pnl_total: GAIN,
    pnl_today: GAIN,
    pnl_this_month: GAIN,
    snapshot_date: new Date().toISOString().slice(0, 10), // today
    source: "reconciliation",
    is_settlement: true,
    settlement_period: "Test Settlement",
  });
  if (secondError) throw secondError;

  console.log(`✔ ${label}: settled $${BASELINE_BALANCE} -> $${SETTLED_BALANCE} (${returnPct.toFixed(2)}% gain, $${GAIN} profit)`);
}

async function main() {
  console.log("Building two-branch chain and running profit-share (earnings) test...\n");
  console.log(`Every person's settlement: $${BASELINE_BALANCE} -> $${SETTLED_BALANCE} (a $${GAIN} gain, ${((GAIN / BASELINE_BALANCE) * 100).toFixed(2)}% return)\n`);

  const createdIds: Record<string, string> = {};

  console.log("Building main trunk (A through H)...");
  await createAndLinkMember(MAIN_TRUNK[0], null, createdIds);
  for (let i = 1; i < MAIN_TRUNK.length; i++) {
    await createAndLinkMember(MAIN_TRUNK[i], createdIds[MAIN_TRUNK[i - 1].label], createdIds);
  }

  console.log("\nBuilding second branch off A (R -> S -> T -> U -> W -> X -> Y)...");
  await createAndLinkMember(SECOND_BRANCH[0], createdIds["Test Chain A"], createdIds);
  for (let i = 1; i < SECOND_BRANCH.length; i++) {
    await createAndLinkMember(SECOND_BRANCH[i], createdIds[SECOND_BRANCH[i - 1].label], createdIds);
  }

  const ALL_MEMBERS = [...MAIN_TRUNK, ...SECOND_BRANCH];

  console.log("\nRunning baseline + settlement sequence for every person (this triggers profit-share commissions)...");
  for (const member of ALL_MEMBERS) {
    await runSettlementSequence(createdIds[member.label], member.label);
  }

  // --- Calculate and print exact expected values for every person ---
  console.log("\n" + "=".repeat(78));
  console.log("EXACT EXPECTED PROFIT-SHARE (EARNINGS) VALUES -- tally these against");
  console.log("Admin -> Referral & Earnings, filtered to commission_type = profit_share");
  console.log("=".repeat(78));

  for (const member of ALL_MEMBERS) {
    const upline = await getUpline(createdIds[member.label], createdIds);
    if (upline.length === 0) {
      console.log(`\n${member.label}'s settlement: no upline, pays nothing to anyone.`);
      continue;
    }
    const depth = upline.length;
    const rates = PROFIT_SHARE_TABLE[depth];
    console.log(`\n${member.label}'s settlement ($${GAIN} gain) -> ${depth}-layer table applies:`);
    let totalPctCheck = 0;
    upline.forEach((beneficiaryLabel, i) => {
      const pct = rates[i];
      const dollarAmount = Math.round(((GAIN * pct) / 100) * 100) / 100;
      totalPctCheck += pct;
      const positionLabel = i === 0 ? "Nearest (1st)" : `${i + 1}${["", "st", "nd", "rd"][i + 1] ?? "th"}`;
      console.log(`   ${beneficiaryLabel} earns $${dollarAmount.toFixed(2)}  (${pct}% of $${GAIN})  -- ${positionLabel} position`);
    });
    console.log(`   Sum check: ${totalPctCheck}% of $${GAIN} = $${((GAIN * totalPctCheck) / 100).toFixed(2)} total distributed from this event`);
  }

  console.log("\n" + "=".repeat(78));
  console.log("IMPORTANT: A is upline of BOTH branches independently. A's TOTAL");
  console.log("profit-share earnings should be the SUM of A's entries across every");
  console.log("person's settlement above where A appears in the upline list --");
  console.log("both from the main trunk (B/C/D/E's settlements, up to depth 5) AND");
  console.log("from the second branch (R/S/T/U/W's settlements, up to depth 5),");
  console.log("combined. Add up every '$X.XX' figure listed above next to 'A earns'");
  console.log("to get A's expected grand total, and compare that sum against what");
  console.log("A's own My Earnings page shows.");
  console.log("=".repeat(78));

  console.log("\nLogin credentials for every account: password is", PASSWORD);
  console.log("Emails:", ALL_MEMBERS.map((m) => m.email).join(", "));
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
