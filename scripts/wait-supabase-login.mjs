/**
 * Waits until the Supabase dashboard shows a logged-in project page.
 * Usage: node scripts/wait-supabase-login.mjs [timeoutMinutes=10]
 */
import { chromium } from "playwright-core";

const timeoutMin = Number(process.argv[2] || 10);
const deadline = Date.now() + timeoutMin * 60_000;

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
if (!ctx) {
  console.error("No browser context found.");
  process.exit(1);
}
const page = ctx.pages()[0] ?? (await ctx.newPage());

process.stdout.write("⏳ Waiting for you to finish logging in");
while (Date.now() < deadline) {
  const url = page.url();
  if (/\/dashboard\/(project|org)/.test(url) && !/sign-in/.test(url)) {
    console.log(`\n✅ Logged in! At: ${url}`);
    // Land on the database settings page where the connection string lives.
    const refMatch = url.match(/project\/([a-z0-9]+)/);
    const ref = refMatch ? refMatch[1] : "";
    if (ref) {
      await page.goto(
        `https://supabase.com/dashboard/project/${ref}/settings/database`,
        { waitUntil: "domcontentloaded", timeout: 60_000 }
      ).catch(() => {});
      console.log(`📍 Opened: project ${ref} → Settings → Database`);
      console.log("REF=" + ref);
    }
    process.exit(0);
  }
  process.stdout.write(".");
  await new Promise((r) => setTimeout(r, 5000));
}
console.log("\n❌ Timed out waiting for login.");
process.exit(1);
