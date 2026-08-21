import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { eq, lt } from "drizzle-orm";

/**
 * Durable sliding-window rate limiter.
 *
 * The previous in-process Map reset on every serverless invocation, which
 * made throttling effectively a no-op in production. Counters now live in
 * Postgres and survive cold starts. If the DB hiccups we degrade to the old
 * per-instance memory behaviour instead of locking everyone out.
 */

const memory = new Map<string, { count: number; resetAt: number }>();
const globalForLimiter = globalThis as typeof globalThis & {
  __vfRateLimitSweep?: number;
};

/** Housekeeping: drop expired windows at most once every 5 minutes. */
async function sweep() {
  const now = Date.now();
  if (globalForLimiter.__vfRateLimitSweep && now - globalForLimiter.__vfRateLimitSweep < 300_000) return;
  globalForLimiter.__vfRateLimitSweep = now;
  try {
    await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date()));
    for (const [key, entry] of memory) {
      if (entry.resetAt < now) memory.delete(key);
    }
  } catch {
    /* housekeeping is best-effort */
  }
}

export async function throttled(
  key: string,
  max = 12,
  windowMs = 15 * 60_000
): Promise<boolean> {
  void sweep();
  try {
    const now = new Date();
    const existing = await db
      .select()
      .from(rateLimits)
      .where(eq(rateLimits.key, key))
      .limit(1);
    const row = existing[0];

    if (!row || row.resetAt < now) {
      // New window.
      await db
        .insert(rateLimits)
        .values({ key, count: 1, resetAt: new Date(now.getTime() + windowMs) })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        });
      return false;
    }

    const nextCount = row.count + 1;
    await db.update(rateLimits).set({ count: nextCount }).where(eq(rateLimits.key, key));
    return nextCount > max;
  } catch {
    // Fallback: per-instance memory (previous behaviour).
    const now = Date.now();
    const entry = memory.get(key);
    if (!entry || entry.resetAt < now) {
      memory.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > max;
  }
}
