/** Dump all buttons + row structure on filtered GEMINI_MODEL view. */
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
await page.getByPlaceholder("Search variables…").first().fill("GEMINI_MODEL");
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("button")]
    .filter((b) => b.offsetParent !== null)
    .map((b, i) => ({ i, aria: b.getAttribute("aria-label"), txt: b.innerText.trim().slice(0, 25) }));
  const text = document.body.innerText;
  const idx = text.indexOf("GEMINI_MODEL");
  return {
    btns: btns.slice(0, 25),
    around: idx >= 0 ? text.slice(Math.max(0, idx - 100), idx + 300) : "(row not found)",
  };
});
console.log(JSON.stringify(info, null, 1));
process.exit(0);
