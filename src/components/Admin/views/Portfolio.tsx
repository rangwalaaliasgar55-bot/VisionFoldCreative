import React, { useState } from 'react';
import { Plus, Sparkles, Loader2, Star, Trash2, Pencil } from 'lucide-react';
import { useContent } from '../../../context/ContentContext';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, Input, Select, Textarea, PrimaryButton, GhostButton, EmptyState } from '../ui';
import type { PortfolioItem } from '../../../types';

const CATEGORIES: PortfolioItem['category'][] = ['Short Form', 'Brand Content', 'Long Form', 'Social Media', 'Documentary'];

const emptyDraft = {
  title: '', clientName: '', category: 'Short Form' as PortfolioItem['category'],
  thumbnailUrl: '', videoUrl: '', teaser: '', fullDescription: '', resultsImpact: '', notes: '',
};

export const Portfolio: React.FC = () => {
  const { portfolio, refreshPortfolio, savePortfolioItem, updatePortfolioItem, deletePortfolioItem } = useContent();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setDraft({
      title: item.title, clientName: item.clientName || '', category: item.category,
      thumbnailUrl: item.thumbnailUrl, videoUrl: item.videoUrl || '', teaser: item.teaser,
      fullDescription: item.fullDescription, resultsImpact: item.resultsImpact, notes: '',
    });
    setShowForm(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const payload = await adminApi.post<{ text: string }>('/api/ai/generate', {
        prompt: `Create a premium portfolio description for a project called "${draft.title}". Notes: ${draft.notes}`,
        systemPrompt: 'Return valid JSON with teaser, fullDescription, resultsImpact keys. Keep the copy concise, premium, and marketing-ready.',
      });
      const parsed = payload.text ? JSON.parse(payload.text) : null;
      setDraft((prev) => ({
        ...prev,
        teaser: parsed?.teaser || prev.teaser,
        fullDescription: parsed?.fullDescription || prev.fullDescription,
        resultsImpact: parsed?.resultsImpact || prev.resultsImpact,
      }));
    } catch (err: any) {
      setError(err.message || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: draft.title,
        clientName: draft.clientName,
        category: draft.category,
        thumbnailUrl: draft.thumbnailUrl,
        videoUrl: draft.videoUrl,
        teaser: draft.teaser,
        fullDescription: draft.fullDescription,
        resultsImpact: draft.resultsImpact,
        dateCreated: new Date().toISOString(),
        toolsUsed: [],
        order: portfolio.length,
        featured: false,
      };
      if (editingId) {
        await updatePortfolioItem(editingId, payload);
      } else {
        await savePortfolioItem(payload);
      }
      setDraft(emptyDraft);
      setShowForm(false);
      setEditingId(null);
      await refreshPortfolio();
    } catch (err: any) {
      setError(err.message || 'Failed to save portfolio item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Portfolio"
        subtitle={`${portfolio.length} showcased projects`}
        action={<PrimaryButton onClick={() => { setShowForm((v) => !v); setEditingId(null); setDraft(emptyDraft); }}><Plus className="h-4 w-4" /> Add Project</PrimaryButton>}
      />

      {showForm ? (
        <form onSubmit={handleSave} className="space-y-3 border-b border-[#222226] p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Project title" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as PortfolioItem['category'] })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
            <Input placeholder="Client name (optional)" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} />
            <Input placeholder="Thumbnail URL" value={draft.thumbnailUrl} onChange={(e) => setDraft({ ...draft, thumbnailUrl: e.target.value })} />
            <Input placeholder="Video URL (optional)" value={draft.videoUrl} onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })} className="sm:col-span-2" />
          </div>

          <div className="rounded-lg border border-[#D4AF37]/30 bg-[#0A0A0B] p-4">
            <div className="mb-2 flex items-center gap-2 text-[#D4AF37]">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">AI Copy Assist</span>
            </div>
            <Textarea placeholder="Rough notes for the AI to expand into premium copy" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="mb-2 min-h-16" />
            <GhostButton type="button" onClick={() => void handleGenerate()} disabled={generating || !draft.title}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Draft
            </GhostButton>
          </div>

          <Textarea placeholder="Teaser" value={draft.teaser} onChange={(e) => setDraft({ ...draft, teaser: e.target.value })} className="min-h-16" />
          <Textarea placeholder="Full description" value={draft.fullDescription} onChange={(e) => setDraft({ ...draft, fullDescription: e.target.value })} className="min-h-24" />
          <Textarea placeholder="Results / impact" value={draft.resultsImpact} onChange={(e) => setDraft({ ...draft, resultsImpact: e.target.value })} className="min-h-16" />

          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update Project' : 'Save Project'}</PrimaryButton>
            <GhostButton type="button" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</GhostButton>
          </div>
        </form>
      ) : null}

      {portfolio.length === 0 ? (
        <EmptyState message="No portfolio items yet — add your first showcase project." />
      ) : (
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-[#222226] bg-[#0A0A0B]">
              <div className="aspect-video bg-[#1a1a1d]">
                {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="truncate font-bold text-[#EDEDED]">{item.title}</h4>
                  {item.featured ? <Star className="h-4 w-4 shrink-0 fill-[#D4AF37] text-[#D4AF37]" /> : null}
                </div>
                <p className="mt-1 text-xs text-[#888891]">{item.category}</p>
                <div className="mt-3 flex gap-2">
                  <GhostButton type="button" onClick={() => startEdit(item)} className="flex-1 justify-center"><Pencil className="h-3.5 w-3.5" /> Edit</GhostButton>
                  <GhostButton
                    type="button"
                    onClick={() => void deletePortfolioItem(item.id)}
                    className="justify-center text-red-400 hover:border-red-400/50 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </GhostButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
