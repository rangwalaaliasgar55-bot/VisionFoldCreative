/** Trigger a production redeploy of vision-fold-creative. */
import { chromium } from "playwright-core";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ?? (await ctx.newPage());

await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/deployments",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(5000);

// Find the first deployment row's actions menu ("⋯" / More options).
const menuBtns = await page.evaluate(() =>
  [...document.querySelectorAll("button")].map((b, i) => ({
    i,
    label: b.getAttribute("aria-label"),
    text: b.innerText.trim().slice(0, 20),
  })).filter((b) => /more|menu|⋯|options/i.test(b.label || "") || b.text === "")
);
console.log("candidate buttons:", JSON.stringify(menuBtns.slice(0, 8)));

// Prefer aria-label match; fallback: first icon-only button inside list area.
let clicked = false;
for (const { label } of menuBtns) {
  const btn = page.locator(`button[aria-label="${label}"]`).first();
  if (label && await btn.count()) {
    await btn.click();
    clicked = true;
    console.log("Clicked menu:", label);
    break;
  }
}
if (!clicked) {
  // fallback: click the three-dots glyph
  await page.locator('button:has-text("⋯"), button:has-text("…")').first().click();
  clicked = true;
  console.log("Clicked dots fallback");
}
await page.waitForTimeout(1500);

const item = page.getByRole("menuitem", { name: /redeploy/i }).last();
if (await item.count()) {
  await item.click();
  console.log("Clicked Redeploy");
} else {
  const anyRedeploy = page.locator("text=/^redeploy/i").last();
  await anyRedeploy.click();
  console.log("Clicked Redeploy fallback");
}
await page.waitForTimeout(2000);

// Confirmation dialog may appear — confirm it.
const confirm = page.getByRole("button", { name: /^redeploy/i }).last();
if (await confirm.count()) {
  await confirm.click();
  console.log("Confirmed redeploy");
}
await page.waitForTimeout(4000);
console.log("URL now:", page.url());
const txt = await page.evaluate(() => document.body.innerText.slice(0, 700));
console.log(txt.includes("Building") || txt.includes("Queued") ? "🚀 REDEPLOY STARTED" : txt.slice(0, 300));
process.exit(0);
