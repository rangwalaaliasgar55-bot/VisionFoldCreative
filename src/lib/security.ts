/**
 * Cross-site request protection.
 *
 * Session cookies are SameSite=lax, which already blocks most cross-site
 * POSTs — this adds a second, explicit gate: any state-changing request that
 * carries an Origin header must match the deployment host. Browsers always
 * send Origin on cross-origin mutations; non-browser clients (curl, Vercel
 * Cron, provider webhooks) omit it and are authenticated by other means
 * (Bearer secrets / HMAC signatures).
 */
export function originCheck(req: Request): Response | null {
  if (req.method === "GET" || req.method === "HEAD") return null;
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "";
  try {
    if (new URL(origin).host === host) return null;
  } catch {
    /* malformed Origin */
  }
  return Response.json({ error: "Cross-origin request blocked." }, { status: 403 });
}
