import { generate } from "@/lib/ai";
import type { ReviewPayload } from "@/lib/social";
import type { socialPosts, socialMetrics } from "@/db/schema";

export type SeoPack = {
  titles: string[];
  description: string;
  tags: string[];
  hashtags: string[];
  hooks: string[];
  seoScore: number;
  source: "ai" | "rules";
};

type Post = typeof socialPosts.$inferSelect;
type Metric = typeof socialMetrics.$inferSelect;

const STUDIO = "VisionFold Creative";

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 60;
  return Math.max(0, Math.min(100, v));
}

function toList(value: unknown, max = 10): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean).slice(0, max);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, max);
  }
  return [];
}

function keywordsFrom(topic: string): string[] {
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return [...new Set(words)].slice(0, 6);
}

// ---------------------------------------------------------------------------
// SEO pack — titles / description / tags / hashtags / hooks / score
// ---------------------------------------------------------------------------

function ruleSeoPack(platform: string, topic: string): SeoPack {
  const kws = keywordsFrom(topic);
  const primary = kws[0] ? kws.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") : topic || "Brand Story";
  const short = platform === "youtube" ? false : true;
  const titles = short
    ? [
        `${primary}: the cut that made it land`,
        `How ${primary} went from raw footage to retention machine`,
        `${primary} — before & after the VisionFold edit`,
      ]
    : [
        `${primary} | Full Breakdown — Cinematic Edit Process`,
        `We cut ${primary} for a brand launch — here's what changed`,
        `${primary}: story-first editing that keeps people watching`,
      ];
  const tags = [
    ...kws,
    "video editing",
    "post production",
    "brand film",
    "video marketing",
    "content strategy",
    platform === "youtube" ? "youtube growth" : "linkedin video",
  ].slice(0, 10);
  const hashtags = [
    "#VideoEditing",
    "#PostProduction",
    "#BrandFilm",
    "#ContentCreation",
    platform === "youtube" ? "#YouTubeTips" : "#LinkedInVideo",
  ].slice(0, 6);
  const description = [
    `${primary} — cut by ${STUDIO}.`,
    "",
    `In this ${platform === "youtube" ? "breakdown" : "post"}: the story pass, the pacing choices and the polish that turn raw footage into something people finish.`,
    platform === "youtube"
      ? "\nChapters:\n00:00 Hook\n00:42 The brief\n02:10 Editing decisions\n05:30 Final grade & sound\n07:15 Results"
      : "",
    "",
    "Want an edit like this for your brand? Message us — we reply within 24h.",
    hashtags.join(" "),
  ]
    .filter((s) => s !== undefined)
    .join("\n");
  const hooks = [
    `"Most edits lose viewers in the first 8 seconds. Here's how ${primary} avoids it."`,
    '"This footage looked unfixable. Watch what one story pass does."',
    '"Before/after: same footage, completely different film."',
  ];
  const seoScore = clampScore(
    58 +
      Math.min(kws.length, 5) * 4 +
      (topic.length > 24 ? 6 : 0) +
      (platform === "youtube" ? 4 : 2)
  );
  return { titles, description, tags, hashtags, hooks, seoScore, source: "rules" };
}

