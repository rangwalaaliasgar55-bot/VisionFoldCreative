/** Redeploy via latest production deployment detail page. */
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

// Collect deployment detail links.
const deploys = await page.evaluate(() =>
  [...new Set(
    [...document.querySelectorAll('a[href*="/vision-fold-creative/"]')]
      .map((a) => a.getAttribute("href"))
      .filter((h) => /^\/rangwalaaliasgar55-8394s-projects\/vision-fold-creative\/[A-Za-z0-9]{10,}$/.test(h))
  )]
);
console.log("DEPLOYMENT LINKS:", deploys.slice(0, 5));
if (!deploys.length) {
  console.log("No deployments found.");
  process.exit(1);
}

await page.goto(`https://vercel.com${deploys[0]}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.waitForTimeout(5000);
console.log("DETAIL:", page.url());

// Find the ⋯ actions button on the detail header.
const labels = await page.evaluate(() =>
  [...document.querySelectorAll("button")]
    .filter((b) => b.offsetParent !== null)
    .map((b) => ({ aria: b.getAttribute("aria-label"), txt: b.innerText.trim().slice(0, 15) }))
    .filter((b) => b.aria || b.txt)
);
console.log("VISIBLE BUTTONS:", JSON.stringify(labels).slice(0, 800));

// Click the icon-only one that isn't obvious text (likely ⋯): try common names first.
for (const name of [/more options/i, /actions/i, /deployment actions/i]) {
  const btn = page.getByRole("button", { name }).first();
  if (await btn.count()) {
    await btn.click();
    console.log("Clicked", name);
    break;
  }
}
await page.waitForTimeout(1200);

let clickedMenu = false;
const menuItem = page.getByRole("menuitem", { name: /redeploy/i });
if (await menuItem.count()) {
  await menuItem.first().click();
  clickedMenu = true;
  console.log("Menuitem Redeploy clicked");
} else {
  const anyR = page.locator('[role="menuitem"], [role="menu"] >> text=/redeploy/i').last();
  if (await anyR.count()) {
    await anyR.click();
    clickedMenu = true;
    console.log("Fallback Redeploy clicked");
  }
}
if (!clickedMenu) {
  // maybe clicking opened nothing; try direct button named Redeploy on page
  const direct = page.getByRole("button", { name: /^redeploy$/i }).first();
  if (await direct.count()) {
    await direct.click();
    console.log("Direct Redeploy button clicked");
  } else {
    console.log("❌ Could not find redeploy control");
    process.exit(1);
  }
}
await page.waitForTimeout(2500);

// Confirm dialog
const confirmBtn = page
  .getByRole("dialog")
  .getByRole("button", { name: /^redeploy/i })
  .last();
if (await confirmBtn.count()) {
  await confirmBtn.click();
  console.log("Confirmed");
} else {
  const c2 = page.locator('div[role="dialog"] button:has-text("Redeploy"), [data-state="open"] button:has-text("Redeploy")').last();
  if (await c2.count()) await c2.click(), console.log("Confirmed fallback");
}
await page.waitForTimeout(5000);
console.log("DONE — check build status next.");
process.exit(0);
