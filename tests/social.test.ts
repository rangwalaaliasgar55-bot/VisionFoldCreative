import { describe, expect, it } from "vitest";
import { simulateMetrics } from "@/lib/social";

const base = { platform: "youtube", seoScore: 80 };

describe("simulateMetrics (offline analytics engine)", () => {
  it("is deterministic for the same inputs", () => {
    const a = simulateMetrics({ ...base, postId: 42, daysSincePublish: 3 });
    const b = simulateMetrics({ ...base, postId: 42, daysSincePublish: 3 });
    expect(a).toEqual(b);
  });

  it("gives launch-day traction (never zero views)", () => {
    const day0 = simulateMetrics({ ...base, postId: 7, daysSincePublish: 0 });
    expect(day0.views).toBeGreaterThan(100);
    expect(day0.likes).toBeGreaterThan(0);
  });

  it("is monotonically non-decreasing over time", () => {
    let prev = 0;
    for (let day = 0; day <= 30; day++) {
      const snap = simulateMetrics({ ...base, postId: 9, daysSincePublish: day });
      expect(snap.views).toBeGreaterThanOrEqual(prev);
      prev = snap.views;
    }
  });

  it("rewards higher SEO scores with more reach", () => {
    const low = simulateMetrics({ postId: 5, platform: "youtube", seoScore: 10, daysSincePublish: 14 });
    const high = simulateMetrics({ postId: 5, platform: "youtube", seoScore: 95, daysSincePublish: 14 });
    expect(high.views).toBeGreaterThan(low.views);
  });

  it("engagement counts stay proportional to views", () => {
    const snap = simulateMetrics({ ...base, postId: 11, daysSincePublish: 10 });
    expect(snap.likes).toBeLessThan(snap.views);
    expect(snap.comments).toBeLessThan(snap.likes);
    expect(snap.shares).toBeLessThanOrEqual(snap.views / 2);
  });
});
