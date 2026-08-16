/**
 * VisionFold Social SEO engine.
 *
 * Zero dependencies, zero API keys, zero network: pure functions that turn a
 * plain description of a video into publish-ready YouTube and Instagram
 * metadata. It runs identically in the browser and on the server, so the admin
 * can generate a pack offline.
 *
 * Everything is deterministic — same input, same output — which is what makes
 * it testable and what keeps it free.
 */

export type SocialInput = {
  /** The only required field: what the video is about, in the admin's words. */
  topic: string;
  brand?: string;
  audience?: string;
  /** Extra keywords the admin wants to rank for. */
  keywords?: string[];
  link?: string;
  category?: string;
  /** Runtime in seconds — enables chapter scaffolding. */
  durationSec?: number;
  /** Vertical cut (Shorts / Reels). */
  vertical?: boolean;
  cta?: string;
};

export type PlatformCheck = { label: string; ok: boolean; detail: string };

export type SocialPack = {
  keywords: string[];
  youtube: {
    titles: string[];
    title: string;
    description: string;
    tags: string[];
    chapters: string[];
  };
  instagram: { caption: string; hashtags: string[]; firstComment: string };
  shorts: { title: string; caption: string; hashtags: string[] };
  checks: PlatformCheck[];
  score: number;
};

/* ------------------------------------------------------------------ */
/* Limits — the actual platform ceilings, in one place                 */
/* ------------------------------------------------------------------ */
export const LIMITS = {
  ytTitle: 100,
  ytTitleIdeal: 70,
  ytDescription: 5000,
  ytTagsTotal: 500,
  ytShortsTitle: 100,
  igCaption: 2200,
  igHashtags: 30,
} as const;

const STOPWORDS = new Set(
  `a an and are as at be been but by for from had has have he her his how i if in into is it its
   of on or our over she so than that the their them then there these they this to too was we were
   what when where which who will with would you your about after again all also am any because
   before being below between both can did do does doing down during each few more most other some
   such only own same very just now here get got make made using use used video videos`.split(/\s+/)
);

const CATEGORY_TAGS: Record<string, string[]> = {
  "brand film": ["brand film", "commercial production", "brand storytelling", "cinematic ad"],
  commercial: ["commercial", "tv advert", "ad film", "product commercial"],
  youtube: ["youtube editing", "video editing", "retention editing", "youtube growth"],
  "music video": ["music video", "music video editing", "colour grading", "vfx"],
  wedding: ["wedding film", "wedding cinematography", "wedding highlights"],
  podcast: ["podcast editing", "podcast clips", "audio post"],
  shorts: ["shorts", "reels", "vertical video", "short form content"],
};

const clamp = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

const titleCase = (value: string) =>
  value
    .split(" ")
    .map((word, i) =>
      i === 0 || word.length > 3 ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");

const unique = <T,>(list: T[]) => Array.from(new Set(list));

/* ------------------------------------------------------------------ */
/* Keyword extraction — frequency + bigrams, no model required         */
/* ------------------------------------------------------------------ */
export function extractKeywords(text: string, limit = 12): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));

  const freq = new Map<string, number>();
  words.forEach((word) => freq.set(word, (freq.get(word) ?? 0) + 1));

  // Bigrams carry more search intent than single words ("colour grading").
  const bigrams = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const pair = `${words[i]} ${words[i + 1]}`;
    bigrams.set(pair, (bigrams.get(pair) ?? 0) + 1);
  }

  const scored = [
    ...[...bigrams.entries()].map(([term, n]) => ({ term, score: n * 2.2 + term.length * 0.01 })),
    ...[...freq.entries()].map(([term, n]) => ({ term, score: n + term.length * 0.01 })),
  ].sort((a, b) => b.score - a.score);

  const picked: string[] = [];
  for (const { term } of scored) {
    if (picked.length >= limit) break;
    // Skip a single word already covered by a chosen phrase.
    if (picked.some((existing) => existing.includes(term))) continue;
    picked.push(term);
  }
  return picked;
}

