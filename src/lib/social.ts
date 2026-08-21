import { db } from "@/db";
import { activity, socialAccounts, socialInsights, socialMetrics, socialPosts } from "@/db/schema";
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import {
  linkedinConfigured,
  linkedinOrgStats,
  linkedinPost,
} from "@/lib/linkedin";
import { instagramAuthUrl, instagramConfigured, instagramPublish, instagramInsights } from "@/lib/instagram";
import { tiktokAuthUrl, tiktokConfigured, tiktokPublish } from "@/lib/tiktok";
import {
  youtubeAccessToken,
  youtubeAuthUrl,
  youtubeConfigured,
  youtubeUpload,
  youtubeVideoStats,
} from "@/lib/youtube";

export type SocialPlatform = "youtube" | "linkedin" | "instagram" | "tiktok";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["youtube", "linkedin", "instagram", "tiktok"];

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return (
    value === "youtube" ||
    value === "linkedin" ||
    value === "instagram" ||
    value === "tiktok"
  );
}

export function platformConfigured(platform: SocialPlatform): boolean {
  switch (platform) {
    case "youtube":
      return youtubeConfigured();
    case "linkedin":
      return linkedinConfigured();
    case "instagram":
      return instagramConfigured();
    case "tiktok":
      return tiktokConfigured();
  }
}

export function oauthUrl(platform: SocialPlatform): string | null {
  if (!platformConfigured(platform)) return null;
  switch (platform) {
    case "youtube":
      return youtubeAuthUrl("vf-youtube");
    case "instagram":
      return instagramAuthUrl("vf-instagram");
    case "tiktok":
      return tiktokAuthUrl("vf-tiktok");
    default:
      return null; // LinkedIn builds its URL in the auth module.
  }
}

// ---------------------------------------------------------------------------
// Publishing
// ---------------------------------------------------------------------------

type PublishResult =
  | { ok: true; externalPostId: string; permalink: string }
  | { ok: false; error: string };

async function publishLive(
  platform: SocialPlatform,
  account: typeof socialAccounts.$inferSelect,
  post: typeof socialPosts.$inferSelect
): Promise<PublishResult> {
  try {
    const tags = post.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const hashtags = post.hashtags.split(/\s+/).map((t) => t.trim()).filter(Boolean);

    if (platform === "youtube") {
      const auth = await youtubeAccessToken(account);
      if (!auth) throw new Error("YouTube token expired — reconnect the channel.");
      let token = auth.token;
      try {
        const result = await youtubeUpload({
          token,
          title: post.title || "VisionFold Creative",
          description: `${post.description}\n\n${hashtags.join(" ")}`.trim(),
          tags,
          videoUrl: post.videoUrl,
        });
        return { ok: true, externalPostId: result.videoId, permalink: result.permalink };
      } catch (err) {
        // One transparent retry after a forced refresh (token may have rotated).
        if (!auth.refreshToken) throw err;
        const fresh = await youtubeAccessToken({ ...account, accessToken: "", expiresAt: null });
        if (!fresh) throw err;
        token = fresh.token;
        const result = await youtubeUpload({
          token,
          title: post.title || "VisionFold Creative",
          description: `${post.description}\n\n${hashtags.join(" ")}`.trim(),
          tags,
          videoUrl: post.videoUrl,
        });
        return { ok: true, externalPostId: result.videoId, permalink: result.permalink };
      }
    }

    // LinkedIn
    const orgUrn = process.env.LINKEDIN_ORGANIZATION_URN || "";
    const authorUrn = orgUrn || `urn:li:person:${account.externalId}`;
    if (!authorUrn.startsWith("urn:li:")) throw new Error("LinkedIn author URN missing — reconnect the account.");
    const result = await linkedinPost({
      token: account.accessToken,
      authorUrn,
      title: post.title || "VisionFold Creative",
      description: `${post.description}\n\n${hashtags.join(" ")}`.trim(),
      url: post.videoUrl || undefined,
    });
    return { ok: true, externalPostId: result.postId, permalink: result.permalink };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Publish failed" };
  }
}

