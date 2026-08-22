/** Read runtime-stored AI keys + settings from Supabase for Vercel sync. */
import pg from "pg";
import { writeFileSync } from "node:fs";

const url = process.argv[2];
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

const { rows } = await client.query(
  `SELECT key, value FROM settings WHERE key LIKE 'ai\\_key\\_%' ESCAPE '\'`
);
const out = {};
for (const row of rows) {
  const v = typeof row.value === "string" ? row.value : JSON.stringify(row.value);
  if (v && v !== '""') out[row.key] = v.replace(/^\"|\"$/g, "");
}
writeFileSync(new URL("./.ai-keys.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("FOUND RUNTIME KEYS:", Object.keys(out));
console.log(
  Object.entries(out).map(([k, v]) => `${k}: ••••${v.slice(-4)}`).join("\n")
);
// Also check maintenance + other settings while we're here.
const { rows: misc } = await client.query(
  `SELECT key, value FROM settings WHERE key IN ('maintenanceOn','blogPerPage','siteTitle')`
);
console.log("MISC SETTINGS:", misc);
await client.end();
