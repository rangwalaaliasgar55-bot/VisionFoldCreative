import { db } from "@/db";
import { leads, newsletter } from "@/db/schema";
import { bad, loginThrottled, ok, readBody, requestIp } from "@/lib/auth";
import { emitEvent } from "@/lib/events";
import { emailConfigured, emailShell, sendEmail } from "@/lib/email";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ action: string }> }
) {
  const { action } = await ctx.params;

  if (action === "contact") {
    // Basic spam protection: 12 submissions / 15 min / IP.
    if (loginThrottled(`contact:${requestIp(req)}`)) {
      return bad("Too many submissions. Please try again later.", 429);
    }
    const body = await readBody<Record<string, any>>(req);
    const name = String(body.name || "").trim().slice(0, 120);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    const message = String(body.message || "").trim().slice(0, 5000);
    if (!name || !EMAIL_RE.test(email) || !message) {
      return bad("Please fill in your name, a valid email and a short brief.");
    }
    if (message.length < 10) return bad("Tell us a little more about the project (at least 10 characters).");

    const row = await db
      .insert(leads)
      .values({
        name,
        email,
        phone: String(body.phone || "").trim().slice(0, 40),
        service: String(body.service || "Video Editing").slice(0, 80),
        budget: String(body.budget || "").slice(0, 80),
        message,
        status: "new",
        source: "website",
      })
      .returning();

    // Fan out: activity feed + subscribed webhooks.
    await emitEvent("lead.created", {
      id: row[0].id,
      name,
      email,
      service: row[0].service,
      budget: row[0].budget,
    });

    // Instant studio alert (only when Resend is configured).
    if (emailConfigured()) {
      const studioEmail = String((await getSetting("email")) || process.env.NOTIFICATION_EMAIL || "");
      if (studioEmail) {
        await sendEmail({
          to: studioEmail,
          subject: `New inquiry: ${name} — ${row[0].service}`,
          html: emailShell(
            "New lead from the website",
            `<p><b>${name}</b> (${email}${row[0].phone ? `, ${row[0].phone}` : ""})</p>
             <p>Service: <b>${row[0].service}</b>${row[0].budget ? ` · Budget: ${row[0].budget}` : ""}</p>
             <p style="white-space:pre-line;">${message.replace(/</g, "&lt;")}</p>
             <p><a href="${process.env.APP_URL || ""}/admin/leads" style="color:#7357FF;">Open in Leads →</a></p>`
          ),
        });
      }
    }

    return ok({ ok: true, leadId: row[0].id });
  }

  if (action === "newsletter") {
    if (loginThrottled(`newsletter:${requestIp(req)}`)) {
      return bad("Too many attempts. Please try again later.", 429);
    }
    const body = await readBody<{ email?: string }>(req);
    const email = String(body.email || "").trim().toLowerCase().slice(0, 254);
    if (!EMAIL_RE.test(email)) return bad("Please enter a valid email.");
    await db
      .insert(newsletter)
      .values({ email })
      .onConflictDoNothing({ target: newsletter.email });
    return ok({ ok: true });
  }

  return bad("Unknown action", 404);
}
