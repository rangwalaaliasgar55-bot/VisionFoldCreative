import React, { useEffect, useState } from 'react';
import {
  FileText,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Upload,
  Plus,
  Save,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ContentBlock, ContentBlockType } from '../../types';

export const AdminContentEditor: React.FC = () => {
  const [selectedPage, setSelectedPage] = useState<string>('home');
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // New Block Form State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newSectionKey, setNewSectionKey] = useState('');
  const [newType, setNewType] = useState<ContentBlockType>('text');
  const [newValue, setNewValue] = useState('');

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const data = await api.getContent(selectedPage);
      setBlocks(data);
    } catch (err) {
      console.error('Failed to load blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocks();
  }, [selectedPage]);

  const handleStartEdit = (block: ContentBlock) => {
    setEditingBlock(block);
    setEditValue(
      typeof block.value === 'object'
        ? JSON.stringify(block.value, null, 2)
        : String(block.value)
    );
    setSaveSuccess('');
  };

  const handleSaveBlock = async () => {
    if (!editingBlock) return;
    setSaving(true);
    setSaveSuccess('');

    try {
      let finalVal: any = editValue;
      if (editingBlock.type === 'list' && typeof editValue === 'string') {
        try {
          finalVal = JSON.parse(editValue);
        } catch {
          // If not valid JSON, split lines
          finalVal = editValue.split('\n').filter((l) => l.trim() !== '');
        }
      }

      const updated = await api.updateContentBlock(editingBlock.id, {
        value: finalVal,
      });

      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBlock(null);
      setSaveSuccess('Block saved and published live to public site!');
    } catch (err: any) {
      alert(err.message || 'Failed to save block');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (block: ContentBlock) => {
    try {
      const updated = await api.updateContentBlock(block.id, {
        visible: !block.visible,
      });
      setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle block visibility');
    }
  };

  const handleReorder = async (block: ContentBlock, direction: 'up' | 'down') => {
    const idx = blocks.findIndex((b) => b.id === block.id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;

    const targetBlock = blocks[targetIdx];
    const newOrder1 = targetBlock.order;
    const newOrder2 = block.order;

    try {
      await api.updateContentBlock(block.id, { order: newOrder1 });
      await api.updateContentBlock(targetBlock.id, { order: newOrder2 });
      loadBlocks();
    } catch (err: any) {
      console.error('Reorder failed:', err);
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
        setEditValue(res.url);
      } catch (err: any) {
        alert('Image upload failed: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNewBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalVal: any = newValue;
      if (newType === 'list') {
        try {
          finalVal = JSON.parse(newValue);
        } catch {
          finalVal = newValue.split('\n').filter((l) => l.trim() !== '');
        }
      }

      await api.createContentBlock({
        page: selectedPage as any,
        section_key: newSectionKey,
        type: newType,
        value: finalVal,
        order: blocks.length + 1,
        visible: true,
      });

      setShowNewModal(false);
      setNewSectionKey('');
      setNewValue('');
      loadBlocks();
    } catch (err: any) {
      alert('Failed to create block: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400">
            WordPress-Style Block Editor
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">CMS Content Blocks</h2>
          <p className="text-xs text-slate-400">
            Edit live public site copy, prices, headings, and lists without touching code.
          </p>
        </div>

        {/* Page Selector & New Block Action */}
        <div className="flex items-center gap-3">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-4 py-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 font-semibold text-sm focus:border-amber-500"
          >
            <option value="home">Home Page Copy</option>
            <option value="about">About Page Copy</option>
            <option value="services">Services Rates</option>
            <option value="contact">Contact Details</option>
            <option value="global">Global / Footer</option>
          </select>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Blocks List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading content blocks...</div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const isEditing = editingBlock?.id === block.id;

            return (
              <div
                key={block.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isEditing
                    ? 'bg-[#161922] border-amber-500 shadow-xl'
                    : 'bg-[#11131a] border-[#222736] hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-[#222736]">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                      {block.section_key}
                    </span>
                    <span className="text-xs uppercase font-semibold text-slate-400">
                      [{block.type}]
                    </span>
                  </div>

                  {/* Actions: Visibility, Reorder, Edit */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(block, 'up')}
                      disabled={idx === 0}
                      title="Move Up"
                      className="p-1.5 rounded bg-[#161922] text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(block, 'down')}
                      disabled={idx === blocks.length - 1}
                      title="Move Down"
                      className="p-1.5 rounded bg-[#161922] text-slate-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleVisibility(block)}
                      className={`p-1.5 rounded text-xs font-semibold flex items-center gap-1 ${
                        block.visible
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {block.visible ? 'Visible' : 'Hidden'}
                    </button>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(block)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
                      >
                        Edit Block
                      </button>
                    )}
                  </div>
                </div>

                {/* Block Content Display or Inline Editor */}
                {isEditing ? (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                        Edit Block Value ({block.type})
                      </label>

                      {block.type === 'text' || block.type === 'price' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 bg-[#11131a] border border-[#222736] rounded-xl text-slate-100 font-medium focus:border-amber-500"
                        />
                      ) : (
                        <textarea
                          rows={6}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 bg-[#11131a] border border-[#222736] rounded-xl text-slate-100 font-mono text-xs focus:border-amber-500 resize-y"
                        />
                      )}
                    </div>

                    {/* Image Upload Option if type === image */}
                    {block.type === 'image' && (
                      <div className="p-3 rounded-xl bg-[#11131a] border border-[#222736] flex items-center gap-3">
                        <Upload className="w-5 h-5 text-amber-400" />
                        <label className="text-xs font-semibold text-slate-300 cursor-pointer hover:text-white">
                          <span>Upload new image via StorageProvider</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}

                    <div className="flex items-center gap-3 justify-end pt-2">
                      <button
                        onClick={() => setEditingBlock(null)}
                        className="px-4 py-2 rounded-xl bg-[#11131a] text-slate-400 hover:text-white text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBlock}
                        disabled={saving}
                        className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Publishing...' : 'Save & Publish Live'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-200 text-sm font-medium leading-relaxed overflow-x-auto">
                    {typeof block.value === 'object' ? (
                      <pre className="text-xs font-mono text-amber-300 bg-[#161922] p-3 rounded-xl max-h-40 overflow-y-auto">
                        {JSON.stringify(block.value, null, 2)}
                      </pre>
                    ) : (
                      <p>{String(block.value)}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* NEW BLOCK MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131a] border border-[#222736] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Add New Content Block</h3>
            <form onSubmit={handleCreateNewBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Section Key *
                </label>
                <input
                  type="text"
                  required
                  value={newSectionKey}
                  onChange={(e) => setNewSectionKey(e.target.value)}
                  placeholder="e.g. hero_banner_cta"
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Block Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                >
                  <option value="text">Text</option>
                  <option value="richtext">Rich Text</option>
                  <option value="price">Price</option>
                  <option value="list">List / JSON</option>
                  <option value="image">Image URL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Initial Value
                </label>
                <textarea
                  rows={4}
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Content text or list items..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Create Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
