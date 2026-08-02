import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, StatusBadge, LoadingState, EmptyState, Input, Select, Textarea, PrimaryButton, GhostButton, formatINR, formatDate } from '../ui';
import type { Project, User, ProjectStatus } from '../../../types';

const emptyForm = {
  title: '', clientId: '', category: 'Short Form', description: '', amountINR: '', deliveryDate: '',
};

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        adminApi.get<Project[]>('/api/projects'),
        adminApi.get<User[]>('/api/clients'),
      ]);
      setProjects(p);
      setClients(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: string, status: ProjectStatus) => {
    const updated = await adminApi.put<Project>(`/api/projects/${id}`, { status });
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const client = clients.find((c) => c.id === form.clientId);
      if (!client) throw new Error('Select a client');
      const newProject = await adminApi.post<Project>('/api/projects', {
        title: form.title,
        clientId: client.id,
        clientName: client.name,
        clientEmail: client.email,
        category: form.category,
        status: 'in_progress',
        description: form.description,
        amountINR: Number(form.amountINR) || 0,
        startDate: new Date().toISOString(),
        deliveryDate: form.deliveryDate || undefined,
      });
      setProjects((prev) => [newProject, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <Card>
      <CardHeader
        title="Projects"
        subtitle={`${projects.length} total`}
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> New Project</PrimaryButton>}
      />

      {showForm ? (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 border-b border-[#222226] p-5 sm:grid-cols-2">
          <Input placeholder="Project title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>Short Form</option>
            <option>Brand Content</option>
            <option>Long Form</option>
            <option>Social Media</option>
            <option>Documentary</option>
          </Select>
          <Input type="number" placeholder="Amount (₹)" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} />
          <Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
          <Textarea className="sm:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error ? <p className="text-xs text-red-400 sm:col-span-2">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Project'}</PrimaryButton>
            <GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton>
          </div>
        </form>
      ) : null}

      {projects.length === 0 ? (
        <EmptyState message="No projects yet — create one once a lead turns into paid work." />
      ) : (
        <div className="divide-y divide-[#222226]">
          {projects.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-[#EDEDED]">{p.title}</h4>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-xs text-[#888891]">{p.clientName} · {p.category} · {formatINR(p.amountINR)} · Due {formatDate(p.deliveryDate)}</p>
              </div>
              <Select value={p.status} onChange={(e) => void updateStatus(p.id, e.target.value as ProjectStatus)} className="w-auto">
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="delivered">Delivered</option>
              </Select>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
