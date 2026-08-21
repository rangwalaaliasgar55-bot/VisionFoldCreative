import { db } from "@/db";
import {
  activity,
  socialAccounts,
  socialInsights,
  socialMetrics,
  socialPosts,
  type SocialPost,
} from "@/db/schema";
import { bad, ok, readBody, requireStaff } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  captureSnapshots,
  generateDueInsights,
  isSocialPlatform,
  latestMetricsByPost,
  oauthUrl,
  platformConfigured,
  publishSocialPost,
} from "@/lib/social";
import { buildReviewPayload, generateSeoPack } from "@/lib/socialAi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function authorize() {
  return requireStaff(["admin", "editor"]);
}

/** Tokens must never leave the server. */
function sanitizeAccount(account: typeof socialAccounts.$inferSelect) {
  return {
    id: account.id,
    platform: account.platform,
    name: account.name,
    externalId: account.externalId,
    status: account.status,
    createdAt: account.createdAt,
  };
}

function parseTags(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean).join(",");
  return String(value ?? "");
}

function parseHashtags(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean).join(" ");
  return String(value ?? "");
}

async function loadPost(id: number): Promise<SocialPost | null> {
  const rows = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const staff = await authorize();
  if (!staff) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];

  // Overview: everything the dashboard needs in one round-trip.
  if (path.length === 0 || path[0] === "overview") {
    const accounts = await db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
    const posts = (await db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt))).slice(0, 200);
    const metrics = await latestMetricsByPost(posts.map((p) => p.id));
    const insights = await db.select().from(socialInsights).orderBy(desc(socialInsights.createdAt)).limit(50);
    const titles = new Map(
      (await db.select({ id: socialPosts.id, title: socialPosts.title }).from(socialPosts)).map((p) => [p.id, p.title])
    );

    return ok({
      config: {
        youtubeConfigured: platformConfigured("youtube"),
        linkedinConfigured: platformConfigured("linkedin"),
        platforms: SOCIAL_PLATFORMS,
      },
      accounts: accounts.map(sanitizeAccount),
      posts: posts.map((post) => ({
        id: post.id,
        platform: post.platform,
        accountId: post.accountId,
        title: post.title,
        description: post.description,
        tags: post.tags,
        hashtags: post.hashtags,
        videoUrl: post.videoUrl,
        thumbnailUrl: post.thumbnailUrl,
        permalink: post.permalink,
        status: post.status,
        seoScore: post.seoScore,
        lastError: post.lastError,
        scheduledFor: post.scheduledFor,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        metrics: metrics.get(post.id) ?? null,
      })),
      insights: insights.map((i) => ({ ...i, postTitle: titles.get(i.postId) ?? "" })),
    });
  }

  if (path[0] === "posts" && path[1]) {
    const post = await loadPost(Number(path[1]));
    if (!post) return bad("Post not found", 404);
    const history = await db
      .select()
      .from(socialMetrics)
      .where(eq(socialMetrics.postId, post.id))
      .orderBy(desc(socialMetrics.capturedAt));
    const reviews = await db
      .select()
      .from(socialInsights)
      .where(eq(socialInsights.postId, post.id))
      .orderBy(desc(socialInsights.createdAt));
    return ok({ post, metrics: history, insights: reviews });
  }

  return bad("Not found", 404);
}

