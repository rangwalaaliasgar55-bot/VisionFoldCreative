import React, { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, StatusBadge, LoadingState, EmptyState, Select, formatDate } from '../ui';
import type { Message } from '../../../types';

export const Leads: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<Message[]>('/api/messages');
      setMessages(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateStatus = async (id: string, status: Message['status']) => {
    const updated = await adminApi.patch<Message>(`/api/messages/${id}/status`, { status });
    setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  if (loading) return <LoadingState />;

  return (
    <Card>
      {messages.length === 0 ? (
        <EmptyState message="No inquiries yet — new leads from the contact form and WhatsApp funnel will show up here." />
      ) : (
        <div className="divide-y divide-[#222226]">
          {messages.map((m) => (
            <div key={m.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-[#EDEDED]">{m.name}</h4>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888891]">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {m.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {m.phone}</span>
                    <span>{formatDate(m.createdAt)}</span>
                  </div>
                </div>
                <Select
                  value={m.status}
                  onChange={(e) => void updateStatus(m.id, e.target.value as Message['status'])}
                  className="w-auto"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </Select>
              </div>

              <button
                onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-white"
              >
                {expanded === m.id ? 'Hide details' : 'View details'}
              </button>

              {expanded === m.id ? (
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-[#0A0A0B] p-4 text-sm sm:grid-cols-2">
                  <div><span className="text-[#888891]">Company: </span>{m.company || '—'}</div>
                  <div><span className="text-[#888891]">Project Type: </span>{m.projectType}</div>
                  <div><span className="text-[#888891]">Budget: </span>{m.budgetRange}</div>
                  <div><span className="text-[#888891]">Deadline: </span>{m.deadline || '—'}</div>
                  <div className="sm:col-span-2"><span className="text-[#888891]">Message: </span>{m.message}</div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
