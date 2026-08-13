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
  statsYears: 8,
  statsProjects: 420,
  statsClients: 160,
  statsAwards: 14,
  aboutText:
    "For 8 years we have cut for startups, agencies, creators and studios — always chasing the same thing: edits so tight the story feels inevitable.",
  email: "hello@visionfoldcreative.com",
  phone: "+1 (555) 010-2048",
  address: "Burbank, California",
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
let cache: Cache | null = null;
const TTL_MS = 20_000;

export async function getSettings(): Promise<Record<string, any>> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return { ...DEFAULT_SETTINGS, ...cache.map };
  const rows = await db.select().from(settings);
  const map: Record<string, unknown> = {};
  for (const row of rows) map[row.key] = row.value;
  cache = { at: now, map };
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
  cache = null;
}

export async function setSettings(pairs: Record<string, unknown>) {
  for (const [key, value] of Object.entries(pairs)) {
    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }
  cache = null;
}

export async function isMaintenanceOn(): Promise<boolean> {
  const on = await getSetting("maintenanceOn");
  return Boolean(on);
}

export async function automationsEnabled(): Promise<boolean> {
  const on = await getSetting("automationsOn");
  return on !== false;
}
