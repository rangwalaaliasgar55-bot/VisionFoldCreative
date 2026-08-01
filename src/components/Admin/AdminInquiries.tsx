import React from 'react';
import { Mail, MessageSquare, ExternalLink, Calendar, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Message } from '../../types';
import { formatDate } from '../../lib/formatters';

interface AdminInquiriesProps {
  messages: Message[];
  onRefresh: () => void;
}

export const AdminInquiries: React.FC<AdminInquiriesProps> = ({ messages, onRefresh }) => {
  const handleStatusChange = async (id: string, status: Message['status']) => {
    try {
      await api.updateMessageStatus(id, status);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to update inquiry status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#11131a] border border-[#222736] rounded-2xl p-6">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-amber-400">
            Inbound Leads
          </span>
          <h2 className="text-2xl font-bold text-white mt-1">Client Contact Submissions</h2>
          <p className="text-xs text-slate-400">
            View full project briefs, WhatsApp phone links, budget requirements, and target deadlines.
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#11131a] border border-[#222736] text-center text-slate-400">
          No contact inquiries submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => {
            const cleanPhone = msg.phone.replace(/[^0-9]/g, '');
            const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}`;

            return (
              <div
                key={msg.id}
                className="bg-[#11131a] border border-[#222736] rounded-2xl p-6 hover:border-amber-500/40 transition-all space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#222736]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{msg.name}</h3>
                      {msg.company && (
                        <span className="text-xs text-slate-400 font-semibold">({msg.company})</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{msg.email}</p>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-3">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat on WhatsApp
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <select
                      value={msg.status}
                      onChange={(e) => handleStatusChange(msg.id, e.target.value as Message['status'])}
                      className="px-3 py-1.5 bg-[#161922] border border-[#222736] rounded-lg text-xs font-bold uppercase text-slate-200 focus:border-amber-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Brief Meta Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#161922] border border-[#222736]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Project Format
                    </span>
                    <span className="font-bold text-amber-400">{msg.projectType}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#161922] border border-[#222736]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Budget Range
                    </span>
                    <span className="font-bold text-white">{msg.budgetRange}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#161922] border border-[#222736]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Target Deadline
                    </span>
                    <span className="font-bold text-slate-200">
                      {msg.deadline ? formatDate(msg.deadline) : 'Flexible'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#161922] border border-[#222736]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                      Submitted Date
                    </span>
                    <span className="font-bold text-slate-300">{formatDate(msg.createdAt)}</span>
                  </div>
                </div>

                {/* Full Message Text */}
                <div className="p-4 rounded-xl bg-[#161922] border border-[#222736]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Project Message / Link Brief
                  </span>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
