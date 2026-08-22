/**
 * Reads the connection string + resets the DB password on the open
 * Supabase database-settings page, then prints a ready DATABASE_URL.
 */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("supabase.com")) ?? ctx.pages()[0];

console.log("PAGE:", page.url());
await page.waitForTimeout(2000);

// Make sure we're on the Database settings page.
if (!/settings\/database/.test(page.url())) {
  const m = page.url().match(/project\/([a-z0-9]+)/);
  await page.goto(`https://supabase.com/dashboard/project/${m?.[1]}/settings/database`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.waitForTimeout(3000);
}

  // Dump page text for diagnosis
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("--- PAGE TEXT (first 3000) ---");
  console.log(bodyText.slice(0, 3000));
const strings = await page.evaluate(() => {
  const out = [];
  const walk = document.querySelectorAll("input, code, span, div, p");
  for (const el of walk) {
    const val = (el.value || el.textContent || "").trim();
    if (/^postgres(ql)?:\/\/.+supabase/.test(val) && val.length < 300 && !out.includes(val)) out.push(val);
  }
  return out;
});
console.log("FOUND STRINGS:");
strings.forEach((s) => console.log(" •", s.slice(0, 140)));

// Save whatever we found; password step comes next in a second script run
// so the user can watch each stage.
writeFileSync("scripts/.conn-strings.json", JSON.stringify(strings, null, 2));
console.log("\nSaved to scripts/.conn-strings.json");

await browser.close();
