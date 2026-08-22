/** Add DATABASE_URL via the "Add Environment Variable" dialog. */
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const dbUrl = readFileSync(new URL("./.database-url.txt", import.meta.url), "utf8").trim();

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page =
  ctx.pages().find((p) => p.url().includes("vision-fold-creative")) ??
  (await ctx.newPage());

await page.goto(
  "https://vercel.com/rangwalaaliasgar55-8394s-projects/vision-fold-creative/settings/environment-variables",
  { waitUntil: "domcontentloaded", timeout: 60_000 }
);
await page.waitForTimeout(3000);

// Click the exact button.
await page.getByRole("button", { name: /add environment variable/i }).first().click();
console.log("Opened Add Environment Variable");
await page.waitForTimeout(2000);

// Dump visible inputs/labels to adapt quickly.
const probe = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("input, textarea")]
    .filter((el) => el.offsetParent !== null)
    .map((el) => ({
      tag: el.tagName,
      type: el.type,
      name: el.name,
      placeholder: el.placeholder,
      aria: el.getAttribute("aria-label"),
      id: el.id,
    }));
  return inputs;
});
console.log("VISIBLE INPUTS:", JSON.stringify(probe, null, 1));

// Fill by best match: first visible empty input = Key; textarea = Value.
const keyInput = page.locator("input:visible").nth(0);
await keyInput.fill("DATABASE_URL");
console.log("Key filled");
const valueArea = page.locator("textarea:visible").first();
if (await valueArea.count()) {
  await valueArea.fill(dbUrl);
} else {
  const valueInput = page.locator("input:visible").nth(1);
  await valueInput.fill(dbUrl);
}
console.log("Value filled");

// Environments: ensure Production checked at minimum; check all three.
for (const envName of ["Production", "Preview", "Development"]) {
  const cb = page.getByRole("checkbox", { name: new RegExp(`^${envName}$`, "i") }).first();
  if (await cb.count()) {
    if (!(await cb.isChecked())) await cb.check();
  }
}
console.log("Environments ensured");

// Save
await page.getByRole("button", { name: /^(add|save) environment variable$/i }).last().click().catch(async () => {
  await page.locator('button[type="submit"]:visible').last().click();
});
console.log("Saved");
await page.waitForTimeout(5000);

const after = await page.evaluate(() => document.body.innerText.slice(0, 800));
console.log(after.includes("DATABASE_URL") ? "✅ DATABASE_URL IS IN THE LIST" : after);
process.exit(0);
