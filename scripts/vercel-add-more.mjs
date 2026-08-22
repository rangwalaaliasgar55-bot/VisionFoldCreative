/** Add APP_URL + CRON_SECRET env vars via Vercel UI. */
import { chromium } from "playwright-core";
import { randomBytes } from "node:crypto";

const cronSecret = randomBytes(24).toString("hex");
const vars = [
  { key: "APP_URL", value: "https://visionfoldcreative.vercel.app" },
  { key: "CRON_SECRET", value: cronSecret },
];

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

  // Skip if already present.
  await page.getByPlaceholder("Search variables…").first().fill(key);
  await page.waitForTimeout(1500);
  const exists = await page.evaluate(
    (k) => document.body.innerText.includes(k),
    key
  );
  if (exists) {
    console.log(`✓ ${key} already set`);
    continue;
  }
  await page.getByPlaceholder("Search variables…").first().fill("");
  await page.waitForTimeout(800);

  await page.getByRole("button", { name: /add environment variable/i }).first().click();
  await page.waitForTimeout(1500);
  await page.locator('[aria-label="environment variable key"]').fill(key);
  await page.locator('[aria-label*="variable value"]').first().fill(value);
  await page.waitForTimeout(500);

  const saveBtn = page.locator('button:visible').filter({ hasText: /^Save$/ }).last();
  await saveBtn.click();
  console.log(`✅ Added ${key}`);
  await page.waitForTimeout(3000);
}

// Persist CRON_SECRET locally so nothing is lost.
const fs = await import("node:fs");
fs.writeFileSync(new URL("./.vercel-cron-secret.txt", import.meta.url), cronSecret);
console.log("Cron secret saved locally too.");
process.exit(0);
