import { ok } from "@/lib/auth";
import { recordVisit } from "@/lib/tracking";
import { throttled } from "@/lib/ratelimit";
import { requestIp } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Anonymous heartbeat + pageview tracker.
 * Public pages ping this with a stable session id. Bots, admin, and portal
 * paths are ignored. Page views increment only on real navigations.
 */
export async function POST(req: Request) {
  try {
    if (await throttled(`track:${requestIp(req)}`, 120, 60_000)) {
      return ok({ ok: false, reason: "rate" });
    }
    const body = await req.json().catch(() => ({}));
    const result = await recordVisit({
      id: String(body.id || ""),
      path: String(body.path || "/"),
      referrer: String(body.referrer || ""),
      title: String(body.title || ""),
      lang: String(body.lang || ""),
      utmSource: String(body.utmSource || ""),
      utmMedium: String(body.utmMedium || ""),
      utmCampaign: String(body.utmCampaign || ""),
      kind: body.kind === "heartbeat" || body.kind === "exit" ? body.kind : "view",
      durationMs: Number(body.durationMs || 0),
      userAgent: req.headers.get("user-agent") || "",
    });
    return ok(result);
  } catch {
    return ok({ ok: false, reason: "error" });
  }
}
