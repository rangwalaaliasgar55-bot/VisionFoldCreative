/**
 * Domain lexicon for the social engine.
 *
 * The old engine's biggest tell was casing and phrasing: it produced things like
 * "Retention Youtube Breakdown". Copy only reads as human when the vocabulary is
 * right, so the vocabulary lives here as data rather than being guessed.
 */

/** Correct casing for terms a video studio actually writes. */
export const CANON: Record<string, string> = {
  youtube: "YouTube",
  "youtube shorts": "YouTube Shorts",
  shorts: "Shorts",
  reels: "Reels",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  facebook: "Facebook",
  "davinci resolve": "DaVinci Resolve",
  davinci: "DaVinci Resolve",
  resolve: "Resolve",
  "premiere pro": "Premiere Pro",
  premiere: "Premiere Pro",
  "after effects": "After Effects",
  "final cut": "Final Cut Pro",
  "final cut pro": "Final Cut Pro",
  cinema4d: "Cinema 4D",
  "cinema 4d": "Cinema 4D",
  blender: "Blender",
  photoshop: "Photoshop",
  vfx: "VFX",
  cgi: "CGI",
  lut: "LUT",
  luts: "LUTs",
  raw: "RAW",
  hdr: "HDR",
  "4k": "4K",
  "8k": "8K",
  "1080p": "1080p",
  fps: "fps",
  "b-roll": "B-roll",
  broll: "B-roll",
  "a-roll": "A-roll",
  ai: "AI",
  seo: "SEO",
  ui: "UI",
  ux: "UX",
  roi: "ROI",
  cta: "CTA",
  ctr: "CTR",
  b2b: "B2B",
  b2c: "B2C",
  saas: "SaaS",
  d2c: "D2C",
  ott: "OTT",
  usp: "USP",
  indore: "Indore",
  mumbai: "Mumbai",
  india: "India",
  dubai: "Dubai",
  london: "London",
  "new york": "New York",
  "los angeles": "Los Angeles",
};

/** Terms that signal this niche — they get scored up as keyphrases. */
export const DOMAIN_TERMS = new Set([
  "colour grading",
  "color grading",
  "sound design",
  "motion graphics",
  "post production",
  "video editing",
  "brand film",
  "music video",
  "wedding film",
  "podcast",
  "commercial",
  "documentary",
  "storyboard",
  "retention",
  "watch time",
  "hook",
  "pacing",
  "edit",
  "cut",
  "grade",
  "mix",
  "titles",
  "transitions",
  "thumbnail",
  "script",
  "voiceover",
  "subtitles",
  "captions",
  "shot list",
  "client",
  "launch",
  "campaign",
]);

export const STOPWORDS = new Set(
  `a an and are as at be been being but by for from had has have he her his how i if in into is it
   its of on or our ours over she so than that the their theirs them then there these they this
   those to too was we were what when where which who whom will with would you your yours about
   after again all also am any because before below between both can could did do does doing down
   during each few more most much must other others some such only own same very just now here
   get got make made using use used able upon while against off out up down again once without
   into onto per via step steps thing things way ways lot lots really actually basically`.split(/\s+/)
);

/** Words that must not start a noun phrase — the source of clumsy titles. */
export const VERB_LEAD = new Set(
  `edited editing added adding created creating making built building shot shooting delivered
   delivering produced producing designed designing graded grading mixed mixing cut cutting
   finished finishing wrote writing filmed filming worked working helped helping shows showing
   featuring featured includes including`.split(/\s+/)
);

/** Phrases we never want to emit — LLM-flavoured filler and marketing sludge. */
export const BANNED_PHRASES = [
  "in today's video",
  "in this video we will",
  "without further ado",
  "buckle up",
  "game changer",
  "game-changer",
  "revolutionize",
  "unlock the power",
  "dive deep",
  "delve into",
  "elevate your",
  "take it to the next level",
  "in conclusion",
  "look no further",
  "we've got you covered",
];

/** Tool names we can detect and credit in a description. */
export const TOOLS = [
  "davinci resolve",
  "premiere pro",
  "after effects",
  "final cut pro",
  "cinema 4d",
  "blender",
  "photoshop",
  "illustrator",
  "audition",
  "izotope",
  "logic pro",
  "ableton",
];

/** Intent cues — how the brief is phrased tells us what kind of post it is. */
export const INTENT_CUES: Record<string, string[]> = {
  tutorial: ["how to", "tutorial", "step by step", "guide", "learn", "explain", "walkthrough"],
  caseStudy: ["client", "for a", "brand film for", "campaign", "results", "increased", "we edited"],
  bts: ["behind the scenes", "bts", "process", "how we", "our workflow", "breakdown"],
  showreel: ["showreel", "reel", "montage", "highlights", "portfolio", "compilation"],
  launch: ["launch", "announcing", "new", "introducing", "release", "premiere"],
  tips: ["tips", "mistakes", "lessons", "things", "ways", "secrets", "rules"],
};

/**
 * Canonicalise known terms *inside* a sentence without flattening the rest of
 * its casing — "shot in davinci resolve in indore" -> "shot in DaVinci Resolve
 * in Indore". Longest keys first so "final cut pro" wins over "final cut".
 */
const CANON_KEYS = Object.keys(CANON).sort((a, b) => b.length - a.length);

export function canonSentence(text: string): string {
  let out = text;
  for (const key of CANON_KEYS) {
    const pattern = new RegExp(`(^|[^A-Za-z0-9])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9])`, "gi");
    out = out.replace(pattern, (_m, lead) => `${lead}${CANON[key]}`);
  }
  return out;
}

export function canon(term: string): string {
  const lower = term.toLowerCase().trim();
  if (CANON[lower]) return CANON[lower];
  // Canonicalise inside phrases too: "shot in 4k" -> "shot in 4K"
  return lower
    .split(" ")
    .map((word) => CANON[word] ?? word)
    .join(" ");
}

/** Sentence case that respects known acronyms and product names. */
export function smartTitleCase(value: string): string {
  const minor = new Set(["a", "an", "and", "the", "for", "of", "in", "on", "to", "with", "at", "by"]);
  return value
    .split(" ")
    .filter(Boolean)
    .map((word, i, arr) => {
      const lower = word.toLowerCase();
      if (CANON[lower]) return CANON[lower];
      if (i !== 0 && i !== arr.length - 1 && minor.has(lower)) return lower;
      if (/^[A-Z0-9]{2,}$/.test(word)) return word; // already an acronym
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
