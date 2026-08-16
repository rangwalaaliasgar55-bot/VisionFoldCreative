#!/usr/bin/env node
/**
 * Regression suite for the social engine.
 *
 * It asserts the things that make output publishable and human:
 * platform limits, per-platform distinctness, correct product casing,
 * no filler, no repetition, and determinism.
 *
 * Usage: npx tsx scripts/check-social-seo.mjs
 */
import { generateCampaign, similarity, checkThumbnail, LIMITS } from "../src/lib/social/engine";

const failures = [];
const check = (label, ok) => {
  if (!ok) failures.push(label);
};

const BRIEFS = [
  {
    name: "case study",
    input: {
      topic:
        "A cinematic brand film we edited for a robotics startup in indore. Colour graded in davinci resolve, motion graphics for the product HUD, cut for retention on youtube. Watch time went up 40%.",
      brand: "VisionFold Creative",
      audience: "startup founders",
      category: "brand film",
      durationSec: 480,
      link: "https://example.com/work",
    },
  },
  {
    name: "tutorial",
    input: {
      topic: "How to colour grade skin tones in davinci resolve without plastic highlights. Step by step guide.",
      durationSec: 600,
    },
  },
  { name: "bare", input: { topic: "wedding highlights film" } },
  { name: "empty", input: { topic: "" } },
  { name: "no spaces", input: { topic: "a".repeat(400) } },
  { name: "emoji", input: { topic: "🔥 Music video edit!! VFX, colour & sound design — full breakdown?", category: "music video" } },
];

for (const { name, input } of BRIEFS) {
  const c = generateCampaign(input);

  // --- hard platform ceilings
  check(`${name}: yt title <= ${LIMITS.ytTitle}`, c.youtube.title.length <= LIMITS.ytTitle);
  check(`${name}: yt body <= ${LIMITS.ytDescription}`, c.youtube.body.length <= LIMITS.ytDescription);
  check(`${name}: yt tag budget`, c.youtube.tags.join(",").length <= LIMITS.ytTagsTotal);
  check(`${name}: ig caption <= ${LIMITS.igCaption}`, c.instagram.body.length <= LIMITS.igCaption);
  check(`${name}: ig hashtags <= ${LIMITS.igHashtags}`, c.instagram.hashtags.length <= LIMITS.igHashtags);
  check(`${name}: li post <= ${LIMITS.liPost}`, c.linkedin.body.length <= LIMITS.liPost);
  check(`${name}: li hashtags <= ${LIMITS.liHashtags}`, c.linkedin.hashtags.length <= LIMITS.liHashtags);

  // --- the platforms must not be copy-paste of each other
  check(`${name}: ig != li`, similarity(c.instagram.body, c.linkedin.body) < 0.6);
  check(`${name}: yt != ig`, similarity(c.youtube.body, c.instagram.body) < 0.6);
  check(`${name}: yt != li`, similarity(c.youtube.body, c.linkedin.body) < 0.75);

  // --- register: LinkedIn never uses Instagram's vocabulary
  check(`${name}: li has no 'link in bio'`, !/link in bio/i.test(c.linkedin.body));
  check(`${name}: li ends with a question`, /\?/.test(c.linkedin.body));
  check(`${name}: ig has hashtags in first comment`, c.instagram.firstComment.startsWith("#"));

  // --- no machine tells
  const all = [c.youtube.title, c.youtube.body, c.instagram.body, c.linkedin.body, c.shorts.title].join("\n");
  check(`${name}: no repeated adjacent words`, !/\b(\w+)\s+\1\b/i.test(all));
  check(`${name}: no dangling punctuation in title`, !/[-–—:,]\s*$/.test(c.youtube.title));
  check(`${name}: no double spaces`, !/ {2,}/.test(all));
  check(`${name}: no empty bullet`, !/^[•↳]\s*$/m.test(all));
  check(`${name}: chapters start at 0:00`, c.youtube.chapters.length === 0 || c.youtube.chapters[0].startsWith("0:00"));
  check(`${name}: score in range`, c.score >= 0 && c.score <= 100);
}

// --- product casing must survive lowercase input
const cased = generateCampaign({
  topic: "we cut this in davinci resolve and after effects for youtube and linkedin, shot in 4k with vfx in indore",
});
// Hashtags and URLs are lowercase by convention, so they're excluded here.
const casedText = [cased.youtube.body, cased.instagram.body, cased.linkedin.body]
  .join("\n")
  .replace(/#\S+/g, "")
  .replace(/https?:\/\/\S+/g, "");
check("canonicalises DaVinci Resolve", !/davinci resolve/i.test(casedText) || /DaVinci Resolve/.test(casedText));
check("canonicalises YouTube", !/\byoutube\b/.test(casedText));
check("canonicalises 4K", !/\b4k\b/.test(casedText));
check("canonicalises Indore", !/\bindore\b/.test(casedText));

// --- filler must never appear
const fillerProbe = generateCampaign({ topic: "In today's video we will dive deep and unlock the power of colour grading" });
const probeText = [fillerProbe.youtube.body, fillerProbe.instagram.body, fillerProbe.linkedin.body].join(" ").toLowerCase();
["in today's video", "dive deep", "unlock the power"].forEach((phrase) =>
  check(`strips filler: ${phrase}`, !probeText.includes(phrase))
);

// --- determinism, and variants that actually differ
const a = JSON.stringify(generateCampaign({ topic: "colour grading breakdown", variant: 0 }));
const b = JSON.stringify(generateCampaign({ topic: "colour grading breakdown", variant: 0 }));
check("deterministic", a === b);
const v1 = generateCampaign({ topic: "colour grading breakdown", variant: 1 });
check("variant changes the copy", JSON.parse(a).instagram.body !== v1.instagram.body);

// --- thumbnails
check("good thumbnail passes", checkThumbnail({ width: 1920, height: 1080, bytes: 900_000, type: "image/jpeg" }).every((c) => c.ok));
check("bad thumbnail fails", checkThumbnail({ width: 640, height: 640, bytes: 5_000_000, type: "image/gif" }).every((c) => !c.ok));

if (failures.length) {
  console.error(`✗ ${failures.length} social engine assertion(s) failed:`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log(`✓ social engine: ${BRIEFS.length} briefs × 4 platforms — limits, distinctness, casing, tone and determinism all hold`);
