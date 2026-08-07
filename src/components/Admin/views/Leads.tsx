import React, { useEffect, useState } from 'react';
import { Mail, Phone, Flame, Thermometer, Snowflake, Sparkles, Loader2, FileText } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, EmptyState, Select, formatDate, PrimaryButton, GhostButton } from '../ui';
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
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost' | 'closed';
  createdAt: string;
  leadScore?: number | null;
  leadTier?: 'hot' | 'warm' | 'cold' | null;
  leadReason?: string | null;
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
  const [convertLoading, setConvertLoading] = useState<string | null>(null);
  const [convertMsg, setConvertMsg] = useState('');
  const [proposalText, setProposalText] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<LeadMessage[]>('/api/messages');
      setMessages([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const convertToProject = async (id: string) => {
    setConvertLoading(id);
    setConvertMsg('');
    try {
      const res = await adminApi.post<{ project: { id: string; title: string }; tempPassword?: string | null }>(
        `/api/messages/${id}/convert-project`,
        {}
      );
      setConvertMsg(
        res.tempPassword
          ? `Project created. New client login password: ${res.tempPassword}`
          : `Project created: ${res.project?.title || 'ok'}`
      );
      await load();
    } catch (err: any) {
      setConvertMsg(err?.message || 'Convert failed');
    } finally {
      setConvertLoading(null);
    }
  };

  const updateStatus = async (id: string, status: LeadMessage['status']) => {
    const updated = await adminApi.patch<LeadMessage>(`/api/messages/${id}/status`, { status });
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
  };

  const rescore = async (id: string) => {
    setScoringId(id);
    try {
      const result = await adminApi.post<{ score: number; tier: string; reason?: string }>('/api/ai/score-lead', {
        messageId: id,
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, leadScore: result.score, leadTier: result.tier as any, leadReason: result.reason }
            : m
        )
      );
    } catch (err: any) {
      setConvertMsg(err?.message || 'Score failed');
    } finally {
      setScoringId(null);
    }
  };

  const makeProposal = async (id: string) => {
    setPropLoading(id);
    try {
      const result = await adminApi.post<any>('/api/ai/proposal', { messageId: id });
      const p = result.proposal || {};
      const text = [
        p.title,
        '',
        p.executiveSummary,
        '',
        'Scope:',
        ...(p.scope || []).map((s: string) => `- ${s}`),
        '',
        'Timeline:',
        ...(p.timeline || []).map((s: string) => `- ${s}`),
        '',
        `Investment: ${p.investment || ''}`,
        '',
        'Next steps:',
        ...(p.nextSteps || []).map((s: string) => `- ${s}`),
      ].join('\n');
      setProposalText(text);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        /* ignore */
      }
    } catch (err: any) {
      setConvertMsg(err?.message || 'Proposal failed');
    } finally {
      setPropLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {convertMsg ? (
        <p className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-sm text-[#EDEDED]">{convertMsg}</p>
      ) : null}
      {proposalText ? (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-white">Latest proposal</h3>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-[#B8B3AA]">{proposalText}</pre>
        </Card>
      ) : null}
      <Card padding="none">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-black text-white">Leads & inquiries</h2>
          <p className="text-xs text-[#8A857C]">Pipeline · score · proposal · convert to project</p>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState message="No leads yet — contact form submissions appear here." />
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map((m) => (
              <div key={m.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white">{m.name}</h3>
                      <TierBadge tier={m.leadTier} score={m.leadScore} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#8A857C]">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {m.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {m.phone}
                      </span>
                      <span>{formatDate(m.createdAt)}</span>
                    </div>
                    {m.leadReason ? <p className="mt-1 text-[11px] text-[#666]">{m.leadReason}</p> : null}
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
                      <option value="proposal">Proposal</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="closed">Closed</option>
                    </Select>
                    <GhostButton type="button" onClick={() => void rescore(m.id)} disabled={scoringId === m.id}>
                      {scoringId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Score
                    </GhostButton>
                    <PrimaryButton type="button" onClick={() => void makeProposal(m.id)} disabled={propLoading === m.id}>
                      {propLoading === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      Proposal
                    </PrimaryButton>
                    <GhostButton type="button" onClick={() => void convertToProject(m.id)} disabled={convertLoading === m.id}>
                      {convertLoading === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      → Project
                    </GhostButton>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                  className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]"
                >
                  {expanded === m.id ? 'Hide details' : 'View details'}
                </button>
                {expanded === m.id ? (
                  <div className="mt-3 grid gap-2 rounded-lg bg-[#0A0A0B] p-4 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-[#888891]">Company: </span>
                      {m.company || '—'}
                    </div>
                    <div>
                      <span className="text-[#888891]">Type: </span>
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