/* ------------------------------------------------------------------ */
/* Hashtags — three reach tiers beat thirty generic ones               */
/* ------------------------------------------------------------------ */
export function buildHashtags(keywords: string[], brand?: string, category?: string): string[] {
  const toTag = (value: string) =>
    `#${value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .join("")}`;

  const niche = keywords.slice(0, 8).map(toTag);
  const broad = ["#videoediting", "#filmmaking", "#postproduction", "#cinematography", "#reels"];
  const categoryTags = (CATEGORY_TAGS[(category || "").toLowerCase()] || []).map(toTag);
  const brandTag = brand ? [toTag(brand)] : [];

  return unique([...brandTag, ...niche, ...categoryTags, ...broad])
    .filter((tag) => tag.length > 2)
    .slice(0, LIMITS.igHashtags);
}

/* ------------------------------------------------------------------ */
/* Titles                                                              */
/* ------------------------------------------------------------------ */
export function buildTitles(input: SocialInput, keywords: string[]): string[] {
  const primary = titleCase(keywords[0] || input.topic.split(/[.,]/)[0] || "Video");
  const secondary = titleCase(keywords[1] || input.category || "Behind the Cut");
  const brand = input.brand || "VisionFold";
  const audience = input.audience ? ` for ${input.audience}` : "";

  const candidates = [
    `${primary}${audience} — ${secondary} Breakdown`,
    `How We Edited ${primary} (${secondary})`,
    `${primary}: The ${secondary} Process, Start to Finish`,
    `${primary} — ${brand} Studio Cut`,
    `Inside ${primary}${audience}`,
  ];

  return unique(candidates.map((title) => clamp(title.replace(/\s+/g, " ").trim(), LIMITS.ytTitle)));
}

/* ------------------------------------------------------------------ */
/* Chapters                                                            */
/* ------------------------------------------------------------------ */
export function buildChapters(durationSec?: number): string[] {
  if (!durationSec || durationSec < 120) return [];
  const stamp = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };
  const beats = ["Intro", "The brief", "The edit", "Colour & sound", "Result", "Takeaways"];
  const step = Math.floor(durationSec / beats.length);
  // YouTube requires the first chapter to be 0:00.
  return beats.map((label, i) => `${i === 0 ? "0:00" : stamp(i * step)} ${label}`);
}

