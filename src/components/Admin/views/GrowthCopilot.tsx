import React, { useState } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Copy, Check, Table2, FileText } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, PrimaryButton, GhostButton, Textarea, Input } from '../ui';
import { Skeleton } from '../../ui/Skeleton';

interface GrowthPayload {
  summary: string;
  opportunities: string[];
  followUps: string[];
  appreciation: string[];
  configured?: boolean;
  source?: string;
}

const Section: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">{title}</h4>
    {items.length ? (
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="rounded-lg border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-sm text-[#EDEDED]"
          >
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-[#888891]">Nothing here yet.</p>
    )}
  </div>
);

function brandImagePrompts(topic: string) {
  const t = topic.trim() || 'premium short-form video editing';
  return [
    `Cinematic brand still for VisionFold Creative: gold accents on deep black, subtle film grain, ${t}, editorial lighting, 4k, minimal luxury.`,
    `Social carousel cover: bold typography “${t}”, black background, metallic gold foil texture, clean Swiss layout, Instagram 1080x1080.`,
    `Before/after style thumbnail: dual panel edit timeline vs finished reel, neon gold highlights, high contrast, YouTube thumbnail composition.`,
    `Abstract 3D ribbon of light forming a film strip, black void, volumetric glow, ${t}, product-shot quality, no text.`,
  ];
}

