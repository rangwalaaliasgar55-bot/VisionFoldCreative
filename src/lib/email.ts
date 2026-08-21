/**
 * Outbound email via Resend — fully optional.
 *
 * Set RESEND_API_KEY (+ RESEND_FROM_EMAIL) to enable. Every send is
 * fail-safe: without a key, or if Resend errors, callers proceed normally
 * and the attempt is only visible in the activity feed.
 */

const RESEND_URL = "https://api.resend.com/emails";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!emailConfigured()) return false;
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [opts.to],
        subject: opts.subject.slice(0, 200),
        html: opts.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Consistent, on-brand wrapper for all transactional email. */
export function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#0B1020;font-family:Inter,Arial,sans-serif;color:#F6F3EC;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <p style="font-size:12px;letter-spacing:.2em;color:#F4A62A;font-weight:bold;margin:0 0 8px;">VISIONFOLD CREATIVE</p>
    <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
    <div style="font-size:14px;line-height:1.7;color:#C9CFDB;">${bodyHtml}</div>
    <p style="margin-top:28px;font-size:11px;color:#5A6478;">VisionFold Creative · Indore, India · We fold stories into motion.</p>
  </div></body></html>`;
}
