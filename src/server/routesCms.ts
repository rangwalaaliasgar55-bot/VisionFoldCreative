import { Application } from 'express';
import { dbManager } from '../lib/db';
import {
  DEFAULT_CMS_STORE,
  BLOCK_CATALOG,
  type CmsPage,
  type CmsStore,
  type CmsBlock,
  type CmsRevision,
} from '../lib/cmsTypes';
import { authenticateToken, requireAdmin, type AuthenticatedRequest } from './security';

async function readStore(): Promise<CmsStore> {
  const settings = await dbManager.getSettings();
  const raw = (settings as any).cmsStore;
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CMS_STORE, pages: [], revisions: [] };
  return {
    pages: Array.isArray(raw.pages) ? raw.pages : [],
    revisions: Array.isArray(raw.revisions) ? raw.revisions : [],
    savedBlocks: Array.isArray(raw.savedBlocks) ? raw.savedBlocks : [],
    nav: Array.isArray(raw.nav) && raw.nav.length ? raw.nav : DEFAULT_CMS_STORE.nav,
  };
}

async function writeStore(store: CmsStore) {
  const settings = await dbManager.getSettings();
  await dbManager.updateSettings({
    ...settings,
    cmsStore: {
      pages: store.pages,
      revisions: store.revisions.slice(0, 200),
      savedBlocks: store.savedBlocks.slice(0, 100),
      nav: store.nav,
    },
  } as any);
}

function newId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function snapshotPage(page: CmsPage): CmsRevision {
  return {
    id: newId('rev'),
    pageId: page.id,
    snapshot: JSON.parse(JSON.stringify(page)),
    createdAt: new Date().toISOString(),
  };
}