export const GrowthCopilot: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<GrowthPayload | null>(null);
  const [topic, setTopic] = useState('retention reels for founders');
  const [prompts, setPrompts] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const [socialDraft, setSocialDraft] = useState('');
  const [socialOut, setSocialOut] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetOut, setSheetOut] = useState<any>(null);
  const [propBrief, setPropBrief] = useState('');
  const [propOut, setPropOut] = useState('');
  const [propLoading, setPropLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await adminApi.post<GrowthPayload>('/api/ai/insights', {});
      setResult(payload);
    } catch (err: any) {
      setError(err.message || 'Growth insights failed');
    } finally {
      setLoading(false);
    }
  };

  const makePrompts = () => setPrompts(brandImagePrompts(topic));

  const copyPrompt = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const draftSocial = async () => {
    setSocialLoading(true);
    setError('');
    try {
      const res = await adminApi.post<{ text?: string; error?: string }>('/api/ai/generate', {
        prompt: `Write 3 short Instagram/X captions for VisionFold Creative about: ${socialDraft || topic}. Premium tone, no hashtag spam. Number them.`,
        systemPrompt: 'You are a social strategist for a luxury video editing studio in India.',
        temperature: 0.85,
        maxTokens: 500,
      });
      setSocialOut(res.text || '');
    } catch (err: any) {
      setError(err.message || 'Social draft unavailable');
    } finally {
      setSocialLoading(false);
    }
  };

  const onSheetFile = async (file: File | null) => {
    if (!file) return;
    setSheetLoading(true);
    setSheetOut(null);
    setError('');
    try {
      const text = await file.text();
      const res = await adminApi.post<any>('/api/ai/spreadsheet-analyst', {
        text,
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
    } catch (err: any) {
      setError(err.message || 'Proposal failed');
    } finally {
      setPropLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Growth Copilot"
          subtitle="Live studio brief from leads, projects, invoices (NVIDIA when configured)"
          action={
            <PrimaryButton onClick={() => void generate()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Brief
            </PrimaryButton>
          }
        />
        <div className="p-6">
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
          {loading ? <Skeleton className="mb-4 h-24 w-full" /> : null}
          {!result && !loading ? (
            <p className="text-sm text-[#888891]">
              Generate a studio snapshot from real data. Offline AI uses deterministic rules — never fake LLM
              text.
            </p>
          ) : null}
          {result ? (
            <div className="space-y-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#888891]">
                Source: {result.source || 'unknown'}
              </p>
              <div className="rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 px-5 py-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37]">Summary</h4>
                <p className="text-sm text-[#EDEDED]">{result.summary}</p>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Section title="Opportunities" items={result.opportunities} />
                <Section title="Follow-Ups" items={result.followUps} />
                <Section title="Appreciation" items={result.appreciation} />
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Spreadsheet Analyst"
          subtitle="Upload CSV/TSV — real parse + rules stats + AI narrative. Export Excel as CSV first."
        />
        <div className="space-y-3 p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/30 px-4 py-8 text-center hover:border-[#D4AF37]/40">
            <input
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              className="hidden"
              disabled={sheetLoading}
              onChange={(e) => void onSheetFile(e.target.files?.[0] || null)}
            />
            {sheetLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
            ) : (
              <Table2 className="h-6 w-6 text-[#D4AF37]" />
            )}
            <span className="mt-2 text-xs font-bold uppercase tracking-wider text-[#B8B3AA]">
              {sheetLoading ? 'Analyzing…' : 'Choose CSV'}
            </span>
          </label>
          {sheetOut ? (
            <div className="space-y-2 rounded-lg border border-white/10 bg-[#0A0A0B] p-4 text-sm text-[#EDEDED]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                {sheetOut.fileName} · {sheetOut.analysis?.rowCount} rows · source {sheetOut.source}
              </p>
              <p className="whitespace-pre-wrap">{sheetOut.narrative}</p>
              {sheetOut.analysis?.numericColumns?.length ? (
                <ul className="mt-2 space-y-1 text-xs text-[#8A857C]">
                  {sheetOut.analysis.numericColumns.slice(0, 6).map((c: any) => (
                    <li key={c.name}>
                      {c.name}: sum {Number(c.sum).toLocaleString()}, avg {Number(c.avg).toFixed(1)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Proposal generator"
          subtitle="Structured proposal from a brief (or use Proposal on a lead in Leads)"
          action={
            <PrimaryButton type="button" onClick={() => void makeProposal()} disabled={propLoading}>
              {propLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Generate
            </PrimaryButton>
          }
        />
        <div className="space-y-3 p-6">
          <Textarea
            value={propBrief}
            onChange={(e) => setPropBrief(e.target.value)}
            placeholder="Client, scope, deadline, budget notes…"
            rows={4}
          />
          {propOut ? (
            <pre className="whitespace-pre-wrap rounded-lg border border-[#222226] bg-[#0A0A0B] p-4 text-sm text-[#EDEDED]">
              {propOut}
            </pre>
          ) : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Brand image prompts"
          subtitle="Copy-ready prompts — local templates, no API"
          action={
            <PrimaryButton type="button" onClick={makePrompts}>
              <ImageIcon className="h-4 w-4" /> Generate prompts
            </PrimaryButton>
          }
        />
        <div className="space-y-3 p-6">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Theme e.g. founder reels, gold on black"
          />
          {prompts.length === 0 ? (
            <p className="text-sm text-[#888891]">Generate 4 studio-grade image prompts.</p>
          ) : (
            <ul className="space-y-2">
              {prompts.map((pr, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-sm text-[#EDEDED]"
                >
                  <span className="flex-1">{pr}</span>
                  <GhostButton type="button" onClick={() => void copyPrompt(pr, idx)} className="shrink-0">
                    {copied === idx ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </GhostButton>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Social caption drafts"
          subtitle="Uses NVIDIA when NVIDIA_API_KEY is set"
          action={
            <PrimaryButton type="button" onClick={() => void draftSocial()} disabled={socialLoading}>
              {socialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Draft captions
            </PrimaryButton>
          }
        />
        <div className="space-y-3 p-6">
          <Textarea
            value={socialDraft}
            onChange={(e) => setSocialDraft(e.target.value)}
            placeholder="Topic or campaign angle…"
            rows={3}
          />
          {socialOut ? (
            <pre className="whitespace-pre-wrap rounded-lg border border-[#222226] bg-[#0A0A0B] p-4 text-sm text-[#EDEDED]">
              {socialOut}
            </pre>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default GrowthCopilot;
