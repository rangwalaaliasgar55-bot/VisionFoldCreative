/**
 * Transactional email.
 *
 * Until now a lead landed in the database and nobody was told. This is the
 * notification layer.
 *
 * Design rules:
 *  · Provider-agnostic surface, Resend as the implementation (plain fetch, no
 *    SDK — one less dependency to keep current).
 *  · **Never throws.** A failed email must not lose a lead or fail a request.
 *    Callers get a result object and carry on.
 *  · No-ops with a single clear log when unconfigured, so local dev and
 *    preview deploys work without a key.
 *  · The API key is never returned, logged or embedded in an error message.
 *  · Transport is injectable, so the whole thing is testable without network.
 */

export type EmailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Resend tags, handy for filtering in their dashboard. */
  tag?: string;
};

export type EmailResult =
  | { ok: true; id: string | null; skipped?: false }
  | { ok: false; skipped: true; reason: "not-configured" }
  | { ok: false; skipped?: false; error: string; attempts: number };

export type EmailDeps = {
  fetch?: typeof fetch;
  apiKey?: string;
  from?: string;
  /** Retry backoff in ms; zero in tests. */
  backoffMs?: number;
  maxAttempts?: number;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

let warnedMissingKey = false;

export function emailFrom(): string {
  return process.env.EMAIL_FROM || "VisionFold Creative <onboarding@resend.dev>";
}

export function studioInbox(): string {
  return process.env.STUDIO_EMAIL || process.env.ADMIN_EMAIL || "visionfoldcreative@gmail.com";
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Safe to expose to the admin UI — booleans and addresses only, never the key. */
export function emailStatus() {
  return {
    configured: emailConfigured(),
    from: emailFrom(),
    studioInbox: studioInbox(),
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendEmail(payload: EmailPayload, deps: EmailDeps = {}): Promise<EmailResult> {
  const apiKey = deps.apiKey ?? process.env.RESEND_API_KEY ?? "";
  const doFetch = deps.fetch ?? globalThis.fetch;
  const from = deps.from ?? emailFrom();
  const maxAttempts = deps.maxAttempts ?? 3;
  const backoffMs = deps.backoffMs ?? 400;

  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.info("[email] RESEND_API_KEY is not set — transactional email is disabled.");
    }
    return { ok: false, skipped: true, reason: "not-configured" };
  }

  const body = JSON.stringify({
    from,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
    ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    ...(payload.tag ? { tags: [{ name: "category", value: payload.tag }] } : {}),
  });

  let lastError = "unknown error";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await doFetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        return { ok: true, id: data.id ?? null };
      }

      // 4xx other than rate limiting is our fault — retrying won't help.
      if (res.status !== 429 && res.status < 500) {
        const detail = await res.text().catch(() => "");
        return {
          ok: false,
          error: `Rejected with ${res.status}: ${redact(detail).slice(0, 300)}`,
          attempts: attempt,
        };
      }

      lastError = `HTTP ${res.status}`;
    } catch (error) {
      lastError = redact((error as Error).message || String(error));
    }

    if (attempt < maxAttempts && backoffMs > 0) await sleep(backoffMs * attempt);
  }

  return { ok: false, error: lastError, attempts: maxAttempts };
}

/** Belt and braces: never let a key fragment reach a log line. */
function redact(text: string): string {
  return text.replace(/re_[A-Za-z0-9_-]{8,}/g, "re_***");
}

/** Fire several emails without letting one failure affect the others. */
export async function sendAll(
  payloads: EmailPayload[],
  deps: EmailDeps = {}
): Promise<EmailResult[]> {
  const results = await Promise.allSettled(payloads.map((p) => sendEmail(p, deps)));
  return results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : { ok: false as const, error: redact(String(r.reason)), attempts: 0 }
  );
}
