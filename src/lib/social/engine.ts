/**
 * VisionFold social engine — analysis → per-platform drafting → critique → repair.
 *
 * Design rules:
 *  1. Every platform gets its OWN copy. YouTube is search-led, Instagram is
 *     emotion-led, LinkedIn is insight-led, Shorts is hook-led. Nothing is
 *     pasted between them.
 *  2. The engine drafts several candidates, critiques them against concrete
 *     rules, repairs what it can and picks the best — instead of emitting the
 *     first template that fills in.
 *  3. Deterministic: same brief + same variant = same output. `variant` lets the
 *     admin cycle alternatives without randomness.
 *  4. No network, no key, no model. Runs in the browser.
 */

import {
  BANNED_PHRASES,
  DOMAIN_TERMS,
  INTENT_CUES,
  STOPWORDS,
  TOOLS,
  VERB_LEAD,
  canon,
  canonSentence,
  smartTitleCase,
} from "./lexicon";

export const LIMITS = {
  ytTitle: 100,
  ytTitleIdeal: 70,
  ytDescription: 5000,
  ytTagsTotal: 500,
  igCaption: 2200,
  igHashtags: 30,
  liPost: 3000,
  liHashtags: 5,
  shortsTitle: 100,
} as const;

export type Intent = "tutorial" | "caseStudy" | "bts" | "showreel" | "launch" | "tips" | "general";

export type SocialInput = {
  topic: string;
  brand?: string;
  audience?: string;
  keywords?: string[];
  link?: string;
  category?: string;
  durationSec?: number;
  vertical?: boolean;
  cta?: string;
  /** Cycles alternative phrasings deterministically. */
  variant?: number;
};

export type Analysis = {
  sentences: string[];
  subject: string;
  keyphrases: string[];
  intent: Intent;
  tools: string[];
  metrics: string[];
  audience: string;
  hasClient: boolean;
};

export type Issue = { rule: string; detail: string; severity: "warn" | "fix" };

export type PlatformDraft = {
  platform: "youtube" | "instagram" | "linkedin" | "shorts";
  title?: string;
  titleOptions?: string[];
  body: string;
  tags?: string[];
  hashtags?: string[];
  firstComment?: string;
  chapters?: string[];
  limit: number;
  issues: Issue[];
};

