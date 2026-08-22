/** Step 2: Reset DB password, capture it, then read the Connect modal URI. */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("supabase.com")) ?? ctx.pages()[0];

console.log("PAGE:", page.url());
await page.waitForTimeout(1500);

// --- 1. Click "Reset password" --------------------------------------------
const resetBtn = page.getByRole("button", { name: /reset password/i }).first();
await resetBtn.scrollIntoViewIfNeeded();
await resetBtn.click();
console.log("Clicked: Reset password");
await page.waitForTimeout(2000);

// Confirmation modal — click its confirm/reset button too.
const confirmBtn = page
  .getByRole("button", { name: /^(reset password|confirm|yes)/i })
  .last();
if (await confirmBtn.count()) {
  await confirmBtn.click();
  console.log("Confirmed modal");
}
await page.waitForTimeout(3000);

// --- 2. Capture the newly shown password ----------------------------------
// Supabase reveals the new password in a readonly input or code block.
let newPassword = "";
const candidates = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("input[readonly], code, pre, span, div").forEach((el) => {
    const v = (el.value || el.textContent || "").trim();
    // Password-like: no spaces, decent length, mixed charset.
    if (
      v.length >= 12 &&
      v.length <= 40 &&
      !/\s/.test(v) &&
      /[A-Z]/.test(v) &&
      /[a-z]/.test(v) &&
      /\d/.test(v) &&
      !/supabase|postgres|password|pooler/i.test(v)
    ) {
      out.push(v);
    }
  });
  return [...new Set(out)];
});
console.log("PASSWORD CANDIDATES:");
candidates.forEach((c) => console.log(" •", c));
newPassword = candidates[candidates.length - 1] || "";

writeFileSync("scripts/.db-password.txt", newPassword);
console.log("\nSaved password to scripts/.db-password.txt (kept local only)");
await browser.close();
