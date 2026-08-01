import React from 'react';
import { FolderKanban, Receipt, DollarSign, Mail, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Project, Invoice, Message, Expense } from '../../types';
import { formatINR } from '../../lib/formatters';

interface AdminOverviewProps {
  projects: Project[];
  invoices: Invoice[];
  messages: Message[];
  expenses: Expense[];
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  projects,
  invoices,
  messages,
  expenses,
  onNavigateTab,
}) => {
  const activeProjects = projects.filter((p) => p.status !== 'delivered');
  const pendingInvoices = invoices.filter((i) => i.status !== 'paid');
  const pendingRevenueINR = pendingInvoices.reduce((sum, i) => sum + i.amountINR, 0);
  const paidRevenueINR = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountINR, 0);
  const newInquiries = messages.filter((m) => m.status === 'new');

  return (
    <div className="space-y-8">
      {/* Top Stat Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <div
          onClick={() => onNavigateTab('projects')}
          className="bg-[#11131a] border border-[#222736] hover:border-amber-500/50 rounded-2xl p-6 transition-all cursor-pointer fold-card"
        >
          <div className="flex items-center justify-between text-slate-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Active Projects</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{activeProjects.length}</div>
          <p className="text-xs text-slate-400 mt-1">In progress & under review</p>
        </div>

        {/* Pending Invoices */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-[#11131a] border border-[#222736] hover:border-amber-500/50 rounded-2xl p-6 transition-all cursor-pointer fold-card"
        >
          <div className="flex items-center justify-between text-slate-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Invoices</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{pendingInvoices.length}</div>
          <p className="text-xs text-amber-400 mt-1 inr-price font-semibold">
            {formatINR(pendingRevenueINR)} outstanding
          </p>
        </div>

        {/* Total Collected Revenue */}
        <div
          onClick={() => onNavigateTab('finance')}
          className="bg-[#11131a] border border-[#222736] hover:border-amber-500/50 rounded-2xl p-6 transition-all cursor-pointer fold-card"
        >
          <div className="flex items-center justify-between text-slate-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Collected Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 inr-price">
            {formatINR(paidRevenueINR)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Paid invoices total</p>
        </div>

        {/* New Inquiries */}
        <div
          onClick={() => onNavigateTab('inquiries')}
          className="bg-[#11131a] border border-[#222736] hover:border-amber-500/50 rounded-2xl p-6 transition-all cursor-pointer fold-card"
        >
          <div className="flex items-center justify-between text-slate-400 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">New Inquiries</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{newInquiries.length}</div>
          <p className="text-xs text-slate-400 mt-1">Awaiting response</p>
        </div>
      </div>

      {/* Recent Inquiries Quick Table */}
      <div className="bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Recent Client Inquiries</h3>
          <button
            onClick={() => onNavigateTab('inquiries')}
            className="text-xs font-semibold text-amber-400 hover:underline flex items-center gap-1"
          >
            View All Inquiries <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {messages.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No client inquiries received yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.slice(0, 4).map((msg) => (
              <div
                key={msg.id}
                className="p-4 rounded-xl bg-[#161922] border border-[#222736] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{msg.name}</span>
                    {msg.company && (
                      <span className="text-xs text-slate-400">({msg.company})</span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        msg.status === 'new'
                          ? 'bg-amber-500/20 text-amber-400'
                          : msg.status === 'contacted'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-1">{msg.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-amber-400">{msg.projectType}</span>
                  <div className="text-[11px] text-slate-400">{msg.phone}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
