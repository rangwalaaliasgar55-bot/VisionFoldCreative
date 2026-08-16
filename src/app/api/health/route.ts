import { db, isMemoryDb } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { getAiStatus } from "@/lib/ai";
import { whatsappConnected } from "@/lib/whatsapp";
import { prospectingConfigured } from "@/lib/prospect";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = true;
  try {
    await db.execute(sql`select 1`);
    await ensureSeed();
  } catch {
    dbOk = false;
  }
  const ai = await getAiStatus();
  return Response.json({
    ok: dbOk,
    service: "visionfold-creative",
    db: dbOk ? "connected" : "down",
    storage: isMemoryDb ? "memory" : "postgres",
    ai: { configured: ai.configured, provider: ai.provider, model: ai.model, phase: ai.phase },
    whatsapp: { connected: whatsappConnected() },
    places: { configured: prospectingConfigured() },
    time: new Date().toISOString(),
  });
}