/* ------------------------------------------------------------------ */
/* The pack                                                            */
/* ------------------------------------------------------------------ */
export function generateSocialPack(input: SocialInput): SocialPack {
  const topic = (input.topic || "").trim();
  const brand = input.brand || "VisionFold Creative";
  const link = input.link || "";
  const cta = input.cta || "Got footage? Send a brief and we'll cut it.";

  const keywords = unique([
    ...(input.keywords || []).map((k) => k.trim().toLowerCase()).filter(Boolean),
    ...extractKeywords(`${topic} ${input.category || ""} ${input.audience || ""}`),
  ]).slice(0, 14);

  const titles = buildTitles({ ...input, brand }, keywords);
  const chapters = buildChapters(input.durationSec);
  const hashtags = buildHashtags(keywords, brand, input.category);

  // --- YouTube description: hook first (only ~120 chars show before "more")
  const hook = clamp(topic.split(/(?<=[.!?])\s/)[0] || topic, 150);
  const bullets = keywords.slice(0, 5).map((k) => `• ${titleCase(k)}`);
  const ytDescription = clamp(
    [
      hook,
      "",
      `${brand} — we fold stories into motion.`,
      "",
      "In this video:",
      ...bullets,
      "",
      chapters.length ? "Chapters:" : "",
      ...chapters,
      chapters.length ? "" : "",
      cta,
      link ? `→ ${link}` : "",
      "",
      hashtags.slice(0, 3).join(" "),
    ]
      .filter((line) => line !== undefined)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    LIMITS.ytDescription
  );

  // --- YouTube tags: comma-joined length is what's capped, not the count
  const tagPool = unique([
    ...keywords,
    ...(CATEGORY_TAGS[(input.category || "").toLowerCase()] || []),
    brand.toLowerCase(),
    "video editing",
    "post production",
  ]);
  const tags: string[] = [];
  let tagLength = 0;
  for (const tag of tagPool) {
    const cost = tag.length + 1;
    if (tagLength + cost > LIMITS.ytTagsTotal) break;
    tags.push(tag);
    tagLength += cost;
  }

  // --- Instagram: hook, short lines, CTA. Hashtags go in the first comment.
  const igCaption = clamp(
    [
      hook,
      "",
      keywords
        .slice(0, 3)
        .map((k) => `— ${titleCase(k)}`)
        .join("\n"),
      "",
      cta,
      link ? `Link in bio → ${link}` : "",
    ]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
    LIMITS.igCaption
  );

  const shortsTitle = clamp(`${titleCase(keywords[0] || topic)} #shorts`, LIMITS.ytShortsTitle);

  /* --- Checks: real ceilings, phrased as something you can act on --- */
  const checks: PlatformCheck[] = [
    {
      label: "YouTube title length",
      ok: titles[0].length <= LIMITS.ytTitleIdeal,
      detail: `${titles[0].length}/${LIMITS.ytTitle} chars — search results truncate near ${LIMITS.ytTitleIdeal}.`,
    },
    {
      label: "Keyword in first 150 chars",
      ok: keywords.length > 0 && ytDescription.slice(0, 150).toLowerCase().includes(keywords[0]),
      detail: keywords.length
        ? `Primary keyword “${keywords[0]}” should appear before the fold.`
        : "Add a longer description so keywords can be extracted.",
    },
    {
      label: "Description depth",
      ok: ytDescription.length >= 250,
      detail: `${ytDescription.length} chars — aim for 250+ for context.`,
    },
    {
      label: "Tag budget",
      ok: tags.length >= 5,
      detail: `${tags.length} tags, ${tagLength}/${LIMITS.ytTagsTotal} chars used.`,
    },
    {
      label: "Chapters",
      ok: chapters.length > 0,
      detail: chapters.length
        ? `${chapters.length} chapters starting at 0:00.`
        : "Add a duration over 2 minutes to scaffold chapters.",
    },
    {
      label: "Instagram caption",
      ok: igCaption.length <= LIMITS.igCaption && igCaption.length > 80,
      detail: `${igCaption.length}/${LIMITS.igCaption} chars.`,
    },
    {
      label: "Hashtag mix",
      ok: hashtags.length >= 8 && hashtags.length <= LIMITS.igHashtags,
      detail: `${hashtags.length}/${LIMITS.igHashtags} — brand + niche + broad tiers.`,
    },
  ];

  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return {
    keywords,
    youtube: { titles, title: titles[0], description: ytDescription, tags, chapters },
    instagram: {
      caption: igCaption,
      hashtags,
      firstComment: hashtags.join(" "),
    },
    shorts: {
      title: shortsTitle,
      caption: clamp(`${hook}\n\n${cta}`, LIMITS.igCaption),
      hashtags: unique(["#shorts", "#reels", ...hashtags]).slice(0, 12),
    },
    checks,
    score,
  };
}

/* ------------------------------------------------------------------ */
/* Thumbnail validation — free, instant, catches real upload rejections */
/* ------------------------------------------------------------------ */
export type ThumbCheck = { label: string; ok: boolean; detail: string };

export function checkThumbnail(meta: {
  width: number;
  height: number;
  bytes: number;
  type: string;
}): ThumbCheck[] {
  const ratio = meta.width / Math.max(meta.height, 1);
  return [
    {
      label: "Minimum size",
      ok: meta.width >= 1280 && meta.height >= 720,
      detail: `${meta.width}×${meta.height} — YouTube wants 1280×720 or larger.`,
    },
    {
      label: "16:9 aspect",
      ok: Math.abs(ratio - 16 / 9) < 0.05,
      detail: `Ratio ${ratio.toFixed(2)} — 1.78 keeps it from being letterboxed.`,
    },
    {
      label: "Under 2 MB",
      ok: meta.bytes <= 2 * 1024 * 1024,
      detail: `${(meta.bytes / 1024 / 1024).toFixed(2)} MB — YouTube rejects over 2 MB.`,
    },
    {
      label: "Format",
      ok: /jpeg|jpg|png|webp/i.test(meta.type),
      detail: `${meta.type || "unknown"} — use JPG, PNG or WEBP.`,
    },
  ];
}
