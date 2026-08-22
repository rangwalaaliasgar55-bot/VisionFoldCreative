/** Inspect page after reset: dump text near 'password' mentions. */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("supabase.com")) ?? ctx.pages()[0];
await page.waitForTimeout(1500);

const text = await page.evaluate(() => document.body.innerText);
const lines = text.split("\n");
lines.forEach((line, i) => {
  if (/password/i.test(line)) {
    console.log(`[line ${i}] ${JSON.stringify(line.trim().slice(0, 120))}`);
    for (let k = 1; k <= 2; k++) {
      if (lines[i + k]) console.log(`   +${k}: ${JSON.stringify(lines[i + k].trim().slice(0, 140))}`);
    }
  }
});
