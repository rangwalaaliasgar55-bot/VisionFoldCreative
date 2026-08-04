import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { IndianRupee, Users, Inbox, FolderKanban } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, StatCard, LoadingState, formatINR } from '../ui';
import type { Message, Invoice, Project, User } from '../../../types';

const PIE_COLORS = ['#D4AF37', '#888891', '#3b82f6', '#22c55e', '#ef4444'];

export const Overview: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const errorMsg = err instanceof Error ? err.message : 'Failed to load overview data';
        setError(errorMsg);
        // Fallback to empty state for resilience
        console.error('[v0] Overview data fetch failed:', errorMsg);
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
      const date = new Date(inv.paidAt || inv.createdAt);
      const key = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      byMonth.set(key, (byMonth.get(key) || 0) + inv.amountINR);
    });
    return Array.from(byMonth.entries()).map(([month, revenue]) => ({ month, revenue }));
  }, [invoices]);

  const leadBreakdown = useMemo(() => {
    const counts = { new: 0, contacted: 0, closed: 0 };
    messages.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [messages]);

  const projectBreakdown = useMemo(() => {
    const counts: Record<string, number> = { in_progress: 0, in_review: 0, delivered: 0 };
    projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [projects]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-6 text-center">
        <h3 className="text-sm font-semibold text-red-300 mb-2">Failed to Load Overview</h3>
        <p className="text-xs text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded px-4 py-2 bg-red-600/20 text-red-300 text-xs font-medium hover:bg-red-600/30 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatINR(totalRevenue)} icon={IndianRupee} delta={`${formatINR(pendingRevenue)} pending`} deltaTone="neutral" />
        <StatCard label="New Leads" value={String(newLeads)} icon={Inbox} delta={`${messages.length} total inquiries`} deltaTone={newLeads > 0 ? 'up' : 'neutral'} />
        <StatCard label="Active Projects" value={String(activeProjects)} icon={FolderKanban} delta={`${projects.length} total`} deltaTone="neutral" />
        <StatCard label="Clients Onboarded" value={String(clients.length)} icon={Users} deltaTone="neutral" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue Trend" subtitle="Paid invoices by month" />
          <div className="h-72 p-4">
            {revenueTrend.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222226" vertical={false} />
                  <XAxis dataKey="month" stroke="#888891" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888891" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#121215', border: '1px solid #222226', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#EDEDED' }}
                    formatter={(value: number) => [formatINR(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#888891]">No paid invoices yet</div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Lead Status" subtitle="Inquiry pipeline" />
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
          {leadBreakdown.length ? (
            <div className="flex flex-wrap gap-3 border-t border-[#222226] px-4 py-3">
              {leadBreakdown.map((entry, idx) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-[#888891]">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>

      {projectBreakdown.length ? (
        <Card>
          <CardHeader title="Project Pipeline" subtitle="Where active work stands right now" />
          <div className="flex flex-wrap gap-4 p-6">
            {projectBreakdown.map((entry, idx) => (
              <div key={entry.name} className="flex min-w-[140px] flex-1 items-center gap-3 rounded-lg border border-[#222226] bg-[#0A0A0B] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <div>
                  <p className="text-lg font-black text-[#EDEDED]">{entry.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#888891]">{entry.name}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
};
