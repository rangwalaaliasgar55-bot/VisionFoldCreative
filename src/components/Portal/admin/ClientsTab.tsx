import React, { useEffect, useState } from 'react';
import { clientsApi } from '../../../lib/api';
import type { User } from '../../../types';
import { PortalCard, EmptyState, LoadingState, formatDate } from '../portalUi';
import { Plus, X, Copy, Check } from 'lucide-react';

export const ClientsTab: React.FC = () => {
  const [clients, setClients] = useState<User[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    clientsApi.list().then(setClients).catch(() => setClients([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { client, initialPassword } = await clientsApi.create(form);
      setClients((prev) => [...(prev || []), client]);
      setNewCredentials({ email: client.email, password: initialPassword });
      setForm({ name: '', email: '', company: '', phone: '' });
      setIsCreating(false);
    } catch {
      // form stays open with entered data
    } finally {
      setIsSaving(false);
    }
  };

  const copyCredentials = () => {
    if (!newCredentials) return;
    navigator.clipboard.writeText(`Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {newCredentials && (
        <PortalCard className="border-[#D4AF37]/40 bg-[#D4AF37]/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-2">New Client Account Created</div>
              <p className="text-sm text-[#EDEDED] mb-1">Share these portal login details with your client — this password won't be shown again.</p>
              <div className="font-mono text-sm text-[#888891] mt-3">
                <div>Email: <span className="text-[#EDEDED]">{newCredentials.email}</span></div>
                <div>Password: <span className="text-[#EDEDED]">{newCredentials.password}</span></div>
              </div>
            </div>
            <button onClick={copyCredentials} className="flex items-center gap-2 border border-[#222226] rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#888891] hover:text-[#EDEDED] hover:border-[#D4AF37] transition-colors shrink-0">
              {copied ? <Check className="w-3.5 h-3.5 text-[#25D366]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </PortalCard>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating((v) => !v)}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded hover:bg-white transition-colors"
        >
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'New Client'}
        </button>
      </div>

      {isCreating && (
        <PortalCard>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Company</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={isSaving} className="bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-60">
                {isSaving ? 'Creating…' : 'Create Client Account'}
              </button>
            </div>
          </form>
        </PortalCard>
      )}

      {clients === null ? (
        <LoadingState />
      ) : clients.length === 0 ? (
        <EmptyState label="No client accounts yet." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <PortalCard key={client.id}>
              <h3 className="font-bold text-[#EDEDED] mb-1">{client.name}</h3>
              {client.company && <p className="text-xs text-[#D4AF37] mb-3">{client.company}</p>}
              <div className="text-xs text-[#888891] space-y-1">
                <div>{client.email}</div>
                {client.phone && <div>{client.phone}</div>}
                <div>Joined {formatDate(client.createdAt)}</div>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
};
