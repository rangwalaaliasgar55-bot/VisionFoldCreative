import { bad } from "@/lib/auth";
import type { CmsPage, CmsStore } from "@/lib/cmsTypes";
import { getSetting, setSetting } from "@/lib/settings";
import { captureSnapshots, generateDueInsights, publishDueScheduledPosts } from "@/lib/social";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STORE_KEY = "cmsStore";

/**
 * Vercel Cron (daily 06:00 UTC), three jobs in one authenticated endpoint:
 *   1. Publish CMS pages whose scheduledFor time has passed.
 *   2. Publish social posts (YouTube/LinkedIn) whose schedule came due.
 *   3. Capture daily metric snapshots + generate day-3 / day-7 AI reviews.
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

  return NextResponse.json({
    ok: true,
    published: 0,
    social: { published: socialPublished, snapshotsCaptured, insightsGenerated },
    checkedAt: nowIso,
  });
}

export async function GET(request: Request) {
  return runScheduled(request);
}

export async function POST(request: Request) {
  return runScheduled(request);
}