async function publishInstagram(
  account: typeof socialAccounts.$inferSelect,
  post: typeof socialPosts.$inferSelect
): Promise<PublishResult> {
  try {
    const result = await instagramPublish({
      token: account.accessToken,
      igUserId: account.externalId,
      title: post.title || "VisionFold Creative",
      description: post.description,
      videoUrl: post.videoUrl,
    });
    return { ok: true, externalPostId: result.postId, permalink: result.permalink };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Publish failed" };
  }
}

async function publishTikTok(
  account: typeof socialAccounts.$inferSelect,
  post: typeof socialPosts.$inferSelect
): Promise<PublishResult> {
  try {
    const result = await tiktokPublish({
      token: account.accessToken,
      title: `${post.title}\n\n${post.hashtags}`.trim(),
      videoUrl: post.videoUrl,
    });
    return { ok: true, externalPostId: result.postId, permalink: result.permalink };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Publish failed" };
  }
}

/** Offline/demo publish — deterministic fake ids so the whole flow works without keys. */
function demoPublish(platform: SocialPlatform, postId: number): PublishResult {
  const id = `demo_${platform}_${postId}_${Date.now().toString(36)}`;
  const permalink =
    platform === "youtube"
      ? `https://www.youtube.com/watch?v=${id}`
      : `https://www.linkedin.com/feed/update/urn:li:share:${postId}-demo`;
  return { ok: true, externalPostId: id, permalink };
}

/**
 * Publishes a single post now (or reports why it failed).
 * Works fully offline: demo accounts get simulated ids/permalinks.
 */
export async function publishSocialPost(postId: number): Promise<
  { ok: true; status: string } | { ok: false; error: string }
> {
  const rows = await db
    .select({ post: socialPosts, account: socialAccounts })
    .from(socialPosts)
    .innerJoin(socialAccounts, eq(socialPosts.accountId, socialAccounts.id))
    .where(eq(socialPosts.id, postId))
    .limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Post not found" };
  const { post, account } = row;
  if (post.status === "published") return { ok: false, error: "Already published" };

  const platform = account.platform as SocialPlatform;
  const live = account.status === "connected" && platformConfigured(platform);
  let result: PublishResult;
  if (!live) {
    result = demoPublish(platform, post.id);
  } else if (platform === "instagram") {
    result = await publishInstagram(account, post);
  } else if (platform === "tiktok") {
    result = await publishTikTok(account, post);
  } else {
    result = await publishLive(platform, account, post);
  }

  const now = new Date();
  if (!result.ok) {
    await db
      .update(socialPosts)
      .set({ status: "failed", lastError: result.error.slice(0, 500), updatedAt: now })
      .where(eq(socialPosts.id, postId));
    return { ok: false, error: result.error };
  }

  await db
    .update(socialPosts)
    .set({
      status: "published",
      externalPostId: result.externalPostId,
      permalink: result.permalink,
      publishedAt: now,
      scheduledFor: null,
      lastError: "",
      updatedAt: now,
    })
    .where(eq(socialPosts.id, postId));

  await db.insert(activity).values({
    actor: "studio",
    action: "social.published",
    details: `${account.platform}: ${post.title || result.externalPostId}`,
  });
  const { emitEvent } = await import("@/lib/events");
  await emitEvent("social.published", {
    id: post.id,
    platform: account.platform,
    title: post.title,
    permalink: result.permalink,
  });

  return { ok: true, status: "published" };
}

/** Cron helper: publishes every due scheduled post. Returns count published. */
export async function publishDueScheduledPosts(): Promise<number> {
  const due = await db
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.status, "scheduled"), sql`${socialPosts.scheduledFor} <= NOW()`));
  let published = 0;
  for (const post of due) {
    const res = await publishSocialPost(post.id);
    if (res.ok) published += 1;
  }
  return published;
}

