import { db } from "@/db";
import { settings } from "@/db/schema";

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  siteTitle: "VisionFold Creative",
  siteTagline: "Premium video editing studio",
  seoTitle: "VisionFold Creative — Premium Video Editing Studio",
  seoDescription:
    "VisionFold Creative is a premium video editing studio crafting brand films, YouTube series, commercials and cinematic stories for brands worldwide.",
  heroTitle: "Creative systems built to",
  heroHighlight: "stop the scroll.",
  heroSubtitle:
    "Premium video editing for brands and creators — retention-first cuts, cinematic polish, and platform-ready masters that convert.",
  heroCta: "Book a Call",
  heroSecondary: "See our work",
  statsYears: 2,
  statsRating: 4.9,
  statsCountries: 12,
  statsTurnaround: 24,
  aboutText:
    "For 2 years we have cut for startups, agencies, creators and studios — always chasing the same thing: edits so tight the story feels inevitable.",
  email: "visionfoldcreative@gmail.com",
  phone: "+91 77250 04639",
  whatsapp: "+917725004639",
  address: "Indore, Madhya Pradesh, India",
  instagram: "https://instagram.com",
  youtube: "https://youtube.com",
  x: "https://x.com",
  maintenanceOn: false,
  maintenanceMessage: "We're polishing the next cut. The studio reopens soon — our best work is still on the timeline.",
  maintenanceEndsAt: "",
  blogPerPage: 6,
  newsletterOn: true,
  ratingsOn: true,
  automationsOn: true,
};

type Cache = { at: number; map: Record<string, unknown> };

// The cache must live on globalThis — in Next.js production each route is a
// separate bundled module with its own module scope. A module-local cache would
// mean the admin's write invalidates one copy while the public pages keep
// serving their own stale copy ("I changed it but nothing happened").
const globalForSettings = globalThis as typeof globalThis & {
  __vfSettingsCache?: Cache | null;
};

function readCache(): Cache | null {
  return globalForSettings.__vfSettingsCache ?? null;
}
function writeCache(c: Cache | null) {
  globalForSettings.__vfSettingsCache = c;
}

const TTL_MS = 5_000;

export async function getSettings(): Promise<Record<string, any>> {
  const now = Date.now();
  const cache = readCache();
  if (cache && now - cache.at < TTL_MS) return { ...DEFAULT_SETTINGS, ...cache.map };
  const rows = await db.select().from(settings);
  const map: Record<string, unknown> = {};
  for (const row of rows) map[row.key] = row.value;
  writeCache({ at: now, map });
  return { ...DEFAULT_SETTINGS, ...map };
}

export async function getSetting(key: string): Promise<any> {
  const all = await getSettings();
  return all[key] ?? DEFAULT_SETTINGS[key] ?? null;
}

export async function setSetting(key: string, value: unknown) {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  // Invalidate the shared cache, then warm it with the fresh value so every
  // route in this process (public + admin) reflects the change immediately.
  const current = readCache()?.map ?? {};
  current[key] = value;
  writeCache({ at: Date.now(), map: current });
}

export async function setSettings(pairs: Record<string, unknown>) {
  for (const [key, value] of Object.entries(pairs)) {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
  const current = readCache()?.map ?? {};
  Object.assign(current, pairs);
  writeCache({ at: Date.now(), map: current });
}

export async function isMaintenanceOn(): Promise<boolean> {
  const on = await getSetting("maintenanceOn");
  return Boolean(on);
}

export async function automationsEnabled(): Promise<boolean> {
  const on = await getSetting("automationsOn");
  return on !== false;
}
