import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { emailShell } from "@/lib/email";

describe("password hashing (scrypt)", () => {
  it("round-trips a correct password", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(stored).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
  });

  it("rejects wrong passwords", () => {
    const stored = hashPassword("hunter2");
    expect(verifyPassword("hunter3", stored)).toBe(false);
  });

  it("salts every hash uniquely", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });
});

describe("email shell", () => {
  it("wraps content with brand markup", () => {
    const html = emailShell("Welcome", "<p>hi</p>");
    expect(html).toContain("VISIONFOLD CREATIVE");
    expect(html).toContain("<p>hi</p>");
  });
});
