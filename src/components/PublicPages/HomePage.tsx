import React, { useState } from 'react';
import { useSfx } from '../../context/SfxContext';
import { useAdmin } from '../../context/AdminContext';
import { useContent } from '../../context/ContentContext';
import { ThreeHero } from '../ThreeHero';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Activity, ArrowRight, Video, Scissors, Film, MonitorPlay, Infinity as InfinityIcon, MessageCircleMore } from 'lucide-react';
import { EditableText } from '../EditableText';
import { EditableImage } from '../EditableImage';

interface HomePageProps {
  onNavigate: (page: string) => void;
}


const RevealSection: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ref = useScrollReveal();
  return <div ref={ref} className={className}>{children}</div>;
};

const ShowcaseCard: React.FC<{ imageUrl: string; title: string }> = ({ imageUrl, title }) => {
  return (
    <div className="relative aspect-video bg-[#121215] rounded overflow-hidden border border-[#222226] group interactive-hover">
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-transparent to-transparent" />
      <div className="absolute bottom-6 left-6 right-6">
        <span className="font-bold text-xs uppercase tracking-[0.15em] text-[#EDEDED]">Case Study Preview</span>
      </div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { playHover, playClick } = useSfx();
  const { baselineRate, metrics, addonRates } = useAdmin();
  const { isAdmin, editMode } = useContent();
  
  const [estimatorMinutes, setEstimatorMinutes] = useState<number>(3);
  const [wants4k, setWants4k] = useState(false);
  const [wantsMulti, setWantsMulti] = useState(false);
  const [wantsCustomSound, setWantsCustomSound] = useState(false);
  const [brief, setBrief] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const baseTotal = estimatorMinutes * baselineRate;
  const addonCost = 
    (wants4k ? addonRates.render4k : 0) + 
    (wantsMulti ? addonRates.multiFormat : 0) + 
    (wantsCustomSound ? addonRates.customSound : 0);
  const totalCost = baseTotal + (addonCost * estimatorMinutes);

  const selectedAddons = [wants4k && '4K Render', wantsMulti && 'Multi-Format', wantsCustomSound && 'Custom Sound'].filter(Boolean).join(', ');
  const whatsappMessage = `Hi Aliasgar, I'm interested in a video editing project with VisionFold. I'm looking at approximately ${estimatorMinutes} minutes of finished video.${selectedAddons ? ' With addons: ' + selectedAddons : ''}`;
  const defaultWhatsappMessage = `Hi Aliasgar, I'm interested in a video editing project with VisionFold.`;

  const handleSuggestQuestions = async () => {
    if (!brief.trim()) return;
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/ai/inquiry-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: brief }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to generate questions');
      setSuggestions((payload.questions || []).filter(Boolean));
    } catch {
      setSuggestions(['What is the target audience?', 'What is the final platform for the content?', 'What is the timeline and revision count?']);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#0A0A0B] text-[#EDEDED] font-sans">
      
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6 pb-32 pt-20">
        <ThreeHero />

        <div className="pointer-events-none relative z-10 mx-auto mt-12 flex max-w-5xl flex-col items-center text-center md:mt-0">
          <div className="pointer-events-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[#222226] bg-[#121215]/80 px-3 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#D4AF37]" />
            <EditableText page="home" sectionKey="home_hero_kicker" fallback="PREMIUM VIDEO EDITING LEAD BY ALIASGAR" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888891]" tagName="span" />
          </div>

          <EditableText page="home" sectionKey="home_hero_eyebrow" fallback="EDIT • CREATE • INSPIRE" className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]" tagName="div" />

          <h1 className="mb-8 text-4xl font-black uppercase leading-[0.9] tracking-[-0.03em] text-[#EDEDED] md:text-6xl lg:text-8xl">
            <EditableText page="home" sectionKey="home_hero_headline" fallback="High-Retention Video Production &" className="block" tagName="span" />
            <span className="mt-2 block bg-gradient-to-b from-[#EDEDED] to-[#888891] bg-clip-text text-transparent">
              <EditableText page="home" sectionKey="home_hero_headline_alt" fallback="Narrative Architecture" className="block" tagName="span" />
            </span>
            <EditableText page="home" sectionKey="home_hero_headline_tail" fallback="for Category-Leading Brands." className="mt-2 block" tagName="span" />
          </h1>

          <EditableText page="home" sectionKey="home_hero_subline" fallback="Surgical video pacing, cinematic color grading, and organic sound design built for maximum viewer retention." className="mb-12 max-w-2xl text-base font-light leading-relaxed text-[#888891] md:text-lg" tagName="p" />

          <div className="pointer-events-auto flex flex-col items-center gap-6 sm:flex-row">
            <a
              href={`https://wa.me/917725004639?text=${encodeURIComponent(defaultWhatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={playHover}
              onClick={playClick}
              className="flex items-center gap-3 bg-[#25D366] px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#0A0A0B] transition-colors hover:bg-white hover:text-[#0A0A0B] interactive-hover"
            >
              START PROJECT <ArrowRight className="h-4 w-4" />
            </a>

            <button
              onClick={() => { playClick(); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); }}
              onMouseEnter={playHover}
              className="border border-[#222226] px-8 py-4 text-xs font-bold uppercase tracking-[0.15em] text-[#EDEDED] transition-all hover:border-[#D4AF37] hover:text-[#D4AF37] interactive-hover"
            >
              View Showcase
            </button>
          </div>
        </div>
      </section>

      {/* Selected Works */}
      <section id="work" className="py-32 px-6 bg-[#0A0A0B]">
        <div className="max-w-7xl mx-auto">
          <RevealSection className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-[-0.03em] uppercase text-[#EDEDED]">Selected Works & Case Studies</h2>
            </div>
            <p className="text-[#888891] text-sm uppercase tracking-[0.15em] font-bold max-w-xs md:text-right">
              Metric-driven business outcomes.
            </p>
          </RevealSection>

          <div className="flex flex-col gap-16">
            <RevealSection>
              <div className="flex flex-col gap-4">
                <div className="group border border-[#222226] hover:border-[#D4AF37] bg-[#121215] p-2 transition-all duration-300 rounded-lg">
                  <div className="relative rounded overflow-hidden bg-[#0A0A0B]">
                    <ShowcaseCard
                      title="Alex Tech Insights"
                      imageUrl="https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
                    />
                    <div className="absolute top-6 left-6 z-20 pointer-events-none">
                      <div className="border border-[#222226] bg-[#0A0A0B]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#EDEDED] backdrop-blur-md">
                        Alex Tech Insights
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">Long-Form YouTube Edit</h3>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold">{metrics.card1Metric}</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="flex flex-col gap-4">
                <div className="group border border-[#222226] hover:border-[#D4AF37] bg-[#121215] p-2 transition-all duration-300 rounded-lg">
                  <div className="relative rounded overflow-hidden bg-[#0A0A0B]">
                    <ShowcaseCard
                      title="Aura Performance"
                      imageUrl="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
                    />
                    <div className="absolute top-6 left-6 z-20 pointer-events-none">
                      <div className="border border-[#222226] bg-[#0A0A0B]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#EDEDED] backdrop-blur-md">
                        Aura Performance
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">Viral Micro-Narrative Reel</h3>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold">{metrics.card2Metric}</span>
                  </div>
                </div>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="flex flex-col gap-4">
                <div className="group border border-[#222226] hover:border-[#D4AF37] bg-[#121215] p-2 transition-all duration-300 rounded-lg">
                  <div className="relative rounded overflow-hidden bg-[#0A0A0B]">
                    <ShowcaseCard
                      title="Kube Design Studio"
                      imageUrl="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                    />
                    <div className="absolute top-6 left-6 z-20 pointer-events-none">
                      <div className="border border-[#222226] bg-[#0A0A0B]/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#EDEDED] backdrop-blur-md">
                        Kube Design Studio
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-2xl font-bold tracking-tight mb-2 text-[#EDEDED]">Cinematic Brand Film</h3>
                  <div className="flex items-center gap-2 text-[#D4AF37]">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm font-bold">{metrics.card3Metric}</span>
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* Services & Dedicated Workflow */}
      <section id="services" className="py-32 px-6 bg-[#121215] border-y border-[#222226]">
        <RevealSection className="max-w-7xl mx-auto">
          <div className="mb-20 text-center">
            <EditableText page="home" sectionKey="home_services_heading" fallback="Services & Expertise" className="mb-6 text-3xl font-semibold uppercase tracking-[-0.03em] text-[#EDEDED] md:text-5xl" tagName="h2" />
            <EditableText page="home" sectionKey="home_services_subline" fallback="Specialized post-production capabilities tailored to diverse content formats and platforms." className="mx-auto max-w-2xl text-lg font-light text-[#888891]" tagName="p" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { titleKey: 'home_services_item_1_title', descKey: 'home_services_item_1_desc', icon: Scissors, fallbackTitle: 'Short-Form Editing', fallbackDesc: 'High-impact Reels, Shorts, and TikToks designed for viral retention.' },
              { titleKey: 'home_services_item_2_title', descKey: 'home_services_item_2_desc', icon: MonitorPlay, fallbackTitle: 'Long-Form YouTube', fallbackDesc: 'Talking heads, Vlogs, and Documentaries with surgical narrative pacing.' },
              { titleKey: 'home_services_item_3_title', descKey: 'home_services_item_3_desc', icon: Film, fallbackTitle: 'Brand Films', fallbackDesc: 'Luxury product showcases and commercial ads with cinematic grading.' },
              { titleKey: 'home_services_item_4_title', descKey: 'home_services_item_4_desc', icon: Video, fallbackTitle: 'Motion Graphics', fallbackDesc: 'Custom lower thirds, data diagrams, and 3D overlays/tracking.' },
              { titleKey: 'home_services_item_5_title', descKey: 'home_services_item_5_desc', icon: InfinityIcon, fallbackTitle: 'Content Retainers', fallbackDesc: 'Ongoing batch editing managed directly by lead editor Aliasgar.' },
            ].map((service, i) => (
              <div key={i} className="group border border-[#222226] bg-[#0A0A0B] p-8 transition-colors hover:border-[#D4AF37] interactive-hover">
                <service.icon className="mb-6 h-8 w-8 text-[#888891] transition-colors group-hover:text-[#D4AF37]" />
                <EditableText page="home" sectionKey={service.titleKey} fallback={service.fallbackTitle} className="mb-4 text-lg font-bold uppercase tracking-[0.2em] text-[#EDEDED]" tagName="h3" />
                <EditableText page="home" sectionKey={service.descKey} fallback={service.fallbackDesc} className="text-sm font-light leading-relaxed text-[#888891]" tagName="p" />
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* 5-Step Execution Workflow */}
      <section id="process" className="py-32 px-6 bg-[#0A0A0B]">
        <RevealSection className="max-w-7xl mx-auto">
          <div className="mb-20 md:w-1/2">
            <EditableText page="home" sectionKey="home_process_heading" fallback="Execution Workflow" className="mb-6 text-3xl font-semibold uppercase tracking-[-0.03em] text-[#EDEDED] md:text-5xl" tagName="h2" />
            <EditableText page="home" sectionKey="home_process_subline" fallback="A systematic approach to post-production that leaves nothing to chance." className="text-lg font-light text-[#888891]" tagName="p" />
          </div>

          <div className="flex flex-col border-t border-[#222226] pt-12">
            {[
              { num: '01', titleKey: 'home_process_step_1_title', descKey: 'home_process_step_1_desc', fallbackTitle: 'Strategic Narrative Briefing', fallbackDesc: 'Analyzing target audience, emotional core, and business objectives.' },
              { num: '02', titleKey: 'home_process_step_2_title', descKey: 'home_process_step_2_desc', fallbackTitle: 'Pacing & Hook Architecture', fallbackDesc: 'Engineering the critical first 3-second retention hook and outlining pacing.' },
              { num: '03', titleKey: 'home_process_step_3_title', descKey: 'home_process_step_3_desc', fallbackTitle: 'Surgical Cut Timing', fallbackDesc: 'Trimming dead air, applying dynamic beats, and eliminating drop-off points.' },
              { num: '04', titleKey: 'home_process_step_4_title', descKey: 'home_process_step_4_desc', fallbackTitle: 'Captions, SFX & Color Grade', fallbackDesc: 'Adding kinetic typography, organic Foley sound design, and Rec.709 cinematic grading.' },
              { num: '05', titleKey: 'home_process_step_5_title', descKey: 'home_process_step_5_desc', fallbackTitle: 'Platform-Optimized Export', fallbackDesc: 'Delivering mastered 4K renders optimized for YouTube, Reels, or TikTok algorithms.' }
            ].map((step, i) => (
              <div key={i} className="group relative flex flex-col gap-8 overflow-hidden border-b border-[#222226] py-10 md:flex-row">
                <div className="w-16 font-mono text-sm font-bold text-[#888891] transition-colors group-hover:text-[#D4AF37] md:text-lg">{step.num}</div>
                <div className="flex-1">
                  <EditableText page="home" sectionKey={step.titleKey} fallback={step.fallbackTitle} className="mb-3 text-xl font-bold text-[#EDEDED] md:text-2xl" tagName="h3" />
                  <EditableText page="home" sectionKey={step.descKey} fallback={step.fallbackDesc} className="text-base font-light leading-relaxed text-[#888891] md:text-lg" tagName="p" />
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* Estimator */}
      <section id="estimator" className="border-y border-[#222226] bg-[#0A0A0B] px-6 py-32">
        <RevealSection className="mx-auto max-w-4xl">
          <div className="mb-16">
            <EditableText page="home" sectionKey="home_estimator_heading" fallback="Transparent Investment" className="mb-4 text-3xl font-semibold uppercase tracking-[-0.03em] text-[#EDEDED] md:text-5xl" tagName="h2" />
            <EditableText page="home" sectionKey="home_estimator_subline" fallback={`We operate on a flat baseline rate of ₹${baselineRate} per finished minute. Use the calculator to estimate your project cost.`} className="font-light text-[#888891]" tagName="p" />
          </div>

          <div className="overflow-hidden rounded-xl border border-[#222226] bg-[#121215]">
            <div className="flex flex-col items-center border-b border-[#222226] p-12 text-center">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[#888891]">ESTIMATED OUTPUT</div>
              <div className="mb-8 text-5xl font-black text-[#D4AF37] md:text-7xl">₹{totalCost.toLocaleString()}</div>
              <a
                href={`https://wa.me/917725004639?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={playHover}
                onClick={playClick}
                className="w-full bg-[#EDEDED] px-16 py-5 text-center text-xs font-bold uppercase tracking-[0.15em] text-[#0A0A0B] transition-colors hover:bg-white interactive-hover md:w-auto"
              >
                RESERVE EDIT SLOT
              </a>
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-6 flex items-center justify-between text-xs font-bold uppercase tracking-[0.2em] text-[#888891]">
                <span>FINISHED DURATION</span>
                <span className="text-[#EDEDED]">{estimatorMinutes} MINS</span>
              </div>

              <input
                type="range"
                min="1"
                max="20"
                value={estimatorMinutes}
                onChange={(e) => { playHover(); setEstimatorMinutes(parseInt(e.target.value)); }}
                className="mb-12 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#222226] outline-none interactive-hover [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4AF37]"
              />

              <div className="space-y-6 border-t border-[#222226] pt-6">
                <label className="flex items-center justify-between gap-4 text-[#888891] transition-colors group cursor-pointer hover:text-[#EDEDED]">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={wants4k} onChange={(e) => { playClick(); setWants4k(e.target.checked); }} className="h-5 w-5 border-[#222226] bg-[#121215] accent-[#D4AF37]" />
                    <span className="text-sm">4K Render Export</span>
                  </div>
                  <span className="text-xs font-mono">+₹{addonRates.render4k}/min</span>
                </label>

                <label className="flex items-center justify-between gap-4 text-[#888891] transition-colors group cursor-pointer hover:text-[#EDEDED]">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={wantsMulti} onChange={(e) => { playClick(); setWantsMulti(e.target.checked); }} className="h-5 w-5 border-[#222226] bg-[#121215] accent-[#D4AF37]" />
                    <span className="text-sm">Multi-Format Reframing (16:9 + 9:16)</span>
                  </div>
                  <span className="text-xs font-mono">+₹{addonRates.multiFormat}/min</span>
                </label>

                <label className="flex items-center justify-between gap-4 text-[#888891] transition-colors group cursor-pointer hover:text-[#EDEDED]">
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={wantsCustomSound} onChange={(e) => { playClick(); setWantsCustomSound(e.target.checked); }} className="h-5 w-5 border-[#222226] bg-[#121215] accent-[#D4AF37]" />
                    <span className="text-sm text-[#D4AF37]">Custom Sound Design & Foley</span>
                  </div>
                  <span className="text-xs font-mono text-[#D4AF37]">+₹{addonRates.customSound}/min</span>
                </label>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      <section className="border-t border-[#222226] bg-[#121215] px-6 py-24">
        <RevealSection className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#222226] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              <MessageCircleMore className="h-4 w-4" />
              <span>Inquiry Assist</span>
            </div>
            <EditableText page="home" sectionKey="home_inquiry_heading" fallback="Need a sharper brief before you reach out?" className="mb-3 text-3xl font-semibold uppercase tracking-[-0.03em] text-[#EDEDED] md:text-4xl" tagName="h2" />
            <EditableText page="home" sectionKey="home_inquiry_subline" fallback="Share the rough idea, and we’ll suggest the questions that help us quote the work faster." className="max-w-xl text-base font-light leading-relaxed text-[#888891]" tagName="p" />
          </div>
          <div className="w-full rounded-2xl border border-[#222226] bg-[#0A0A0B] p-6 lg:max-w-xl">
            <textarea
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              placeholder="Describe the video, audience, platform, and timeline..."
              className="min-h-32 w-full rounded-xl border border-[#222226] bg-[#121215] px-4 py-3 text-sm text-[#EDEDED] outline-none focus:border-[#D4AF37]"
            />
            <button
              type="button"
              onClick={() => void handleSuggestQuestions()}
              className="mt-4 rounded-full border border-[#D4AF37]/40 bg-[#121215] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#EDEDED] transition-colors hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
            >
              {isSuggesting ? 'Probing your brief…' : 'Suggest clarifying questions'}
            </button>
            {suggestions.length ? (
              <ul className="mt-4 space-y-2 text-sm text-[#888891]">
                {suggestions.map((item) => (
                  <li key={item} className="rounded-lg border border-[#222226] bg-[#121215] px-3 py-2">{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </RevealSection>
      </section>

      <section className="border-t border-[#222226] bg-[#0A0A0B] px-6 py-16">
        <RevealSection className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <EditableText page="home" sectionKey="home_portfolio_heading" fallback="Featured portfolio" className="mb-3 text-2xl font-semibold uppercase tracking-[-0.03em] text-[#EDEDED]" tagName="h2" />
            <EditableText page="home" sectionKey="home_portfolio_subline" fallback="Swap imagery and copy from the admin panel without touching code." className="text-base font-light leading-relaxed text-[#888891]" tagName="p" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-[#222226] bg-[#121215]">
              <EditableImage page="home" sectionKey="home_portfolio_image_one" fallbackSrc="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80" alt="Editorial edit preview" className="h-56 w-full" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-[#222226] bg-[#121215]">
              <EditableImage page="home" sectionKey="home_portfolio_image_two" fallbackSrc="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80" alt="Story-driven motion graphics preview" className="h-56 w-full" />
            </div>
          </div>
        </RevealSection>
      </section>

    </div>
  );
};
