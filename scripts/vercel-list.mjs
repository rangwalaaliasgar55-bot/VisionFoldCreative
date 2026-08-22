/** Dump dashboard project cards (name + link) with generous waiting. */
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("vercel")) ?? (await ctx.newPage());
await page.goto("https://vercel.com/rangwalaaliasgar55-8394s-projects", {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
// Wait for project cards to hydrate
await page.waitForTimeout(8000);
const data = await page.evaluate(() => {
  const links = [...document.querySelectorAll("a")].map((a) => a.getAttribute("href")).filter(Boolean);
  return {
    projectLinks: [...new Set(links.filter((h) => /\/[a-z0-9-]+$/.test(h) && !/login|signup|integrations|settings/i.test(h)))].slice(0, 30),
    allHrefs: [...new Set(links)].slice(0, 60),
    bodySnippet: document.body.innerText.slice(0, 600),
  };
});
console.log("PROJECT LINKS:\n" + (data.projectLinks.join("\n") || "(none)"));
console.log("\nALL HREFS:\n" + data.allHrefs.slice(0, 40).join("\n"));
console.log("\nBODY:\n" + data.bodySnippet);
process.exit(0);
