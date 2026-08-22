/** List projects + go to VisionFold env vars page. */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("vercel")) ?? (await ctx.newPage());
await page.goto("https://vercel.com/rangwalaaliasgar55-8394s-projects", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(4000);

const links = await page.evaluate(() =>
  [...document.querySelectorAll('a[href*="/projects/"]')]
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && /^[^?]*\/projects\/[a-z0-9\-]+$/.test(h))
);
console.log("PROJECT LINKS:", [...new Set(links)].join("\n"));

// Pick the visionfold one
const target = [...new Set(links)].find((l) => /vision/i.test(l));
if (!target) {
  console.log("❌ No visionfold project link found.");
  process.exit(1);
}
console.log("TARGET:", target);

const url = `https://vercel.com${target}/settings/environment-variables`;
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(4000);
console.log("ENV PAGE:", page.url());

// Save the value for the next step
const dbUrl = readFileSync(new URL("./.database-url.txt", import.meta.url), "utf8").trim();
globalThis.__dbUrl = dbUrl;
console.log("DB URL loaded:", dbUrl.slice(0, 60) + "…");

// Keep values accessible for the add-env step via a temp file already saved.
console.log("READY");
process.exit(0);
