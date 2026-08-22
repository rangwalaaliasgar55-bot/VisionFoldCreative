import { bad, ok } from "@/lib/auth";
import { generate, getAiInstructions } from "@/lib/ai";
import { receiveWhatsAppMessage, sendWhatsAppText, whatsappConfig } from "@/lib/whatsapp";
import { db } from "@/db";
import { waMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Meta WhatsApp Cloud API webhook.
 * GET  — verification handshake (hub.verify_token)
 * POST — incoming messages (text only); auto-replies when enabled.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = whatsappConfig().verifyToken;
  if (mode === "subscribe" && expected && token === expected) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;
    // Meta sends a list of entry -> changes -> value
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    const processed: string[] = [];

    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change?.value || {};
        const messages = Array.isArray(value?.messages) ? value.messages : [];
        const metadata = value?.metadata || {};
        const ourNumber = String(metadata?.display_phone_number || "");
        for (const msg of messages) {
          if (msg?.type !== "text") continue;
          const from = String(msg.from || "").replace(/[^\d]/g, "");
          const text = String(msg?.text?.body || "").trim();
          if (!from || !text) continue;
          const stored = await receiveWhatsAppMessage(from, text);

          // Auto-reply bot (only when explicitly enabled and AI is configured)
          if (whatsappConfig().autoReply) {
            const instructions = await getAiInstructions();
            const reply = await generate(
              `Inbound WhatsApp from a customer:\n"${text.slice(0, 800)}"\nWrite one reply under 60 words. One question max. Do not invent prices. Do not change any website.`,
              instructions
            );
            if (reply && reply.trim()) {
              const clean = reply.trim().replace(/\n{3,}/g, "\n\n").slice(0, 900);
              const sent = await sendWhatsAppText(from, clean);
              await db
                .update(waMessages)
                .set({ autoReplied: sent.ok })
                .where(eq(waMessages.id, stored.id));
            }
          }
          processed.push(from);
        }
      }
    }

    return ok({ ok: true, processed });
  } catch (err) {
    console.error("[whatsapp webhook]", err);
    return bad("Internal error", 500);
  }
}
