import React, { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, Table2, FileText } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { profileCsvText, readFileAsText } from '../../../lib/csvClient';
import { Card, CardHeader, PrimaryButton, GhostButton, Textarea, Input } from '../ui';

interface GrowthPayload {
  summary: string;
  opportunities: string[];
  followUps: string[];
  appreciation: string[];
  configured?: boolean;
  source?: string;
}

export const GrowthCopilot: React.FC = () => {
  const [brief, setBrief] = useState<GrowthPayload | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetOut, setSheetOut] = useState<any>(null);
  const [propBrief, setPropBrief] = useState('');
  const [propOut, setPropOut] = useState('');
  const [propLoading, setPropLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generateBrief = async () => {
    setBriefLoading(true);
    setError('');
    try {
      const res = await adminApi.post<GrowthPayload>('/api/ai/growth-brief', {});
      setBrief(res);
    } catch (err: any) {
      setError(err.message || 'Brief failed — check NVIDIA key and admin session');
    } finally {
      setBriefLoading(false);
    }
  };

  const onSheetFile = async (file: File | null) => {
    if (!file) return;
    setSheetLoading(true);
    setSheetOut(null);
    setError('');
    try {
      if (/\.xlsx$/i.test(file.name)) {
        throw new Error('Export as CSV first (Excel → Save As → CSV).');
      }
      const text = await readFileAsText(file);
      const profile = profileCsvText(text, file.name, 50000);
      if (!profile.rowCount) {
        throw new Error(profile.warnings.join(' ') || 'No data rows found');
      }
      const res = await adminApi.post<any>('/api/ai/spreadsheet-profile', {
        profile,
        fileName: file.name,
      });
      setSheetOut(res);
    } catch (err: any) {
      setError(err.message || 'Spreadsheet analysis failed');
    } finally {
      setSheetLoading(false);
    }
  };

  const makeProposal = async () => {
    setPropLoading(true);
    setError('');
    try {
      const res = await adminApi.post<any>('/api/ai/proposal', { brief: propBrief });
      const p = res.proposal || {};
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
      setPropOut(text);
      await navigator.clipboard.writeText(text).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Proposal failed');
    } finally {
      setPropLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Growth Copilot</h2>
            <p className="text-xs text-[#8A857C]">Live studio brief · NVIDIA when configured</p>
          </div>
          <PrimaryButton type="button" onClick={() => void generateBrief()} disabled={briefLoading}>
            {briefLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate brief
          </PrimaryButton>
        </div>
        {brief ? (
          <div className="mt-4 space-y-4 text-sm text-[#EDEDED]">
            <p>{brief.summary}</p>
            {brief.opportunities?.length ? (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">Opportunities</p>
                <ul className="mt-1 list-disc pl-5">
                  {brief.opportunities.map((o) => (
                    <li key={o}>{o}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-[10px] text-[#666]">Source: {brief.source || 'rules'}</p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#8A857C]">Generate a studio snapshot from real data.</p>
        )}
      </Card>

      <Card className="p-5">
        <CardHeader title="Spreadsheet analyst" subtitle="CSV profiled in the browser — only the summary hits the API (large files OK)" />
        <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-10 text-center hover:border-[#D4AF37]/40">
          <input
            type="file"
            accept=".csv,.tsv,text/csv,text/tab-separated-values"
            className="hidden"
            disabled={sheetLoading}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              e.target.value = '';
              void onSheetFile(f);
            }}
          />
          {sheetLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
          ) : (
            <Table2 className="h-6 w-6 text-[#D4AF37]" />
          )}
          <span className="mt-2 text-xs font-bold uppercase tracking-wider text-[#B8B3AA]">
            {sheetLoading ? 'Profiling…' : 'Choose CSV'}
          </span>
        </label>
        {sheetOut ? (
          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
            <p className="text-[10px] uppercase tracking-wider text-[#D4AF37]">
              {sheetOut.fileName} · {sheetOut.analysis?.rowCount} rows · {sheetOut.source}
            </p>
            <p className="whitespace-pre-wrap text-[#EDEDED]">{sheetOut.narrative}</p>
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white">Proposal generator</h3>
            <p className="text-xs text-[#8A857C]">Structured draft from a brief</p>
          </div>
          <PrimaryButton type="button" onClick={() => void makeProposal()} disabled={propLoading}>
            {propLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Generate
          </PrimaryButton>
        </div>
        <Textarea
          className="mt-3 min-h-24"
          placeholder="Client, scope, deadline, budget notes…"
          value={propBrief}
          onChange={(e) => setPropBrief(e.target.value)}
        />
        {propOut ? (
          <div className="mt-3">
            <GhostButton
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(propOut);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </GhostButton>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-[#EDEDED]">
              {propOut}
            </pre>
          </div>
        ) : null}
      </Card>
    </div>
  );
};

export default GrowthCopilot;
