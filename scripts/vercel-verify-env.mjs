/** Verify DATABASE_URL exists; if not, re-add using precise aria selectors. */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const dbUrl = readFileSync(new URL("./.database-url.txt", import.meta.url), "utf8").trim();
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(3000);

// Filter the table by name.
const search = page.getByPlaceholder("Search variables…").first();
if (await search.count()) {
  await search.fill("DATABASE_URL");
  await page.waitForTimeout(2000);
}
const bodyNow = await page.evaluate(() => document.body.innerText);
if (/DATABASE_URL/.test(bodyNow)) {
  console.log("✅ DATABASE_URL already exists.");
  process.exit(0);
}

console.log("Not present — opening add form again.");
await search.fill("");
await page.waitForTimeout(1000);
await page.getByRole("button", { name: /add environment variable/i }).first().click();
await page.waitForTimeout(1500);

await page.locator('[aria-label="environment variable key"]').fill("DATABASE_URL");
await page.locator('[aria-label*="variable value"]').first().fill(dbUrl);
console.log("Filled via aria");

// Dump buttons to find the real submit.
const buttons = await page.evaluate(() =>
  [...document.querySelectorAll("button")]
    .filter((b) => b.offsetParent !== null)
    .map((b) => b.innerText.trim())
    .filter(Boolean)
);
console.log("BUTTONS:", JSON.stringify(buttons));

const saveBtn = page.getByRole("button", { name: /^save$/i }).first();
if (await saveBtn.count()) {
  await saveBtn.click();
  console.log("Clicked Save");
} else {
  const addBtn = page.getByRole("button", { name: /^add$/i }).last();
  await addBtn.click();
  console.log("Clicked Add");
}
await page.waitForTimeout(5000);

// Re-filter to confirm
const s2 = page.getByPlaceholder("Search variables…").first();
if (await s2.count()) {
  await s2.fill("DATABASE_URL");
  await page.waitForTimeout(2000);
}
const finalText = await page.evaluate(() => document.body.innerText.slice(0, 1200));
console.log(finalText.includes("DATABASE_URL") ? "✅ CONFIRMED: DATABASE_URL saved." : "❌ still missing:\n" + finalText);
process.exit(0);
