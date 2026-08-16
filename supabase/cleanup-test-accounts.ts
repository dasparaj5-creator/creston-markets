import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Creston Markets — Pre-launch full reset
 *
 * Per explicit confirmation that NO real users are onboarded yet: this
 * removes every client account EXCEPT ones with a genuine, non-test
 * Gmail address, then resets every REMAINING client's portfolio balance
 * to $0 -- a full clean slate before tomorrow's real launch.
 *
 * KEEP criteria (an account survives ONLY if BOTH are true):
 *   1. Email ends with "@gmail.com"
 *   2. Email does NOT contain "test" anywhere (case-insensitive)
 *
 * Everything else gets deleted -- every @example.com test account,
 * every @yopmail.com test account, and any @gmail.com address that
 * happens to contain "test" (e.g. a personal +test alias used during
 * QA). Admin accounts (role = 'admin') are NEVER touched, regardless of
 * their email, as a hard safety rule independent of the criteria above.
 *
 * Still a two-step, review-before-delete tool, same safety pattern as
 * before -- deleting real account data is not something to do blind,
 * even when confident nothing real exists yet.
 *
 * Usage:
 *   npx tsx supabase/cleanup-test-accounts.ts             (dry run, default)
 *   npx tsx supabase/cleanup-test-accounts.ts --confirm    (actually deletes + resets balances)
 *
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

const CONFIRM = process.argv.includes("--confirm");

function shouldKeep(email: string): boolean {
  const lower = email.toLowerCase();
  const isGmail = lower.endsWith("@gmail.com");
  const containsTest = lower.includes("test");
  return isGmail && !containsTest;
}

async function deleteUserAndDependents(uid: string): Promise<void> {
  // None of these tables have `on delete cascade` on their foreign key
  // to users(id) (confirmed by reading schema.sql directly) -- every
  // dependent row needs to be explicitly removed first, in an order
  // that respects each table's own internal foreign keys, before the
  // user itself can be deleted without hitting a foreign key violation.
  const { data: userDeposits } = await supabase.from("deposits").select("id").eq("user_id", uid);
  const depositIds = (userDeposits ?? []).map((d) => d.id);
  if (depositIds.length > 0) {
    await supabase.from("deposit_proofs").delete().in("deposit_id", depositIds);
  }

  await supabase.from("commission_notifications").delete().or(`user_id.eq.${uid},source_user_id.eq.${uid}`);
  await supabase.from("commission_records").delete().or(`beneficiary_id.eq.${uid},source_user_id.eq.${uid}`);
  await supabase.from("referral_bonuses").delete().or(`referrer_id.eq.${uid},referred_user_id.eq.${uid}`);
  await supabase.from("portfolio_snapshots").delete().eq("user_id", uid);
  await supabase.from("kyc_documents").delete().eq("user_id", uid);
  await supabase.from("withdrawals").delete().eq("user_id", uid);
  await supabase.from("deposits").delete().eq("user_id", uid);
  await supabase.from("support_tickets").delete().eq("user_id", uid);
  await supabase.from("client_group_members").delete().eq("user_id", uid);
  // Clear referred_by on anyone who lists this user as their referrer,
  // so a deletion never leaves a dangling reference on a DIFFERENT
  // account that's being kept.
  await supabase.from("users").update({ referred_by: null }).eq("referred_by", uid);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(uid);
  if (deleteError) throw deleteError;
}

async function main() {
  console.log(CONFIRM ? "Running in EXECUTE mode (--confirm passed)...\n" : "Running in DRY RUN mode (no --confirm flag, nothing will change)...\n");

  const { data: allUsers, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, plan_id, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  const admins = (allUsers ?? []).filter((u) => u.role === "admin");
  const clients = (allUsers ?? []).filter((u) => u.role !== "admin");

  const toKeep = clients.filter((u) => shouldKeep(u.email));
  const toDelete = clients.filter((u) => !shouldKeep(u.email));

  console.log(`Total users: ${allUsers?.length ?? 0}`);
  console.log(`Admin accounts (never touched): ${admins.length}`);
  console.log(`Client accounts to KEEP (genuine, non-test @gmail.com): ${toKeep.length}`);
  console.log(`Client accounts to DELETE: ${toDelete.length}\n`);

  if (toKeep.length > 0) {
    console.log("KEEPING these accounts (their balance will be reset to $0):");
    console.log("-".repeat(78));
    for (const u of toKeep) {
      console.log(`  ${u.email.padEnd(40)} ${u.full_name ?? ""}`);
    }
    console.log("-".repeat(78) + "\n");
  }

  if (toDelete.length > 0) {
    console.log(`DELETING ${toDelete.length} accounts (showing first 30, run with --confirm to see all act on the full list):`);
    console.log("-".repeat(78));
    for (const u of toDelete.slice(0, 30)) {
      console.log(`  ${u.email.padEnd(40)} ${u.full_name ?? ""}`);
    }
    if (toDelete.length > 30) console.log(`  ...and ${toDelete.length - 30} more`);
    console.log("-".repeat(78) + "\n");
  }

  if (!CONFIRM) {
    console.log("This was a DRY RUN. Nothing was deleted or reset.");
    console.log("Review the KEEP list above especially carefully -- if any account you actually");
    console.log("want to delete is listed there (or vice versa), stop and adjust before proceeding.");
    console.log("\nIf everything above looks correct, run again with --confirm:");
    console.log("  npx tsx supabase/cleanup-test-accounts.ts --confirm");
    return;
  }

  console.log(`Deleting ${toDelete.length} accounts...`);
  let deleteSuccess = 0;
  let deleteFail = 0;
  for (const u of toDelete) {
    try {
      await deleteUserAndDependents(u.id);
      deleteSuccess++;
      console.log(`✔ Deleted ${u.email}`);
    } catch (err) {
      deleteFail++;
      console.error(`✗ Failed to delete ${u.email}:`, err);
    }
  }
  console.log(`Deletion done: ${deleteSuccess} deleted, ${deleteFail} failed.\n`);

  console.log(`Resetting balances to $0 for ${toKeep.length} remaining client(s)...`);
  let resetSuccess = 0;
  let resetFail = 0;
  for (const u of toKeep) {
    try {
      // A fresh, clean $0 snapshot -- NOT a settlement, so this never
      // triggers a profit-share commission (there's no prior balance
      // for anyone to have "lost" a gain from, and marking a reset as a
      // settlement would be semantically wrong regardless).
      const { error: snapshotError } = await supabase.from("portfolio_snapshots").insert({
        user_id: u.id,
        balance: 0,
        pnl_total: 0,
        pnl_today: 0,
        pnl_this_month: 0,
        return_percent: 0,
        snapshot_date: new Date().toISOString().slice(0, 10),
        source: "reconciliation",
        is_settlement: false,
      });
      if (snapshotError) throw snapshotError;
      resetSuccess++;
      console.log(`✔ Reset balance to $0 for ${u.email}`);
    } catch (err) {
      resetFail++;
      console.error(`✗ Failed to reset balance for ${u.email}:`, err);
    }
  }
  console.log(`Balance reset done: ${resetSuccess} reset, ${resetFail} failed.`);

  console.log("\n✅ Full reset complete.");
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
