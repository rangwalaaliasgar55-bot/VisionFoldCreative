import { bad } from "@/lib/auth";
import type { CmsPage, CmsStore } from "@/lib/cmsTypes";
import { getSetting, setSetting } from "@/lib/settings";
import { automationsEnabled } from "@/lib/settings";
import { runAutomations } from "@/lib/automations/run";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STORE_KEY = "cmsStore";

/**
 * Vercel Cron: publish scheduled CMS pages, then run the studio automations
 * (overdue invoices, approval nudges, stale-project alerts).
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

  try {
    const store = (await getSetting(STORE_KEY)) as CmsStore | null;

    const now = Date.now();
    const nowIso = new Date().toISOString();
    let published = 0;

    const pages = (store?.pages ?? []).map((page: CmsPage) => {
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

    if (published > 0 && store) {
      await setSetting(STORE_KEY, { ...store, pages });
    }

    // Chase work nobody should have to remember: overdue invoices, cuts sitting
    // unapproved, projects that have gone quiet. Never blocks publishing.
    let automations: unknown = { skipped: true };
    try {
      if (await automationsEnabled()) {
        const summary = await runAutomations();
        automations = {
          flagged: summary.items.length,
          applied: summary.applied,
          errors: summary.errors,
        };
      }
    } catch (error) {
      automations = { error: (error as Error).message };
    }

    return NextResponse.json({ ok: true, published, automations, checkedAt: nowIso });
  } catch (error: any) {
    return bad(error?.message || "Failed to run scheduled publishing", 500);
  }
}

export async function GET(request: Request) {
  return runScheduled(request);
}

export async function POST(request: Request) {
  return runScheduled(request);
}
