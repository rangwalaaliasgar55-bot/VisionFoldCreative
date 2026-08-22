/**
 * Applies supabase/COMPLETE_SCHEMA.sql to any Postgres database.
 *
 * Usage:
 *   node scripts/apply-schema.mjs "postgresql://postgres:<password>@..."
 *
 * Idempotent — safe to run multiple times (CREATE TABLE IF NOT EXISTS etc).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url || !url.startsWith("postgres")) {
  console.error(
    "\n❌ Provide your Supabase connection string:\n" +
      '   node scripts/apply-schema.mjs "postgresql://postgres:<PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres"\n'
  );
  process.exit(1);
}

const sqlPath = join(__dirname, "..", "supabase", "COMPLETE_SCHEMA.sql");
const sqlText = readFileSync(sqlPath, "utf8");

console.log("🔌 Connecting…");
const client = new pg.Client({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log("✅ Connected.");
  console.log("📜 Applying COMPLETE_SCHEMA.sql (idempotent)…");
  await client.query(sqlText);
  console.log("✅ Schema applied.");

  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log(`\n📊 Tables now in public (${rows.length}):`);
  rows.forEach((r) => console.log("   •", r.table_name));

  const expected = [
    "users","clients","projects","updates","messages","leads","portfolio","invoices",
    "expenses","ratings","categories","posts","media","settings","automations",
    "activity","ai_usage","newsletter","quotas","frame_annotations","deliverables",
    "webhooks","visitors","wa_messages","social_accounts","social_posts",
    "social_metrics","social_insights","rate_limits","approvals",
  ];
  const have = new Set(rows.map((r) => r.table_name));
  const missing = expected.filter((t) => !have.has(t));
  if (missing.length === 0) {
    console.log("\n🎉 ALL TABLES PRESENT. Your database is ready.");
    console.log("\nNEXT STEP — make data persist on Vercel:");
    console.log('  1. Vercel → Settings → Environment Variables');
    console.log(`  2. Add  DATABASE_URL  =  ${url.replace(/:[^:@]+@/, ":****@")}`);
    console.log("  3. Redeploy. Done — no more data loss.\n");
  } else {
    console.log("\n⚠️ Missing tables:", missing.join(", "));
    process.exitCode = 2;
  }
} catch (err) {
  console.error("\n❌ Failed:", err.message);
  if (/password authentication/i.test(err.message)) {
    console.error("   → Wrong database password. Reset it in Supabase → Settings → Database.");
  }
  if (/ENOTFOUND|getaddrinfo/i.test(err.message)) {
    console.error("   → Host not found. Copy the EXACT connection string from Supabase → Settings → Database.");
  }
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
