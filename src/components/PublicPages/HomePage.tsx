import React, { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Clapperboard, Clock3, Film, LockKeyhole, MessageCircleMore, MonitorPlay, Play, Quote, Scissors, Send, Sparkles, Star, Wand2, Zap } from 'lucide-react';
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
  { title: 'Retention Reels', type: 'Short Form', metric: 'Custom quote', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=900&q=80' },
  { title: 'Founder Stories', type: 'Consumer Brands', metric: 'DM for custom quote', image: 'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&w=900&q=80' },
  { title: 'Launch Ads', type: 'Performance Creative', metric: 'Hook + CTA system', image: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?auto=format&fit=crop&w=900&q=80' },
];

const features = [
  { icon: Zap, title: 'Hook-first edits', text: 'First three seconds planned for scroll-stopping consumer attention.' },
  { icon: Wand2, title: 'Premium polish', text: 'Kinetic captions, SFX, motion accents, grading, and clean brand-safe exports.' },
  { icon: Clock3, title: 'Workflow dashboard', text: 'Admin-ready leads, projects, invoices, and revisions to keep every job moving.' },
  { icon: MonitorPlay, title: 'Platform masters', text: 'Reels, Shorts, TikTok, YouTube, ads, and launch cuts formatted correctly.' },
];

const premiumMotionSystems = [
  { title: 'Magnetic Brief Builder', text: 'A high-friction-free brief CTA that turns vague ideas into actionable edit direction before the first DM.', accent: 'from-[#D4AF37] to-white' },
  { title: 'Delivery Pulse Timeline', text: 'A premium animated workflow promise for intake, first cut, revision, final export, and review request.', accent: 'from-white to-[#8D7A3A]' },
  { title: 'Client Trust Loop', text: 'Reviews are framed as a post-delivery moment, so feedback feels earned instead of randomly requested.', accent: 'from-[#D4AF37] to-[#7C5B12]' },
];

const seededReviews = [
  { name: 'Aarav Mehta', place: 'Mumbai, India', role: 'D2C Skincare Founder', quote: 'VisionFold made our product reel feel like a luxury launch film. The pacing and captions instantly improved our ad quality.' },
  { name: 'Naina Kapoor', place: 'Delhi, India', role: 'Fashion Creator', quote: 'Aliasgar understood my audience quickly and turned simple footage into premium reels that looked very international.' },
  { name: 'Rohan Shetty', place: 'Karnataka, India', role: 'Fitness Coach', quote: 'The short-form edits were crisp, fast, and clean. My clients noticed the upgrade from the first post.' },
  { name: 'Priya Shah', place: 'Mumbai, India', role: 'Cafe Owner', quote: 'Our menu launch videos finally looked high-end. The transitions, sound design, and color made a huge difference.' },
  { name: 'Karan Malhotra', place: 'Delhi, India', role: 'Real Estate Marketer', quote: 'They converted property walkthrough footage into sharp consumer-facing stories instead of boring listing videos.' },
  { name: 'Ahmed Al Mansoori', place: 'Dubai, UAE', role: 'Ecommerce Operator', quote: 'Clean communication, premium edits, and very good attention to product detail. The videos looked ready for paid campaigns.' },
  { name: 'Sarah Collins', place: 'New York, USA', role: 'Personal Brand Consultant', quote: 'VisionFold gave our client clips a polished agency feel with hooks, b-roll rhythm, and strong retention pacing.' },
  { name: 'Devika Rao', place: 'Bengaluru, Karnataka', role: 'SaaS Marketer', quote: 'The edits helped explain our app in a more visual way. The workflow was organized and feedback was easy.' },
  { name: 'Michael Reed', place: 'Austin, USA', role: 'YouTube Creator', quote: 'Long-form pricing was handled through DMs, and the custom quote matched the complexity. Final cut felt premium.' },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { playHover, playClick } = useSfx();
  const { metrics } = useAdmin();
  const { isAdmin, editMode } = useContent();
  const [brief, setBrief] = useState('');
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [userReviews, setUserReviews] = useState<typeof seededReviews>([]);

  const allReviews = useMemo(() => [...userReviews, ...seededReviews].slice(0, userReviews.length + 9), [userReviews]);
  const whatsappMessage = `Hi Aliasgar, I want to start a project with VisionFold Creative.${brief ? ` Brief: ${brief}` : ''}`;

  const addReview = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reviewName.trim() || !reviewText.trim()) return;
    setUserReviews((reviews) => [{ name: reviewName.trim(), place: 'Client submitted', role: 'Website Review', quote: reviewText.trim() }, ...reviews]);
    setReviewName('');
    setReviewText('');
  };

  return (
    <div className="relative flex flex-col overflow-hidden bg-[#050505] text-[#F4F1EA] font-sans">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-70">
        <ThreeHero />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,175,55,0.18),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_22%),linear-gradient(135deg,#050505_0%,#101012_45%,#050505_100%)]" />
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 blur-2xl animate-pulse" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:70px_70px] [transform:perspective(900px)_rotateX(58deg)_translateY(-180px)]" />
      </div>

      <section className="relative z-10 min-h-screen px-6 pb-24 pt-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
          <RevealSection>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <EditableText page="home" sectionKey="home_hero_kicker" fallback="Premium consumer-focused video agency" className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]" tagName="span" />
            </div>
            <h1 className="max-w-5xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.06em] md:text-7xl xl:text-8xl">
              <EditableText page="home" sectionKey="home_hero_headline" fallback="Make every scroll stop, watch, and buy." className="block" tagName="span" />
            </h1>
            <EditableText page="home" sectionKey="home_hero_subline" fallback="VisionFold Creative Studio edits high-retention short-form videos, launch creatives, and custom long-form stories for consumer brands, creators, and premium businesses." className="mt-8 max-w-2xl text-lg font-light leading-8 text-[#B8B3AA]" tagName="p" />
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" onMouseEnter={playHover} onClick={playClick} className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#D4AF37] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:scale-105 hover:bg-white">
                Start on WhatsApp <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <button onMouseEnter={playHover} onClick={() => { playClick(); document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full border border-white/15 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]">
                View pricing
              </button>
              <button onMouseEnter={playHover} onClick={() => { playClick(); onNavigate('portal'); window.location.href = '/portal'; }} className="rounded-full border border-white/15 bg-black/40 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl transition-all hover:border-white hover:bg-white hover:text-black">
                Client login
              </button>
            </div>
            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-3 text-center">
              {['Short-form custom', 'Long-form custom', metrics.retentionSplit].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#B8B3AA] backdrop-blur-xl">{item}</div>)}
            </div>
          </RevealSection>

          <RevealSection className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-[#D4AF37]/10 blur-3xl" />
            <div className="relative rounded-[2.5rem] border border-white/10 bg-[#F4F1EA] p-8 shadow-2xl shadow-black/60 [transform:perspective(1000px)_rotateY(-8deg)_rotateX(4deg)] transition-transform duration-700 hover:[transform:perspective(1000px)_rotateY(0deg)_rotateX(0deg)]">
              <div className="mb-6 h-40 overflow-hidden rounded-[2rem] bg-black opacity-95 md:h-44"><ThreeHero /></div>
              <div className="relative z-10 mx-auto max-w-[430px] rounded-[1.5rem] bg-[#F4F1EA]/90 px-4 py-3"><VisionFoldLogo variant="full" color="dark" size="lg" /></div>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {['EDIT', 'CREATE', 'INSPIRE'].map((word) => <div key={word} className="rounded-xl bg-black px-3 py-3 text-center text-[10px] font-black tracking-[0.35em] text-white">{word}</div>)}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-black/35 px-6 py-24 backdrop-blur-xl">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Consumer creative systems</p><h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Built to improve your workflow</h2></div>
            <p className="max-w-md text-sm leading-7 text-[#B8B3AA]">From lead capture to delivery, the site now supports a premium front-end journey and a working admin credential setup.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => <div key={feature.title} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl transition-all hover:-translate-y-2 hover:border-[#D4AF37]/60"><feature.icon className="mb-8 h-8 w-8 text-[#D4AF37]" /><h3 className="mb-3 text-lg font-black uppercase tracking-[0.08em]">{feature.title}</h3><p className="text-sm leading-7 text-[#B8B3AA]">{feature.text}</p></div>)}
          </div>
        </RevealSection>
      </section>

      <section className="relative z-10 px-6 py-28">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">3 premium upgrades</p>
              <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Motion systems that feel expensive</h2>
            </div>
            <Clapperboard className="hidden h-14 w-14 animate-pulse text-[#D4AF37] md:block" />
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {premiumMotionSystems.map((system, index) => <div key={system.title} className="group relative min-h-72 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-7 transition-all duration-700 hover:-translate-y-3 hover:rotate-1 hover:border-[#D4AF37]/60"><div className={`absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${system.accent} opacity-20 blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-40`} /><div className="relative z-10 flex h-full flex-col justify-between"><div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-xl font-black text-[#D4AF37]">0{index + 1}</div><div><h3 className="mb-4 text-2xl font-black uppercase tracking-[-0.02em]">{system.title}</h3><p className="text-sm leading-7 text-[#B8B3AA]">{system.text}</p></div></div></div>)}
          </div>
        </RevealSection>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-black/30 px-6 py-20 backdrop-blur-xl">
        <RevealSection className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <LockKeyhole className="mb-6 h-10 w-10 text-[#D4AF37]" />
            <h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-5xl">Client auth is ready</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#B8B3AA]">Existing clients can sign in to the portal to view projects, invoices, delivered files, and revision requests. Admin can create client accounts from the dashboard.</p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {['Projects', 'Invoices', 'Revisions'].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-black/40 px-4 py-5 text-center text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37] transition-transform hover:-translate-y-1">{item}</div>)}
            </div>
            <button onClick={() => { playClick(); window.location.href = '/portal'; }} className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-black transition-all hover:bg-[#D4AF37]">Open client portal</button>
          </div>
        </RevealSection>
      </section>

      <section id="work" className="relative z-10 px-6 py-28">
        <RevealSection className="mx-auto max-w-7xl">
          <h2 className="mb-12 text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Agency-grade edits</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {workCards.map((card) => <div key={card.title} className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-2 hover:border-[#D4AF37]/60"><div className="relative aspect-[4/5] overflow-hidden"><img src={card.image} alt={card.title} className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-110 group-hover:opacity-100" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" /><Play className="absolute left-6 top-6 h-10 w-10 rounded-full bg-[#D4AF37] p-3 text-black" /></div><div className="p-6"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37]">{card.type}</p><h3 className="text-2xl font-black">{card.title}</h3><p className="mt-4 text-sm font-bold text-[#B8B3AA]">{card.metric}</p></div></div>)}
          </div>
        </RevealSection>
      </section>

      <section id="pricing" className="relative z-10 border-y border-white/10 bg-[#0D0D0F] px-6 py-28">
        <RevealSection className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-[#D4AF37]/40 bg-[#D4AF37] p-8 text-black"><Scissors className="mb-10 h-10 w-10" /><h2 className="text-5xl font-black uppercase tracking-[-0.05em]">Short-form videos</h2><div className="mt-8 text-5xl font-black">Custom quote</div><p className="mt-4 text-sm font-bold uppercase tracking-[0.18em]">We will discuss your scope before pricing</p></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8"><Film className="mb-10 h-10 w-10 text-[#D4AF37]" /><h2 className="text-5xl font-black uppercase tracking-[-0.05em]">Long-form cuts</h2><div className="mt-8 text-5xl font-black">Custom quote</div><p className="mt-5 leading-7 text-[#B8B3AA]">Long-form YouTube, documentaries, podcasts, and brand films vary by footage, structure, graphics, and revisions. Message in DMs for an exact quote.</p><a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi Aliasgar, I need a custom long-form quote from VisionFold Creative.')}`} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex rounded-full border border-[#D4AF37]/50 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black">DM for long-form</a></div>
        </RevealSection>
      </section>

      <section className="relative z-10 px-6 py-28">
        <RevealSection className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6"><div><p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">Swipe left</p><h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Client reviews</h2><p className="mt-3 text-sm text-[#B8B3AA]">Showing fewer cards at once keeps the page cleaner. Feedback is requested after a client project is delivered.</p></div><BadgeCheck className="hidden h-12 w-12 text-[#D4AF37] md:block" /></div>
          <div className="flex snap-x gap-5 overflow-x-auto pb-6 [scrollbar-width:none] motion-safe:animate-[review-slide_45s_linear_infinite] hover:[animation-play-state:paused] [&::-webkit-scrollbar]:hidden">
            {allReviews.map((review, index) => <div key={`${review.name}-${index}`} className="min-w-[84%] snap-center rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-transform duration-500 hover:-translate-y-2 sm:min-w-[430px]"><div className="mb-5 flex gap-1 text-[#D4AF37]">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div><Quote className="mb-4 h-6 w-6 text-white/30" /><p className="min-h-28 text-sm leading-7 text-[#D8D3CA]">“{review.quote}”</p><div className="mt-6 border-t border-white/10 pt-5"><p className="font-black">{review.name}</p><p className="text-xs uppercase tracking-[0.15em] text-[#D4AF37]">{review.place}</p><p className="mt-1 text-xs text-[#B8B3AA]">{review.role}</p></div></div>)}
          </div>
          <form onSubmit={addReview} className="mt-4 grid gap-4 rounded-3xl border border-[#D4AF37]/25 bg-black/40 p-5 md:grid-cols-[1fr_2fr_auto]"><div className="md:col-span-3 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]">Delivered client? Leave your review after final files are approved.</div><input value={reviewName} onChange={(e) => setReviewName(e.target.value)} placeholder="Client name" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" /><input value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Post-delivery review" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" /><button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.15em] text-black"><Send className="h-4 w-4" /> Submit</button></form>
        </RevealSection>
      </section>

      <section className="relative z-10 border-t border-white/10 bg-black px-6 py-24">
        <RevealSection className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div><MessageCircleMore className="mb-6 h-10 w-10 text-[#D4AF37]" /><h2 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">Ready to fold raw footage into a premium consumer story?</h2></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"><textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Tell us your product, platform, target audience, deadline, and edit style..." className="min-h-36 w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#D4AF37]" /><a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-black"><Send className="h-4 w-4" /> Send brief on WhatsApp</a></div>
        </RevealSection>
      </section>

      {(isAdmin && editMode) ? null : null}
    </div>
  );
};
