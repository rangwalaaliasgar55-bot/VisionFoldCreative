import { bad } from "@/lib/auth";
import type { CmsPage, CmsStore } from "@/lib/cmsTypes";
import { getSetting, setSetting } from "@/lib/settings";
import { captureSnapshots, generateDueInsights, publishDueScheduledPosts } from "@/lib/social";
import { runAutomations } from "@/lib/automations";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STORE_KEY = "cmsStore";

/**
 * Vercel Cron (daily 06:00 UTC), four jobs in one authenticated endpoint:
 *   1. Publish CMS pages whose scheduledFor time has passed.
 *   2. Publish social posts (YouTube/LinkedIn) whose schedule came due.
 *   3. Capture daily metric snapshots + generate day-3 / day-7 AI reviews.
 *   4. Run the in-app automation engine (lead acks, invoice reminders,
 *      milestone notices, review requests, daily digest, social sync).
 *
 * Auth: when CRON_SECRET (or JWT_SECRET as a fallback) is set, the request
 * must send `Authorization: Bearer <secret>`. Vercel Cron does this
 * automatically when the CRON_SECRET env var exists on the project.
 * Configured in vercel.json -> crons.
 */
async function runScheduled(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.JWT_SECRET || "";
  if (secret) {
    const auth = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (auth !== secret) return bad("Unauthorized", 401);
  }

  const nowIso = new Date().toISOString();

  // Job 1 — scheduled CMS pages.
  try {
    const store = (await getSetting(STORE_KEY)) as CmsStore | null;
    if (store && Array.isArray(store.pages)) {
      const now = Date.now();
      let published = 0;
      const pages = store.pages.map((page: CmsPage) => {
        if (
          page.status === "scheduled" &&
          page.scheduledFor &&
          new Date(page.scheduledFor).getTime() <= now
        ) {
          published += 1;
          return {
            ...page,
            status: "published" as const,
            publishedAt: nowIso,
            updatedAt: nowIso,
          };
        }
        return page;
      });
      if (published > 0) await setSetting(STORE_KEY, { ...store, pages });
    }
  } catch {
    /* never block later jobs */
  }

  // Jobs 2 + 3 — social publishing & analytics pipeline.
  let socialPublished = 0;
  let snapshotsCaptured = 0;
  let insightsGenerated = 0;
  try {
    socialPublished = await publishDueScheduledPosts();
  } catch {
    /* reported as zero; next run retries */
  }
  try {
    snapshotsCaptured = (await captureSnapshots()).captured;
  } catch {
    /* ditto */
  }
  try {
    insightsGenerated = (await generateDueInsights()).generated;
  } catch {
    /* ditto */
  }

  // Job 4 — the in-app automation engine (lead acks, invoice reminders,
  // milestone notices, review requests, daily digest, social sync).
  // Cooldown-aware: only automations not run in the last 12h execute.
  let automationEffects = 0;
  let automationsRan: string[] = [];
  try {
    const ran = await runAutomations({ force: false });
    automationsRan = ran.filter((r) => r.effects > 0).map((r) => `${r.name} (${r.effects})`);
    automationEffects = ran.reduce((sum, r) => sum + r.effects, 0);
  } catch {
    /* ditto */
  }

  // Job 5 — retention: keep analytics tables from growing forever.
  let pruned = { visitors: 0, activity: 0, rateLimits: 0 };
  try {
    pruned.visitors = await pruneOlderThan(visitorsTable, 30);
    pruned.activity = await pruneActivity(120);
    pruned.rateLimits = await pruneExpiredRateLimits();
  } catch {
    /* ditto */
  }

  return NextResponse.json({
    ok: true,
    published: 0,
    social: { published: socialPublished, snapshotsCaptured, insightsGenerated },
    automations: { effects: automationEffects, ran: automationsRan },
    pruned,
    checkedAt: nowIso,
  });
}

import { db } from "@/db";
import { activity as activityTable, rateLimits as rateLimitsTable, visitors as visitorsTable } from "@/db/schema";
import { lt, and, ne, sql } from "drizzle-orm";

async function pruneOlderThan(
  table: typeof visitorsTable,
  days: number
): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const gone = await db.delete(table).where(lt(table.lastSeen, cutoff)).returning({ id: table.id });
  return gone.length;
}

async function pruneActivity(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  const gone = await db
    .delete(activityTable)
    .where(and(lt(activityTable.createdAt, cutoff), ne(activityTable.action, "digest.daily")))
    .returning({ id: activityTable.id });
  return gone.length;
}

async function pruneExpiredRateLimits(): Promise<number> {
  const gone = await db
    .delete(rateLimitsTable)
    .where(sql`${rateLimitsTable.resetAt} < NOW()`)
    .returning({ key: rateLimitsTable.key });
  return gone.length;
}

export async function GET(request: Request) {
  return runScheduled(request);
}

export async function POST(request: Request) {
  return runScheduled(request);
}
