import { bad } from "@/lib/auth";
import type { CmsPage, CmsStore } from "@/lib/cmsTypes";
import { getSetting, setSetting } from "@/lib/settings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STORE_KEY = "cmsStore";

/**
 * Vercel Cron: publish any CMS pages whose scheduledFor time has passed.
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
    if (!store || !Array.isArray(store.pages)) {
      return NextResponse.json({ ok: true, published: 0 });
    }

    const now = Date.now();
    const nowIso = new Date().toISOString();
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

    if (published > 0) {
      await setSetting(STORE_KEY, { ...store, pages });
    }

    return NextResponse.json({ ok: true, published, checkedAt: nowIso });
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
