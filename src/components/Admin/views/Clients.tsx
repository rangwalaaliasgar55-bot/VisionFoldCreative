import React, { useEffect, useState } from 'react';
import { adminApi } from '../../../lib/adminApi';
import type { User } from '../../../types';
import { PrimaryButton, Input } from '../ui';

export const Clients: React.FC = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await adminApi.get<User[]>('/api/clients');
        setClients(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to load clients');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required. Email and password are optional.');
      return;
    }
    setSaving(true);
    setError('');
    setCreatedInfo(null);
    try {
      const result = await adminApi.post<{ client: User; initialPassword: string; loginEmail: string }>('/api/clients', {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        password: form.password.trim(),
      });
      setClients((prev) => [...prev, result.client]);
      setCreatedInfo(`Client saved. Login: ${result.loginEmail} · Temp password: ${result.initialPassword}`);
      setForm({ name: '', email: '', company: '', phone: '', password: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
        <h2 className="text-lg font-bold text-white">Add client (email & password optional)</h2>
        <p className="mt-1 text-sm text-[#8A857C]">Only a name is required. Missing email/password are auto-generated.</p>
        {createdInfo ? <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{createdInfo}</div> : null}
        {error ? <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div> : null}
        <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#888891]">Name *</p>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Client name" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#888891]">Email (optional)</p>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#888891]">Company</p>
            <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#888891]">Phone</p>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#888891]">Password (optional)</p>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto if empty" />
          </div>
          <div className="flex items-end">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Create client'}</PrimaryButton>
          </div>
        </form>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
        <h2 className="text-lg font-bold text-white">Client list</h2>
        {loading ? <p className="mt-4 text-sm text-[#8A857C]">Loading…</p> : clients.length === 0 ? (
          <p className="mt-4 text-sm text-[#8A857C]">No clients yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {clients.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-sm text-[#8A857C]">{c.email}</p>
                </div>
                <p className="text-xs uppercase tracking-wider text-[#D4AF37]">{c.company || '—'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
export default Clients;
