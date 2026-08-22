import { getSetting } from "@/lib/settings";

/**
 * Runtime-stored integration credentials (Admin → Social / WhatsApp / AI).
 * Hydrated once per process from the settings table so sync config helpers
 * (youtubeConfig, whatsappConfig, …) can read them without going async.
 */
type KeyCache = Record<string, string>;

const KEYS = [
  "youtube_client_id",
  "youtube_client_secret",
  "linkedin_client_id",
  "linkedin_client_secret",
  "linkedin_organization_urn",
  "instagram_client_id",
  "instagram_client_secret",
  "tiktok_client_key",
  "tiktok_client_secret",
  "whatsapp_token",
  "whatsapp_phone_number_id",
  "whatsapp_business_number",
  "whatsapp_verify_token",
  "whatsapp_auto_reply",
  "ai_preferred_provider",
  "ai_instructions",
] as const;

const globalForKeys = globalThis as typeof globalThis & { __vfRuntimeKeys?: KeyCache };

function cache(): KeyCache {
  if (!globalForKeys.__vfRuntimeKeys) globalForKeys.__vfRuntimeKeys = {};
  return globalForKeys.__vfRuntimeKeys;
}

export function runtimeKey(key: string): string {
  return cache()[key] || "";
}

export function setRuntimeKey(key: string, value: string) {
  cache()[key] = String(value || "");
}

export async function hydrateRuntimeKeys(): Promise<void> {
  for (const key of KEYS) {
    try {
      const value = await getSetting(key);
      if (typeof value === "string" && value.trim()) cache()[key] = value.trim();
      else if (value === true || value === false) cache()[key] = value ? "true" : "false";
    } catch {
      /* settings table not ready yet */
    }
  }
}
