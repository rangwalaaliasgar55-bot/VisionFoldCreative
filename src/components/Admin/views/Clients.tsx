import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, Copy, Check, Building2, Mail, Phone, Pencil, Trash2, X } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import type { User } from '../../../types';
import { PrimaryButton, GhostButton, Input, Card, CardHeader, EmptyState } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminApi.get<User[]>('/api/clients');
      setClients(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q),
    );
  }, [clients, query]);

  const resetForm = () => {
    setForm({ name: '', email: '', company: '', phone: '', password: '' });
    setEditing(null);
    setShowForm(false);
  };

  const startEdit = (c: User) => {
    setEditing(c);
    setShowForm(true);
    setForm({
      name: c.name,
      email: c.email,
      company: c.company || '',
      phone: c.phone || '',
      password: '',
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError('');
    setCreatedInfo(null);
    try {
      if (editing) {
        const updated = await adminApi.put<User>(`/api/clients/${editing.id}`, {
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          phone: form.phone.trim(),
          password: form.password.trim() || undefined,
        });
        setClients((prev) => prev.map((c) => (c.id === editing.id ? updated : c)));
        resetForm();
      } else {
        const result = await adminApi.post<{ client: User; initialPassword: string; loginEmail: string }>(
          '/api/clients',
          {
            name: form.name.trim(),
            email: form.email.trim(),
            company: form.company.trim(),
            phone: form.phone.trim(),
            password: form.password.trim(),
          },
        );
        setClients((prev) => [...prev, result.client]);
        setCreatedInfo(`Login: ${result.loginEmail} · Temp password: ${result.initialPassword}`);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (c: User) => {
    if (!confirm(`Delete client ${c.name}? This cannot be undone.`)) return;
    try {
      await adminApi.delete(`/api/clients/${c.id}`);
      setClients((prev) => prev.filter((x) => x.id !== c.id));
    } catch (err: any) {
      setError(err.message || 'Delete failed');
    }
  };

  const copyInfo = async () => {
    if (!createdInfo) return;
    await navigator.clipboard.writeText(createdInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">CRM</p>
          <h2 className="text-xl font-black text-white">Clients</h2>
          <p className="text-sm text-[#8A857C]">{clients.length} onboarded · create, edit, delete, portal access</p>
        </div>
        <PrimaryButton type="button" onClick={() => { resetForm(); setShowForm(true); }}>
          <UserPlus className="h-4 w-4" /> Add client
        </PrimaryButton>
      </div>

      {createdInfo ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <span>{createdInfo}</span>
          <button type="button" onClick={() => void copyInfo()} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 px-3 py-1 text-xs font-bold uppercase">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : null}
      {error ? <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}

      {showForm ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <CardHeader title={editing ? `Edit ${editing.name}` : 'New client'} subtitle="WordPress-style: change any field and save" />
            <button type="button" onClick={resetForm} className="text-[#888] hover:text-white"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={onSubmit} className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder={editing ? 'New password (optional)' : 'Password (optional)'} type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <div className="flex items-end gap-2">
              <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update client' : 'Create client'}</PrimaryButton>
              <GhostButton type="button" onClick={resetForm}>Cancel</GhostButton>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#666]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, company…"
          className="w-full rounded-xl border border-white/10 bg-[#0C0C10] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#666]"
        />
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={query ? 'No clients match your search.' : 'No clients yet — add your first one.'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-[#0C0C10] p-5 transition hover:border-[#D4AF37]/30">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white">{c.name}</h3>
                  {c.company ? (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#8A857C]">
                      <Building2 className="h-3 w-3" /> {c.company}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Client</span>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-[#B8B3AA]">
                <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#666]" /> {c.email}</p>
                {c.phone ? <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#666]" /> {c.phone}</p> : null}
              </div>
              <div className="mt-4 flex gap-2">
                <GhostButton type="button" onClick={() => startEdit(c)}><Pencil className="h-3.5 w-3.5" /> Edit</GhostButton>
                <GhostButton type="button" onClick={() => void onDelete(c)} className="text-red-300"><Trash2 className="h-3.5 w-3.5" /> Delete</GhostButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
