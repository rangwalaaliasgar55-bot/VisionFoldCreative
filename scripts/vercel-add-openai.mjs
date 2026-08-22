/** Add OPENAI_API_KEY env var via Vercel UI (skips if present). */
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
const search = page.getByPlaceholder("Search variables…").first();
await search.fill("OPENAI_API_KEY");
await page.waitForTimeout(2000);
if (!(await page.evaluate(() => /No Results Found/i.test(document.body.innerText)))) {
  console.log("✓ OPENAI_API_KEY already set");
  process.exit(0);
}
await search.fill("");
await page.waitForTimeout(800);
await page.getByRole("button", { name: /add environment variable/i }).first().click();
await page.waitForTimeout(1500);
await page.locator('[aria-label="environment variable key"]').fill("OPENAI_API_KEY");
await page.locator('[aria-label*="variable value"]').first().fill(KEY);
await page.locator('button:visible').filter({ hasText: /^Save$/ }).last().click();
console.log("✅ Added OPENAI_API_KEY");
process.exit(0);
