import { afterAll, describe, expect, it, vi } from "vitest";
import { generateSeoPack } from "@/lib/socialAi";

// Keep this suite hermetic: force every AI provider call (including the
// keyless relay) to fail so we exercise the deterministic rules fallback.
vi.stubGlobal("fetch", () => Promise.reject(new Error("offline-test-mode")));
afterAll(() => {
  vi.unstubAllGlobals();
});

// No AI keys in the test environment → exercises the offline rules engine.
describe("generateSeoPack (rule-based fallback)", () => {
  it("returns a complete pack without any API keys", async () => {
    const pack = await generateSeoPack({ platform: "youtube", topic: "sneaker launch commercial" });
    expect(pack.titles.length).toBeGreaterThanOrEqual(3);
    expect(pack.description.length).toBeGreaterThan(40);
    expect(pack.tags.length).toBeGreaterThanOrEqual(5);
    expect(pack.hashtags.every((h) => h.startsWith("#"))).toBe(true);
    expect(pack.hooks.length).toBeGreaterThanOrEqual(3);
    expect(pack.seoScore).toBeGreaterThan(0);
    expect(pack.seoScore).toBeLessThanOrEqual(100);
    expect(pack.source).toBe("rules");
  });

  it("adapts copy per platform", async () => {
    const yt = await generateSeoPack({ platform: "youtube", topic: "wedding film" });
    const li = await generateSeoPack({ platform: "linkedin", topic: "wedding film" });
    // YouTube descriptions get chapters, LinkedIn copy stays short-form.
    expect(yt.description).toContain("Chapters");
    expect(li.description.length).toBeLessThan(yt.description.length);
  });

  it("never crashes on empty topics", async () => {
    const pack = await generateSeoPack({ platform: "youtube", topic: "" });
    expect(pack.titles.length).toBeGreaterThan(0);
  });
});
