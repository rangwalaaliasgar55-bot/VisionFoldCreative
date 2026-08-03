import React, { useEffect, useState } from 'react';
import { UserPlus, Mail, Phone, Building2 } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, LoadingState, EmptyState, Input, PrimaryButton, GhostButton, formatDate } from '../ui';
import type { User } from '../../../types';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createdInfo, setCreatedInfo] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<User[]>('/api/clients');
      setClients(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const result = await adminApi.post<{ client: User; initialPassword: string }>('/api/clients', form);
      setClients((prev) => [...prev, result.client]);
      setCreatedInfo(`Client added. Temporary password: ${result.initialPassword}`);
      setForm({ name: '', email: '', company: '', phone: '', password: '' });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      {createdInfo ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">{createdInfo}</div>
      ) : null}

      <Card>
        <CardHeader
          title="Clients"
          subtitle={`${clients.length} onboarded`}
          action={<PrimaryButton onClick={() => setShowForm((v) => !v)}><UserPlus className="h-4 w-4" /> Add Client</PrimaryButton>}
        />

        {showForm ? (
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 border-b border-[#222226] p-5 sm:grid-cols-2">
            <Input placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <Input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Temporary password (optional)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {error ? <p className="text-xs text-red-400 sm:col-span-2">{error}</p> : null}
            <div className="flex gap-2 sm:col-span-2">
              <PrimaryButton type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create Client'}</PrimaryButton>
              <GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton>
            </div>
          </form>
        ) : null}

        {clients.length === 0 ? (
          <EmptyState message="No clients yet — add your first client to start tracking their projects and invoices." />
        ) : (
          <div className="divide-y divide-[#222226]">
            {clients.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <h4 className="font-bold text-[#EDEDED]">{c.name}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888891]">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>
                    {c.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span> : null}
                    {c.company ? <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {c.company}</span> : null}
                  </div>
                </div>
                <span className="text-xs text-[#888891]">Joined {formatDate(c.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
