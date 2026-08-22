/** Edit existing OPENAI_API_KEY value to the newly provided key. */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const KEY = JSON.parse(readFileSync(new URL("./.local-keys.json", import.meta.url), "utf8")).OPENAI_API_KEY;

import { readFileSync } from "node:fs";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(2500);
await page.getByPlaceholder("Search variables…").first().fill("OPENAI_API_KEY");
await page.waitForTimeout(2000);

// Row action menu
const btn = page.locator('button[aria-label="Menu"]:visible').last();
await btn.scrollIntoViewIfNeeded();
await btn.click();
console.log("Opened actions");
await page.waitForTimeout(1200);

const editItem = page.locator('[role="menuitem"]:has-text("Edit"), [role="menu"] *:has-text("Edit")').last();
if (!(await editItem.count())) {
  console.log("❌ no edit item — dumping menu:");
  const items = await page.evaluate(() =>
    [...document.querySelectorAll("[role=menuitem]")].map((e) => e.innerText.trim())
  );
  console.log(JSON.stringify(items));
  process.exit(1);
}
await editItem.click();
console.log("Opened editor");
await page.waitForTimeout(2000);

// Value field(s) in editor — fill all textareas with the key.
const areas = page.locator("textarea:visible");
const count = await areas.count();
for (let i = 0; i < count; i++) {
  await areas.nth(i).fill(KEY);
}
console.log(`Filled ${count} textarea(s)`);

const saveBtn = page.locator('button:visible').filter({ hasText: /^Save$/ }).last();
await saveBtn.click();
console.log("✅ Saved new key value");
process.exit(0);
