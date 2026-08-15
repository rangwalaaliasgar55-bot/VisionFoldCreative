import { bad, ok, readBody, requireStaff } from "@/lib/auth";
import { BLOCK_CATALOG, DEFAULT_CMS_STORE, type CmsBlock, type CmsPage, type CmsRevision, type CmsStore } from "@/lib/cmsTypes";
import { getSetting, setSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

const STORE_KEY = "cmsStore";
const MAX_PAGES = 100;
const MAX_BLOCKS = 80;

function id(prefix: string) {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function cleanSlug(input: unknown) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

async function readStore(): Promise<CmsStore> {
  const raw = await getSetting(STORE_KEY);
  if (!raw || typeof raw !== "object") return clone(DEFAULT_CMS_STORE);
  return {
    pages: Array.isArray(raw.pages) ? raw.pages : [],
    revisions: Array.isArray(raw.revisions) ? raw.revisions : [],
    savedBlocks: Array.isArray(raw.savedBlocks) ? raw.savedBlocks : [],
    nav: Array.isArray(raw.nav) ? raw.nav : clone(DEFAULT_CMS_STORE.nav),
  };
}

async function writeStore(store: CmsStore) {
  await setSetting(STORE_KEY, {
    pages: store.pages.slice(0, MAX_PAGES),
    revisions: store.revisions.slice(0, 300),
    savedBlocks: store.savedBlocks.slice(0, 100),
    nav: store.nav,
  });
}

function snapshot(page: CmsPage, note: string, createdBy?: string): CmsRevision {
  return { id: id("rev"), pageId: page.id, snapshot: clone(page), note, createdBy, createdAt: new Date().toISOString() };
}

function normalizeBlocks(value: unknown, fallback: CmsBlock[]): CmsBlock[] {
  if (!Array.isArray(value)) return fallback;
  return value.slice(0, MAX_BLOCKS).map((block: any, order) => ({
    id: String(block.id || id("blk")),
    type: BLOCK_CATALOG.some((item) => item.type === block.type) ? block.type : "text",
    order,
    content: block.content && typeof block.content === "object" ? block.content : {},
    settings: block.settings && typeof block.settings === "object" ? block.settings : {},
  }));
}

async function authorize() {
  const admin = await requireStaff(["admin", "editor"]);
  if (!admin) return null;
  return admin;
}

export async function GET(_req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const admin = await authorize();
  if (!admin) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  const store = await readStore();

  if (path.length === 0 || (path.length === 1 && path[0] === "pages")) {
    return ok({ pages: store.pages.map((page) => ({ ...page, blockCount: page.blocks.length })), catalog: BLOCK_CATALOG });
  }
  if (path[0] === "pages" && path[1]) {
    const page = store.pages.find((item) => item.id === path[1]);
    if (!page) return bad("Page not found", 404);
    return ok({ page, revisions: store.revisions.filter((item) => item.pageId === page.id).slice(0, 30) });
  }
  if (path[0] === "nav") return ok({ nav: store.nav });
  return bad("Not found", 404);
}

export async function POST(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const admin = await authorize();
  if (!admin) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  const body = await readBody<Record<string, any>>(req);
  const store = await readStore();

  if (path.length === 1 && path[0] === "pages") {
    if (store.pages.length >= MAX_PAGES) return bad(`Page limit reached (${MAX_PAGES}).`);
    const title = String(body.title || "Untitled page").trim().slice(0, 120) || "Untitled page";
    let slug = cleanSlug(body.slug || title) || `page-${Date.now()}`;
    if (store.pages.some((item) => item.slug === slug)) slug = `${slug}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const page: CmsPage = {
      id: id("page"), title, slug, status: "draft", publishedAt: null, scheduledFor: null,
      seo: { metaTitle: title, metaDescription: "" },
      blocks: [
        { id: id("blk"), type: "heading", order: 0, content: { text: title, level: 1 } },
        { id: id("blk"), type: "text", order: 1, content: { html: "Start telling your story." } },
      ],
      createdAt: now, updatedAt: now,
    };
    store.pages.unshift(page);
    store.revisions.unshift(snapshot(page, "Page created", String(admin.id)));
    await writeStore(store);
    return ok({ page }, 201);
  }

  const pageId = path[0] === "pages" ? path[1] : null;
  const action = path[2];
  const index = store.pages.findIndex((item) => item.id === pageId);
  if (index < 0) return bad("Page not found", 404);
  const current = store.pages[index];

  if (action === "publish" || action === "unpublish") {
    if (action === "publish" && current.blocks.length === 0) return bad("Add at least one content block before publishing.");
    const page: CmsPage = {
      ...current,
      status: action === "publish" ? "published" : "draft",
      publishedAt: action === "publish" ? new Date().toISOString() : current.publishedAt,
      scheduledFor: action === "publish" ? null : current.scheduledFor ?? null,
      updatedAt: new Date().toISOString(),
    };
    store.pages[index] = page;
    store.revisions.unshift(snapshot(page, action === "publish" ? "Published" : "Unpublished", String(admin.id)));
    await writeStore(store);
    return ok({ page });
  }

  // Schedule a page for auto-publication by the /api/cron/run-scheduled cron.
  // Body: { at: string } (ISO date, must be in the future) or { at: null } to unschedule.
  if (action === "schedule") {
    const at = body.at == null ? null : new Date(String(body.at));
    if (at && Number.isNaN(at.getTime())) return bad("Provide a valid ISO date in `at`. ");
    if (at && at.getTime() <= Date.now()) return bad("Scheduled time must be in the future.");
    if (at && current.blocks.length === 0) return bad("Add at least one content block before scheduling.");

    const page: CmsPage = {
      ...current,
      status: at ? "scheduled" : current.status === "scheduled" ? "draft" : current.status,
      scheduledFor: at ? at.toISOString() : null,
      updatedAt: new Date().toISOString(),
    };
    store.pages[index] = page;
    store.revisions.unshift(
      snapshot(page, at ? `Scheduled for ${page.scheduledFor}` : "Schedule cleared", String(admin.id))
    );
    await writeStore(store);
    return ok({ page });
  }

  if (action === "rollback") {
    const revision = store.revisions.find((item) => item.id === String(body.revisionId) && item.pageId === pageId);
    if (!revision) return bad("Revision not found", 404);
    const restored = { ...clone(revision.snapshot), id: current.id, updatedAt: new Date().toISOString() };
    store.pages[index] = restored;
    store.revisions.unshift(snapshot(restored, `Restored ${revision.id}`, String(admin.id)));
    await writeStore(store);
    return ok({ page: restored });
  }

  return bad("Not found", 404);
}

export async function PUT(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const admin = await authorize();
  if (!admin) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  const body = await readBody<Record<string, any>>(req);
  const store = await readStore();

  if (path[0] === "nav") {
    if (!Array.isArray(body.nav)) return bad("Navigation must be an array.");
    store.nav = body.nav.slice(0, 30);
    await writeStore(store);
    return ok({ nav: store.nav });
  }

  const index = store.pages.findIndex((item) => item.id === path[1]);
  if (path[0] !== "pages" || index < 0) return bad("Page not found", 404);
  const current = store.pages[index];
  const title = String(body.title ?? current.title).trim().slice(0, 120);
  const slug = cleanSlug(body.slug ?? current.slug);
  if (!title || !slug) return bad("Title and slug are required.");
  if (store.pages.some((item, i) => i !== index && item.slug === slug)) return bad("That URL slug is already in use.", 409);

  const page: CmsPage = {
    ...current, title, slug,
    seo: { ...current.seo, ...(body.seo && typeof body.seo === "object" ? body.seo : {}) },
    blocks: normalizeBlocks(body.blocks, current.blocks),
    updatedAt: new Date().toISOString(),
  };
  store.pages[index] = page;
  store.revisions.unshift(snapshot(page, String(body.note || "Editor save").slice(0, 120), String(admin.id)));
  await writeStore(store);
  return ok({ page });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const admin = await authorize();
  if (!admin) return bad("Unauthorized", 401);
  const path = (await ctx.params).path || [];
  if (path[0] !== "pages" || !path[1]) return bad("Not found", 404);
  const store = await readStore();
  if (!store.pages.some((item) => item.id === path[1])) return bad("Page not found", 404);
  store.pages = store.pages.filter((item) => item.id !== path[1]);
  store.revisions = store.revisions.filter((item) => item.pageId !== path[1]);
  await writeStore(store);
  return ok({ ok: true });
}
