import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Upload,
  Link,
  CheckCircle2,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Project, ProjectStatus, User } from '../../types';
import { formatINR, formatDate } from '../../lib/formatters';

interface AdminProjectsProps {
  projects: Project[];
  clients: User[];
  onRefresh: () => void;
}

export const AdminProjects: React.FC<AdminProjectsProps> = ({ projects, clients, onRefresh }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState('Short Form');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [description, setDescription] = useState('');
  const [amountINR, setAmountINR] = useState<number>(14000);
  const [resultsImpact, setResultsImpact] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingProj(null);
    setTitle('');
    setClientId(clients[0]?.id || '');
    setCategory('Short Form');
    setStatus('in_progress');
    setDescription('');
    setAmountINR(14000);
    setResultsImpact('');
    setFileName('');
    setFileUrl('');
    setShowModal(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setEditingProj(proj);
    setTitle(proj.title);
    setClientId(proj.clientId);
    setCategory(proj.category);
    setStatus(proj.status);
    setDescription(proj.description);
    setAmountINR(proj.amountINR);
    setResultsImpact(proj.resultsImpact || '');
    setFileName(proj.deliveredFiles?.[0]?.name || '');
    setFileUrl(proj.deliveredFiles?.[0]?.url || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const clientObj = clients.find((c) => c.id === clientId);

    const deliveredFiles =
      fileName && fileUrl ? [{ name: fileName, url: fileUrl }] : editingProj?.deliveredFiles || [];

    try {
      if (editingProj) {
        await api.updateProject(editingProj.id, {
          title,
          clientId,
          clientName: clientObj?.name || editingProj.clientName,
          clientEmail: clientObj?.email || editingProj.clientEmail,
          category,
          status,
          description,
          amountINR,
          resultsImpact,
          deliveredFiles,
        });
      } else {
        await api.createProject({
          title,
          clientId,
          clientName: clientObj?.name || 'Client',
          clientEmail: clientObj?.email || '',
          category,
          status,
          description,
          amountINR,
          resultsImpact,
          deliveredFiles,
          startDate: new Date().toISOString().split('T')[0],
        });
      }

      onRefresh();
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (projId: string, newStatus: ProjectStatus) => {
    try {
      await api.updateProject(projId, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400">
            Project Operations
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Video Editing Projects</h2>
          <p className="text-xs text-slate-400">
            Attach final files/links, update client review status, and log performance results.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                  {proj.category}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Client: <strong className="text-slate-200">{proj.clientName}</strong> ({proj.clientEmail})
                </span>
              </div>

              <h3 className="text-xl font-bold text-white">{proj.title}</h3>
              <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">{proj.description}</p>

              {/* Logged Results/Impact */}
              {proj.resultsImpact && (
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                  <span>Results: {proj.resultsImpact}</span>
                </div>
              )}
            </div>

            {/* Status Dropdown & Price */}
            <div className="flex flex-col md:items-end gap-3 shrink-0">
              <div className="text-xl font-extrabold text-amber-400 inr-price">
                {formatINR(proj.amountINR)}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={proj.status}
                  onChange={(e) => handleQuickStatusChange(proj.id, e.target.value as ProjectStatus)}
                  className="px-3 py-1.5 bg-[#161922] border border-[#222736] rounded-lg text-xs font-bold uppercase text-slate-200 focus:border-amber-500"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="delivered">Delivered</option>
                </select>

                <button
                  onClick={() => handleOpenEdit(proj)}
                  className="p-2 rounded-lg bg-[#161922] text-slate-300 hover:text-white hover:bg-[#222736]"
                  title="Edit Project"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE/EDIT PROJECT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#11131a] border border-[#222736] rounded-2xl w-full max-w-xl my-8 p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">
              {editingProj ? 'Edit Project Details' : 'Create New Client Project'}
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
                  placeholder="e.g. Summer Reel Campaign - Batch 5"
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Assign Client *
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || 'Client'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  >
                    <option value="Short Form">Short Form</option>
                    <option value="Long Form">Long Form</option>
                    <option value="Brand Content">Brand Content</option>
                    <option value="Social Media">Social Media</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountINR}
                    onChange={(e) => setAmountINR(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details regarding raw footage length, music, captions..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Delivered File Name & URL
                </label>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. Reel_Final.mp4"
                    className="p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-xs"
                  />
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Results / Impact (e.g. "+340K views")
                </label>
                <input
                  type="text"
                  value={resultsImpact}
                  onChange={(e) => setResultsImpact(e.target.value)}
                  placeholder="Logged performance metric for agency portfolio..."
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  {submitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
