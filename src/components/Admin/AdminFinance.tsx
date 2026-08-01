import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Receipt,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api } from '../../lib/api';
import { Invoice, Expense, User, Project } from '../../types';
import { formatINR, formatDate } from '../../lib/formatters';

interface AdminFinanceProps {
  invoices: Invoice[];
  expenses: Expense[];
  clients: User[];
  projects: Project[];
  onRefresh: () => void;
}

export const AdminFinance: React.FC<AdminFinanceProps> = ({
  invoices,
  expenses,
  clients,
  projects,
  onRefresh,
}) => {
  const [showInvModal, setShowInvModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);

  // Invoice Form State
  const [invClientId, setInvClientId] = useState('');
  const [invNumber, setInvNumber] = useState(`INV-2026-${String(invoices.length + 1).padStart(3, '0')}`);
  const [invAmount, setInvAmount] = useState(14000);
  const [invDueDate, setInvDueDate] = useState('');
  const [invDesc, setInvDesc] = useState('');

  // Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('Software/Tools');
  const [expAmount, setExpAmount] = useState(1500);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);

  const totalIncomeINR = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountINR, 0);

  const totalExpenseINR = expenses.reduce((sum, e) => sum + e.amountINR, 0);
  const netProfitINR = totalIncomeINR - totalExpenseINR;

  // Revenue chart data by month
  const chartData = [
    { month: 'May 2026', Income: 28000, Expense: 3000 },
    { month: 'Jun 2026', Income: 35000, Expense: 4000 },
    { month: 'Jul 2026', Income: 21000, Expense: 2800 },
    { month: 'Aug 2026', Income: totalIncomeINR || 14000, Expense: totalExpenseINR || 2000 },
  ];

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const client = clients.find((c) => c.id === invClientId);

    try {
      await api.createInvoice({
        invoiceNumber: invNumber,
        clientId: invClientId || clients[0]?.id || '',
        clientName: client?.name || 'Client',
        amountINR: invAmount,
        dueDate: invDueDate || new Date().toISOString().split('T')[0],
        status: 'unpaid',
        description: invDesc || 'Video Editing Services',
      });
      onRefresh();
      setShowInvModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createExpense({
        title: expTitle,
        category: expCategory,
        amountINR: expAmount,
        date: expDate,
      });
      onRefresh();
      setShowExpModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  const handleToggleInvoicePaid = async (inv: Invoice) => {
    try {
      const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
      await api.updateInvoice(inv.id, {
        status: newStatus,
        paidAt: newStatus === 'paid' ? new Date().toISOString() : undefined,
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update invoice');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Type', 'Identifier/Title', 'Party/Category', 'Amount (INR)', 'Date', 'Status'];
    const invRows = invoices.map((i) => [
      'Income',
      i.invoiceNumber,
      i.clientName,
      i.amountINR,
      i.dueDate,
      i.status,
    ]);
    const expRows = expenses.map((e) => [
      'Expense',
      e.title,
      e.category,
      e.amountINR,
      e.date,
      'Paid',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...invRows.map((r) => r.join(',')), ...expRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VisionFoldCreative_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Financial Overview Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400">
            Agency Accounting
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Financial Log & Revenue</h2>
          <p className="text-xs text-slate-400">
            Track income, expenses, profit margins, and export financial CSV data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInvModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Issue Invoice
          </button>
          <button
            onClick={() => setShowExpModal(true)}
            className="px-3.5 py-2 bg-[#161922] hover:bg-[#222736] text-slate-200 border border-[#222736] font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-red-400" />
            Log Expense
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#161922] hover:bg-[#222736] text-slate-200 border border-[#222736] font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 fold-card">
          <span className="text-xs font-bold uppercase text-slate-400">Total Collected Income</span>
          <div className="text-3xl font-extrabold text-emerald-400 inr-price mt-2">
            {formatINR(totalIncomeINR)}
          </div>
        </div>

        <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 fold-card">
          <span className="text-xs font-bold uppercase text-slate-400">Total Expenses</span>
          <div className="text-3xl font-extrabold text-red-400 inr-price mt-2">
            {formatINR(totalExpenseINR)}
          </div>
        </div>

        <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 fold-card">
          <span className="text-xs font-bold uppercase text-slate-400">Net Profit</span>
          <div className="text-3xl font-extrabold text-amber-400 inr-price mt-2">
            {formatINR(netProfitINR)}
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-6">Monthly Financial Performance (INR)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222736" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#11131a', borderColor: '#222736', color: '#f8fafc' }}
              />
              <Bar dataKey="Income" fill="#10b981" name="Collected Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Client Invoices Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#161922] uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Client</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Amount (INR)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Toggle Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222736]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#161922]/50">
                  <td className="p-3 font-mono font-bold text-amber-400">{inv.invoiceNumber}</td>
                  <td className="p-3 font-semibold text-white">{inv.clientName}</td>
                  <td className="p-3 text-slate-400">{formatDate(inv.dueDate)}</td>
                  <td className="p-3 font-bold text-white inr-price">{formatINR(inv.amountINR)}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleInvoicePaid(inv)}
                      className="px-2.5 py-1 rounded bg-[#161922] hover:bg-[#222736] text-amber-400 font-semibold text-[11px]"
                    >
                      Mark as {inv.status === 'paid' ? 'Unpaid' : 'Paid'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Agency Expense Tracker</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#161922] uppercase font-bold text-slate-400">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount (INR)</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222736]">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#161922]/50">
                  <td className="p-3 font-semibold text-white">{exp.title}</td>
                  <td className="p-3 font-mono text-slate-400">{exp.category}</td>
                  <td className="p-3 text-slate-400">{formatDate(exp.date)}</td>
                  <td className="p-3 font-bold text-red-400 inr-price">{formatINR(exp.amountINR)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ISSUE INVOICE MODAL */}
      {showInvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131a] border border-[#222736] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Issue Client Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Client *
                </label>
                <select
                  value={invClientId}
                  onChange={(e) => setInvClientId(e.target.value)}
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                >
                  <option value="">Select Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Client'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={invNumber}
                  onChange={(e) => setInvNumber(e.target.value)}
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  placeholder="e.g. 5 Short Form Video Edits Batch"
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG EXPENSE MODAL */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#11131a] border border-[#222736] rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Log Agency Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. CapCut Pro Subscription"
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-xs"
                  >
                    <option value="Software/Tools">Software/Tools</option>
                    <option value="Subcontracting">Subcontracting</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Amount (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full p-2.5 bg-[#161922] border border-[#222736] rounded-xl text-slate-100 text-sm"
                />
              </div>

              <div className="flex items-center gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
