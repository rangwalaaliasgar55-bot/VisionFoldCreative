import { describe, expect, it } from "vitest";
import { scoreLead } from "@/lib/leadScore";
import { toInr, fmtInr, parseMoneyString, FX_USD_INR } from "@/lib/money";
import { winRate, cycleTimeDays, conversionFunnel } from "@/lib/kpis";
import { isBotUa, isInternalPath, normalizePath } from "@/lib/tracking";
import { KEYED_PROVIDERS, PROVIDER_META } from "@/lib/ai";
import { oauthUrl, platformConfigured } from "@/lib/social";

describe("lead scoring", () => {
  it("scores a complete inbound lead as hot", () => {
    const result = scoreLead({
      name: "Priya Shah",
      email: "priya@studio.in",
      phone: "9876543210",
      service: "Brand film",
      budget: "₹80,000",
      message: "Need a 90-second launch film for our D2C brand by next month, footage is on Drive.",
      source: "website",
    });
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.band).toBe("hot");
    expect(result.reasons.length).toBeGreaterThan(2);
  });

  it("scores a maps prospect with only a name as cold/warm, not hot", () => {
    const result = scoreLead({ name: "Indore Gym", source: "maps" });
    expect(result.score).toBeLessThan(70);
  });
});

describe("INR-first money", () => {
  it("keeps INR amounts unchanged", () => {
    const m = toInr({ amount: 2000, currency: "INR" });
    expect(m.amountInr).toBe(2000);
    expect(m.originalCurrency).toBe("INR");
    expect(fmtInr(2000)).toContain("2,000");
  });

  it("converts USD to INR and keeps the original", () => {
    const m = toInr({ amount: 100, currency: "USD" });
    expect(m.originalAmount).toBe(100);
    expect(m.originalCurrency).toBe("USD");
    expect(m.amountInr).toBe(Math.round(100 * FX_USD_INR));
  });

  it("parses a dollar string as USD", () => {
    expect(parseMoneyString("$250").currency).toBe("USD");
  });
});

describe("studio KPIs", () => {
  it("computes win rate from real statuses", () => {
    expect(winRate([{ status: "won" }, { status: "new" }, { status: "won" }])).toBe(67);
    expect(winRate([])).toBe(0);
  });

  it("builds a conversion funnel", () => {
    const funnel = conversionFunnel([
      { status: "new" },
      { status: "contacted" },
      { status: "proposal" },
      { status: "won" },
    ]);
    expect(funnel[0].value).toBe(4);
    expect(funnel[funnel.length - 1].value).toBe(1);
  });

  it("averages cycle time for completed projects", () => {
    const days = cycleTimeDays([
      { status: "completed", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-11") },
      { status: "in_progress", createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-02-01") },
    ]);
    expect(days).toBe(10);
  });
});

describe("visit tracking filters", () => {
  it("ignores admin, portal and api paths", () => {
    expect(isInternalPath("/admin")).toBe(true);
    expect(isInternalPath("/admin/leads")).toBe(true);
    expect(isInternalPath("/portal")).toBe(true);
    expect(isInternalPath("/")).toBe(false);
    expect(isInternalPath("/work/reel")).toBe(false);
  });

  it("detects bots", () => {
    expect(isBotUa("Googlebot/2.1")).toBe(true);
    expect(isBotUa("Mozilla/5.0 (Macintosh) Chrome/120")).toBe(false);
  });

  it("normalizes paths", () => {
    expect(normalizePath("/work/?utm=1")).toBe("/work");
    expect(normalizePath("contact")).toBe("/contact");
  });
});

describe("AI providers", () => {
  it("includes Grok and Groq in the keyed chain", () => {
    expect(KEYED_PROVIDERS).toContain("grok");
    expect(KEYED_PROVIDERS).toContain("groq");
    expect(PROVIDER_META.grok.envVar).toBe("XAI_API_KEY");
    expect(PROVIDER_META.groq.envVar).toBe("GROQ_API_KEY");
    expect(PROVIDER_META.grok.endpoint).toContain("api.x.ai");
    expect(PROVIDER_META.groq.endpoint).toContain("api.groq.com");
  });
});

describe("social OAuth", () => {
  it("returns a LinkedIn auth URL when configured", () => {
    const prevId = process.env.LINKEDIN_CLIENT_ID;
    const prevSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const prevApp = process.env.APP_URL;
    process.env.LINKEDIN_CLIENT_ID = "abc";
    process.env.LINKEDIN_CLIENT_SECRET = "secret";
    process.env.APP_URL = "https://visionfoldcreative.vercel.app";
    expect(platformConfigured("linkedin")).toBe(true);
    const url = oauthUrl("linkedin");
    expect(url).toContain("linkedin.com/oauth");
    process.env.LINKEDIN_CLIENT_ID = prevId;
    process.env.LINKEDIN_CLIENT_SECRET = prevSecret;
    process.env.APP_URL = prevApp;
  });
});
