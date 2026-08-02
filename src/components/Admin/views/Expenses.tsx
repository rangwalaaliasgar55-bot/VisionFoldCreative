import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, LoadingState, EmptyState, Input, Select, PrimaryButton, GhostButton, formatINR, formatDate } from '../ui';
import type { Expense } from '../../../types';

const CATEGORIES: Expense['category'][] = ['Software/Tools', 'Subcontracting', 'Equipment', 'Marketing', 'Operations'];
const emptyForm = { title: '', category: 'Software/Tools' as Expense['category'], amountINR: '', date: '' };

export const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setExpenses(await adminApi.get<Expense[]>('/api/expenses'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newExpense = await adminApi.post<Expense>('/api/expenses', {
        title: form.title,
        category: form.category,
        amountINR: Number(form.amountINR) || 0,
        date: form.date || new Date().toISOString(),
      });
      setExpenses((prev) => [newExpense, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await adminApi.delete(`/api/expenses/${id}`);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const total = expenses.reduce((sum, e) => sum + e.amountINR, 0);

  if (loading) return <LoadingState />;

  return (
    <Card>
      <CardHeader
        title="Expenses"
        subtitle={`${formatINR(total)} tracked total`}
        action={<PrimaryButton onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> Add Expense</PrimaryButton>}
      />

      {showForm ? (
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 border-b border-[#222226] p-5 sm:grid-cols-2">
          <Input placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Expense['category'] })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Input type="number" required placeholder="Amount (₹)" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} />
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <div className="flex gap-2 sm:col-span-2">
            <PrimaryButton type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add Expense'}</PrimaryButton>
            <GhostButton type="button" onClick={() => setShowForm(false)}>Cancel</GhostButton>
          </div>
        </form>
      ) : null}

      {expenses.length === 0 ? (
        <EmptyState message="No expenses tracked yet." />
      ) : (
        <div className="divide-y divide-[#222226]">
          {expenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between gap-3 p-5">
              <div>
                <h4 className="font-bold text-[#EDEDED]">{exp.title}</h4>
                <p className="mt-0.5 text-xs text-[#888891]">{exp.category} · {formatDate(exp.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-[#EDEDED]">{formatINR(exp.amountINR)}</span>
                <button onClick={() => void handleDelete(exp.id)} className="text-[#888891] hover:text-red-400" aria-label="Delete expense">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