export type Campaign = {
  analysis: Analysis;
  youtube: PlatformDraft;
  instagram: PlatformDraft;
  linkedin: PlatformDraft;
  shorts: PlatformDraft;
  checks: { label: string; ok: boolean; detail: string }[];
  score: number;
  schedule: { when: string; what: string }[];
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
const unique = <T,>(list: T[]) => Array.from(new Set(list));

const clamp = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

/** Deterministic pick — no Math.random anywhere in this engine. */
const rotate = <T,>(list: T[], variant: number): T[] =>
  list.length ? list.slice(variant % list.length).concat(list.slice(0, variant % list.length)) : list;

const sentenceCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/* ------------------------------------------------------------------ */
/* 1. Analysis                                                         */
/* ------------------------------------------------------------------ */
export function analyzeBrief(input: SocialInput): Analysis {
  const topic = (input.topic || "").trim();
  const sentences = topic
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Phrases must never span a sentence or clause boundary — that is what
  // produced garbage like "highlights step" from "...highlights. Step by step".
  const segments = topic
    .split(/[.!?;:,()\n—–]+/)
    .map((segment) => words(segment))
    .filter((seg) => seg.length);

  // --- keyphrases: bigrams and trigrams that read like noun phrases
  const phraseScore = new Map<string, number>();
  const bump = (phrase: string, amount: number) =>
    phraseScore.set(phrase, (phraseScore.get(phrase) ?? 0) + amount);

  const clean = (parts: string[]) =>
    parts.every((t) => !STOPWORDS.has(t) && !VERB_LEAD.has(t) && t.length > 2);

  for (const tokens of segments) {
    for (let i = 0; i < tokens.length; i++) {
      const w1 = tokens[i];
      if (clean([w1])) bump(w1, 1);
      if (i < tokens.length - 1 && clean([tokens[i], tokens[i + 1]])) {
        bump(`${tokens[i]} ${tokens[i + 1]}`, 2.4);
      }
      if (i < tokens.length - 2 && clean([tokens[i], tokens[i + 1], tokens[i + 2]])) {
        bump(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`, 2.0);
      }
    }
  }

  // Domain vocabulary outranks generic repetition.
  for (const term of DOMAIN_TERMS) if (topic.toLowerCase().includes(term)) bump(term, 4);
  for (const manual of input.keywords || []) {
    const clean = manual.trim().toLowerCase();
    if (clean) bump(clean, 10);
  }
  if (input.category) bump(input.category.toLowerCase(), 3);

  const ranked = [...phraseScore.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([phrase]) => phrase);

  const keyphrases: string[] = [];
  for (const phrase of ranked) {
    if (keyphrases.length >= 12) break;
    // Drop anything already represented by a longer chosen phrase.
    if (keyphrases.some((chosen) => chosen.includes(phrase) || phrase.includes(chosen))) continue;
    keyphrases.push(canon(phrase));
  }

  // --- intent
  const lower = topic.toLowerCase();
  let intent: Intent = "general";
  let best = 0;
  for (const [name, cues] of Object.entries(INTENT_CUES)) {
    const hits = cues.filter((cue) => lower.includes(cue)).length;
    if (hits > best) {
      best = hits;
      intent = name as Intent;
    }
  }

  const tools = TOOLS.filter((tool) => lower.includes(tool)).map(canon);
  // Only real measurements — "4k" is a resolution, not a result.
  const metrics = (
    topic.match(
      /\b\d+(?:[.,]\d+)?\s?(?:%|x(?=\s|$)|(?:k|m|million)?\s?(?:views|subscribers|subs|leads|sales)|days?|hours?|weeks?|months?)/gi
    ) || []
  )
    .map((m) => canonSentence(m.trim()))
    .filter((m) => !/^\d+\s?[km]$/i.test(m));

  const subject = canon(
    keyphrases[0] || segments.flat().filter((t) => !STOPWORDS.has(t))[0] || "the edit"
  );

  return {
    sentences,
    subject,
    keyphrases,
    intent,
    tools,
    metrics,
    audience: input.audience?.trim() || "",
    hasClient: /\bclient|brand|startup|company|agency\b/i.test(topic),
  };
}

/* ------------------------------------------------------------------ */
/* 2. Critique + repair — the "think before you speak" pass            */
/* ------------------------------------------------------------------ */
export function critique(text: string, opts: { kind: "title" | "body"; limit: number }): Issue[] {
  const issues: Issue[] = [];
  const lower = text.toLowerCase();

  if (text.length > opts.limit) {
    issues.push({ rule: "length", detail: `Over the ${opts.limit}-character limit.`, severity: "fix" });
  }
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      issues.push({ rule: "filler", detail: `Contains AI-flavoured filler: “${phrase}”.`, severity: "fix" });
    }
  }
  const dupes = lower.match(/\b(\w+)\s+\1\b/g);
  if (dupes) {
    issues.push({ rule: "repetition", detail: `Repeated word: “${dupes[0]}”.`, severity: "fix" });
  }
  const shouty = text.match(/\b[A-Z]{4,}\b/g)?.filter((w) => !/^(VFX|CGI|HDR|RAW|LUTS?|SEO|ROI|CTA|CTR|SAAS)$/.test(w));
  if (shouty?.length) {
    issues.push({ rule: "shouting", detail: `ALL-CAPS word: “${shouty[0]}”.`, severity: "warn" });
  }
  if (opts.kind === "title") {
    const first = lower.split(/\s+/)[0] ?? "";
    if (STOPWORDS.has(first) || VERB_LEAD.has(first)) {
      issues.push({ rule: "weak-open", detail: `Title opens on a weak word: “${first}”.`, severity: "warn" });
    }
    if (/[-–—:,]\s*$/.test(text)) {
      issues.push({ rule: "dangling", detail: "Title ends on dangling punctuation.", severity: "fix" });
    }
  }
  const emoji = text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) || [];
  if (emoji.length > 4) {
    issues.push({ rule: "emoji", detail: `${emoji.length} emoji — keep it under 4.`, severity: "warn" });
  }
  // Keyword stuffing: any word (not a stopword) used 5+ times.
  const counts = new Map<string, number>();
  words(text).forEach((w) => {
    if (!STOPWORDS.has(w) && w.length > 3) counts.set(w, (counts.get(w) ?? 0) + 1);
  });
  const stuffed = [...counts.entries()].find(([, n]) => n >= 5);
  if (stuffed) {
    issues.push({ rule: "stuffing", detail: `“${stuffed[0]}” repeats ${stuffed[1]}×.`, severity: "warn" });
  }
  return issues;
}

/** Fix everything that can be fixed mechanically, without changing meaning. */
export function repair(text: string, limit: number): string {
  let out = text;
  for (const phrase of BANNED_PHRASES) {
    out = out.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  }
  out = out
    .replace(/\b(\w+)(\s+\1\b)+/gi, "$1") // collapse repeated words
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[-–—:,]\s*$/g, "")
    .trim();
  return clamp(out, limit);
}

/** Score a title candidate on how a human would judge it. */
function scoreTitle(title: string, primary: string): number {
  let score = 100;
  const length = title.length;
  if (length > LIMITS.ytTitleIdeal) score -= (length - LIMITS.ytTitleIdeal) * 1.5;
  if (length < 25) score -= (25 - length) * 2;
  const idx = title.toLowerCase().indexOf(primary.toLowerCase());
  if (idx === -1) score -= 25;
  else score -= idx * 0.35; // keyword earlier is better
  score -= critique(title, { kind: "title", limit: LIMITS.ytTitle }).length * 12;
  const wordCount = title.split(/\s+/).length;
  if (wordCount < 4) score -= 15;
  if (wordCount > 14) score -= 10;
  return score;
}

/* ------------------------------------------------------------------ */
/* 3. Per-platform drafting — four different voices                    */
/* ------------------------------------------------------------------ */
function hookLine(a: Analysis, input: SocialInput): string {
  const first = a.sentences[0] || input.topic || "";
  return sentenceCase(canonSentence(first.replace(/\s+/g, " ").trim()));
}

/** Phrases worth putting in a bullet — single generic verbs read as filler. */
function bulletPhrases(a: Analysis, count: number): string[] {
  return a.keyphrases
    .filter((k) => k.includes(" ") || k.length > 6)
    .slice(1, 1 + count);
}

/**
 * Turn a keyphrase into a full sentence. Each platform passes a different
 * frame, which is what stops the three posts reading identically.
 */
function beat(phrase: string, frame: "ig" | "li", index: number): string {
  const subject = sentenceCase(canonSentence(phrase));
  const igFrames = [
    `${subject} carried the whole thing.`,
    `${subject} did the heavy lifting.`,
    `${subject} — that's the bit people notice.`,
  ];
  void igFrames;
  const liFrames = [
    `${subject} shaped the pacing more than any effect did.`,
    `${subject} took most of the hours on the timeline.`,
    `${subject} gave the client something they could point at.`,
  ];
  const pool = frame === "ig" ? igFrames : liFrames;
  return pool[index % pool.length];
}

function ctaFor(platform: string, input: SocialInput, a: Analysis): string {
  const brand = input.brand || "VisionFold Creative";
  switch (platform) {
    case "youtube":
      return input.cta || `Got footage that deserves this treatment? Send ${brand} a brief.`;
    case "instagram":
      return input.cta || "Send us your footage — we'll cut it.";
    case "linkedin":
      return a.hasClient
        ? "If you're planning something similar, I'm happy to talk through the approach."
        : "Curious how this would apply to your footage? Happy to compare notes.";
    default:
      return "Full cut on the channel.";
  }
}

function youtubeDraft(a: Analysis, input: SocialInput, variant: number): PlatformDraft {
  const primary = a.keyphrases[0] || a.subject;
  const secondary = a.keyphrases[1] || input.category || "the process";
  const subject = smartTitleCase(primary);
  const audienceTail = a.audience ? ` for ${a.audience}` : "";

  // Templates chosen by intent, so a tutorial doesn't get a case-study title.
  const byIntent: Record<Intent, string[]> = {
    tutorial: [
      `How to ${subject} (Without ${smartTitleCase(secondary)} Guesswork)`,
      `${subject}: A Practical Walkthrough`,
      `The ${subject} Method We Use on Every Edit`,
    ],
    caseStudy: [
      `${subject}${audienceTail} — How We Cut It`,
      `We Edited ${subject}. Here's What Changed`,
      `${subject}: The Full Post-Production Breakdown`,
    ],
    bts: [
      `Inside the Edit: ${subject}`,
      `${subject} — Our Actual Workflow`,
      `What ${subject} Really Takes`,
    ],
    showreel: [
      `${subject} — Studio Reel`,
      `${subject}: Selected Work`,
      `The ${subject} Cut`,
    ],
    launch: [
      `Introducing ${subject}`,
      `${subject} Is Live`,
      `${subject} — First Look`,
    ],
    tips: [
      `${subject}: 5 Things That Actually Matter`,
      `Fix Your ${subject} in One Pass`,
      `${subject} — Mistakes Worth Avoiding`,
    ],
    general: [
      `${subject}${audienceTail}`,
      `${subject} — ${smartTitleCase(secondary)}`,
      `${subject}: Start to Finish`,
    ],
  };

  const candidates = rotate(unique(byIntent[a.intent].map((t) => repair(t, LIMITS.ytTitle))), variant);
  const ranked = [...candidates].sort((x, y) => scoreTitle(y, primary) - scoreTitle(x, primary));
  const title = ranked[0];

  const chapters = buildChapters(input.durationSec, a);
  const learn = bulletPhrases(a, 4).map((k) => `• ${sentenceCase(canonSentence(k))}`);
  const toolLine = a.tools.length ? `Cut in ${a.tools.join(", ")}.` : "";
  const metricLine = a.metrics.length ? `Result: ${a.metrics.join(", ")}.` : "";

  const body = repair(
    [
      hookLine(a, input),
      toolLine,
      metricLine,
      "",
      learn.length ? "What's covered:" : "",
      ...learn,
      "",
      chapters.length ? "Chapters:" : "",
      ...chapters,
      "",
      ctaFor("youtube", input, a),
      input.link ? `→ ${input.link}` : "",
    ]
      .filter((line) => line !== "" || true)
      .join("\n"),
    LIMITS.ytDescription
  );

  // Tags are capped by joined length, not count.
  const pool = unique([
    ...a.keyphrases.map((k) => k.toLowerCase()),
    ...(input.category ? [input.category.toLowerCase()] : []),
    ...a.tools.map((t) => t.toLowerCase()),
    "video editing",
    "post production",
  ]).filter((t) => t.length > 2);
  const tags: string[] = [];
  let used = 0;
  for (const tag of pool) {
    if (used + tag.length + 1 > LIMITS.ytTagsTotal) break;
    tags.push(tag);
    used += tag.length + 1;
  }

  return {
    platform: "youtube",
    title,
    titleOptions: ranked,
    body,
    tags,
    chapters,
    limit: LIMITS.ytDescription,
    issues: [
      ...critique(title, { kind: "title", limit: LIMITS.ytTitle }),
      ...critique(body, { kind: "body", limit: LIMITS.ytDescription }),
    ],
  };
}

function instagramDraft(a: Analysis, input: SocialInput, variant: number): PlatformDraft {
  const primary = a.keyphrases[0] || a.subject;
  const openers = rotate(
    [
      `${sentenceCase(canonSentence(primary))} — here's the version that made the cut.`,
      `This one took a few passes to get right.`,
      `Small change on the timeline. Completely different film.`,
      `The brief said simple. The timeline disagreed.`,
    ],
    variant
  );

  // Fragments, not sentences from the brief — Instagram reads in glances.
  const fragments: string[] = [];
  if (a.tools.length) fragments.push(`Graded in ${a.tools[0]}`);
  if (a.metrics.length) fragments.push(`${a.metrics[0]} on the numbers`);
  // Deliberately no mined keyphrases here — those belong to the LinkedIn
  // analysis. Instagram gets craft detail so the two never read alike; the
  // keywords still ship in the hashtag block below.
  // Thin brief? Fall back to craft details rather than echoing the other posts.
  const filler = rotate(
    [
      "Cut for the moments people actually rewatch",
      "Sound designed before a single transition",
      "Colour pass done on the mids, not the highlights",
      "Every frame earned its place",
    ],
    variant
  );
  for (let i = 0; fragments.length < 3 && i < filler.length; i++) fragments.push(filler[i]);

  const beats = fragments.slice(0, 3).map((f) => `↳ ${f}`);
  const closer = rotate(
    [
      "Sound on. It matters more than the grade.",
      "Watch it full screen — the detail is in the mids.",
      "Frame by frame, this is where the hours go.",
    ],
    variant
  )[0];

  const body = repair(
    [
      openers[0],
      "",
      beats.join("\n"),
      "",
      closer,
      "",
      ctaFor("instagram", input, a),
      input.link ? "Link in bio." : "",
    ].join("\n"),
    LIMITS.igCaption
  );

  const toTag = (value: string) =>
    `#${value.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean).join("")}`;
  const hashtags = unique([
    ...(input.brand ? [toTag(input.brand)] : []),
    ...a.keyphrases.slice(0, 8).map(toTag),
    ...(input.category ? [toTag(input.category)] : []),
    "#videoediting",
    "#postproduction",
    "#filmmaking",
    "#colourgrading",
    "#reels",
  ])
    .filter((t) => t.length > 2)
    .slice(0, LIMITS.igHashtags);

  return {
    platform: "instagram",
    body,
    hashtags,
    firstComment: hashtags.join(" "),
    limit: LIMITS.igCaption,
    issues: critique(body, { kind: "body", limit: LIMITS.igCaption }),
  };
}

function linkedinDraft(a: Analysis, input: SocialInput, variant: number): PlatformDraft {
  const meaty = a.keyphrases.find((k) => k.includes(" ")) || a.keyphrases[0] || a.subject;
  const primary = sentenceCase(canonSentence(meaty));
  const lower = primary.toLowerCase();

  const openers = rotate(
    [
      `${primary} is where most edits quietly lose their audience.`,
      `A client came to us for ${lower}. The useful part wasn't in the brief.`,
      `We spent last week on ${lower}. Three things were worth writing down.`,
    ],
    variant
  );

  const context = a.hasClient
    ? "The footage was strong. The problem was structure — the story arrived about ninety seconds too late."
    : "The raw material was fine. What it lacked was a reason to keep watching past the first ten seconds.";

  const mined = bulletPhrases(a, 3);
  const fallbackLessons = rotate(
    [
      "Structure beat effects. Reordering two scenes did more than any plugin.",
      "The first ten seconds were rebuilt four times. Everything after was easier.",
      "Sound carried the emotion the picture only implied.",
    ],
    variant
  );
  const lessons = (mined.length ? mined.map((k, i) => beat(k, "li", i)) : fallbackLessons.slice(0, 3)).map(
    (line, i) => `${i + 1}. ${line}`
  );

  const result = a.metrics.length
    ? `The measurable part: ${a.metrics.join(", ")}.`
    : "The outcome was a cut the client could ship the same week, in every format they needed.";

  const body = repair(
    [
      openers[0],
      "",
      context,
      "",
      lessons.length ? "What actually moved the needle:" : "",
      ...lessons,
      "",
      result,
      a.tools.length ? `Finished in ${a.tools.join(" and ")}.` : "",
      "",
      ctaFor("linkedin", input, a),
      "",
      "How are you approaching this on your own edits?",
      input.link ? `\nFull breakdown: ${input.link}` : "",
    ].join("\n"),
    LIMITS.liPost
  );

  const toTag = (value: string) =>
    `#${value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w, i) => (i ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join("")}`;
  const hashtags = unique([...a.keyphrases.slice(0, 3).map(toTag), "#videoProduction"]).slice(
    0,
    LIMITS.liHashtags
  );

  return {
    platform: "linkedin",
    body,
    hashtags,
    limit: LIMITS.liPost,
    issues: critique(body, { kind: "body", limit: LIMITS.liPost }),
  };
}

function shortsDraft(a: Analysis, input: SocialInput, variant: number): PlatformDraft {
  const primary = smartTitleCase(a.keyphrases[0] || a.subject);
  const hooks = rotate(
    [
      `${primary} in 30 seconds`,
      `Watch the ${primary.toLowerCase()} change`,
      `${primary} — before vs after`,
      `Why your ${primary.toLowerCase()} looks flat`,
    ],
    variant
  );
  const title = repair(`${hooks[0]} #shorts`, LIMITS.shortsTitle);
  const body = repair([hooks[0], "", ctaFor("shorts", input, a)].join("\n"), 400);

  return {
    platform: "shorts",
    title,
    titleOptions: hooks,
    body,
    hashtags: unique(["#shorts", "#reels", ...a.keyphrases.slice(0, 4).map((k) => `#${k.replace(/[^a-z0-9]/gi, "").toLowerCase()}`)]).slice(0, 10),
    limit: LIMITS.shortsTitle,
    issues: critique(title, { kind: "title", limit: LIMITS.shortsTitle }),
  };
}

export function buildChapters(durationSec: number | undefined, a: Analysis): string[] {
  if (!durationSec || durationSec < 120) return [];
  const stamp = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
  const beatsByIntent: Record<Intent, string[]> = {
    tutorial: ["Intro", "The setup", "Step by step", "Common mistakes", "Result"],
    caseStudy: ["Intro", "The brief", "The edit", "Grade and sound", "Result"],
    bts: ["Intro", "Prep", "On the timeline", "Finishing", "Takeaways"],
    showreel: ["Intro", "Selected work", "Outro"],
    launch: ["Intro", "What's new", "Why it matters", "Availability"],
    tips: ["Intro", "Tip one", "Tip two", "Tip three", "Recap"],
    general: ["Intro", "The work", "The details", "Result"],
  };
  const beats = beatsByIntent[a.intent];
  const step = Math.floor(durationSec / beats.length);
  return beats.map((label, i) => `${i === 0 ? "0:00" : stamp(i * step)} ${label}`);
}

/* ------------------------------------------------------------------ */
/* 4. Campaign — assemble, verify distinctness, score                   */
/* ------------------------------------------------------------------ */
/** Rough similarity so we can prove the platforms aren't copy-paste. */
export function similarity(a: string, b: string): number {
  // Content words only, Jaccard over the union — symmetric and not skewed by
  // one post being shorter than the other.
  const content = (text: string) =>
    new Set(words(text).filter((w) => !STOPWORDS.has(w) && w.length > 2));
  const setA = content(a);
  const setB = content(b);
  if (!setA.size || !setB.size) return 0;
  let shared = 0;
  setA.forEach((w) => {
    if (setB.has(w)) shared++;
  });
  return shared / (setA.size + setB.size - shared);
}

export function generateCampaign(input: SocialInput): Campaign {
  const variant = Math.max(0, Math.floor(input.variant ?? 0));
  const analysis = analyzeBrief(input);

  const youtube = youtubeDraft(analysis, input, variant);
  const instagram = instagramDraft(analysis, input, variant);
  const linkedin = linkedinDraft(analysis, input, variant + 1);
  const shorts = shortsDraft(analysis, input, variant);

  const igVsLi = similarity(instagram.body, linkedin.body);
  const ytVsIg = similarity(youtube.body, instagram.body);

  const checks = [
    {
      label: "Platform voices differ",
      ok: igVsLi < 0.6 && ytVsIg < 0.6,
      detail: `Instagram↔LinkedIn ${(igVsLi * 100).toFixed(0)}% overlap, YouTube↔Instagram ${(ytVsIg * 100).toFixed(0)}% — under 60% means genuinely rewritten.`,
    },
    {
      label: "YouTube title length",
      ok: (youtube.title?.length ?? 0) <= LIMITS.ytTitleIdeal,
      detail: `${youtube.title?.length ?? 0}/${LIMITS.ytTitle} — results truncate near ${LIMITS.ytTitleIdeal}.`,
    },
    {
      label: "Keyword before the fold",
      ok:
        analysis.keyphrases.length > 0 &&
        youtube.body.slice(0, 150).toLowerCase().includes(analysis.keyphrases[0].toLowerCase()),
      detail: analysis.keyphrases.length
        ? `“${analysis.keyphrases[0]}” should appear in the first 150 characters.`
        : "Write a longer brief so keyphrases can be extracted.",
    },
    {
      label: "Chapters",
      ok: youtube.chapters!.length > 0,
      detail: youtube.chapters!.length
        ? `${youtube.chapters!.length} chapters, starting at 0:00.`
        : "Add a duration over 2 minutes to scaffold chapters.",
    },
    {
      label: "LinkedIn stays professional",
      ok:
        (linkedin.hashtags?.length ?? 0) <= LIMITS.liHashtags &&
        !/link in bio/i.test(linkedin.body),
      detail: `${linkedin.hashtags?.length ?? 0}/${LIMITS.liHashtags} hashtags, no “link in bio”.`,
    },
    {
      label: "Instagram hashtag mix",
      ok: (instagram.hashtags?.length ?? 0) >= 8,
      detail: `${instagram.hashtags?.length ?? 0}/${LIMITS.igHashtags} in the first comment.`,
    },
    {
      label: "No filler or repetition",
      ok: [youtube, instagram, linkedin, shorts].every(
        (d) => !d.issues.some((i) => i.severity === "fix")
      ),
      detail: "Drafts are checked for AI filler, repeated words and dangling punctuation.",
    },
  ];

  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  const schedule = [
    { when: "Day 0 · 18:00", what: "YouTube upload — title, description, chapters, tags" },
    { when: "Day 0 · 19:30", what: "Instagram Reel — caption live, hashtags in first comment" },
    { when: "Day 1 · 09:30", what: "LinkedIn post — insight version, no link in body" },
    { when: "Day 3 · 12:00", what: "Shorts cut-down from the strongest 30 seconds" },
  ];

  return { analysis, youtube, instagram, linkedin, shorts, checks, score, schedule };
}

/* ------------------------------------------------------------------ */
/* Thumbnail rules                                                      */
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
      detail: `Ratio ${ratio.toFixed(2)} — 1.78 avoids letterboxing.`,
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
