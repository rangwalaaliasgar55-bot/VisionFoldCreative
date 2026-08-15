import { db } from "@/db";
import { waMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const GRAPH_VERSION = "v22.0";

export function whatsappConfig() {
  return {
    token: process.env.WHATSAPP_TOKEN || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
    autoReply: process.env.WHATSAPP_AUTO_REPLY === "true",
  };
}

export function whatsappConnected(): boolean {
  const c = whatsappConfig();
  return Boolean(c.token && c.phoneNumberId);
}

function apiUrl(phoneNumberId: string, path: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/${path}`;
}

/**
 * Send a WhatsApp text message via the Meta Cloud API.
 * Returns { ok: true, id } on success or { ok: false, error, fallback } on failure.
 * fallback is a wa.me deep link so the studio can still reach the lead manually.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: boolean; id?: string; error?: string; fallback?: string }> {
  const cfg = whatsappConfig();
  const digits = String(to || "").replace(/[^\d]/g, "");
  const fallback = `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
  if (!whatsappConnected()) {
    return { ok: false, error: "WhatsApp Cloud API is not configured (set WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID).", fallback };
  }
  try {
    const res = await fetch(apiUrl(cfg.phoneNumberId, "messages"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits,
        type: "text",
        text: { body: String(body).slice(0, 4096) },
      }),
    });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || data?.error) {
      return { ok: false, error: data?.error?.message || `HTTP ${res.status}`, fallback };
    }
    const id = data?.messages?.[0]?.id || "";
    await db.insert(waMessages).values({
      from: cfg.businessNumber || "studio",
      to: digits,
      direction: "outbound",
      body,
      status: "sent",
    });
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error", fallback };
  }
}

/** Store an inbound WhatsApp message and optionally auto-reply via AI. */
export async function receiveWhatsAppMessage(from: string, body: string) {
  const cfg = whatsappConfig();
  const [row] = await db
    .insert(waMessages)
    .values({ from: String(from).replace(/[^\d]/g, ""), to: cfg.businessNumber || "studio", direction: "inbound", body, status: "received" })
    .returning();
  return row;
}

export async function listWaMessages(limit = 100) {
  return db.select().from(waMessages).orderBy(desc(waMessages.createdAt)).limit(limit);
}

/** Get the most recent inbound message from a number (for bot context). */
export async function recentFrom(from: string, limit = 5) {
  const digits = String(from).replace(/[^\d]/g, "");
  return db
    .select()
    .from(waMessages)
    .where(eq(waMessages.from, digits))
    .orderBy(desc(waMessages.createdAt))
    .limit(limit);
}
