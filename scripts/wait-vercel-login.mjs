/** Waits for successful Vercel login, then reports dashboard state. */
import { chromium } from "playwright-core";

const deadline = Date.now() + 10 * 60_000;
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("vercel")) ?? (await ctx.newPage());

process.stdout.write("⏳ Waiting for Vercel login");
while (Date.now() < deadline) {
  const url = page.url();
  if (/vercel\.com\/(dashboard|\[|^$)/.test(url) && !/login|signup/.test(url)) {
    console.log(`\n✅ Logged in! ${url}`);
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    console.log("--- DASHBOARD TEXT (first 1500) ---");
    console.log(text.slice(0, 1500));
    process.exit(0);
  }
  process.stdout.write(".");
  await new Promise((r) => setTimeout(r, 4000));
}
console.log("\n❌ Timed out.");
process.exit(1);
