/** Check Vercel login state + find the project. */
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("vercel")) ?? (await ctx.newPage());
await page.goto("https://vercel.com/dashboard", { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(5000);
console.log("URL:", page.url());
const text = await page.evaluate(() => document.body.innerText);
console.log("--- TEXT ---");
console.log(text.slice(0, 1500));
