/** Diagnose the filtered OPENAI_API_KEY row: does it exist? where is its menu? */
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(2500);
await page.getByPlaceholder("Search variables…").first().fill("OPENAI_API_KEY");
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const text = document.body.innerText;
  const btns = [...document.querySelectorAll("button")]
    .filter((b) => b.offsetParent !== null)
    .map((b) => ({ aria: b.getAttribute("aria-label"), txt: b.innerText.trim().slice(0, 20) }));
  return {
    noResults: /No Results Found/i.test(text),
    snippet: text.slice(text.indexOf("Name"), text.indexOf("Name") + 400),
    btns: btns.slice(0, 25),
  };
});
console.log(JSON.stringify(info, null, 1));
process.exit(0);