export async function generateSeoPack(opts: {
  platform: string;
  topic: string;
  extra?: string;
}): Promise<SeoPack> {
  const fallback = ruleSeoPack(opts.platform, opts.topic);

  try {
    const text = await generate(
      `Platform: ${opts.platform}. Topic/brief: "${opts.topic}". Extra context: "${String(
        opts.extra || ""
      ).slice(0, 600)}".
Return STRICT JSON only (no markdown fences) shaped exactly as:
{"titles":["...","...","..."],"description":"...","tags":["..."],"hashtags":["#..."],"hooks":["..."],"seoScore":0-100}
Rules: titles under ${opts.platform === "youtube" ? "70 chars, searchable keywords first" : "150 chars, professional tone"}; description ${
        opts.platform === "youtube" ? "with chapters placeholders and a CTA" : "max 200 words with a soft CTA"
      }; tags are lowercase search terms; hashtags start with #; hooks are first-3-seconds opening lines; seoScore reflects expected searchability.`,
      `You are the SEO brain of ${STUDIO}, a premium video editing studio. You write platform-native copy that ranks and retains.`
    );
    if (!text) return fallback;
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback;
    const json = JSON.parse(match[0]);
    const titles = toList(json.titles, 3);
    const tags = toList(json.tags, 12).map((t) => t.toLowerCase());
    const hashtags = toList(json.hashtags, 6).map((h) => (h.startsWith("#") ? h : `#${h}`));
    const hooks = toList(json.hooks, 3);
    const description = String(json.description || "").trim();
    if (!titles.length || !description) return fallback;
    return {
      titles,
      description,
      tags: tags.length ? tags : fallback.tags,
      hashtags: hashtags.length ? hashtags : fallback.hashtags,
      hooks: hooks.length ? hooks : fallback.hooks,
      seoScore: clampScore(json.seoScore),
      source: "ai",
    };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Day-3 / day-7 performance review
// ---------------------------------------------------------------------------

function engagementRate(m: { likes: number; comments: number; shares: number; views: number }): number {
  if (m.views <= 0) return 0;
  return Number((((m.likes + m.comments + m.shares) / m.views) * 100).toFixed(2));
}

export async function buildReviewPayload(
  post: Post,
  latest: Metric,
  previous: Metric | null,
  dayOffset: number
): Promise<ReviewPayload> {
  const totals = {
    views: latest.views,
    likes: latest.likes,
    comments: latest.comments,
    shares: latest.shares,
  };
  const er = engagementRate(totals);
  const benchmark = post.platform === "youtube" ? 4.5 : 6.5;

  const wins: string[] = [];
  const improvements: string[] = [];

  if (er >= benchmark) wins.push(`Engagement rate ${er}% beats the ${benchmark}% platform benchmark — the hook is working.`);
  else improvements.push(`Engagement is ${er}% vs ${benchmark}% typical — tighten the first 5 seconds and add one clear question to spark comments.`);

  if (previous && latest.views > previous.views * 1.25) wins.push(`Views grew ${Math.round(((latest.views - previous.views) / Math.max(previous.views, 1)) * 100)}% since last snapshot — momentum window is open, reply to every comment now.`);
  if (latest.shares > 0 && latest.shares / Math.max(latest.views, 1) > 0.02) wins.push("Share rate above 2% — this format travels. Repurpose it as a Short/Reel.");
  if (latest.comments === 0) improvements.push("Zero comments: end the video on an explicit question or poll.");
  if (dayOffset >= 7 && latest.views < 500) improvements.push("Under-performing reach after a week: repackage the strongest 20s as a vertical clip and repost.");
  if (wins.length < 2) wins.push("Consistent publishing beats perfect timing — keep the cadence.");
  if (improvements.length < 2) improvements.push("Add end-screens pointing to your best performer to lift session time.");

  const payload: ReviewPayload = {
    headline:
      dayOffset <= 2
        ? `${post.platform} · early traction: ${totals.views.toLocaleString()} views`
        : dayOffset <= 4
          ? `${post.platform} · 3-day check-in: ${totals.views.toLocaleString()} views`
          : `${post.platform} · week-one report: ${totals.views.toLocaleString()} views`,
    dayOffset,
    totals,
    engagementRate: er,
    source: latest.source === "live" ? "live" : "simulated",
    wins,
    improvements,
    nextTopics: [],
  };

  // Enrich the narrative with AI when available (never blocks the review).
  {
    try {
      const text = await generate(
        `A ${post.platform} video titled "${post.title}" reached ${JSON.stringify(
          totals
        )} after ${dayOffset} days (engagement rate ${er}%). Return exactly 3 concrete next-video topics as JSON array [{"title":"...","why":"..."}] tuned for this performance data. Titles max 12 words.`,
        "You are a video content strategist for a premium editing studio."
      );
      if (text) {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed)) {
            payload.nextTopics = parsed
              .map((x: any) => ({ title: String(x?.title || "").slice(0, 120), why: String(x?.why || "").slice(0, 160) }))
              .filter((x: any) => x.title)
              .slice(0, 3);
          }
        }
      }
    } catch {
      /* rules cover it */
    }
  }

  if (payload.nextTopics.length === 0) {
    payload.nextTopics = ruleNextTopics(post, totals);
  }
  return payload;
}

/** Offline topic advisor driven by the studio's own top performers. */
function ruleNextTopics(post: Post, totals: { views: number }): { title: string; why: string }[] {
  const base = post.title.split(/[—|:-]/)[0]?.trim() || "this project";
  return [
    {
      title: `Part 2: "${base}" — what happened after delivery`,
      why: "Sequels ride existing curiosity and typically convert 2–3× better on reach.",
    },
    {
      title: totals.views >= 1000
        ? "Breakdown: the exact timeline of our best-performing edit"
        : "Client story: from messy rushes to launch film in 10 days",
      why: totals.views >= 1000
        ? "Process content converts high-intent leads searching for editors."
        : "Story-based commercials outperform showreels for trust building.",
    },
    {
      title: "₹700 Shorts vs ₹70,000 brand films — what changes frame by frame",
      why: "Comparison formats trigger saves and shares on both platforms.",
    },
  ];
}
