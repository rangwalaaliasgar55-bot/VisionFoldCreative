import React, { useState } from 'react';
import { Film, Plus, Edit2, Trash2, Upload, TrendingUp, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { PortfolioItem } from '../../types';

interface AdminPortfolioProps {
  portfolio: PortfolioItem[];
  onRefresh: () => void;
}

export const AdminPortfolio: React.FC<AdminPortfolioProps> = ({ portfolio, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [hideClientName, setHideClientName] = useState(false);
  const [category, setCategory] = useState<PortfolioItem['category']>('Short Form');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [teaser, setTeaser] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [toolsUsed, setToolsUsed] = useState('CapCut, AI Audio, Motion Graphics');
  const [resultsImpact, setResultsImpact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle('');
    setClientName('');
    setHideClientName(false);
    setCategory('Short Form');
    setThumbnailUrl('https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80');
    setVideoUrl('');
    setTeaser('');
    setFullDescription('');
    setToolsUsed('CapCut, AI Audio, Motion Design');
    setResultsImpact('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setClientName(item.clientName || '');
    setHideClientName(!!item.hideClientName);
    setCategory(item.category);
    setThumbnailUrl(item.thumbnailUrl);
    setVideoUrl(item.videoUrl || '');
    setTeaser(item.teaser);
    setFullDescription(item.fullDescription);
    setToolsUsed(item.toolsUsed ? item.toolsUsed.join(', ') : '');
    setResultsImpact(item.resultsImpact || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const toolsArr = toolsUsed.split(',').map((t) => t.trim()).filter(Boolean);

    try {
      if (editingItem) {
        await api.updatePortfolioItem(editingItem.id, {
          title,
          clientName,
          hideClientName,
          category,
          thumbnailUrl,
          videoUrl,
          teaser,
          fullDescription,
          toolsUsed: toolsArr,
          resultsImpact,
        });
      } else {
        await api.createPortfolioItem({
          title,
          clientName,
          hideClientName,
          category,
          thumbnailUrl,
          videoUrl,
          teaser,
          fullDescription,
          dateCreated: new Date().toISOString().split('T')[0],
          toolsUsed: toolsArr,
          resultsImpact,
          order: portfolio.length + 1,
          featured: true,
        });
      }

      onRefresh();
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save case study');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this case study?')) return;
    try {
      await api.deletePortfolioItem(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete portfolio item');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await api.uploadFile(file.name, base64, file.type);
        setThumbnailUrl(res.url);
      } catch (err: any) {
        alert('Thumbnail upload failed: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400">
            Case Studies Manager
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Portfolio Case Studies</h2>
          <p className="text-xs text-slate-400">
            Add, update, or remove agency portfolio items and results showcased on the public site.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Case Study
        </button>
      </div>

      {/* Grid of Portfolio Items */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.map((item) => (
          <div
            key={item.id}
            className="bg-[#11131a] border border-[#222736] rounded-2xl overflow-hidden hover:border-amber-500/40 transition-all flex flex-col justify-between fold-card"
          >
            <div>
              <div className="relative aspect-video bg-black">
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-black/70 text-amber-400 text-[11px] font-bold">
                  {item.category}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="text-base font-bold text-white line-clamp-1">{item.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{item.teaser}</p>

                {item.resultsImpact && (
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.resultsImpact}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#161922] border-t border-[#222736] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {item.hideClientName ? 'Hidden Client' : item.clientName || 'Client'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded bg-[#11131a] text-amber-400 hover:bg-[#222736]"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded bg-[#11131a] text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL FOR CREATE / EDIT PORTFOLIO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#11131a] border border-[#222736] rounded-2xl w-full max-w-xl my-8 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">
              {editingItem ? 'Edit Portfolio Case Study' : 'Add New Portfolio Case Study'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Viral Apparel Reel Campaign"
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Aura Apparel"
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  >
                    <option value="Short Form">Short Form</option>
                    <option value="Long Form">Long Form</option>
                    <option value="Brand Content">Brand Content</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Documentary">Documentary</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hideClient"
                  checked={hideClientName}
                  onChange={(e) => setHideClientName(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <label htmlFor="hideClient" className="text-xs text-slate-300 font-medium">
                  Hide client name on public case study (Confidential Client toggle)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Thumbnail Image URL or Upload *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-xs"
                  />
                  <label className="px-3 py-2 bg-[#161922] hover:bg-[#222736] border border-[#222736] text-amber-400 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Video URL (YouTube/Vimeo Embed)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Short Teaser *
                </label>
                <input
                  type="text"
                  required
                  value={teaser}
                  onChange={(e) => setTeaser(e.target.value)}
                  placeholder="1-sentence hook for portfolio card..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Full Case Study Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Detailed breakdown of footage, hook pacing, motion design..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Tools Used (Comma separated)
                </label>
                <input
                  type="text"
                  value={toolsUsed}
                  onChange={(e) => setToolsUsed(e.target.value)}
                  placeholder="CapCut, AI Audio, Color Grading, Motion Graphics"
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Results & Impact (Crucial for Agencies) *
                </label>
                <input
                  type="text"
                  required
                  value={resultsImpact}
                  onChange={(e) => setResultsImpact(e.target.value)}
                  placeholder="e.g. +340,000 views in 7 days, 8.4% engagement rate, 42% ROAS surge..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-emerald-400 text-sm font-semibold"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  {submitting ? 'Saving...' : 'Save Case Study'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
