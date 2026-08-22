/** Probe candidate project env-var URLs directly. */
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("vercel")) ?? (await ctx.newPage());

const candidates = [
  "vision-fold-creative",
  "visionfoldcreative",
  "visionfold",
  "vision-fold",
];

for (const slug of candidates) {
  const url = `https://vercel.com/rangwalaaliasgar55-8394s-projects/${slug}/settings`;
  const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch(() => null);
  await page.waitForTimeout(2500);
  const finalUrl = page.url();
  const title = await page.title();
  const notFound = /404|not found/i.test(await page.evaluate(() => document.body.innerText.slice(0, 500)));
  console.log(`${slug}: status=${res?.status()} final=${finalUrl.slice(0, 90)} nf=${notFound} title="${title.slice(0, 60)}"`);
  if (!notFound && !/dashboard\/?$/.test(finalUrl)) {
    console.log(`\n✅ FOUND PROJECT SLUG: ${slug}`);
    process.exit(0);
  }
}
console.log("\n❌ none matched");
