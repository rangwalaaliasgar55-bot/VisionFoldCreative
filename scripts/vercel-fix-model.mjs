/** Ensure GEMINI_MODEL value = gemini-3.6-flash (edit if different). */
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
await page.waitForTimeout(2000);

// Open the row's actions menu
const btn = page.locator('button').first();
if (await btn.count()) {
  await btn.click();
  await page.waitForTimeout(1200);
  const editItem = page.locator('[role="menuitem"]:has-text("Edit"), [role="menu"] *:has-text("Edit")').last();
  if (await editItem.count()) {
    await editItem.click();
    console.log("Opened editor");
    await page.waitForTimeout(2000);
    // Read the value field(s)
    const vals = await page.evaluate(() =>
      [...document.querySelectorAll("textarea, input")]
        .filter((el) => el.offsetParent !== null)
        .map((el) => ({ aria: el.getAttribute("aria-label"), v: el.value?.slice(0, 60) }))
    );
    console.log("FIELDS:", JSON.stringify(vals));
    const valueArea = page.locator('textarea[aria-label*="value" i], textarea').first();
    const current = await valueArea.inputValue().catch(() => "");
    console.log("CURRENT VALUE:", current);
    if (current !== "gemini-3.6-flash") {
      await valueArea.fill("gemini-3.6-flash");
      const saveBtn = page.locator('button:visible').filter({ hasText: /^Save$/ }).last();
      await saveBtn.click();
      console.log("✅ corrected to gemini-3.6-flash");
    } else {
      console.log("already correct");
    }
  } else {
    console.log("no edit item");
  }
} else {
  console.log("actions button not found");
}
process.exit(0);
