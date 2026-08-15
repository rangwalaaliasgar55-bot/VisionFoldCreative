import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus,
  Save,
  Globe,
  EyeOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  RotateCcw,
  LayoutTemplate,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { BLOCK_CATALOG, type CmsPage, type CmsBlock, type CmsRevision } from '../../../lib/cmsTypes';
import { BlockRenderer } from '../../cms/BlockRenderer';
import { Card, PrimaryButton, GhostButton, Input, Textarea } from '../ui';

export const PageBuilder: React.FC = () => {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState<CmsPage | null>(null);
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState(false);
  const blockCounter = useRef(0);

  const loadList = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await adminApi.get<{ pages: CmsPage[] }>('/api/admin/cms/pages');
      setPages(res.pages || []);
    } catch (e: any) {
      setErr(e.message || 'Failed to load pages — sign in again if session expired');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPage = async (id: string) => {
    setErr('');
    try {
      const res = await adminApi.get<{ page: CmsPage; revisions: CmsRevision[] }>(`/api/admin/cms/pages/${id}`);
      setPage(res.page);
      setRevisions(res.revisions || []);
      setSelectedId(id);
    } catch (e: any) {
      setErr(e.message || 'Failed to load page');
    }
  };

  useEffect(() => {
    const task = window.setTimeout(() => void loadList(), 0);
    return () => window.clearTimeout(task);
  }, [loadList]);

  const createPage = async () => {
    const title = prompt('Page title?', 'New page');
    if (!title) return;
    setErr('');
    try {
      const res = await adminApi.post<{ page: CmsPage }>('/api/admin/cms/pages', { title });
      await loadList();
      await loadPage(res.page.id);
      setMsg('Draft created — click Save after edits');
    } catch (e: any) {
      setErr(e.message || 'Create failed');
    }
  };

  const save = async () => {
    if (!page) return;
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const res = await adminApi.put<{ page: CmsPage }>(`/api/admin/cms/pages/${page.id}`, {
        title: page.title,
        slug: page.slug,
        seo: page.seo,
        blocks: page.blocks,
        note: 'Editor save',
      });
      setPage(res.page);
      setMsg(`Saved at ${new Date().toLocaleTimeString()} — durable on server`);
      await loadPage(page.id);
      await loadList();
    } catch (e: any) {
      setErr(e.message || 'Save failed — check Supabase settings.data column');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!page) return;
    try {
      await save();
      const res = await adminApi.post<{ page: CmsPage }>(`/api/admin/cms/pages/${page.id}/publish`, {});
      setPage(res.page);
      setMsg(`Published → /p/${res.page.slug}`);
      await loadList();
    } catch (e: any) {
      setErr(e.message || 'Publish failed');
    }
  };

  const unpublish = async () => {
    if (!page) return;
    try {
      const res = await adminApi.post<{ page: CmsPage }>(`/api/admin/cms/pages/${page.id}/unpublish`, {});
      setPage(res.page);
      setMsg('Unpublished → draft');
      await loadList();
    } catch (e: any) {
      setErr(e.message || 'Unpublish failed');
    }
  };

  const deletePage = async () => {
    if (!page) return;
    if (!confirm(`Delete “${page.title}” permanently?`)) return;
    try {
      await adminApi.delete(`/api/admin/cms/pages/${page.id}`);
      setPage(null);
      setSelectedId(null);
      setMsg('Page deleted');
      await loadList();
    } catch (e: any) {
      setErr(e.message || 'Delete failed');
    }
  };

  const addBlock = (type: string) => {
    if (!page) return;
    const cat = BLOCK_CATALOG.find((c) => c.type === type);
    if (!cat) return;
    const block: CmsBlock = {
      id: `blk_local_${++blockCounter.current}`,
      type: cat.type,
      order: page.blocks.length,
      content: { ...cat.defaults },
    };
    setPage({ ...page, blocks: [...page.blocks, block] });
  };

  const updateBlock = (id: string, content: Record<string, unknown>) => {
    if (!page) return;
    setPage({
      ...page,
      blocks: page.blocks.map((b) => (b.id === id ? { ...b, content: { ...b.content, ...content } } : b)),
    });
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    if (!page) return;
    const sorted = [...page.blocks].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const tmp = sorted[i];
    sorted[i] = sorted[j];
    sorted[j] = tmp;
    setPage({ ...page, blocks: sorted.map((b, order) => ({ ...b, order })) });
  };

  const removeBlock = (id: string) => {
    if (!page) return;
    setPage({
      ...page,
      blocks: page.blocks.filter((b) => b.id !== id).map((b, order) => ({ ...b, order })),
    });
  };

  const rollback = async (revisionId: string) => {
    if (!page || !confirm('Restore this revision?')) return;
    try {
      const res = await adminApi.post<{ page: CmsPage }>(`/api/admin/cms/pages/${page.id}/rollback`, {
        revisionId,
      });
      setPage(res.page);
      setMsg('Rolled back');
      await loadPage(page.id);
    } catch (e: any) {
      setErr(e.message || 'Rollback failed');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CMS</p>
          <h2 className="text-xl font-black text-white">Page builder</h2>
          <p className="text-sm text-[#8A857C]">
            Edit → <strong className="text-white">Save</strong> → Publish → live at /p/slug
          </p>
        </div>
        <PrimaryButton type="button" onClick={() => void createPage()}>
          <Plus className="h-4 w-4" /> New page
        </PrimaryButton>
      </div>

      {err ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {err}
        </div>
      ) : null}
      {msg ? <p className="text-xs text-emerald-400">{msg}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="h-fit p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">Pages</p>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
          ) : pages.length === 0 ? (
            <p className="text-xs text-[#666]">No pages — create one</p>
          ) : (
            <ul className="space-y-1">
              {pages.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => void loadPage(p.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      selectedId === p.id ? 'bg-[#D4AF37]/15 text-white' : 'text-[#B8B3AA] hover:bg-white/5'
                    }`}
                  >
                    <span className="font-medium">{p.title}</span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-[#666]">
                      {p.status} · /p/{p.slug}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {!page ? (
          <Card className="flex min-h-[320px] items-center justify-center p-8 text-sm text-[#8A857C]">
            <div className="text-center">
              <LayoutTemplate className="mx-auto h-8 w-8 text-[#D4AF37]/50" />
              <p className="mt-3">Select a page or create one</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card className="space-y-3 p-4">
              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={() => void save()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </PrimaryButton>
                {page.status === 'published' ? (
                  <GhostButton type="button" onClick={() => void unpublish()}>
                    <EyeOff className="h-4 w-4" /> Unpublish
                  </GhostButton>
                ) : (
                  <GhostButton type="button" onClick={() => void publish()}>
                    <Globe className="h-4 w-4" /> Publish
                  </GhostButton>
                )}
                <GhostButton type="button" onClick={() => setPreview((v) => !v)}>
                  {preview ? 'Edit blocks' : 'Live preview'}
                </GhostButton>
                {page.status === 'published' ? (
                  <a
                    href={`/p/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-2 text-xs text-[#B8B3AA]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open live
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => void deletePage()}
                  className="inline-flex items-center gap-1 rounded-full border border-red-500/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete page
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-[#8A857C]">
                  Title
                  <Input className="mt-1" value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
                </label>
                <label className="text-xs text-[#8A857C]">
                  Slug
                  <Input className="mt-1" value={page.slug} onChange={(e) => setPage({ ...page, slug: e.target.value })} />
                </label>
                <label className="text-xs text-[#8A857C] sm:col-span-2">
                  Meta description
                  <Textarea
                    className="mt-1 min-h-16"
                    value={page.seo?.metaDescription || ''}
                    onChange={(e) => setPage({ ...page, seo: { ...page.seo, metaDescription: e.target.value } })}
                  />
                </label>
              </div>
            </Card>

            {preview ? (
              <Card className="p-6">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Preview</p>
                <BlockRenderer blocks={page.blocks} />
              </Card>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_CATALOG.map((c) => (
                    <button
                      key={c.type}
                      type="button"
                      onClick={() => addBlock(c.type)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B8B3AA] hover:border-[#D4AF37]/40"
                    >
                      + {c.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {[...page.blocks]
                    .sort((a, b) => a.order - b.order)
                    .map((b) => (
                      <Card key={b.id} className="p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{b.type}</span>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => moveBlock(b.id, -1)} className="p-1 text-[#8A857C] hover:text-white">
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => moveBlock(b.id, 1)} className="p-1 text-[#8A857C] hover:text-white">
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => removeBlock(b.id)} className="p-1 text-red-400">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <BlockEditor block={b} onChange={(content) => updateBlock(b.id, content)} />
                      </Card>
                    ))}
                </div>
              </>
            )}

            <Card className="p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#8A857C]">Revisions</p>
              {revisions.length === 0 ? (
                <p className="text-xs text-[#666]">Saves create snapshots</p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto">
                  {revisions.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 text-xs text-[#B8B3AA]">
                      <span>
                        {new Date(r.createdAt).toLocaleString()} · {r.note || 'Save'}
                      </span>
                      <button type="button" onClick={() => void rollback(r.id)} className="inline-flex items-center gap-1 text-[#D4AF37]">
                        <RotateCcw className="h-3 w-3" /> Restore
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {page ? (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#D4AF37]/30 bg-black/90 px-4 py-2 shadow-xl backdrop-blur lg:left-[calc(50%+8rem)]">
          <span className="hidden text-[10px] text-[#8A857C] sm:inline">Unsaved edits need Save</span>
          <PrimaryButton type="button" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save now
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
};

function BlockEditor({
  block,
  onChange,
}: {
  block: CmsBlock;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const c = block.content || {};
  switch (block.type) {
    case 'heading':
      return (
        <div className="grid gap-2 sm:grid-cols-[1fr_100px]">
          <Input value={String(c.text || '')} onChange={(e) => onChange({ text: e.target.value })} />
          <Input type="number" min={1} max={3} value={Number(c.level) || 2} onChange={(e) => onChange({ level: Number(e.target.value) })} />
        </div>
      );
    case 'text':
      return <Textarea className="min-h-24" value={String(c.html || '')} onChange={(e) => onChange({ html: e.target.value })} />;
    case 'image':
    case 'video':
      return (
        <div className="grid gap-2">
          <Input placeholder="URL" value={String(c.url || '')} onChange={(e) => onChange({ url: e.target.value })} />
          {block.type === 'image' ? (
            <Input placeholder="Alt text" value={String(c.alt || '')} onChange={(e) => onChange({ alt: e.target.value })} />
          ) : null}
        </div>
      );
    case 'cta':
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={String(c.label || '')} onChange={(e) => onChange({ label: e.target.value })} placeholder="Label" />
          <Input value={String(c.href || '')} onChange={(e) => onChange({ href: e.target.value })} placeholder="Href" />
        </div>
      );
    case 'testimonial':
      return (
        <div className="space-y-2">
          <Textarea value={String(c.quote || '')} onChange={(e) => onChange({ quote: e.target.value })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={String(c.author || '')} onChange={(e) => onChange({ author: e.target.value })} placeholder="Author" />
            <Input value={String(c.role || '')} onChange={(e) => onChange({ role: e.target.value })} placeholder="Role" />
          </div>
        </div>
      );
    case 'spacer':
      return <Input type="number" value={Number(c.height) || 48} onChange={(e) => onChange({ height: Number(e.target.value) })} />;
    case 'pricing':
      return (
        <div className="space-y-2">
          <Input value={String(c.title || '')} onChange={(e) => onChange({ title: e.target.value })} placeholder="Title" />
          <Input value={String(c.price || '')} onChange={(e) => onChange({ price: e.target.value })} placeholder="Price" />
          <Textarea
            value={(Array.isArray(c.features) ? c.features : []).join('\n')}
            onChange={(e) => onChange({ features: e.target.value.split('\n').filter(Boolean) })}
            placeholder="One feature per line"
          />
        </div>
      );
    default:
      return (
        <Textarea
          className="min-h-20 font-mono text-xs"
          value={JSON.stringify(c, null, 2)}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              /* typing */
            }
          }}
        />
      );
  }
}

export default PageBuilder;
