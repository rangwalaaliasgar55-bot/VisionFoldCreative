import React, { useMemo, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Clapperboard, Clock3, Film, LockKeyhole, MessageCircleMore,
  MonitorPlay, Play, Quote, Scissors, Send, Sparkles, Star, Wand2, Zap, Layers3,
} from 'lucide-react';
import { useSfx } from '../../context/SfxContext';
import { useAdmin } from '../../context/AdminContext';
import { useContent } from '../../context/ContentContext';
import { EditableText } from '../EditableText';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { ThreeHero } from '../ThreeHero';
import { useScrollReveal } from '../../hooks/useScrollReveal';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const whatsappNumber = '917725004639';

const RevealSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className={className}>{children}</div>;
};

const workCards = [
  { title: 'Retention Reels', type: 'Short Form', metric: '₹700 / reel', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=900&q=80' },
  { title: 'Founder Stories', type: 'Brand Content', metric: 'Custom quote', image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80' },
  { title: 'Launch Ads', type: 'Performance', metric: 'Hook + CTA system', image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=900&q=80' },
];

const features = [
  { icon: Zap, title: 'Hook-first edits', text: 'First three seconds engineered for scroll-stopping attention.' },
  { icon: Wand2, title: 'Premium polish', text: 'Kinetic captions, SFX, motion accents, grading, platform-ready exports.' },
  { icon: Clock3, title: 'Studio workflow', text: 'Leads, projects, invoices, and revisions managed in one admin OS.' },
  { icon: MonitorPlay, title: 'Platform masters', text: 'Reels, Shorts, TikTok, YouTube, ads — formatted correctly every time.' },
];

const processSteps = [
  { step: '01', title: 'Brief', text: 'Share product, platform, audience, and deadline.' },
  { step: '02', title: 'Craft', text: 'Hook, story, captions, grade, and sound design.' },
  { step: '03', title: 'Review', text: 'Structured revisions through the client portal.' },
  { step: '04', title: 'Deliver', text: 'Final masters ready for organic or paid use.' },
];

const seededReviews = [
  { name: 'Kabir Joshi', place: 'Mumbai', role: 'D2C Brand Owner', quote: 'Aliasgar does not just cut footage — he understands the brand. We sent him rough clips and got back reels that looked like a full production house did them.' },
  { name: 'Meera Nair', place: 'Bangalore', role: 'Creator & Coach', quote: 'I have given Aliasgar a lot of work this year. Every single delivery was on time, retention-focused, and better than what bigger agencies quoted me three times the price for.' },
  { name: 'Omar Farid', place: 'Dubai', role: 'Ecommerce Lead', quote: 'VisionFold under Aliasgar turned our product videos into paid-ad ready creatives. CTR went up after the first batch. Highly recommend working with him directly.' },
  { name: 'Ananya Desai', place: 'Pune', role: 'Cafe Founder', quote: 'Aliasgar made our menu and ambience films look expensive without the expensive process. Clear communication, fast revisions, zero drama.' },
  { name: 'Ryan Brooks', place: 'London', role: 'Consultant', quote: 'Working with Aliasgar feels like having an in-house editor who actually cares. Hooks, pacing, captions — all handled. We keep coming back.' },
  { name: 'Sana Qureshi', place: 'Hyderabad', role: 'Fashion Creator', quote: 'Simple phone footage in, premium international-looking reels out. Aliasgar is great at this. Trust him with your content calendar.' },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { playHover, playClick } = useSfx();
  const { metrics } = useAdmin();
  const { isAdmin, editMode } = useContent();
  const [brief, setBrief] = useState('');
  const reviewLoop = useMemo(() => [...seededReviews, ...seededReviews], []);
  const whatsappMessage = `Hi Aliasgar, I want to start a project with VisionFold Creative.${brief ? ` Brief: ${brief}` : ''}`;

  return (
    <div className="relative flex flex-col overflow-hidden bg-[#050507] text-[#F4F1EA]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <ThreeHero />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/40 via-transparent to-[#050507]" />
        <div className="absolute inset-0 noise-overlay opacity-40" />
      </div>

      <section className="relative z-10 min-h-screen px-6 pb-24 pt-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <RevealSection>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-black/40 px-4 py-2 backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-[#D4AF37] animate-pulse" />
              <EditableText page="home" sectionKey="home_hero_kicker" fallback="Premium consumer video studio" className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]" tagName="span" />
            </div>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] md:text-7xl xl:text-8xl">
              <EditableText page="home" sectionKey="home_hero_headline" fallback="Make every scroll stop, watch, and buy." className="block gold-gradient-text" tagName="span" />
            </h1>
            <EditableText page="home" sectionKey="home_hero_subline" fallback="High-retention short-form, launch creatives, and custom long-form for brands that refuse to look average." className="mt-8 max-w-2xl text-lg font-light leading-8 text-[#B8B3AA]" tagName="p" />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick} className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:scale-105 hover:bg-white">
                Start on WhatsApp <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <button type="button" onMouseEnter={playHover} onClick={() => { playClick(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]">
                View pricing
              </button>
            </div>
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3 text-center">
              {['Shorts ₹700', 'Long-form custom', metrics?.retentionSplit || 'Retention-first'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/40 p-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8B3AA] backdrop-blur-xl">{item}</div>
              ))}
            </div>
          </RevealSection>

          <RevealSection className="relative perspective-hero">
            <div className="absolute -inset-10 rounded-full bg-[#D4AF37]/15 blur-3xl animate-[glow-pulse_3.5s_ease-in-out_infinite]" />
            <div className="tilt-3d relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#F4F1EA] p-8 shadow-2xl shadow-black/60">
              <VisionFoldLogo variant="full" color="dark" size="xl" />
              <div className="mt-8 grid grid-cols-3 gap-3">
                {['EDIT', 'CREATE', 'INSPIRE'].map((word) => (
                  <div key={word} className="rounded-xl bg-black px-3 py-3 text-center text-[10px] font-black tracking-[0.35em] text-white">{word}</div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 bg-black/5 p-4">
                <Layers3 className="h-5 w-5 text-[#D4AF37]" />
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-black/70">3D studio systems · live workflow</p>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-black/50 px-6 py-24 backdrop-blur-xl">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12">
            <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Why VisionFold</p>
            <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Creative systems that convert</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="group fold-card rounded-3xl p-7">
                <feature.icon className="mb-8 h-8 w-8 text-[#D4AF37] transition-transform group-hover:scale-110" />
                <h3 className="mb-3 text-lg font-black uppercase tracking-[0.08em]">{feature.title}</h3>
                <p className="text-sm leading-7 text-[#B8B3AA]">{feature.text}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <section className="relative z-10 px-6 py-24">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Workflow</p>
              <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">From brief to final cut</h2>
            </div>
            <Clapperboard className="hidden h-12 w-12 text-[#D4AF37] md:block" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {processSteps.map((s) => (
              <div key={s.step} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-[#D4AF37]/50">
                <p className="text-3xl font-black text-[#D4AF37]/80">{s.step}</p>
                <h3 className="mt-4 text-lg font-black uppercase">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#B8B3AA]">{s.text}</p>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <section id="work" className="relative z-10 border-y border-white/10 bg-black/40 px-6 py-28">
        <RevealSection className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Selected work</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {workCards.map((card) => (
              <div key={card.title} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-2 hover:border-[#D4AF37]/60">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-110 group-hover:opacity-100" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <Play className="absolute left-6 top-6 h-10 w-10 rounded-full bg-[#D4AF37] p-3 text-black" />
                </div>
                <div className="p-6">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">{card.type}</p>
                  <h3 className="text-2xl font-black">{card.title}</h3>
                  <p className="mt-4 text-sm font-bold text-[#B8B3AA]">{card.metric}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <a href="/work" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] hover:text-white">
              View full portfolio <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </RevealSection>
      </section>

      <section id="pricing" className="relative z-10 px-6 py-28">
        <RevealSection className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#D4AF37]/40 bg-[#D4AF37] p-8 text-black shadow-[0_0_80px_rgba(212,175,55,0.25)]">
            <Scissors className="mb-10 h-10 w-10" />
            <h2 className="text-5xl font-black uppercase tracking-[-0.05em]">Short-form</h2>
            <div className="mt-8 text-7xl font-black inr-price">₹700</div>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.18em]">Per short-form edit</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <Film className="mb-10 h-10 w-10 text-[#D4AF37]" />
            <h2 className="text-5xl font-black uppercase tracking-[-0.05em]">Long-form</h2>
            <div className="mt-8 text-5xl font-black">Custom quote</div>
            <p className="mt-5 leading-7 text-[#B8B3AA]">YouTube, documentaries, podcasts, brand films — priced by complexity.</p>
            <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi Aliasgar, I need a custom long-form quote.')}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-full border border-[#D4AF37]/50 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37] transition hover:bg-[#D4AF37] hover:text-black">DM for long-form</a>
          </div>
        </RevealSection>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-black/50 px-6 py-20 backdrop-blur-xl">
        <RevealSection className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <LockKeyhole className="mb-6 h-10 w-10 text-[#D4AF37]" />
            <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">Client portal</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#B8B3AA]">Track projects, invoices, deliveries, and revisions in one workspace.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {['Projects', 'Invoices', 'AI Assist'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-5 text-center text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37]">{item}</div>
              ))}
            </div>
            <button type="button" onClick={() => { playClick(); window.location.href = '/portal'; }} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#D4AF37]">Open client portal</button>
          </div>
        </RevealSection>
      </section>

      <section className="relative z-10 overflow-hidden px-6 py-28">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Social proof</p>
              <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Client reviews</h2>
            </div>
            <BadgeCheck className="hidden h-12 w-12 text-[#D4AF37] md:block" />
          </div>
          <div className="overflow-hidden">
            <div className="review-track">
              {reviewLoop.map((review, index) => (
                <div key={`${review.name}-${index}`} className="w-[340px] shrink-0 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:w-[400px]">
                  <div className="mb-5 flex gap-1 text-[#D4AF37]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                  <Quote className="mb-4 h-6 w-6 text-white/30" />
                  <p className="min-h-24 text-sm leading-7 text-[#D8D3CA]">“{review.quote}”</p>
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <p className="font-black">{review.name}</p>
                    <p className="text-xs uppercase tracking-[0.15em] text-[#D4AF37]">{review.place}</p>
                    <p className="mt-1 text-xs text-[#B8B3AA]">{review.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black px-6 py-24">
        <RevealSection className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <MessageCircleMore className="mb-6 h-10 w-10 text-[#D4AF37]" />
            <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Ready to fold raw footage into a premium story?</h2>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Product, platform, audience, deadline, edit style..." className="min-h-36 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" />
            <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-black">
              <Send className="h-4 w-4" /> Send brief on WhatsApp
            </a>
          </div>
        </RevealSection>
      </section>

      {isAdmin && editMode ? null : null}
    </div>
  );
};
