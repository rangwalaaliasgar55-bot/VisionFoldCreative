import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import {
  IndianRupee, Users, Inbox, FolderKanban, Zap, MessageSquare, FileText,
  UserPlus, ExternalLink, CheckCircle2, Clock,
} from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, StatCard, LoadingState, formatINR } from '../ui';
import type { Message, Invoice, Project, User } from '../../../types';

const PIE_COLORS = ['#D4AF37', '#888891', '#3b82f6', '#22c55e', '#ef4444'];

type NavigateFn = (view: string) => void;

interface OverviewProps {
  onNavigate?: NavigateFn;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const [m, i, p, c] = await Promise.all([
          adminApi.get<Message[]>('/api/messages'),
          adminApi.get<Invoice[]>('/api/invoices'),
          adminApi.get<Project[]>('/api/projects'),
          adminApi.get<User[]>('/api/clients'),
        ]);
        setMessages(m);
        setInvoices(i);
        setProjects(p);
        setClients(c);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load overview data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalRevenue = useMemo(() => invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + i.amountINR, 0), [invoices]);
  const pendingRevenue = useMemo(() => invoices.filter((i) => i.status !== 'paid').reduce((sum, i) => sum + i.amountINR, 0), [invoices]);
  const newLeads = useMemo(() => messages.filter((m) => m.status === 'new').length, [messages]);
  const activeProjects = useMemo(() => projects.filter((p) => p.status !== 'delivered').length, [projects]);

  const revenueTrend = useMemo(() => {
    const byMonth = new Map<string, number>();
    invoices.forEach((inv) => {
      if (inv.status !== 'paid') return;
      const date = new Date((inv as any).dueDate || (inv as any).createdAt || Date.now());
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth.set(key, (byMonth.get(key) || 0) + inv.amountINR);
    });
    return Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([month, value]) => ({ month, value }));
  }, [invoices]);

  const leadBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    messages.forEach((m) => counts.set(m.status || 'new', (counts.get(m.status || 'new') || 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [messages]);

  const projectBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => counts.set(p.status || 'active', (counts.get(p.status || 'active') || 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const recentLeads = useMemo(
    () => [...messages].sort((a, b) => String((b as any).createdAt || '').localeCompare(String((a as any).createdAt || ''))).slice(0, 5),
    [messages]
  );

  const markLeadDone = async (id: string) => {
    try {
      setBusyId(id);
      await adminApi.patch(`/api/messages/${id}/status`, { status: 'contacted' });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'contacted' } : m)));
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const quickActions = [
    { label: 'New lead inbox', icon: Inbox, view: 'leads', hint: 'Triage inquiries' },
    { label: 'Create client', icon: UserPlus, view: 'clients', hint: 'Portal access' },
    { label: 'Add invoice', icon: FileText, view: 'invoices', hint: 'Bill a client' },
    { label: 'AI growth', icon: Zap, view: 'growth', hint: 'Insights & actions' },
    { label: 'Projects', icon: FolderKanban, view: 'projects', hint: 'Active work' },
    { label: 'Growth AI', icon: MessageSquare, view: 'growth', hint: 'Copilot' },
  ];

  if (loading) return <LoadingState label="Loading studio overview..." />;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      ) : null}

      <Card>
        <CardHeader title="Quick actions" subtitle="Jump straight into the work that moves money" />
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.view + action.label}
                type="button"
                onClick={() => onNavigate?.(action.view)}
                className="group flex items-center gap-3 rounded-xl border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-left transition hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] transition group-hover:scale-110">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#EDEDED]">{action.label}</span>
                  <span className="text-[11px] text-[#888891]">{action.hint}</span>
                </span>
                <ExternalLink className="ml-auto h-3.5 w-3.5 text-[#555] opacity-0 transition group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Paid revenue" value={formatINR(totalRevenue)} icon={IndianRupee} accent />
        <StatCard label="Pending invoices" value={formatINR(pendingRevenue)} icon={FileText} />
        <StatCard label="New leads" value={String(newLeads)} icon={Inbox} />
        <StatCard label="Active projects" value={String(activeProjects)} icon={FolderKanban} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Lead triage" subtitle="Newest inquiries — mark contacted in one click" />
          <div className="divide-y divide-[#222226]">
            {recentLeads.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[#888891]">No leads yet</div>
            ) : (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5">
                    {lead.status === 'new' ? (
                      <Clock className="h-4 w-4 text-[#D4AF37]" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#EDEDED]">{lead.name}</p>
                    <p className="truncate text-xs text-[#888891]">{lead.email} · {(lead as any).projectType || 'Project'}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-[#A0A0A0]">{lead.message}</p>
                  </div>
                  {lead.status === 'new' ? (
                    <button
                      type="button"
                      disabled={busyId === lead.id}
                      onClick={() => markLeadDone(lead.id)}
                      className="shrink-0 rounded-lg border border-[#D4AF37]/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] hover:bg-[#D4AF37]/10 disabled:opacity-50"
                    >
                      {busyId === lead.id ? '...' : 'Contacted'}
                    </button>
                  ) : (
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-[#666]">{lead.status}</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-[#222226] p-3">
            <button
              type="button"
              onClick={() => onNavigate?.('leads')}
              className="w-full rounded-lg py-2 text-xs font-bold uppercase tracking-wider text-[#888891] hover:text-[#D4AF37]"
            >
              Open full inbox →
            </button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Studio snapshot" subtitle="Clients & pipeline" />
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between rounded-xl border border-[#222226] bg-[#0A0A0B] px-4 py-3">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm text-[#EDEDED]">Active clients</span>
              </div>
              <span className="text-lg font-black text-[#EDEDED]">{clients.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#222226] bg-[#0A0A0B] px-4 py-3">
              <div className="flex items-center gap-3">
                <Inbox className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm text-[#EDEDED]">Total inquiries</span>
              </div>
              <span className="text-lg font-black text-[#EDEDED]">{messages.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#222226] bg-[#0A0A0B] px-4 py-3">
              <div className="flex items-center gap-3">
                <FolderKanban className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-sm text-[#EDEDED]">Projects</span>
              </div>
              <span className="text-lg font-black text-[#EDEDED]">{projects.length}</span>
            </div>
            {projectBreakdown.length ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {projectBreakdown.map((entry, idx) => (
                  <span key={entry.name} className="rounded-full border border-[#222226] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888891]">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    {entry.name} {entry.value}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue trend" subtitle="Paid invoices by month" />
          <div className="h-72 p-4">
            {revenueTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#222226" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#888891" fontSize={11} />
                  <YAxis stroke="#888891" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#121215', border: '1px solid #222226', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#D4AF37" fill="url(#revFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#888891]">No paid invoices yet</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Lead status" subtitle="Inquiry pipeline" />
          <div className="h-72 p-4">
            {leadBreakdown.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {leadBreakdown.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#121215', border: '1px solid #222226', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#888891]">No inquiries yet</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
