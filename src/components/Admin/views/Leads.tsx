import React, { useEffect, useState } from 'react';
import { Mail, Phone, Flame, Thermometer, Snowflake, Sparkles, Loader2, FileText } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, StatusBadge, EmptyState, Select, formatDate, PrimaryButton, GhostButton } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

interface LeadMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  projectType: string;
  budgetRange: string;
  deadline?: string;
  message: string;
  status: 'new' | 'contacted' | 'closed' | 'qualified';
  createdAt: string;
  leadScore?: number | null;
  leadTier?: 'hot' | 'warm' | 'cold' | null;
  leadReason?: string | null;
  leadSource?: string | null;
}

function TierBadge({ tier, score }: { tier?: string | null; score?: number | null }) {
  if (score == null && !tier) return null;
  const t = tier || (score! >= 70 ? 'hot' : score! >= 45 ? 'warm' : 'cold');
  const styles =
    t === 'hot'
      ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
      : t === 'warm'
        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  const Icon = t === 'hot' ? Flame : t === 'warm' ? Thermometer : Snowflake;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      <Icon className="h-3 w-3" />
      {t}
      {score != null ? ` · ${score}` : ''}
    </span>
  );
}

export const Leads: React.FC = () => {
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [propLoading, setPropLoading] = useState<string | null>(null);
  const [proposalText, setProposalText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<LeadMessage[]>('/api/messages');
      setMessages(
        [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateStatus = async (id: string, status: LeadMessage['status']) => {
    const updated = await adminApi.patch<LeadMessage>(`/api/messages/${id}/status`, { status });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const rescore = async (id: string) => {
    setScoringId(id);
    try {
      const result = await adminApi.post<any>('/api/ai/score-lead', { messageId: id });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                leadScore: result.score,
                leadTier: result.tier,
                leadReason: result.reason,
                leadSource: result.source,
              }
            : m
        )
      );
    } catch (err: any) {
      alert(err.message || 'Rescore failed');
    } finally {
      setScoringId(null);
    }
  };

  const makeProposal = async (id: string) => {
    setPropLoading(id);
    setProposalText('');
    try {
      const result = await adminApi.post<any>('/api/ai/proposal', { messageId: id });
      const p = result.proposal || {};
      const text = [
        p.title,
        '',
        p.executiveSummary,
        '',
        'Scope:',
        ...(p.scope || []).map((s: string) => `• ${s}`),
        '',
        'Timeline:',
        ...(p.timeline || []).map((s: string) => `• ${s}`),
        '',
        `Investment: ${p.investment || ''}`,
        '',
        'Next steps:',
        ...(p.nextSteps || []).map((s: string) => `• ${s}`),
      ].join('\n');
      setProposalText(text);
      await navigator.clipboard.writeText(text).catch(() => undefined);
    } catch (err: any) {
      alert(err.message || 'Proposal failed');
    } finally {
      setPropLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {proposalText ? (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Latest proposal (copied if clipboard allowed)</h3>
            <GhostButton type="button" onClick={() => setProposalText('')}>
              Dismiss
            </GhostButton>
          </div>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-4 text-xs text-[#EDEDED]">
            {proposalText}
          </pre>
        </Card>
      ) : null}

      <Card>
        {messages.length === 0 ? (
          <EmptyState message="No inquiries yet — contact form leads appear here with auto lead scores." />
        ) : (
          <div className="divide-y divide-[#222226]">
            {messages.map((m) => (
              <div key={m.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-[#EDEDED]">{m.name}</h4>
                      <StatusBadge status={m.status} />
                      <TierBadge tier={m.leadTier} score={m.leadScore} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#888891]">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {m.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {m.phone}
                      </span>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                    {m.leadReason ? (
                      <p className="mt-1 text-[11px] text-[#666]">{m.leadReason}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={m.status}
                      onChange={(e) => void updateStatus(m.id, e.target.value as LeadMessage['status'])}
                      className="w-auto"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="closed">Closed</option>
                    </Select>
                    <GhostButton type="button" onClick={() => void rescore(m.id)} disabled={scoringId === m.id}>
                      {scoringId === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Score
                    </GhostButton>
                    <PrimaryButton type="button" onClick={() => void makeProposal(m.id)} disabled={propLoading === m.id}>
                      {propLoading === m.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileText className="h-3.5 w-3.5" />
                      )}
                      Proposal
                    </PrimaryButton>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#D4AF37] hover:text-white"
                >
                  {expanded === m.id ? 'Hide details' : 'View details'}
                </button>

                {expanded === m.id ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-[#0A0A0B] p-4 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-[#888891]">Company: </span>
                      {m.company || '—'}
                    </div>
                    <div>
                      <span className="text-[#888891]">Project Type: </span>
                      {m.projectType}
                    </div>
                    <div>
                      <span className="text-[#888891]">Budget: </span>
                      {m.budgetRange}
                    </div>
                    <div>
                      <span className="text-[#888891]">Deadline: </span>
                      {m.deadline || '—'}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[#888891]">Message: </span>
                      {m.message}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Leads;
