#!/usr/bin/env node
/**
 * Regression test for the social SEO engine.
 *
 * The engine's whole value is that its output is always publishable, so this
 * asserts the real platform ceilings rather than snapshotting prose.
 *
 * Usage: node --experimental-strip-types scripts/check-social-seo.mjs
 */
import { generateSocialPack, checkThumbnail, LIMITS } from "../src/lib/social/seo.ts";

const failures = [];
const check = (label, condition) => {
  if (!condition) failures.push(label);
};

const cases = [
  {
    name: "full brief",
    input: {
      topic:
        "A cinematic brand film for a robotics startup. Colour graded in DaVinci Resolve with motion graphics and a retention-first YouTube cut.",
      brand: "VisionFold Creative",
      audience: "startup founders",
      category: "brand film",
      durationSec: 480,
      link: "https://visionfoldcreative.vercel.app/work",
    },
  },
  { name: "bare topic", input: { topic: "wedding highlights film" } },
  { name: "empty topic", input: { topic: "" } },
  { name: "no spaces", input: { topic: "a".repeat(400) } },
  {
    name: "emoji + punctuation",
    input: { topic: "🔥 Music video edit!! VFX, colour & sound design — full breakdown?", category: "music video" },
  },
];

for (const { name, input } of cases) {
  const pack = generateSocialPack(input);
  check(`${name}: yt title <= ${LIMITS.ytTitle}`, pack.youtube.title.length <= LIMITS.ytTitle);
  check(`${name}: titles all within limit`, pack.youtube.titles.every((t) => t.length <= LIMITS.ytTitle));
  check(`${name}: description <= ${LIMITS.ytDescription}`, pack.youtube.description.length <= LIMITS.ytDescription);
  check(`${name}: tag budget <= ${LIMITS.ytTagsTotal}`, pack.youtube.tags.join(",").length <= LIMITS.ytTagsTotal);
  check(`${name}: caption <= ${LIMITS.igCaption}`, pack.instagram.caption.length <= LIMITS.igCaption);
  check(`${name}: hashtags <= ${LIMITS.igHashtags}`, pack.instagram.hashtags.length <= LIMITS.igHashtags);
  check(`${name}: hashtags well formed`, pack.instagram.hashtags.every((h) => /^#[a-z0-9]+$/.test(h)));
  check(`${name}: chapters start at 0:00`, pack.youtube.chapters.length === 0 || pack.youtube.chapters[0].startsWith("0:00"));
  check(`${name}: score in range`, pack.score >= 0 && pack.score <= 100);
}

// Deterministic: the same brief must always produce the same pack.
const a = JSON.stringify(generateSocialPack({ topic: "colour grading breakdown", brand: "VF" }));
const b = JSON.stringify(generateSocialPack({ topic: "colour grading breakdown", brand: "VF" }));
check("deterministic output", a === b);

// Thumbnail rules
const good = checkThumbnail({ width: 1920, height: 1080, bytes: 900_000, type: "image/jpeg" });
check("valid thumbnail passes every rule", good.every((c) => c.ok));
const bad = checkThumbnail({ width: 640, height: 640, bytes: 5_000_000, type: "image/gif" });
check("bad thumbnail fails every rule", bad.every((c) => !c.ok));

if (failures.length) {
  console.error(`✗ ${failures.length} social SEO assertion(s) failed:`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`✓ social SEO engine: ${cases.length} briefs, all platform limits respected`);
