import { db } from "@/db";
import { pageEvents, visitors } from "@/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
import { ensureMigrations } from "@/db/migrate";

const INTERNAL_PREFIXES = ["/admin", "/portal", "/api", "/pay"];
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora|whatsapp|telegram|preview|monitor|uptime|headless|phantom|puppeteer|playwright/i;

export type TrackPayload = {
  id: string;
  path: string;
  referrer?: string;
  title?: string;
  lang?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  kind?: "view" | "heartbeat" | "exit";
  durationMs?: number;
  userAgent?: string;
};

export function isInternalPath(path: string): boolean {
  const p = path.split("?")[0] || "/";
  return INTERNAL_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function isBotUa(ua: string): boolean {
  return Boolean(ua && BOT_RE.test(ua));
}

export function normalizePath(raw: string): string {
  let path = String(raw || "/").trim() || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  // Strip query/hash — UTM is captured separately so history stays clean.
  path = path.split("#")[0].split("?")[0];
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path.slice(0, 300);
}

function parseUtm(referrer: string, body: TrackPayload) {
  const fromBody = {
    utmSource: String(body.utmSource || "").slice(0, 80),
    utmMedium: String(body.utmMedium || "").slice(0, 80),
    utmCampaign: String(body.utmCampaign || "").slice(0, 120),
  };
  if (fromBody.utmSource) return fromBody;
  try {
    const url = new URL(referrer);
    return {
      utmSource: (url.searchParams.get("utm_source") || "").slice(0, 80),
      utmMedium: (url.searchParams.get("utm_medium") || "").slice(0, 80),
      utmCampaign: (url.searchParams.get("utm_campaign") || "").slice(0, 120),
    };
  } catch {
    return fromBody;
  }
}

/**
 * Record a public-site visit. Heartbeats update last-seen without inflating
 * page views. Real navigations increment page_views and append page_events.
 * Returns null when the ping is ignored (bot, internal path, bad id).
 */
export async function recordVisit(payload: TrackPayload): Promise<{ ok: true; counted: boolean } | { ok: false; reason: string }> {
  await ensureMigrations();
  const id = String(payload.id || "").trim().slice(0, 80);
  if (!id) return { ok: false, reason: "missing_id" };

  const path = normalizePath(payload.path);
  if (isInternalPath(path)) return { ok: false, reason: "internal" };

  const ua = String(payload.userAgent || "");
  if (isBotUa(ua)) return { ok: false, reason: "bot" };

  const kind = payload.kind === "heartbeat" || payload.kind === "exit" ? payload.kind : "view";
  const referrer = String(payload.referrer || "").slice(0, 500);
  const title = String(payload.title || "").slice(0, 200);
  const lang = String(payload.lang || "").slice(0, 16);
  const durationMs = Math.max(0, Math.min(Number(payload.durationMs) || 0, 1000 * 60 * 60 * 6));
  const utm = parseUtm(referrer, payload);
  const now = new Date();

  const existing = await db.select().from(visitors).where(eq(visitors.id, id)).limit(1);
  const row = existing[0];

  if (!row) {
    await db.insert(visitors).values({
      id,
      path,
      referrer,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      lang,
      durationMs,
      bounced: true,
      isBot: false,
      firstSeen: now,
      lastSeen: now,
      pageViews: kind === "view" ? 1 : 0,
    });
    if (kind === "view") {
      await db.insert(pageEvents).values({
        visitorId: id,
        path,
        referrer,
        title,
        kind: "view",
        durationMs: 0,
      });
    }
    return { ok: true, counted: kind === "view" };
  }

  const pathChanged = row.path !== path;
  const isNewView = kind === "view" && pathChanged;
  const nextViews = row.pageViews + (isNewView || (kind === "view" && row.pageViews === 0) ? 1 : 0);
  const nextDuration = Math.max(row.durationMs, durationMs);

  await db
    .update(visitors)
    .set({
      path,
      lastSeen: now,
      pageViews: nextViews,
      durationMs: nextDuration,
      bounced: nextViews <= 1,
      lang: lang || row.lang,
      referrer: row.referrer || referrer,
      utmSource: row.utmSource || utm.utmSource,
      utmMedium: row.utmMedium || utm.utmMedium,
      utmCampaign: row.utmCampaign || utm.utmCampaign,
    })
    .where(eq(visitors.id, id));

  if (isNewView || (kind === "view" && !row.pageViews)) {
    await db.insert(pageEvents).values({
      visitorId: id,
      path,
      referrer,
      title,
      kind: "view",
      durationMs: 0,
    });
  } else if (kind === "exit" && durationMs > 0) {
    await db.insert(pageEvents).values({
      visitorId: id,
      path,
      referrer,
      title,
      kind: "exit",
      durationMs,
    });
  }

  return { ok: true, counted: isNewView };
}

const LIVE_MS = 2 * 60_000;

export async function liveVisitors() {
  const cutoff = new Date(Date.now() - LIVE_MS);
  const rows = await db
    .select()
    .from(visitors)
    .where(and(gte(visitors.lastSeen, cutoff), eq(visitors.isBot, false)))
    .orderBy(desc(visitors.lastSeen))
    .limit(50);
  return rows.map((v) => ({
    id: v.id.slice(0, 8),
    path: v.path,
    lastSeen: v.lastSeen,
    pageViews: v.pageViews,
    durationMs: v.durationMs,
    referrer: v.referrer,
  }));
}

export async function analyticsSnapshot() {
  await ensureMigrations();
  const since30 = new Date(Date.now() - 30 * 86400_000);
  const sinceToday = new Date();
  sinceToday.setHours(0, 0, 0, 0);
  const liveCutoff = new Date(Date.now() - LIVE_MS);

  const [allRecent, live, events] = await Promise.all([
    db.select().from(visitors).where(and(gte(visitors.lastSeen, since30), eq(visitors.isBot, false))),
    db.select().from(visitors).where(and(gte(visitors.lastSeen, liveCutoff), eq(visitors.isBot, false))),
    db
      .select()
      .from(pageEvents)
      .where(and(gte(pageEvents.createdAt, since30), eq(pageEvents.kind, "view")))
      .orderBy(desc(pageEvents.createdAt))
      .limit(5000),
  ]);

  const dayMap = new Map<string, { day: string; views: number; visitors: Set<string> }>();
  for (const ev of events) {
    const day = (ev.createdAt ? new Date(ev.createdAt) : new Date()).toISOString().slice(0, 10);
    const bucket = dayMap.get(day) || { day, views: 0, visitors: new Set<string>() };
    bucket.views += 1;
    bucket.visitors.add(ev.visitorId);
    dayMap.set(day, bucket);
  }
  const daily = [...dayMap.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((d) => ({ day: d.day, views: d.views, visitors: d.visitors.size }));

  const pathMap = new Map<string, number>();
  for (const ev of events) pathMap.set(ev.path, (pathMap.get(ev.path) || 0) + 1);
  const topPages = [...pathMap.entries()]
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  const refMap = new Map<string, number>();
  for (const v of allRecent) {
    const host = hostOf(v.referrer) || "(direct)";
    refMap.set(host, (refMap.get(host) || 0) + 1);
  }
  const referrers = [...refMap.entries()]
    .map(([source, visitors]) => ({ source, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);

  const utmMap = new Map<string, number>();
  for (const v of allRecent) {
    if (!v.utmSource) continue;
    const key = [v.utmSource, v.utmMedium, v.utmCampaign].filter(Boolean).join(" / ");
    utmMap.set(key, (utmMap.get(key) || 0) + 1);
  }
  const campaigns = [...utmMap.entries()]
    .map(([campaign, visitors]) => ({ campaign, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 8);

  const bounced = allRecent.filter((v) => v.bounced).length;
  const withDuration = allRecent.filter((v) => v.durationMs > 0);
  const avgDurationMs = withDuration.length
    ? Math.round(withDuration.reduce((s, v) => s + v.durationMs, 0) / withDuration.length)
    : 0;

  const todayVisitors = allRecent.filter((v) => v.firstSeen && new Date(v.firstSeen) >= sinceToday).length;
  const todayViews = events.filter((e) => e.createdAt && new Date(e.createdAt) >= sinceToday).length;

  const history = events.slice(0, 40).map((e) => ({
    path: e.path,
    title: e.title,
    createdAt: e.createdAt,
    visitor: e.visitorId.slice(0, 8),
  }));

  return {
    daily,
    topPages,
    referrers,
    campaigns,
    history,
    liveNow: live.length,
    live: live.slice(0, 20).map((v) => ({
      path: v.path,
      lastSeen: v.lastSeen,
      pageViews: v.pageViews,
      durationMs: v.durationMs,
    })),
    uniques30d: allRecent.length,
    views30d: events.length,
    todayVisitors,
    todayViews,
    bounceRate: allRecent.length ? Math.round((bounced / allRecent.length) * 100) : 0,
    avgDurationMs,
  };
}

function hostOf(referrer: string): string {
  if (!referrer) return "";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
