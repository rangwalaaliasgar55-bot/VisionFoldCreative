/** Tries candidate Supabase hosts, applies schema on first success. */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PASSWORD = process.argv[2];
if (!PASSWORD) {
  console.error("usage: node scripts/probe-and-apply.mjs <password>");
  process.exit(1);
}
const REF = "rbtsxeisqvrcuttfxwux";
const enc = encodeURIComponent(PASSWORD);

const candidates = [
  ["direct", `postgresql://postgres:${enc}@db.${REF}.supabase.co:5432/postgres`, false],
  ...["ap-south-1", "ap-south-2", "us-east-1", "us-east-2", "eu-central-1", "eu-west-1", "eu-west-2", "ap-southeast-1", "ap-northeast-1"].map((r) => [
    `pooler-${r}`,
    `postgresql://postgres.${REF}:${enc}@aws-0-${r}.pooler.supabase.com:6543/postgres`,
    true,
  ]),
];

const sqlText = readFileSync(join(__dirname, "..", "supabase", "COMPLETE_SCHEMA.sql"), "utf8");

for (const [label, url, isPooler] of candidates) {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12_000,
  });
  try {
    console.log(`→ trying ${label}…`);
    await client.connect();
    console.log(`✅ CONNECTED via ${label}`);
    await client.query(sqlText);
    console.log("✅ Schema applied.");
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
    );
    console.log(`📊 Tables (${rows.length}):`);
    rows.forEach((r) => console.log("   •", r.table_name));

    // Persist the working URL for later steps.
    const finalUrl = isPooler
      ? url.replace(enc, PASSWORD) // readable form for Vercel paste
      : url.replace(enc, PASSWORD);
    writeFileSync(join(__dirname, ".database-url.txt"), finalUrl);
    console.log("\n💾 Working DATABASE_URL saved to scripts/.database-url.txt");
    console.log("DATABASE_URL=" + finalUrl);
    process.exit(0);
  } catch (err) {
    console.log(`   ✗ ${err.message.split("\n")[0].slice(0, 90)}`);
    try { await client.end(); } catch {}
  }
}
console.error("\n❌ No host worked. Check password / project paused.");
process.exit(1);
