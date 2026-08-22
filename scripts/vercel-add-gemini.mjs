/** Add GEMINI_API_KEY + GEMINI_MODEL env vars via Vercel UI. */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const KEY = JSON.parse(readFileSync(new URL("./.local-keys.json", import.meta.url), "utf8")).GEMINI_API_KEY;
const MODEL = "gemini-3.6-flash";
const vars = [
  { key: "GEMINI_API_KEY", value: KEY },
  { key: "GEMINI_MODEL", value: MODEL },
];

import { readFileSync } from "node:fs";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

for (const { key, value } of vars) {
  await page.goto(
    "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
    { waitUntil: "domcontentloaded", timeout: 60_000 }
  );
  await page.waitForTimeout(2500);

  // Skip if exists
  const search = page.getByPlaceholder("Search variables…").first();
  if (await search.count()) {
    await search.fill(key);
    await page.waitForTimeout(1500);
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes(key)) {
      console.log(`✓ ${key} already set`);
      await search.fill("");
      await page.waitForTimeout(800);
      continue;
    }
    await search.fill("");
    await page.waitForTimeout(800);
  }

  await page.getByRole("button", { name: /add environment variable/i }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('[aria-label="environment variable key"]').fill(key);
  await page.locator('[aria-label*="variable value"]').first().fill(value);
  await page.waitForTimeout(400);
  const saveBtn = page.locator('button:visible').filter({ hasText: /^Save$/ }).last();
  await saveBtn.click();
  console.log(`✅ Added ${key}`);
  await page.waitForTimeout(3000);
}
process.exit(0);
