import React, { useState } from 'react';
import { Mail, MessageCircle, MapPin, Twitter, Sparkles, Link2, Loader2, Copy, Check } from 'lucide-react';
import { adminApi } from '../../../lib/adminApi';

type Card = {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  status: 'ready' | 'needs_keys' | 'admin_only';
  steps: string[];
};

const CARDS: Card[] = [
  {
    id: 'gmail',
    title: 'Gmail / email automation',
    desc: 'Auto-notify on new leads via Resend when RESEND_API_KEY is set.',
    icon: <Mail className="h-5 w-5" />,
    status: 'needs_keys',
    steps: [
      'Set RESEND_API_KEY + RESEND_FROM_EMAIL in Vercel',
      'New contact form leads trigger inquiry email when configured',
      'Optional: daily digest of open leads',
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp automation',
    desc: 'Deep-link new leads to WhatsApp for fast human follow-up.',
    icon: <MessageCircle className="h-5 w-5" />,
    status: 'ready',
    steps: [
      'Site links to +91 77250 04639',
      'Open lead in Admin → copy phone → WhatsApp',
      'Cloud API auto-replies need Meta Business keys later',
    ],
  },
  {
    id: 'maps',
    title: 'Maps & demand signals',
    desc: 'Tag regions on leads to see demand geography.',
    icon: <MapPin className="h-5 w-5" />,
    status: 'ready',
    steps: [
      'Add city/region in lead message notes',
      'Export outreach CSV monthly',
      'Optional Google Maps embed on contact',
    ],
  },
  {
    id: 'x',
    title: 'X.com (Twitter) social desk',
    desc: 'Draft post batches with AI. Publish manually until X API keys exist.',
    icon: <Twitter className="h-5 w-5" />,
    status: 'admin_only',
    steps: [
      'Draft 4 posts below with AI',
      'Copy → post from your X account',
      'Never auto-publish without approval',
    ],
  },
];

export const Automations: React.FC = () => {
  const [draft, setDraft] = useState('');
  const [batch, setBatch] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);

  const generateBatch = async () => {
    setLoading(true);
    setError('');
    const topic = draft.trim() || 'retention short-form video editing for brands';
    try {
      const res = await adminApi.post<{ text?: string }>('/api/ai/generate', {
        prompt: `Write exactly 4 short X/Twitter posts for VisionFold Creative about: ${topic}. Number them 1-4. Premium, punchy, no hashtag spam.`,
        systemPrompt: 'Social strategist for a luxury video editing studio in India.',
        temperature: 0.85,
        maxTokens: 500,
      });
      const text = res.text || '';
      const lines = text
        .split(/\n+/)
        .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter((l) => l.length > 8)
        .slice(0, 4);
      if (lines.length) setBatch(lines);
      else {
        setBatch([
          `Hook: Why ${topic} beats longer cuts in 2026.`,
          '3 mistakes brands make before hiring an editor (save this).',
          'Before/after pacing: what short-form packages actually include.',
          'CTA: DM “FOLD” for a custom quote — long-form is always bespoke.',
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'AI draft failed — using templates');
      setBatch([
        `Hook: Why ${topic} beats longer cuts in 2026.`,
        '3 mistakes brands make before hiring an editor (save this).',
        'Before/after pacing: what short-form packages actually include.',
        'CTA: DM “FOLD” for a custom quote — long-form is always bespoke.',
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyOne = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-6">
        <div className="flex items-center gap-2 text-[#D4AF37]">
          <Sparkles className="h-5 w-5" />
          <p className="text-xs font-black uppercase tracking-[0.25em]">Admin-only automation desk</p>
        </div>
        <h2 className="mt-2 text-2xl font-black text-white">WhatsApp · Email · Maps · X</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#B8B3AA]">
          Working drafts and setup checklist. Email needs Resend keys; X publish stays human-approved.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
        <h3 className="font-bold text-white">Automation strategy (practical)</h3>
        <p className="mt-2 text-sm leading-6 text-[#B8B3AA]">
          Build in this order so nothing is half-broken: (1) capture leads via Contact + Outreach Excel/CSV,
          (2) score with NVIDIA on submit, (3) email confirms via Resend, (4) WhatsApp deep-links for human reply,
          (5) X drafts only until paid API. Never auto-post to X on free tier.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#B8B3AA]">
          <li><span className="text-white">Week 1:</span> Outreach import + lead score on contact form.</li>
          <li><span className="text-white">Week 2:</span> Resend — new lead confirm + invoice status emails.</li>
          <li><span className="text-white">Week 3:</span> WhatsApp click-to-chat templates from Admin leads.</li>
          <li><span className="text-white">Later:</span> Meta WhatsApp Cloud API (after Business verification).</li>
          <li><span className="text-white">Never free:</span> full X auto-publish — keep human Approve on drafts.</li>
        </ol>
        <p className="mt-4 text-xs text-[#666]">
          Env when you enable: RESEND_API_KEY, optional WHATSAPP_PHONE. NVIDIA_API_KEY already used for drafts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-[#0C0C10] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 text-white">
                <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-[#D4AF37]">{c.icon}</div>
                <div>
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="mt-1 text-sm text-[#8A857C]">{c.desc}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#D4AF37]">
                {c.status.replace('_', ' ')}
              </span>
            </div>
            <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[#B8B3AA]">
              {c.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0C0C10] p-6">
        <div className="flex items-center gap-2 text-white">
          <Link2 className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="font-bold">X post batch draft (admin)</h3>
        </div>
        <p className="mt-1 text-sm text-[#8A857C]">
          Uses NVIDIA when configured. Copy posts, then publish from your X account.
        </p>
        {error ? <p className="mt-2 text-xs text-amber-300">{error}</p> : null}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Trend or theme (e.g. Reels retention 2026)"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={() => void generateBatch()}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-black uppercase tracking-wider text-black disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Generate 4 posts
        </button>
        {batch.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {batch.map((b, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#EDEDED]"
              >
                <span className="mr-1 text-[#D4AF37]">#{i + 1}</span>
                <span className="flex-1">{b}</span>
                <button
                  type="button"
                  onClick={() => void copyOne(b, i)}
                  className="shrink-0 text-[#8A857C] hover:text-[#D4AF37]"
                >
                  {copied === i ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default Automations;
