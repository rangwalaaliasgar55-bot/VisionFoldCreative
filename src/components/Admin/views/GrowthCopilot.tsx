import React, { useState } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';
import { Card, CardHeader, PrimaryButton, GhostButton, Textarea, Input } from '../ui';

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
          <li key={idx} className="rounded-lg border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-sm text-[#EDEDED]">{item}</li>
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

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await adminApi.post<GrowthPayload>('/api/ai/insights', {});
      setResult(payload);
    } catch (err: any) {
      setError(err.message || 'Growth insights failed — AI provider not configured (Phase D: GEMINI_API_KEY)');
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
      const res = await adminApi.post<{ text?: string; content?: string; error?: string; configured?: boolean }>(
        '/api/ai/generate',
        {
          prompt: `Write 3 short Instagram/X captions for VisionFold Creative about: ${socialDraft || topic}. Premium tone, no hashtag spam. Number them.`,
          systemPrompt: 'You are a social strategist for a luxury video editing studio in India.',
          temperature: 0.85,
          maxTokens: 500,
        }
      );
      if ((res as any).error) {
        setError((res as any).error);
        setSocialOut('');
      } else {
        setSocialOut((res as any).text || (res as any).content || '');
      }
    } catch (err: any) {
      setError(err.message || 'Social draft unavailable until Gemini is wired (Phase D)');
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Growth Copilot"
          subtitle="Business brief from live leads, projects, and invoices (rules-based until Gemini Phase D)"
          action={
            <PrimaryButton onClick={() => void generate()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate Brief
            </PrimaryButton>
          }
        />
        <div className="p-6">
          {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}
          {!result ? (
            <p className="text-sm text-[#888891]">
              Generate a studio snapshot from real data. With AI offline, this uses deterministic rules — not fake LLM text.
            </p>
          ) : (
            <div className="space-y-6">
              {result.source === 'rules' ? (
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888891]">Source: rules (AI offline)</p>
              ) : null}
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
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Brand image prompts"
          subtitle="Copy-ready prompts for Midjourney / image models — local templates, no API"
          action={
            <PrimaryButton type="button" onClick={makePrompts}>
              <ImageIcon className="h-4 w-4" /> Generate prompts
            </PrimaryButton>
          }
        />
        <div className="space-y-3 p-6">
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Theme e.g. founder reels, gold on black" />
          {prompts.length === 0 ? (
            <p className="text-sm text-[#888891]">Generate 4 studio-grade image prompts for ads, carousels, and thumbnails.</p>
          ) : (
            <ul className="space-y-2">
              {prompts.map((pr, idx) => (
                <li key={idx} className="flex items-start gap-2 rounded-lg border border-[#222226] bg-[#0A0A0B] px-4 py-3 text-sm text-[#EDEDED]">
                  <span className="flex-1">{pr}</span>
                  <GhostButton type="button" onClick={() => void copyPrompt(pr, idx)} className="shrink-0">
                    {copied === idx ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
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
          subtitle="Requires GEMINI_API_KEY after Phase D — OpenRouter removed"
          action={
            <PrimaryButton type="button" onClick={() => void draftSocial()} disabled={socialLoading}>
              {socialLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Draft captions
            </PrimaryButton>
          }
        />
        <div className="space-y-3 p-6">
          <Textarea value={socialDraft} onChange={(e) => setSocialDraft(e.target.value)} placeholder="Topic or campaign angle…" rows={3} />
          {socialOut ? <pre className="whitespace-pre-wrap rounded-lg border border-[#222226] bg-[#0A0A0B] p-4 text-sm text-[#EDEDED]">{socialOut}</pre> : null}
        </div>
      </Card>
    </div>
  );
};

export default GrowthCopilot;
