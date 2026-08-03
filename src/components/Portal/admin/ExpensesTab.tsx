import React, { useEffect, useState } from 'react';
import { expensesApi } from '../../../lib/api';
import type { Expense } from '../../../types';
import { PortalCard, EmptyState, LoadingState, formatINR, formatDate } from '../portalUi';
import { Plus, X, Trash2 } from 'lucide-react';

const CATEGORIES: Expense['category'][] = ['Software/Tools', 'Subcontracting', 'Equipment', 'Marketing', 'Operations'];

export const ExpensesTab: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: '', category: CATEGORIES[0], amountINR: '', date: new Date().toISOString().slice(0, 10), description: '' });

  useEffect(() => {
    expensesApi.list().then(setExpenses).catch(() => setExpenses([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const created = await expensesApi.create({
        title: form.title,
        category: form.category,
        amountINR: Number(form.amountINR) || 0,
        date: form.date,
        description: form.description,
      });
      setExpenses((prev) => [...(prev || []), created]);
      setForm({ title: '', category: CATEGORIES[0], amountINR: '', date: new Date().toISOString().slice(0, 10), description: '' });
      setIsCreating(false);
    } catch {
      // keep form open
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    setExpenses((prev) => prev?.filter((e) => e.id !== id) || null);
    try {
      await expensesApi.remove(id);
    } catch {
      expensesApi.list().then(setExpenses).catch(() => {});
    }
  };

  const total = (expenses || []).reduce((sum, e) => sum + e.amountINR, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-[#888891]">
          Total tracked: <span className="text-[#D4AF37] font-bold inr-price">{formatINR(total)}</span>
        </div>
        <button onClick={() => setIsCreating((v) => !v)} className="flex items-center gap-2 bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-5 py-2.5 rounded hover:bg-white transition-colors self-start sm:self-auto">
          {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isCreating ? 'Cancel' : 'New Expense'}
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
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Expense['category'] })} className="input">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Amount (₹)</label>
              <input required type="number" value={form.amountINR} onChange={(e) => setForm({ ...form, amountINR: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Date</label>
              <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] uppercase tracking-widest text-[#888891] font-bold mb-2">Notes (optional)</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button type="submit" disabled={isSaving} className="bg-[#D4AF37] text-[#0A0A0B] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-60">
                {isSaving ? 'Saving…' : 'Add Expense'}
              </button>
            </div>
          </form>
        </PortalCard>
      )}

      {expenses === null ? (
        <LoadingState />
      ) : expenses.length === 0 ? (
        <EmptyState label="No expenses logged yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {expenses.map((exp) => (
            <PortalCard key={exp.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <div className="font-medium text-[#EDEDED]">{exp.title}</div>
                <div className="text-xs text-[#888891]">{exp.category} · {formatDate(exp.date)}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-[#D4AF37] inr-price">{formatINR(exp.amountINR)}</span>
                <button onClick={() => handleDelete(exp.id)} aria-label="Delete expense" className="text-[#888891] hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
};
