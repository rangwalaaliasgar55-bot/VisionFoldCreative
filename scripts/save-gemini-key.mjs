/** Save runtime Gemini key into settings table.
 *  Usage: node scripts/save-gemini-key.mjs "<DATABASE_URL>"
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const KEY = JSON.parse(
  readFileSync(new URL("./.local-keys.json", import.meta.url), "utf8")
).GEMINI_API_KEY;

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('usage: node scripts/save-gemini-key.mjs "<DATABASE_URL>"');
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(
  "INSERT INTO settings (key, value) VALUES ('ai_key_gemini', $1::jsonb) ON CONFLICT (key) DO UPDATE SET value = $1::jsonb",
  [JSON.stringify(KEY)]
);
const { rows } = await client.query("SELECT key FROM settings WHERE key = 'ai_key_gemini'");
console.log("✅ runtime key saved:", rows[0].key);
await client.end();
