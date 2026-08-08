import { config } from "dotenv";
config({ path: ".env.local" });

/**
 * Creston Markets — Seed script
 * Creates: 3 plans, referral config ($25 / 30 days), 1 admin, 3 sample
 * clients with one referral relationship (client A referred client B).
 *
 * Run with: npm run seed
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (service role bypasses RLS).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAuthUser(email: string, password: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    // If user already exists, fetch it instead of failing the whole seed.
    if (error.message.toLowerCase().includes("already")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw error;
  }
  return data.user.id;
}

async function main() {
  console.log("Seeding Creston Markets demo data...\n");

  // 1. Plans
  const plans = [
    {
      name: "Bronze",
      min_deposit: 200,
      description: "Standard PAMM allocation with monthly statements.",
      features: ["Standard PAMM Allocation", "Monthly Withdrawal", "Email Support", "Monthly Statement"],
    },
    {
      name: "Silver",
      min_deposit: 350,
      description: "Priority PAMM allocation with weekly reporting.",
      features: ["Priority PAMM Allocation", "Bi-weekly Withdrawal", "Priority Email Support", "Weekly Statement"],
    },
    {
      name: "Gold",
      min_deposit: 500,
      description: "Premium PAMM allocation with real-time dashboard access.",
      features: ["Premium PAMM Allocation", "Weekly Withdrawal", "Dedicated Support", "Real-time Dashboard"],
    },
  ];

  const { data: planRows, error: planErr } = await supabase
    .from("plans")
    .upsert(plans, { onConflict: "name" })
    .select();
  if (planErr) throw planErr;
  console.log(`✔ Plans seeded: ${planRows?.map((p) => p.name).join(", ")}`);

  const silverPlan = planRows?.find((p) => p.name === "Silver");

  // 2. Referral config
  const { error: cfgErr } = await supabase.from("referral_config").insert({
    bonus_amount: 25,
    bonus_currency: "USD",
    maturity_days: 30,
  });
  if (cfgErr && !cfgErr.message.includes("duplicate")) throw cfgErr;
  console.log("✔ Referral config seeded: $25 flat bonus, 30-day maturity");

  // 3. Admin user
  const adminId = await createAuthUser("admin@crestonmarkets.com", "AdminPass123!");
  await supabase.from("users").upsert({
    id: adminId,
    email: "admin@crestonmarkets.com",
    full_name: "Creston Markets Admin",
    role: "admin",
    kyc_status: "approved",
    is_active: true,
  });
  console.log("✔ Admin user: admin@crestonmarkets.com / AdminPass123!");

  // 4. Client A (the referrer)
  const clientAId = await createAuthUser("alice@example.com", "ClientPass123!");
  await supabase.from("users").upsert({
    id: clientAId,
    email: "alice@example.com",
    full_name: "Alice Nakamura",
    phone: "+1 415 555 0100",
    country: "United States",
    role: "client",
    kyc_status: "approved",
    plan_id: silverPlan?.id,
    plan_activated_at: new Date().toISOString(),
    account_active_since: new Date(Date.now() - 45 * 86400000).toISOString(),
    is_active: true,
  });
  console.log("✔ Client A (referrer): alice@example.com / ClientPass123!");

  // Fetch Alice's referral code to link Client B
  const { data: aliceRow } = await supabase
    .from("users")
    .select("referral_code")
    .eq("id", clientAId)
    .single();

  // 5. Client B (referred by Alice, first deposit already approved 10 days ago
  //    -> still within the 30 day maturity window, bonus status = pending)
  const clientBId = await createAuthUser("ben@example.com", "ClientPass123!");
  await supabase.from("users").upsert({
    id: clientBId,
    email: "ben@example.com",
    full_name: "Ben Whitfield",
    phone: "+44 20 7946 0100",
    country: "United Kingdom",
    referred_by: clientAId,
    role: "client",
    kyc_status: "approved",
    plan_id: silverPlan?.id,
    plan_activated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    account_active_since: new Date(Date.now() - 10 * 86400000).toISOString(),
    is_active: true,
  });
  console.log("✔ Client B (referred by Alice): ben@example.com / ClientPass123!");

  // Simulate the deposit + approval that would trigger the DB trigger
  const { data: depositB } = await supabase
    .from("deposits")
    .insert({
      user_id: clientBId,
      plan_id: silverPlan?.id,
      amount: 350,
      status: "pending",
      payment_reference: "SEED-DEMO-REF-002",
    })
    .select()
    .single();

  if (depositB) {
    await supabase
      .from("deposits")
      .update({
        status: "approved",
        is_first_deposit: true,
        approved_by: adminId,
        approved_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      })
      .eq("id", depositB.id);
  }

  // Manually ensure the referral_bonuses row exists in case the DB trigger
  // didn't fire in this environment (upsert is safe / idempotent).
  await supabase.from("referral_bonuses").upsert(
    {
      referrer_id: clientAId,
      referred_user_id: clientBId,
      trigger_type: "account_maturity",
      bonus_amount: 25,
      status: "pending",
      eligible_after: new Date(Date.now() + 20 * 86400000).toISOString(),
    },
    { onConflict: "referred_user_id" }
  );
  console.log("✔ Referral bonus record created (pending, matures in ~20 days)");

  // 6. Client C (unrelated, no referral)
  const clientCId = await createAuthUser("chloe@example.com", "ClientPass123!");
  await supabase.from("users").upsert({
    id: clientCId,
    email: "chloe@example.com",
    full_name: "Chloe Martins",
    phone: "+61 2 5550 0100",
    country: "Australia",
    role: "client",
    kyc_status: "pending",
    is_active: true,
  });
  console.log("✔ Client C (no referral, KYC pending): chloe@example.com / ClientPass123!");

  console.log("\nSeed complete.");
  console.log(`Alice's referral code: ${aliceRow?.referral_code}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
