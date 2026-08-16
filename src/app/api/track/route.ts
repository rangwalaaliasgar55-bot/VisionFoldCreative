import { db } from "@/db";
import { visitors } from "@/db/schema";
import { ok } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Anonymous heartbeat for live-visitor analytics.
 * Called by public pages every ~25s with a stable session id kept in localStorage.
 * No personal data is collected — just a random id, the path, and timestamps.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "").trim().slice(0, 80);
    const path = String(body.path || "/").trim().slice(0, 300);
    if (!id) return ok({ ok: false });
    await db
      .insert(visitors)
      .values({ id, path, lastSeen: new Date(), pageViews: 1 })
      .onConflictDoUpdate({
        target: visitors.id,
        set: { path, lastSeen: new Date() },
      });
    return ok({ ok: true });
  } catch {
    return ok({ ok: false });
  }
}
