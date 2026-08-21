import { createHmac } from "crypto";
import { db } from "@/db";
import { activity, webhooks } from "@/db/schema";
import { eq } from "drizzle-orm";

export type DomainEvent =
  | "lead.created"
  | "client.registered"
  | "project.completed"
  | "invoice.paid"
  | "post.published"
  | "social.published";

/**
 * Lightweight domain-event bus.
 *
 * Every emit: 1) writes an activity-feed row, 2) fans out to all active
 * webhooks subscribed to that event with an HMAC-SHA256 signature header,
 * 3) never throws — a broken webhook must not break a user flow.
 *
 * Delivery contract for receivers:
 *   POST <url>
 *   X-VF-Event: <event>
 *   X-VF-Signature: sha256=<hmac(secret, `${ts}.${body}`)>
 *   { event, ts, payload }
 */
export async function emitEvent(event: DomainEvent, payload: Record<string, unknown>) {
  try {
    await db.insert(activity).values({
      actor: "system",
      action: `event.${event}`,
      details: summarize(event, payload),
    });
  } catch {
    /* activity feed is best-effort */
  }

  try {
    const hooks = await db.select().from(webhooks).where(eq(webhooks.active, true));
    const targets = hooks.filter((h) => h.events.split(",").map((e) => e.trim()).includes(event));
    await Promise.allSettled(targets.map((hook) => deliver(hook, event, payload)));
  } catch {
    /* fan-out is best-effort */
  }
}

function summarize(event: DomainEvent, payload: Record<string, unknown>): string {
  const who = String(payload.name || payload.title || payload.number || payload.id || "");
  return `${event} — ${who}`.slice(0, 300);
}

async function deliver(
  hook: typeof webhooks.$inferSelect,
  event: DomainEvent,
  payload: Record<string, unknown>
) {
  const body = JSON.stringify({ event, ts: Date.now(), payload });
  const ts = JSON.parse(body).ts as number;
  const signature = hook.secret
    ? `sha256=${createHmac("sha256", hook.secret).update(`${ts}.${body}`).digest("hex")}`
    : "";

  const res = await fetch(hook.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-VF-Event": event,
      ...(signature ? { "X-VF-Signature": signature } : {}),
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  await db
    .update(webhooks)
    .set({ lastTriggeredAt: new Date() })
    .where(eq(webhooks.id, hook.id));

  if (!res.ok) {
    await db.insert(activity).values({
      actor: "system",
      action: "webhook.failed",
      details: `${hook.name} responded ${res.status} for ${event}`,
    });
  }
}
