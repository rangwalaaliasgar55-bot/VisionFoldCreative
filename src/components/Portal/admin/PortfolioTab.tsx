import React, { useEffect, useState } from 'react';
import { portfolioApi } from '../../../lib/api';
import type { PortfolioItem } from '../../../types';
import { PortalCard, EmptyState, LoadingState } from '../portalUi';
import { Plus, Trash2, Star, X } from 'lucide-react';

const CATEGORIES: PortfolioItem['category'][] = ['Short Form', 'Brand Content', 'Long Form', 'Social Media', 'Documentary'];

const emptyDraft = (): Omit<PortfolioItem, 'id'> => ({
  title: '',
  category: 'Short Form',
  thumbnailUrl: '',
  videoUrl: '',
  teaser: '',
  fullDescription: '',
  dateCreated: new Date().toISOString().slice(0, 10),
  toolsUsed: [],
  resultsImpact: '',
  order: 0,
  featured: false,
});

export const PortfolioTab: React.FC = () => {
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    portfolioApi.list().then(setItems).catch(() => setItems([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const created = await portfolioApi.create(draft);
      setItems((prev) => [...(prev || []), created]);
      setDraft(emptyDraft());
      setIsCreating(false);
    } catch {
      // leave the form open with the entered data so nothing is lost
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this portfolio item?')) return;
    setItems((prev) => prev?.filter((i) => i.id !== id) || null);
    try {
      await portfolioApi.remove(id);
    } catch {
      portfolioApi.list().then(setItems).catch(() => {});
    }
  };

  const toggleFeatured = async (item: PortfolioItem) => {
    const updated = { ...item, featured: !item.featured };
    setItems((prev) => prev?.map((i) => (i.id === item.id ? updated : i)) || null);
    try {
      await portfolioApi.update(item.id, { featured: updated.featured });
    } catch {
      portfolioApi.list().then(setItems).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating((v) => !v)}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded hover:bg-white transition-colors"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'New Item'}
        </button>
      </div>

      {isCreating && (
        <PortalCard>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <Field label="Title">
              <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="input" />
            </Field>
            <Field label="Category">
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as PortfolioItem['category'] })} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Thumbnail URL">
              <input required value={draft.thumbnailUrl} onChange={(e) => setDraft({ ...draft, thumbnailUrl: e.target.value })} className="input" />
            </Field>
            <Field label="Video URL (optional)">
              <input value={draft.videoUrl} onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })} className="input" />
            </Field>
            <Field label="Teaser" full>
              <input required value={draft.teaser} onChange={(e) => setDraft({ ...draft, teaser: e.target.value })} className="input" />
            </Field>
            <Field label="Full Description" full>
              <textarea required rows={3} value={draft.fullDescription} onChange={(e) => setDraft({ ...draft, fullDescription: e.target.value })} className="input resize-none" />
            </Field>
            <Field label="Results / Impact">
              <input value={draft.resultsImpact} onChange={(e) => setDraft({ ...draft, resultsImpact: e.target.value })} className="input" />
            </Field>
            <Field label="Tools Used (comma separated)">
              <input
                value={draft.toolsUsed.join(', ')}
                onChange={(e) => setDraft({ ...draft, toolsUsed: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="input"
              />
            </Field>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save Item'}
              </button>
            </div>
          </form>
        </PortalCard>
      )}

      {items === null ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState label="No portfolio items yet — add your first showcase piece above." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <PortalCard key={item.id} className="p-0 overflow-hidden">
              <div className="aspect-video bg-[#0A0A0B] relative">
                {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />}
                <button
                  onClick={() => toggleFeatured(item)}
                  aria-label={item.featured ? 'Unmark as featured' : 'Mark as featured'}
                  className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                    item.featured ? 'bg-[#D4AF37] border-[#D4AF37] text-[#0A0A0B]' : 'bg-[#0A0A0B]/80 border-[#222226] text-[#888891]'
                  }`}
                >
                  <Star className="w-4 h-4" fill={item.featured ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-1">{item.category}</div>
                <h3 className="font-bold text-[#EDEDED] mb-2">{item.title}</h3>
                <p className="text-xs text-[#888891] mb-4 line-clamp-2">{item.teaser}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center gap-1.5 text-xs text-[#888891] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; full?: boolean }> = ({ label, children, full }) => (
  <div className={full ? 'sm:col-span-2' : ''}>
    <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">{label}</label>
    {children}
  </div>
);