export async function POST(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const staff = await authorize();
  if (!staff) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  const body = await readBody<Record<string, any>>(req);

  // --- Accounts -------------------------------------------------------------
  if (path[0] === "connect") {
    const platform = String(body.platform || "");
    if (!isSocialPlatform(platform)) return bad("Unknown platform");

    // Real OAuth when credentials exist and demo mode isn't forced.
    if (!body.demo && platformConfigured(platform)) {
      const url = oauthUrl(platform);
      if (url) return ok({ mode: "oauth", url });
    }
    // Offline/demo connect — no external calls.
    const demoExtId = `${platform}-demo`;
    const existing = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.externalId, demoExtId))
      .limit(1);
    let account = existing.find((a) => a.platform === platform);
    if (!account) {
      const inserted = await db
        .insert(socialAccounts)
        .values({
          platform,
          name: platform === "youtube" ? "VisionFold YouTube (demo)" : "VisionFold LinkedIn (demo)",
          externalId: demoExtId,
          status: "demo",
        })
        .returning();
      account = inserted[0];
      await db.insert(activity).values({
        actor: staff.email,
        action: "social.connected",
        details: `${platform} (offline/demo mode)`,
      });
    }
    return ok({ mode: "demo", account: sanitizeAccount(account) }, 201);
  }

  if (path[0] === "disconnect") {
    const id = Number(body.id);
    if (!id) return bad("Missing account id");
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
    await db.insert(activity).values({ actor: staff.email, action: "social.disconnected", details: `account #${id}` });
    return ok({ ok: true });
  }

  // --- AI SEO pack (no persistence) -----------------------------------------
  if (path[0] === "seo") {
    const topic = String(body.topic || "").trim();
    if (!topic) return bad("Give the AI a topic or brief first.");
    const pack = await generateSeoPack({
      platform: isSocialPlatform(body.platform) ? (body.platform as SocialPlatform) : "youtube",
      topic,
      extra: body.extra,
    });
    return ok(pack);
  }

  // --- Create draft ----------------------------------------------------------
  if (path[0] === "posts" && path.length === 1) {
    const accountRows = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, Number(body.accountId)))
      .limit(1);
    const account = accountRows[0];
    if (!account) return bad("Connect an account first.");
    const title = String(body.title || "").trim().slice(0, 150);
    if (!title) return bad("Title is required.");

    const score = Math.max(0, Math.min(100, Number(body.seoScore) || 0));
    const inserted = await db
      .insert(socialPosts)
      .values({
        platform: account.platform,
        accountId: account.id,
        portfolioId: body.portfolioId ? Number(body.portfolioId) : null,
        title,
        description: String(body.description || "").slice(0, 5000),
        tags: parseTags(body.tags),
        hashtags: parseHashtags(body.hashtags),
        videoUrl: String(body.videoUrl || ""),
        thumbnailUrl: String(body.thumbnailUrl || ""),
        seoScore: score,
        status: "draft",
      })
      .returning();
    return ok({ post: inserted[0] }, 201);
  }

  // --- Publish / schedule / refresh / review ---------------------------------
  if (path[0] === "publish") {
    const result = await publishSocialPost(Number(body.id));
    if (!result.ok) return bad(result.error);
    return ok(result);
  }

  if (path[0] === "schedule") {
    const id = Number(body.id);
    const at = new Date(String(body.at || ""));
    if (!id || Number.isNaN(at.getTime())) return bad("Provide post id and a valid date.");
    if (at.getTime() <= Date.now()) return bad("Scheduled time must be in the future.");
    const post = await loadPost(id);
    if (!post) return bad("Post not found", 404);
    if (post.status === "published") return bad("Already published.");
    await db
      .update(socialPosts)
      .set({ status: "scheduled", scheduledFor: at, updatedAt: new Date(), lastError: "" })
      .where(eq(socialPosts.id, id));
    return ok({ ok: true });
  }

  if (path[0] === "refresh") {
    const snap = await captureSnapshots();
    const ins = await generateDueInsights();
    return ok({ captured: snap.captured, insightsGenerated: ins.generated });
  }

  if (path[0] === "review") {
    const id = Number(body.id);
    const post = await loadPost(id);
    if (!post || post.status !== "published" || !post.publishedAt) {
      return bad("Only published posts can be reviewed.");
    }
    const history = await db
      .select()
      .from(socialMetrics)
      .where(eq(socialMetrics.postId, id))
      .orderBy(desc(socialMetrics.capturedAt));
    if (!history.length) return bad("No metrics captured yet — run Refresh first.");

    const ageDays = Math.max(
      1,
      Math.floor((Date.now() - new Date(post.publishedAt).getTime()) / 86_400_000)
    );
    const payload = await buildReviewPayload(post, history[0], history[1] ?? null, ageDays);
    const inserted = await db
      .insert(socialInsights)
      .values({ postId: id, dayOffset: ageDays, kind: "review", body: payload as unknown as Record<string, unknown> })
      .returning();
    return ok({ insight: inserted[0] }, 201);
  }

  return bad("Not found", 404);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const staff = await authorize();
  if (!staff) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  if (path[0] !== "posts" || !path[1]) return bad("Not found", 404);
  const post = await loadPost(Number(path[1]));
  if (!post) return bad("Post not found", 404);
  if (post.status === "published") return bad("Published posts are immutable — create a new one instead.", 409);
  const body = await readBody<Record<string, any>>(req);

  await db
    .update(socialPosts)
    .set({
      title: body.title != null ? String(body.title).slice(0, 150) : post.title,
      description: body.description != null ? String(body.description).slice(0, 5000) : post.description,
      tags: body.tags != null ? parseTags(body.tags) : post.tags,
      hashtags: body.hashtags != null ? parseHashtags(body.hashtags) : post.hashtags,
      videoUrl: body.videoUrl != null ? String(body.videoUrl) : post.videoUrl,
      thumbnailUrl: body.thumbnailUrl != null ? String(body.thumbnailUrl) : post.thumbnailUrl,
      seoScore: body.seoScore != null ? Math.max(0, Math.min(100, Number(body.seoScore) || 0)) : post.seoScore,
      updatedAt: new Date(),
    })
    .where(eq(socialPosts.id, post.id));
  return ok({ ok: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const staff = await authorize();
  if (!staff) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  if (path[0] !== "posts" || !path[1]) return bad("Not found", 404);
  await db.delete(socialPosts).where(eq(socialPosts.id, Number(path[1])));
  return ok({ ok: true });
}