// ---------------------------------------------------------------------------
// Metrics — live when possible, deterministic simulation offline
// ---------------------------------------------------------------------------

function hashSeed(...parts: (string | number)[]): number {
  let h = 2166136261;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32) so offline metrics are stable. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type MetricSnapshot = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  source: "live" | "simulated";
};

/**
 * Deterministic offline projection: cumulative views grow with a
 * fast-start / long-tail curve scaled by SEO score and a per-post seed.
 * Monotonic by construction, so repeated calls on the same day agree.
 */
export function simulateMetrics(opts: {
  postId: number;
  platform: string;
  seoScore: number;
  daysSincePublish: number;
}): MetricSnapshot {
  const rnd = mulberry32(hashSeed(opts.postId, opts.platform));
  const quality = 0.55 + (Math.max(0, Math.min(100, opts.seoScore)) / 100) * 0.9;
  const base =
    opts.platform === "youtube"
      ? 400 + rnd() * 900
      : opts.platform === "tiktok"
        ? 1400 + rnd() * 3600 // short-form skews viral
        : 900 + rnd() * 2000;
  // Day 0 already gets launch-hour traction; the curve stays monotonic.
  const t = Math.max(0, opts.daysSincePublish) + 1;
  const burst = base * quality * 2.2 * (1 - Math.exp(-t / 3.5));
  const tail = base * quality * 1.4 * Math.log1p(t);
  const views = Math.round(burst + tail);
  const likeRate = opts.platform === "youtube" ? 0.03 + rnd() * 0.03 : 0.05 + rnd() * 0.05;
  const commentRate = opts.platform === "youtube" ? 0.004 + rnd() * 0.004 : 0.01 + rnd() * 0.02;
  const shareRate = opts.platform === "youtube" ? 0.008 + rnd() * 0.008 : 0.02 + rnd() * 0.03;
  return {
    views,
    likes: Math.round(views * likeRate),
    comments: Math.round(views * commentRate),
    shares: Math.round(views * shareRate),
    source: "simulated",
  };
}

async function fetchLiveMetrics(
  post: typeof socialPosts.$inferSelect,
  account: typeof socialAccounts.$inferSelect
): Promise<MetricSnapshot | null> {
  try {
    if (!post.externalPostId || account.status !== "connected") return null;
    if (post.platform === "youtube") {
      const stats = await youtubeVideoStats(post.externalPostId, {
        apiKey: process.env.YOUTUBE_API_KEY || undefined,
      });
      if (!stats && platformConfigured("youtube") && account.refreshToken) {
        const auth = await youtubeAccessToken(account);
        if (!auth) return null;
        return await youtubeVideoStats(post.externalPostId, { token: auth.token }).then((s) =>
          s ? { ...s, shares: 0, source: "live" as const } : null
        );
      }
      return stats ? { ...stats, shares: 0, source: "live" } : null;
    }
    if (post.platform === "instagram") {
      const stats = await instagramInsights(account.accessToken, post.externalPostId);
      return stats ? { ...stats, shares: 0, source: "live" } : null;
    }
    // TikTok exposes no public stats API for direct posts — simulated fallback.
    if (post.platform === "tiktok") {
      return null;
    }
    const orgUrn = process.env.LINKEDIN_ORGANIZATION_URN || "";
    const stats = await linkedinOrgStats(account.accessToken, orgUrn, post.externalPostId);
    return stats ? { ...stats, source: "live" } : null;
  } catch {
    return null;
  }
}

/**
 * Captures one snapshot per published post per calendar day.
 * Live platforms use real APIs when credentials exist; everything else uses
 * the deterministic simulation so the dashboard keeps working offline.
 */
