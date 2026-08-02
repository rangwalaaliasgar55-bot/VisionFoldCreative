import { Request, Response, NextFunction } from 'express';

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * NOTE on serverless (Vercel): each function instance has its own memory,
 * and cold starts reset it. This still stops basic scripted abuse within a
 * warm instance / single-server deployment, but for strong guarantees under
 * serverless scale-out, back this with a shared store (e.g. Vercel KV/Upstash
 * Redis) instead. Kept dependency-free intentionally.
 */
export function createRateLimiter(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests, please try again later.' } = options;
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically clear stale entries so memory doesn't grow unbounded.
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs) as unknown as { unref?: () => void };
  cleanupTimer.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({ error: message });
    }

    entry.count += 1;
    next();
  };
}