export function registerCmsRoutes(app: Application) {
  /** Public: published pages list (slugs) */
  app.get('/api/cms/pages', async (req, res) => {
    const store = await readStore();
    const admin = Boolean((req as any).user?.role === 'admin');
    // Optional admin sees all when authenticated via cookie/bearer on same route with auth middleware skipped — use query
    const all = String(req.query.all || '') === '1';
    let pages = store.pages;
    if (!all) {
      pages = pages.filter((p) => p.status === 'published');
    }
    res.json({
      pages: pages.map(({ blocks, ...meta }) => ({ ...meta, blockCount: blocks?.length || 0 })),
    });
  });

  app.get('/api/cms/pages/admin', authenticateToken, requireAdmin, async (_req, res) => {
    const store = await readStore();
    res.json({ pages: store.pages, catalog: BLOCK_CATALOG });
  });

  app.get('/api/cms/pages/by-slug/:slug', async (req, res) => {
    const store = await readStore();
    const page = store.pages.find((p) => p.slug === req.params.slug);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    if (page.status !== 'published') {
      // Draft only via preview token
      const token = String(req.query.preview || '');
      const expected = process.env.CMS_PREVIEW_SECRET || process.env.JWT_SECRET || '';
      if (!token || token !== expected) {
        return res.status(404).json({ error: 'Page not found' });
      }
    }
    res.json({ page });
  });

  app.get('/api/cms/pages/:id', authenticateToken, requireAdmin, async (req, res) => {
    const store = await readStore();
    const page = store.pages.find((p) => p.id === req.params.id);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    const revisions = store.revisions.filter((r) => r.pageId === page.id).slice(0, 30);
    res.json({ page, revisions });
  });

  app.post('/api/cms/pages', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    const store = await readStore();
    const title = String(req.body?.title || 'Untitled page').trim();
    let slug = String(req.body?.slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    if (!slug) slug = `page-${Date.now()}`;
    if (store.pages.some((p) => p.slug === slug)) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const now = new Date().toISOString();
    const page: CmsPage = {
      id: newId('page'),
      slug,
      title,
      status: 'draft',
      publishedAt: null,
      scheduledFor: null,
      seo: { metaTitle: title, metaDescription: '' },
      blocks: [
        {
          id: newId('blk'),
          type: 'heading',
          order: 0,
          content: { text: title, level: 1 },
        },
        {
          id: newId('blk'),
          type: 'text',
          order: 1,
          content: { html: 'Start editing this page…' },
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    store.pages.unshift(page);
    store.revisions.unshift(snapshotPage(page));
    await writeStore(store);
    res.json({ page });
  });

  app.put('/api/cms/pages/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res) => {
    const store = await readStore();
    const idx = store.pages.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Page not found' });

    const prev = store.pages[idx];
    const body = req.body || {};
    const blocks: CmsBlock[] = Array.isArray(body.blocks)
      ? body.blocks.map((b: any, i: number) => ({
          id: String(b.id || newId('blk')),
          type: b.type,
          order: typeof b.order === 'number' ? b.order : i,
          content: b.content || {},
          settings: b.settings || {},
        }))
      : prev.blocks;

    const page: CmsPage = {
      ...prev,
      title: body.title != null ? String(body.title) : prev.title,
      slug: body.slug != null ? String(body.slug).replace(/[^a-z0-9-]/g, '') : prev.slug,
      seo: body.seo ? { ...prev.seo, ...body.seo } : prev.seo,
      blocks: blocks.sort((a, b) => a.order - b.order),
      updatedAt: new Date().toISOString(),
      // status changes only via publish endpoint unless explicitly set by admin
      status: body.status && ['draft', 'published', 'scheduled'].includes(body.status) ? body.status : prev.status,
      scheduledFor: body.scheduledFor !== undefined ? body.scheduledFor : prev.scheduledFor,
    };

    store.pages[idx] = page;
    store.revisions.unshift({
      ...snapshotPage(page),
      note: String(body.note || 'Save'),
      createdBy: req.user?.id,
    });
    await writeStore(store);
    res.json({ page });
  });

  app.post('/api/cms/pages/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
    const store = await readStore();
    const idx = store.pages.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Page not found' });
    const page = {
      ...store.pages[idx],
      status: 'published' as const,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.pages[idx] = page;
    store.revisions.unshift({ ...snapshotPage(page), note: 'Published' });
    await writeStore(store);
    res.json({ page });
  });

  app.post('/api/cms/pages/:id/unpublish', authenticateToken, requireAdmin, async (req, res) => {
    const store = await readStore();
    const idx = store.pages.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Page not found' });
    const page = {
      ...store.pages[idx],
      status: 'draft' as const,
      updatedAt: new Date().toISOString(),
    };
    store.pages[idx] = page;
    await writeStore(store);
    res.json({ page });
  });

  app.post('/api/cms/pages/:id/rollback', authenticateToken, requireAdmin, async (req, res) => {
    const revisionId = String(req.body?.revisionId || '');
    const store = await readStore();
    const rev = store.revisions.find((r) => r.id === revisionId && r.pageId === req.params.id);
    if (!rev) return res.status(404).json({ error: 'Revision not found' });
    const idx = store.pages.findIndex((p) => p.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Page not found' });

    const restored: CmsPage = {
      ...rev.snapshot,
      id: req.params.id,
      updatedAt: new Date().toISOString(),
    };
    store.pages[idx] = restored;
    store.revisions.unshift({ ...snapshotPage(restored), note: `Rollback to ${revisionId}` });
    await writeStore(store);
    res.json({ page: restored });
  });

  app.delete('/api/cms/pages/:id', authenticateToken, requireAdmin, async (req, res) => {
    const store = await readStore();
    store.pages = store.pages.filter((p) => p.id !== req.params.id);
    store.revisions = store.revisions.filter((r) => r.pageId !== req.params.id);
    await writeStore(store);
    res.json({ success: true });
  });

  app.get('/api/cms/nav', async (_req, res) => {
    const store = await readStore();
    res.json({ nav: store.nav });
  });

  app.put('/api/cms/nav', authenticateToken, requireAdmin, async (req, res) => {
    const store = await readStore();
    const nav = Array.isArray(req.body?.nav) ? req.body.nav : store.nav;
    store.nav = nav;
    await writeStore(store);
    res.json({ nav: store.nav });
  });

  app.get('/api/cms/catalog', authenticateToken, requireAdmin, (_req, res) => {
    res.json({ catalog: BLOCK_CATALOG });
  });
}