export async function captureSnapshots(): Promise<{ captured: number }> {
  const rows = await db
    .select({ post: socialPosts, account: socialAccounts })
    .from(socialPosts)
    .innerJoin(socialAccounts, eq(socialPosts.accountId, socialAccounts.id))
    .where(eq(socialPosts.status, "published"));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let captured = 0;
  for (const { post, account } of rows) {
    if (!post.publishedAt) continue;
    const existing = await db
      .select({ id: socialMetrics.id })
      .from(socialMetrics)
      .where(and(eq(socialMetrics.postId, post.id), gte(socialMetrics.capturedAt, startOfToday)))
      .limit(1);
    if (existing.length > 0) continue;

    const days = Math.floor((Date.now() - new Date(post.publishedAt).getTime()) / 86_400_000);
    const live = await fetchLiveMetrics(post, account);
    const snap =
      live ??
      simulateMetrics({
        postId: post.id,
        platform: post.platform,
        seoScore: post.seoScore,
        daysSincePublish: days,
      });

    await db.insert(socialMetrics).values({
      postId: post.id,
      views: snap.views,
      likes: snap.likes,
      comments: snap.comments,
      shares: snap.shares,
      source: snap.source,
    });
    captured += 1;
  }
  return { captured };
}

// ---------------------------------------------------------------------------
// Insights — "your video got X views, here's how to improve, next topic"
// ---------------------------------------------------------------------------

export type ReviewPayload = {
  headline: string;
  dayOffset: number;
  totals: { views: number; likes: number; comments: number; shares: number };
  engagementRate: number;
  source: "live" | "simulated";
  wins: string[];
  improvements: string[];
  nextTopics: { title: string; why: string }[];
};

const INSIGHT_OFFSETS = [3, 7];

/** Generates day-3 and day-7 performance reviews for every eligible post. */
export async function generateDueInsights(): Promise<{ generated: number }> {
  const posts = await db
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.status, "published"), isNotNull(socialPosts.publishedAt)));

  let generated = 0;
  for (const post of posts) {
    const existing = await db
      .select({ offset: socialInsights.dayOffset })
      .from(socialInsights)
      .where(eq(socialInsights.postId, post.id));
    const have = new Set(existing.map((e) => e.offset));
    const ageDays = post.publishedAt
      ? Math.floor((Date.now() - new Date(post.publishedAt).getTime()) / 86_400_000)
      : 0;

    for (const offset of INSIGHT_OFFSETS) {
      if (ageDays < offset || have.has(offset)) continue;
      const history = await db
        .select()
        .from(socialMetrics)
        .where(eq(socialMetrics.postId, post.id))
        .orderBy(desc(socialMetrics.capturedAt));
      const latest = history[0];
      if (!latest) continue;

      const { buildReviewPayload } = await import("@/lib/socialAi");
      const payload = await buildReviewPayload(post, latest, history[1] ?? null, offset);
      await db.insert(socialInsights).values({
        postId: post.id,
        dayOffset: offset,
        kind: "review",
        body: payload as unknown as Record<string, unknown>,
      });
      generated += 1;
    }
  }
  return { generated };
}

/** Convenience loader for the admin UI: latest metric per post. */
export async function latestMetricsByPost(postIds: number[]) {
  if (postIds.length === 0) return new Map<number, MetricSnapshot & { capturedAt: Date }>();
  const rows = await db
    .select()
    .from(socialMetrics)
    .where(inArray(socialMetrics.postId, postIds))
    .orderBy(desc(socialMetrics.capturedAt));
  const map = new Map<number, MetricSnapshot & { capturedAt: Date }>();
  for (const row of rows) {
    if (!map.has(row.postId)) {
      map.set(row.postId, {
        views: row.views,
        likes: row.likes,
        comments: row.comments,
        shares: row.shares,
        source: row.source === "live" ? "live" : "simulated",
        capturedAt: row.capturedAt ?? new Date(),
      });
    }
  }
  return map;
}
