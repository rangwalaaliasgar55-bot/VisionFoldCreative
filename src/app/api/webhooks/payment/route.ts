import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/db";
import { activity, clients, invoices, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok } from "@/lib/auth";
import { emitEvent } from "@/lib/events";
import { emailConfigured, emailShell, sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Provider-agnostic payment completion webhook.
 *
 *   POST /api/webhooks/payment
 *   X-VF-Pay-Signature: sha256=<hex hmac-sha256(secret, rawBody)>
 *   { "invoiceId"?: 12, "invoiceNumber"?: "INV-1042", "status": "paid", "providerRef"?: "..." }
 *
 * Secret: PAYMENT_WEBHOOK_SECRET (falls back to JWT_SECRET so the flow is
 * testable before a provider is chosen). Configure this URL in your payment
 * provider's dashboard. This is the ONLY automatic path that marks an invoice
 * paid — browsers can never do it.
 */
export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.JWT_SECRET || "";
  if (!secret) return Response.json({ error: "Webhook secret not configured." }, { status: 503 });

  const raw = await req.text();
  const provided = (req.headers.get("x-vf-pay-signature") || "").replace(/^sha256=/i, "");
  if (!provided) return Response.json({ error: "Missing signature." }, { status: 401 });
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let body: { invoiceId?: number; invoiceNumber?: string; status?: string; providerRef?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.status !== "paid") {
    // Only the paid transition is handled; other statuses are acknowledged.
    return ok({ ok: true, ignored: body.status ?? "unknown" });
  }

  const byId = Number(body.invoiceId || 0);
  const byNumber = String(body.invoiceNumber || "").trim();
  if (!byId && !byNumber) {
    return Response.json({ error: "Provide invoiceId or invoiceNumber." }, { status: 400 });
  }

  const rows = await db
    .select({ invoice: invoices, clientName: clients.name, clientEmail: clients.email })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(byId ? eq(invoices.id, byId) : eq(invoices.number, byNumber))
    .limit(1);
  const row = rows[0];
  if (!row) return Response.json({ error: "Invoice not found." }, { status: 404 });

  if (row.invoice.status === "paid") {
    return ok({ ok: true, duplicate: true, invoiceId: row.invoice.id });
  }

  const receiptNote = `Payment received for ${row.invoice.number || `#${row.invoice.id}`} — thank you!${body.providerRef ? ` (ref ${body.providerRef})` : ""}`;

  // Single transaction: the state flip and its side effects land together.
  await db.transaction(async (tx) => {
    await tx.update(invoices).set({ status: "paid" }).where(eq(invoices.id, row.invoice.id));
    await tx.insert(messages).values({
      clientId: row.invoice.clientId,
      sender: "admin",
      body: receiptNote,
      read: false,
    });
    await tx.insert(activity).values({
      actor: "payment-webhook",
      action: "invoice.paid",
      details: `${row.invoice.number || `#${row.invoice.id}`} marked paid via webhook`,
    });
  });

  await emitEvent("invoice.paid", {
    id: row.invoice.id,
    number: row.invoice.number,
    amount: row.invoice.amount,
    clientId: row.invoice.clientId,
    via: "webhook",
  });

  if (emailConfigured() && row.clientEmail) {
    await sendEmail({
      to: row.clientEmail,
      subject: `Payment received — ${row.invoice.number || `#${row.invoice.id}`}`,
      html: emailShell(
        "We received your payment 🎬",
        `<p>Thank you! <b>${row.invoice.number || `#${row.invoice.id}`}</b> (${row.invoice.amount}) is settled and your project keeps moving.</p>`
      ),
    });
  }

  return ok({ ok: true, invoiceId: row.invoice.id, paid: true });
}
