import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, StatusBadge, LoadingState, EmptyState, Input, Select, Textarea, PrimaryButton, GhostButton, formatINR, formatDate } from '../ui';
import type { Invoice, User } from '../../../types';

const emptyForm = { clientId: '', amountINR: '', dueDate: '', description: '' };

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [i, c] = await Promise.all([
        adminApi.get<Invoice[]>('/api/invoices'),
        adminApi.get<User[]>('/api/clients'),
      ]);
      setInvoices(i);
      setClients(c);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: string, status: Invoice['status']) => {
    const updated = await adminApi.patch<Invoice>(`/api/invoices/${id}`, { status });
    setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const client = clients.find((c) => c.id === form.clientId);
      if (!client) throw new Error('Select a client');
      const newInvoice = await adminApi.post<Invoice>('/api/invoices', {
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        clientId: client.id,
        clientName: client.name,
        amountINR: Number(form.amountINR) || 0,
        dueDate: form.dueDate,
        description: form.description,
        status: 'unpaid',
      });
      setInvoices((prev) => [newInvoice, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const totalOutstanding = invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amountINR, 0);

  if (loading) return <LoadingState />;

  return (
    <Card>
      <CardHeader
        title="Invoices"
        subtitle={`${formatINR(totalOutstanding)} outstanding across ${invoices.filter((i) => i.status !== 'paid').length} invoices`}
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> New Invoice</PrimaryButton>}
      />

      {showForm ? (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 border-b border-[#222226] p-5 sm:grid-cols-2">
          <Select required value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
            <option value="">Select client…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input type="number" required placeholder="Amount (₹)" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} />
          <Input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Textarea className="sm:col-span-2" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error ? <p className="text-xs text-red-400 sm:col-span-2">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Invoice'}</PrimaryButton>
            <GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton>
          </div>
        </form>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState message="No invoices yet — create one once a project is confirmed." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#222226] text-[10px] font-bold uppercase tracking-wider text-[#888891]">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222226]">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-5 py-3 font-semibold text-[#EDEDED]">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-[#888891]">{inv.clientName}</td>
                  <td className="px-5 py-3 font-semibold text-[#EDEDED]">{formatINR(inv.amountINR)}</td>
                  <td className="px-5 py-3 text-[#888891]">{formatDate(inv.dueDate)}</td>
                  <td className="px-5 py-3">
                    <Select value={inv.status} onChange={(e) => void updateStatus(inv.id, e.target.value as Invoice['status'])} className="w-auto">
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
