import React, { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../../../lib/adminApi';
import type { Project, ProjectStatus, User } from '../../../types';
import { Card, CardHeader, PrimaryButton, GhostButton, Input, Select, Textarea, StatusBadge, EmptyState, formatINR, formatDate } from '../ui';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', clientId: '', category: 'Short Form', description: '',
    amountINR: '', studioCostINR: '', deliveryDate: '', status: 'in_progress' as ProjectStatus,
  });

  const load = async () => {
    const [p, c] = await Promise.all([
      adminApi.get<Project[]>('/api/projects'),
      adminApi.get<User[]>('/api/clients'),
    ]);
    setProjects(Array.isArray(p) ? p : []);
    setClients(Array.isArray(c) ? c : []);
  };

  useEffect(() => { void load().catch((e) => setError(e.message || 'Failed to load')); }, []);

  const totals = useMemo(() => ({
    revenue: projects.reduce((s, p) => s + (p.amountINR || 0), 0),
    count: projects.length,
  }), [projects]);

  const resetForm = () => {
    setForm({ title: '', clientId: '', category: 'Short Form', description: '', amountINR: '', studioCostINR: '', deliveryDate: '', status: 'in_progress' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setShowForm(true);
    setForm({
      title: p.title, clientId: p.clientId, category: p.category, description: p.description || '',
      amountINR: String(p.amountINR || ''), studioCostINR: '',
      deliveryDate: p.deliveryDate ? p.deliveryDate.slice(0, 10) : '', status: p.status,
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const client = clients.find((c) => c.id === form.clientId);
      if (!client) throw new Error('Select a client');
      const amount = Number(form.amountINR) || 0;
      const cost = Number(form.studioCostINR) || 0;
      const desc = cost > 0
        ? `${form.description}\n\n[studio_cost_inr=${cost}][profit_inr=${amount - cost}]`
        : form.description;
      const payload = {
        title: form.title, clientId: client.id, clientName: client.name, clientEmail: client.email,
        category: form.category, status: form.status, description: desc,
        startDate: new Date().toISOString().slice(0, 10),
        deliveryDate: form.deliveryDate || undefined, amountINR: amount,
      };
      if (editingId) await adminApi.put(`/api/projects/${editingId}`, payload);
      else await adminApi.post('/api/projects', payload);
      await load();
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: ProjectStatus) => {
    await adminApi.put(`/api/projects/${id}`, { status });
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const parseMeta = (description?: string) => {
    const cost = description?.match(/\[studio_cost_inr=(\d+(?:\.\d+)?)\]/);
    const profit = description?.match(/\[profit_inr=(-?\d+(?:\.\d+)?)\]/);
    return {
      cost: cost ? Number(cost[1]) : null,
      profit: profit ? Number(profit[1]) : null,
      clean: (description || '').replace(/\[studio_cost_inr=[^\]]+\]/g, '').replace(/\[profit_inr=[^\]]+\]/g, '').trim(),
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#888891]">Projects</p><p className="mt-2 text-2xl font-black text-white">{totals.count}</p></Card>
        <Card className="p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#888891]">Billed</p><p className="mt-2 text-2xl font-black text-[#D4AF37]">{formatINR(totals.revenue)}</p></Card>
        <Card className="p-5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#888891]">In progress</p><p className="mt-2 text-2xl font-black text-white">{projects.filter((p) => p.status === 'in_progress').length}</p></Card>
      </div>
      <Card padding="none">
        <CardHeader title="Client work tracker" subtitle="Billables, deadlines, studio cost / profit" action={<PrimaryButton type="button" onClick={() => { resetForm(); setShowForm(true); }}>+ New work</PrimaryButton>} />
        {showForm ? (
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 border-b border-[#222226] p-5 sm:grid-cols-2">
            <Input placeholder="Work title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <Select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
              <option value="">Select client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Short Form</option><option>Brand Content</option><option>Long Form</option><option>Social Media</option><option>Documentary</option>
            </Select>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              <option value="in_progress">In progress</option><option value="in_review">In review</option><option value="delivered">Delivered</option>
            </Select>
            <Input type="number" placeholder="Client bill ₹" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} required />
            <Input type="number" placeholder="Studio cost ₹" value={form.studioCostINR} onChange={(e) => setForm({ ...form, studioCostINR: e.target.value })} />
            <Input type="date" value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} />
            <Textarea className="sm:col-span-2" placeholder="Scope / notes" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {error ? <p className="text-xs text-red-400 sm:col-span-2">{error}</p> : null}
            <div className="flex gap-2 sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update work' : 'Create work'}</PrimaryButton>
              <GhostButton type="button" onClick={resetForm}>Cancel</GhostButton>
            </div>
          </form>
        ) : null}
        {projects.length === 0 ? <EmptyState message="No projects yet." /> : (
          <div className="divide-y divide-[#222226]">
            {projects.map((p) => {
              const meta = parseMeta(p.description);
              const profit = meta.profit ?? (meta.cost != null ? p.amountINR - meta.cost : null);
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[#EDEDED]">{p.title}</h4>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#888891]">
                      {p.clientName} · {p.category} · Bill {formatINR(p.amountINR)}
                      {meta.cost != null ? ` · Cost ${formatINR(meta.cost)}` : ''}
                      {profit != null ? ` · Profit ${formatINR(profit)}` : ''}
                      {p.deliveryDate ? ` · Due ${formatDate(p.deliveryDate)}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={p.status} onChange={(e) => void updateStatus(p.id, e.target.value as ProjectStatus)} className="w-auto">
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="delivered">Delivered</option>
                    </Select>
                    <GhostButton type="button" onClick={() => startEdit(p)}>Edit</GhostButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Projects;
