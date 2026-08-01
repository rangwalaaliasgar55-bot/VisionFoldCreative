import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  FileEdit,
  Users,
  FolderKanban,
  DollarSign,
  Mail,
  Film,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Project, Invoice, Message, User, Expense, PortfolioItem } from '../../types';

import { AdminOverview } from './AdminOverview';
import { AdminContentEditor } from './AdminContentEditor';
import { AdminClients } from './AdminClients';
import { AdminProjects } from './AdminProjects';
import { AdminFinance } from './AdminFinance';
import { AdminInquiries } from './AdminInquiries';
import { AdminPortfolio } from './AdminPortfolio';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [pRes, iRes, mRes, cRes, eRes, pfRes] = await Promise.all([
        api.getProjects(),
        api.getInvoices(),
        api.getMessages(),
        api.getClients(),
        api.getExpenses(),
        api.getPortfolio(),
      ]);
      setProjects(pRes);
      setInvoices(iRes);
      setMessages(mRes);
      setClients(cRes);
      setExpenses(eRes);
      setPortfolio(pfRes);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading Admin Operations Suite...
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cms', label: 'Content Editor', icon: FileEdit },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'finance', label: 'Finance & Invoices', icon: DollarSign },
    { id: 'inquiries', label: 'Inquiries', icon: Mail, badge: messages.filter((m) => m.status === 'new').length },
    { id: 'portfolio', label: 'Portfolio Manager', icon: Film },
  ];

  return (
    <div className="min-h-screen text-slate-100 pb-20">
      {/* Admin Top Header */}
      <div className="bg-[#11131a] border-b border-[#222736] px-4 sm:px-6 lg:px-8 py-4 sticky top-16 z-30 backdrop-blur-md bg-[#11131a]/90">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-amber-400">
              Agency Operations · Aliasgar (Admin)
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Vision Fold Creative Suite
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              className="p-2 rounded-xl bg-[#161922] hover:bg-[#222736] text-slate-300 border border-[#222736] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Admin Navigation Bar */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-[#161922] text-slate-300 border border-[#222736] hover:bg-[#222736]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'overview' && (
          <AdminOverview
            projects={projects}
            invoices={invoices}
            messages={messages}
            expenses={expenses}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'cms' && <AdminContentEditor />}

        {activeTab === 'clients' && (
          <AdminClients clients={clients} projects={projects} onRefresh={fetchAllData} />
        )}

        {activeTab === 'projects' && (
          <AdminProjects projects={projects} clients={clients} onRefresh={fetchAllData} />
        )}

        {activeTab === 'finance' && (
          <AdminFinance
            invoices={invoices}
            expenses={expenses}
            clients={clients}
            projects={projects}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'inquiries' && (
          <AdminInquiries messages={messages} onRefresh={fetchAllData} />
        )}

        {activeTab === 'portfolio' && (
          <AdminPortfolio portfolio={portfolio} onRefresh={fetchAllData} />
        )}
      </div>
    </div>
  );
};
