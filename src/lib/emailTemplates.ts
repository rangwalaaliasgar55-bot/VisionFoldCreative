/**
 * Email templates — pure functions, so the copy can be tested like code.
 *
 * Every template returns both HTML and a plain-text version: text is what
 * spam filters read and what plain-text clients show, and skipping it is the
 * fastest way into a junk folder.
 *
 * All interpolated values are HTML-escaped. A lead's name arrives from a public
 * form; it is untrusted input heading into an HTML document.
 */

export type Template = { subject: string; html: string; text: string };

const INK = "#0B1020";
const VIOLET = "#7357FF";
const WARM = "#F6F3EC";
const MUTED = "#98A1B3";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Shared shell. Table-based and inline-styled, because email clients are 2003. */
function layout(opts: { preheader: string; heading: string; body: string; cta?: { label: string; href: string } }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${INK};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#12182B;border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:26px 28px 0;">
                <p style="margin:0;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:${MUTED};">VisionFold Creative</p>
                <h1 style="margin:12px 0 0;font-size:22px;line-height:1.25;color:${WARM};">${escapeHtml(opts.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 4px;font-size:14px;line-height:1.65;color:#C9CEDA;">
                ${opts.body}
              </td>
            </tr>
            ${
              opts.cta
                ? `<tr><td style="padding:14px 28px 28px;">
                    <a href="${escapeHtml(opts.cta.href)}" style="display:inline-block;background:${VIOLET};color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:12px 22px;border-radius:999px;">${escapeHtml(opts.cta.label)}</a>
                  </td></tr>`
                : `<tr><td style="padding:0 28px 28px;"></td></tr>`
            }
            <tr>
              <td style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#6B7280;">
                VisionFold Creative · Indore, India · We fold stories into motion
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const p = (text: string) => `<p style="margin:0 0 12px;">${text}</p>`;

/* ------------------------------------------------------------------ */
/* 1. New lead → the studio                                            */
/* ------------------------------------------------------------------ */
export function newLeadEmail(lead: {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  budget?: string;
  message: string;
}, siteUrl = "https://visionfoldcreative.vercel.app"): Template {
  const subject = `New brief — ${lead.name}${lead.service ? ` · ${lead.service}` : ""}`;

  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone || "—"],
    ["Service", lead.service || "—"],
    ["Budget", lead.budget || "—"],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:${MUTED};font-size:12px;">${escapeHtml(label)}</td><td style="padding:4px 0;color:${WARM};font-size:13px;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  const html = layout({
    preheader: `${lead.name}: ${lead.message.slice(0, 90)}`,
    heading: "A new brief just landed",
    body: `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${rows}</table>
      <div style="background:rgba(255,255,255,0.03);border-left:2px solid ${VIOLET};padding:12px 14px;border-radius:8px;">
        ${p(escapeHtml(lead.message).replace(/\n/g, "<br>"))}
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:${MUTED};">Reply directly to this email to reach them — the reply-to is set to their address.</p>
    `,
    cta: { label: "Open in the studio", href: `${siteUrl}/admin/leads` },
  });

  const text = [
    "A new brief just landed.",
    "",
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Phone:   ${lead.phone || "—"}`,
    `Service: ${lead.service || "—"}`,
    `Budget:  ${lead.budget || "—"}`,
    "",
    lead.message,
    "",
    `Open in the studio: ${siteUrl}/admin/leads`,
  ].join("\n");

  return { subject, html, text };
}

/* ------------------------------------------------------------------ */
/* 2. Auto-reply → the lead                                            */
/* ------------------------------------------------------------------ */
export function leadAutoReplyEmail(
  lead: { name: string; service?: string },
  siteUrl = "https://visionfoldcreative.vercel.app"
): Template {
  const firstName = lead.name.trim().split(/\s+/)[0] || "there";
  const subject = "Got your brief — here's what happens next";

  const html = layout({
    preheader: "We've read it. A real reply is coming within 24 hours.",
    heading: `Thanks, ${escapeHtml(firstName)} — we've got it`,
    body: [
      p("Your brief is in front of the team, not in a queue somewhere. Here's what happens next:"),
      `<ol style="margin:0 0 12px;padding-left:18px;color:#C9CEDA;">
        <li style="margin-bottom:6px;">We read it properly and check we're the right studio for it.</li>
        <li style="margin-bottom:6px;">You get a real reply within 24 hours — a plan, a timeline and a quote.</li>
        <li>If it's a fit, we start with a story pass before anyone touches a timeline.</li>
      </ol>`,
      p("No calls required at any point. If you'd rather talk, just say so in a reply."),
      p(`In the meantime, the reel is worth two minutes: <a href="${siteUrl}/work" style="color:#A78BFA;">recent work</a>.`),
    ].join(""),
    cta: { label: "See the work", href: `${siteUrl}/work` },
  });

  const text = [
    `Thanks, ${firstName} — we've got your brief.`,
    "",
    "What happens next:",
    "1. We read it properly and check we're the right studio for it.",
    "2. You get a real reply within 24 hours — a plan, a timeline and a quote.",
    "3. If it's a fit, we start with a story pass before anyone touches a timeline.",
    "",
    "No calls required at any point. If you'd rather talk, just say so in a reply.",
    "",
    `Recent work: ${siteUrl}/work`,
  ].join("\n");

  return { subject, html, text };
}

/* ------------------------------------------------------------------ */
/* 3. Overdue invoice → the client                                     */
/* ------------------------------------------------------------------ */
export function invoiceOverdueEmail(
  invoice: { number: string; amount: string | number; daysOverdue: number; clientName?: string },
  siteUrl = "https://visionfoldcreative.vercel.app"
): Template {
  const label = invoice.number || "your invoice";
  const subject = `Invoice ${label} is ${invoice.daysOverdue} day${invoice.daysOverdue === 1 ? "" : "s"} past due`;
  const amount = typeof invoice.amount === "number" ? invoice.amount.toLocaleString("en-IN") : invoice.amount;

  const html = layout({
    preheader: `₹${amount} outstanding on ${label}.`,
    heading: "A quick nudge on an invoice",
    body: [
      p(`Hi${invoice.clientName ? ` ${escapeHtml(invoice.clientName)}` : ""}, invoice <strong style="color:${WARM};">${escapeHtml(label)}</strong> for <strong style="color:${WARM};">₹${escapeHtml(amount)}</strong> is now ${invoice.daysOverdue} day${invoice.daysOverdue === 1 ? "" : "s"} past its due date.`),
      p("You can settle it from the Invoices tab in your portal. If it's already been paid or sent for approval, ignore this and let us know so we can update our side."),
    ].join(""),
    cta: { label: "Open the portal", href: `${siteUrl}/portal` },
  });

  const text = [
    `Invoice ${label} for ₹${amount} is ${invoice.daysOverdue} day(s) past due.`,
    "",
    "You can settle it from the Invoices tab in your portal.",
    "If it's already been paid, ignore this and let us know so we can update our side.",
    "",
    `${siteUrl}/portal`,
  ].join("\n");

  return { subject, html, text };
}

/* ------------------------------------------------------------------ */
/* 4. Weekly digest → the studio                                       */
/* ------------------------------------------------------------------ */
export function digestEmail(
  items: { title: string; detail: string; severity: string }[],
  siteUrl = "https://visionfoldcreative.vercel.app"
): Template {
  const urgent = items.filter((i) => i.severity === "high").length;
  const subject = items.length
    ? `${items.length} thing${items.length === 1 ? "" : "s"} need you${urgent ? ` (${urgent} urgent)` : ""}`
    : "Nothing needs you this week";

  const list = items.length
    ? `<ul style="margin:0 0 12px;padding-left:18px;color:#C9CEDA;">${items
        .slice(0, 20)
        .map(
          (item) =>
            `<li style="margin-bottom:8px;"><strong style="color:${WARM};">${escapeHtml(item.title)}</strong><br><span style="color:${MUTED};font-size:12px;">${escapeHtml(item.detail)}</span></li>`
        )
        .join("")}</ul>`
    : p("No unanswered leads, no overdue invoices, nothing sitting unapproved. Quiet week.");

  const html = layout({
    preheader: subject,
    heading: "Your studio digest",
    body: list,
    cta: { label: "Open the queue", href: `${siteUrl}/admin/attention` },
  });

  const text = [
    subject,
    "",
    ...(items.length ? items.slice(0, 20).map((i) => `· ${i.title} — ${i.detail}`) : ["Nothing outstanding."]),
    "",
    `${siteUrl}/admin/attention`,
  ].join("\n");

  return { subject, html, text };
}
