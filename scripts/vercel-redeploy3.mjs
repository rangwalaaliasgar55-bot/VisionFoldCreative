/** Redeploy via row actions on the deployments list. */
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/deployments",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(6000);

// First production row's action button.
const btn = page.locator('button[aria-label="Deployment Actions"]').first();
await btn.scrollIntoViewIfNeeded();
await btn.click();
console.log("Opened Deployment Actions menu");
await page.waitForTimeout(1500);

// Dump menu items
const items = await page.evaluate(() =>
  [...document.querySelectorAll('[role="menuitem"], [role="menu"] button')]
    .filter((el) => el.offsetParent !== null)
    .map((el) => el.innerText.trim())
);
console.log("MENU ITEMS:", JSON.stringify(items));

const redeploy = page
  .locator('[role="menuitem"]:has-text("Redeploy"), [role="menu"] *:has-text("Redeploy")')
  .last();
if (await redeploy.count()) {
  await redeploy.click();
  console.log("Clicked Redeploy");
} else {
  throw new Error("Redeploy item not in menu");
}
await page.waitForTimeout(2500);

// Confirm modal if shown.
const confirmSel = [
  'div[role="dialog"] button:has-text("Redeploy")',
  '[data-state="open"] button:has-text("Redeploy")',
  'button:has-text("Redeploy to Production")',
].join(", ");
const confirmBtn = page.locator(confirmSel).last();
if (await confirmBtn.count()) {
  await confirmBtn.click();
  console.log("Confirmed redeploy");
} else {
  console.log("No extra confirmation detected");
}
await page.waitForTimeout(6000);
const status = await page.evaluate(() => {
  const t = document.body.innerText;
  return /building|queued|initializing/i.test(t) ? "🚀 BUILD RUNNING" : t.slice(0, 300);
});
console.log(status);
process.exit(0);
