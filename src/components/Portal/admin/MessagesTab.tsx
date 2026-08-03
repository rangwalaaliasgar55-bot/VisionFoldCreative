import React, { useEffect, useState } from 'react';
import { messagesApi } from '../../../lib/api';
import type { Message } from '../../../types';
import { StatusBadge, PortalCard, EmptyState, LoadingState, formatDate } from '../portalUi';
import { Mail, Phone } from 'lucide-react';

export const MessagesTab: React.FC = () => {
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    messagesApi.list().then(setMessages).catch(() => setMessages([]));
  }, []);

  const updateStatus = async (id: string, status: Message['status']) => {
    setMessages((prev) => prev?.map((m) => (m.id === id ? { ...m, status } : m)) || null);
    try {
      await messagesApi.updateStatus(id, status);
    } catch {
      // best-effort — a manual refresh will resync if this failed
    }
  };

  if (messages === null) return <LoadingState />;
  if (messages.length === 0) return <EmptyState label="No inquiries yet." />;

  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg) => (
        <PortalCard key={msg.id}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-bold text-[#EDEDED]">{msg.name}</h3>
                {msg.company && <span className="text-xs text-[#888891]">· {msg.company}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#888891]">
                <a href={`mailto:${msg.email}`} className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                  <Mail className="w-3.5 h-3.5" /> {msg.email}
                </a>
                <a href={`tel:${msg.phone}`} className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
                  <Phone className="w-3.5 h-3.5" /> {msg.phone}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#888891] uppercase tracking-widest">{formatDate(msg.createdAt)}</span>
              <StatusBadge status={msg.status} />
            </div>
          </div>

          <p className="text-sm text-[#EDEDED] bg-[#0A0A0B] border border-[#222226] rounded-lg p-4 mb-4">{msg.message}</p>

          <div className="flex flex-wrap gap-4 text-xs text-[#888891] mb-4">
            <span><span className="font-bold text-[#EDEDED]">Type:</span> {msg.projectType}</span>
            <span><span className="font-bold text-[#EDEDED]">Budget:</span> {msg.budgetRange}</span>
            {msg.deadline && <span><span className="font-bold text-[#EDEDED]">Deadline:</span> {msg.deadline}</span>}
          </div>

          <div className="flex gap-2">
            {(['new', 'contacted', 'closed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(msg.id, status)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  msg.status === status
                    ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-[#222226] text-[#888891] hover:border-[#D4AF37] hover:text-[#EDEDED]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </PortalCard>
      ))}
    </div>
  );
};
