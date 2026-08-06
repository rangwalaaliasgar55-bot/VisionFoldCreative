import React, { useState } from 'react';
import { Mail, MessageCircle, MapPin, Twitter, Sparkles, Link2 } from 'lucide-react';

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
    desc: 'Auto-notify on new leads and send status emails via Resend or Gmail SMTP.',
    icon: <Mail className="h-5 w-5" />,
    status: 'needs_keys',
    steps: [
      'Set RESEND_API_KEY + RESEND_FROM_EMAIL (or Gmail app password) in Vercel env',
      'New /api/messages already triggers inquiry email when configured',
      'Optional: daily digest of open leads',
    ],
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp automation',
    desc: 'Route new leads to WhatsApp Business / wa.me templates for fast human follow-up.',
    icon: <MessageCircle className="h-5 w-5" />,
    status: 'ready',
    steps: [
      'Site already deep-links to +91 77250 04639',
      'Connect WhatsApp Cloud API later for auto-replies',
      'Until then: Leads board + chat widget capture intent',
    ],
  },
  {
    id: 'maps',
    title: 'Maps & demand signals',
    desc: 'Track regions of inquiries to see where services are needed.',
    icon: <MapPin className="h-5 w-5" />,
    status: 'ready',
    steps: [
      'Tag leads with city/region in message notes',
      'Optional: embed Google Maps in contact for studio location',
      'Export lead locations monthly for outreach',
    ],
  },
  {
    id: 'x',
    title: 'X.com (Twitter) social desk',
    desc: 'Admin-only: draft daily posts, SEO angles, and 4-post batches. Publishing needs your X API keys.',
    icon: <Twitter className="h-5 w-5" />,
    status: 'admin_only',
    steps: [
      'Link your X account in Settings when API keys are ready',
      'Use Growth Copilot / AI tools to draft 4 posts from trends',
      'Review → approve → publish (never auto-post without approval)',
    ],
  },
];

export const Automations: React.FC = () => {
  const [draft, setDraft] = useState('');
  const [batch, setBatch] = useState<string[]>([]);

  const generateBatch = () => {
    const topic = draft.trim() || 'retention short-form editing';
    setBatch([
      `Hook: Why ${topic} beats longer cuts in 2026 — thread starter.`,
      `3 mistakes brands make before hiring an editor (save this).`,
      `Before/after pacing: what ₹700 short-form actually includes.`,
      `CTA: DM “FOLD” for a custom quote — not a price list for long-form.`,
    ]);
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
          These workflows stay in admin. Clients never see social publishing controls. Full X auto-publish and WhatsApp Cloud need
          external API keys — this desk drafts, tracks setup, and keeps human approval in the loop.
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
        <p className="mt-1 text-sm text-[#8A857C]">Topic or trend → four post angles. Copy, edit, then post from your X account.</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Trend or theme (e.g. Reels retention 2026)"
          className="mt-4 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={generateBatch}
          className="mt-3 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-black uppercase tracking-wider text-black"
        >
          Generate 4 posts
        </button>
        {batch.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {batch.map((b, i) => (
              <li key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#EDEDED]">
                <span className="mr-2 text-[#D4AF37]">#{i + 1}</span>
                {b}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
};

export default Automations;
