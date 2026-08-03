import React, { useEffect, useState } from 'react';
import { invoicesApi, clientsApi } from '../../../lib/api';
import type { Invoice, User } from '../../../types';
import { PortalCard, EmptyState, LoadingState, formatINR, formatDate } from '../portalUi';
import { Plus, X } from 'lucide-react';

export const InvoicesTab: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [clients, setClients] = useState<User[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ clientId: '', description: '', amountINR: '', dueDate: '' });

  useEffect(() => {
    invoicesApi.list().then(setInvoices).catch(() => setInvoices([]));
    clientsApi.list().then(setClients).catch(() => setClients([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === form.clientId);
    if (!client) return;
    setIsSaving(true);
    try {
      const created = await invoicesApi.create({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        clientId: client.id,
        clientName: client.name,
        amountINR: Number(form.amountINR) || 0,
        dueDate: form.dueDate,
        status: 'unpaid',
        description: form.description,
      });
      setInvoices((prev) => [...(prev || []), created]);
      setForm({ clientId: '', description: '', amountINR: '', dueDate: '' });
      setIsCreating(false);
    } catch {
      // keep form open
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (inv: Invoice, status: Invoice['status']) => {
    setInvoices((prev) => prev?.map((i) => (i.id === inv.id ? { ...i, status } : i)) || null);
    try {
      await invoicesApi.update(inv.id, { status, ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}) });
    } catch {
      invoicesApi.list().then(setInvoices).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button onClick={() => setIsCreating((v) => !v)} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded hover:bg-white transition-colors">
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'New Invoice'}
        </button>
      </div>

      {isCreating && (
        <PortalCard>
          <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4">
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
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Amount (₹)</label>
              <input required type="number" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Due Date</label>
              <input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Description</label>
              <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={isSaving || clients.length === 0} className="bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-60">
                {isSaving ? 'Creating…' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </PortalCard>
      )}

      {invoices === null ? (
        <LoadingState />
      ) : invoices.length === 0 ? (
        <EmptyState label="No invoices yet." />
      ) : (
        <div className="flex flex-col gap-4">
          {invoices.map((inv) => (
            <PortalCard key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-[#888891] uppercase tracking-widest font-bold mb-1">{inv.invoiceNumber} · {inv.clientName}</div>
                <div className="text-[#EDEDED] font-medium mb-1">{inv.description}</div>
                <div className="text-xs text-[#888891]">Due {formatDate(inv.dueDate)}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-[#D4AF37] inr-price">{formatINR(inv.amountINR)}</span>
                <select value={inv.status} onChange={(e) => updateStatus(inv, e.target.value as Invoice['status'])} className="input py-2 text-xs w-auto">
                  <option value="unpaid">unpaid</option>
                  <option value="paid">paid</option>
                  <option value="overdue">overdue</option>
                </select>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
};
