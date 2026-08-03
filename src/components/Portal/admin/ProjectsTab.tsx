import React, { useEffect, useState } from 'react';
import { projectsApi, revisionsApi, clientsApi } from '../../../lib/api';
import type { Project, Revision, User, ProjectStatus } from '../../../types';
import { StatusBadge, PortalCard, EmptyState, LoadingState, formatINR, formatDate } from '../portalUi';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

const STATUSES: ProjectStatus[] = ['in_progress', 'in_review', 'delivered'];

export const ProjectsTab: React.FC = () => {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [clients, setClients] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: '', clientId: '', category: 'Short Form', description: '', amountINR: '' });

  useEffect(() => {
    projectsApi.list().then(setProjects).catch(() => setProjects([]));
    clientsApi.list().then(setClients).catch(() => setClients([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === form.clientId);
    if (!client) return;
    setIsSaving(true);
    try {
      const created = await projectsApi.create({
        title: form.title,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        category: form.category,
        status: 'in_progress',
        description: form.description,
        startDate: new Date().toISOString().slice(0, 10),
        amountINR: Number(form.amountINR) || 0,
      });
      setProjects((prev) => [...(prev || []), created]);
      setForm({ title: '', clientId: '', category: 'Short Form', description: '', amountINR: '' });
      setIsCreating(false);
    } catch {
      // keep form open
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (project: Project, status: ProjectStatus) => {
    setProjects((prev) => prev?.map((p) => (p.id === project.id ? { ...p, status } : p)) || null);
    try {
      await projectsApi.update(project.id, { status });
    } catch {
      projectsApi.list().then(setProjects).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button onClick={() => setIsCreating((v) => !v)} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded hover:bg-white transition-colors">
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'New Project'}
        </button>
      </div>

      {isCreating && (
        <PortalCard>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Client</label>
              <select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="input">
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.company || c.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Amount (₹)</label>
              <input required type="number" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Description</label>
              <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input resize-none" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={isSaving || clients.length === 0} className="bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-60">
                {isSaving ? 'Creating…' : 'Create Project'}
              </button>
            </div>
            {clients.length === 0 && <p className="sm:col-span-2 text-xs text-[#888891]">Add a client account first, on the Clients tab.</p>}
          </form>
        </PortalCard>
      )}

      {projects === null ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState label="No projects yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {projects.map((project) => (
            <PortalCard key={project.id}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-[#EDEDED]">{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs text-[#888891]">{project.clientName} · {project.category} · <span className="text-[#D4AF37] inr-price">{formatINR(project.amountINR)}</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={project.status}
                    onChange={(e) => updateStatus(project, e.target.value as ProjectStatus)}
                    className="input py-2 text-xs w-auto"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                    className="w-9 h-9 rounded-full border border-[#222226] flex items-center justify-center text-[#888891] hover:text-[#EDEDED] transition-colors"
                    aria-label={expandedId === project.id ? 'Collapse revisions' : 'View revisions'}
                  >
                    {expandedId === project.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expandedId === project.id && <ProjectRevisions projectId={project.id} />}
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectRevisions: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [revisions, setRevisions] = useState<Revision[] | null>(null);

  useEffect(() => {
    revisionsApi.list(projectId).then(setRevisions).catch(() => setRevisions([]));
  }, [projectId]);

  const updateStatus = async (rev: Revision, status: Revision['status']) => {
    setRevisions((prev) => prev?.map((r) => (r.id === rev.id ? { ...r, status } : r)) || null);
    try {
      await revisionsApi.updateStatus(rev.id, status);
    } catch {
      revisionsApi.list(projectId).then(setRevisions).catch(() => {});
    }
  };

  return (
    <div className="mt-5 pt-5 border-t border-[#222226] flex flex-col gap-3">
      {revisions === null ? (
        <div className="text-xs text-[#888891] uppercase tracking-widest">Loading revisions…</div>
      ) : revisions.length === 0 ? (
        <p className="text-xs text-[#888891]">No revision requests on this project.</p>
      ) : (
        revisions.map((rev) => (
          <div key={rev.id} className="bg-[#0A0A0B] border border-[#222226] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] text-[#888891] uppercase tracking-widest mb-1">{formatDate(rev.createdAt)}</div>
              <p className="text-sm text-[#EDEDED]">{rev.comment}</p>
            </div>
            <select value={rev.status} onChange={(e) => updateStatus(rev, e.target.value as Revision['status'])} className="input py-2 text-xs w-auto shrink-0">
              <option value="pending">pending</option>
              <option value="in_progress">in progress</option>
              <option value="resolved">resolved</option>
            </select>
          </div>
        ))
      )}
    </div>
  );
};
