import { readFileSync } from "node:fs";
/** Ensure BOTH GEMINI_API_KEY and GEMINI_MODEL exist via Add dialog. */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const KEY = JSON.parse(readFileSync(new URL("./.local-keys.json", import.meta.url), "utf8")).GEMINI_API_KEY;
const vars = [
  { key: "GEMINI_API_KEY", value: KEY },
  { key: "GEMINI_MODEL", value: "gemini-3.6-flash" },
];

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

for (const { key, value } of vars) {
  // Fresh load + real filter check
  await page.goto(
    "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
    { waitUntil: "domcontentloaded", timeout: 60_000 }
  );
  await page.waitForTimeout(2500);
  const search = page.getByPlaceholder("Search variables…").first();
  await search.fill(key);
  await page.waitForTimeout(2000);
  let body = await page.evaluate(() => document.body.innerText);
  const noResults = /No Results Found/i.test(body);
  if (!noResults) {
    console.log(`✓ ${key} exists`);
    continue;
  }
  console.log(`+ adding ${key}`);
  await search.fill("");
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /add environment variable/i }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('[aria-label="environment variable key"]').fill(key);
  await page.locator('[aria-label*="variable value"]').first().fill(value);
  await page.waitForTimeout(400);
  const saveBtn = page.locator('button:visible').filter({ hasText: /^Save$/ }).last();
  await saveBtn.click();
  await page.waitForTimeout(3000);
  console.log(`✅ saved ${key}`);
}

// Final verification of both
await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(2500);
for (const { key } of vars) {
  const s = page.getByPlaceholder("Search variables…").first();
  await s.fill(key);
  await page.waitForTimeout(1800);
  const ok = !(await page.evaluate(() => /No Results Found/i.test(document.body.innerText)));
  console.log(`${ok ? "✅" : "❌"} ${key} ${ok ? "confirmed" : "MISSING"}`);
}
process.exit(0);
