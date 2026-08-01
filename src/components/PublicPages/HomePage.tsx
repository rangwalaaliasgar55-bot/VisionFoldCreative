import React, { useEffect, useState, useRef } from 'react';
import {
  Film,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  Scissors,
  Sliders,
  TrendingUp,
  Send,
  Check,
  Calculator,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { StudioWorkspace } from '../StudioWorkspace';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { formatINR } from '../../lib/formatters';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  // Before/After Transformation Slider State
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Pricing Estimator State
  const [estimatorMinutes, setEstimatorMinutes] = useState<number>(3);

  // Contact Room Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactType, setContactType] = useState('Short-Form Reels / Shorts');
  const [contactLength, setContactLength] = useState('3 finished minutes');
  const [contactDeadline, setContactDeadline] = useState('Within 48 hours');
  const [contactBudget, setContactBudget] = useState('₹10,000 - ₹25,000');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Handle Before/After Slider Dragging
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setBeforeAfterPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  // Case Studies Portfolio Data
  const caseStudies = [
    {
      id: 'cs-1',
      title: 'Deep Tech Documentarian Series',
      client: 'Alex Tech Insights (1.2M Subs)',
      category: 'Long-Form YouTube',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      challenge: 'Raw 45-minute talking head footage dropped 60% of viewers in 45s due to slow pacing.',
      approach: 'Constructed 3-second pattern interrupt hook, trimmed 22 mins of filler, applied SFX and color grade.',
      result: '1.4M views & +192% viewer retention.',
    },
    {
      id: 'cs-2',
      title: 'Aura Fitness Viral Launch',
      client: 'Aura Performance Brand',
      category: 'Short-Form Reels & TikTok',
      thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      challenge: 'Product launch video felt flat and lacked high-energy social engagement.',
      approach: 'High-tempo sound design, kinetic typography captions, and punchy motion graphic callouts.',
      result: '3.8M impressions and ₹4.2L direct launch sales.',
    },
    {
      id: 'cs-3',
      title: 'Minimalist Architectural Showcase',
      client: 'Kube Design Studio',
      category: 'Brand Film & Commercial',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      challenge: 'Showcase luxury villa with unhurried pacing without boring high-net-worth buyers.',
      approach: 'Subtle speed-ramping, orchestral sound design, and pristine rec.709 color grading.',
      result: 'Featured on ArchDaily & 3 high-value contracts.',
    },
  ];

  // Process Steps
  const processSteps = [
    {
      step: '01',
      title: 'Understanding the Story',
      sub: 'Raw Footage & Vision Alignment',
      desc: 'Analyzing raw footage, target audience, and emotional message to outline the narrative arc.',
    },
    {
      step: '02',
      title: 'Planning the Edit',
      sub: 'Pacing & Hook Architecture',
      desc: 'Selecting prime takes, designing the first 3-second hook, and mapping sound design beats.',
    },
    {
      step: '03',
      title: 'Editing & Pacing',
      sub: 'Surgical Cut Timing',
      desc: 'Trimming dead air, applying dynamic punch-ins and pattern interrupts to maintain viewer retention.',
    },
    {
      step: '04',
      title: 'Motion Design & Polish',
      sub: 'Captions, SFX & Color Grade',
      desc: 'Integrating kinetic typography, custom sound effects, lower thirds, and cinematic color grading.',
    },
    {
      step: '05',
      title: 'Final Delivery',
      sub: 'Platform-Optimized Export',
      desc: 'Master 4K renders formatted for YouTube, 9:16 Instagram Reels, TikTok, or broadcast ads.',
    },
  ];

  // Services List
  const servicesList = [
    {
      title: 'Short-Form Editing',
      subtitle: 'Instagram Reels, YouTube Shorts, TikToks',
      desc: 'Engineered for viral retention with kinetic captions, 3-second visual hooks, and fast sound effects.',
      highlights: ['Attention hook design', 'Animated captions', 'SFX & music mix', 'High-tempo pacing'],
    },
    {
      title: 'Long-Form YouTube Editing',
      subtitle: 'Talking head, Vlogs, Documentaries',
      desc: 'Complete storytelling architecture designed to keep watch-time high and build loyal subscribers.',
      highlights: ['Full narrative structure', 'B-roll integration', 'Audio noise cleanup', 'Cinematic color grade'],
    },
    {
      title: 'Brand Videos',
      subtitle: 'Commercials, Product Ads, Case Studies',
      desc: 'High-end visual production feel for brands looking to build trust, authority, and sales conversion.',
      highlights: ['Luxury aesthetics', 'Soundtrack mastering', 'Graphic callouts', 'Logo stings'],
    },
    {
      title: 'Motion Graphics',
      subtitle: 'Title animations, 3D overlays, Infographics',
      desc: 'Custom motion graphics elements that explain complex topics cleanly and elevate production value.',
      highlights: ['Custom lower thirds', 'Animated charts & diagrams', 'Logo intros/outros', '3D tracker text'],
    },
    {
      title: 'Social Media Content Systems',
      subtitle: 'Monthly editing retainers & batches',
      desc: 'Consistent batch editing workflow for active creators and marketing teams needing weekly content.',
      highlights: ['Guaranteed turnaround', 'Dedicated editor Aliasgar', 'Brand guideline library', 'Priority revisions'],
    },
  ];

  const estimatedTotal = estimatorMinutes * 700;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitting(true);
    try {
      await api.sendMessage({
        name: contactName,
        email: contactEmail,
        phone: 'N/A',
        projectType: contactType,
        budgetRange: contactBudget,
        deadline: contactDeadline,
        message: `Project Inquiry: Video Length ${contactLength}. Type: ${contactType}. Deadline: ${contactDeadline}.`,
      });
      setContactSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 bg-[#08090d] font-sans selection:bg-amber-400 selection:text-slate-950 pb-20">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-10 pb-16">
        
        {/* Official Vision Fold Logo - Centered Display */}
        <div className="mb-8">
          <VisionFoldLogo size="xl" variant="full" className="mx-auto" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-center uppercase tracking-tight text-white max-w-5xl leading-[1.08] mt-2">
          Transforming footage into <span className="text-amber-400">stories.</span>
        </h1>

        {/* Supporting Subtitle */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light text-center leading-relaxed tracking-wide mt-5">
          Premium video editing for creators and brands who want content that captures attention.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={() => {
              const el = document.getElementById('showreel');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-7 py-3.5 rounded-xl bg-[#0f111a] text-slate-200 border border-[#222736] hover:border-amber-400/40 font-mono text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>View Work</span>
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className="px-7 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-widest hover:bg-amber-300 transition-all shadow-lg flex items-center gap-2.5 group"
          >
            <span>Start Project</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* STUDIO WORKSPACE EDITOR MOCKUP (Minimal, High-Performance) */}
        <div className="w-full max-w-5xl mt-12">
          <StudioWorkspace />
        </div>
      </section>


      {/* ================= SHOWREEL & BEFORE/AFTER TRANSFORMATION ================= */}
      <section id="showreel" className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-[#161924]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 text-amber-400 text-[11px] font-mono font-bold uppercase mb-3 border border-amber-400/20">
            <Sliders className="w-3.5 h-3.5" />
            <span>THE EDITING TRANSFORMATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Raw Footage vs. <span className="text-amber-400">Cinematic Edit</span>
          </h2>
          <p className="text-slate-400 mt-3 text-sm font-light">
            Slide to see how Vision Fold turns flat, un-cut raw footage into a high-retention video.
          </p>
        </div>

        {/* INTERACTIVE BEFORE / AFTER SLIDER */}
        <div
          ref={sliderContainerRef}
          onMouseDown={() => setIsDraggingSlider(true)}
          onMouseUp={() => setIsDraggingSlider(false)}
          onMouseLeave={() => setIsDraggingSlider(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDraggingSlider(true)}
          onTouchEnd={() => setIsDraggingSlider(false)}
          onTouchMove={handleTouchMove}
          className="relative w-full h-[360px] sm:h-[480px] rounded-2xl overflow-hidden border border-[#1a1d28] shadow-2xl select-none cursor-ew-resize bg-black"
        >
          {/* AFTER IMAGE (COLOR GRADED & EDITED) */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80"
              alt="After Edit Cinematic"
              className="w-full h-full object-cover filter contrast-110 saturate-125"
            />
            <div className="absolute top-4 right-4 bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase shadow-lg flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>FINAL CINEMATIC RESULT</span>
            </div>

            <div className="absolute bottom-4 right-4 bg-slate-950/90 p-3.5 rounded-xl border border-amber-400/30 text-[11px] font-mono text-slate-200">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>RETENTION: +320% Watch Time</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Rec.709 Color Grade &bull; Captions &bull; SFX &bull; Pacing
              </p>
            </div>
          </div>

          {/* BEFORE IMAGE (RAW LOG FOOTAGE) */}
          <div
            className="absolute top-0 bottom-0 left-0 overflow-hidden border-r-2 border-amber-400 z-10"
            style={{ width: `${beforeAfterPos}%` }}
          >
            <div className="absolute top-0 bottom-0 left-0 w-[1000px] h-full">
              <img
                src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80"
                alt="Before Raw Footage"
                className="w-full h-full object-cover grayscale opacity-60 contrast-75"
              />
            </div>

            <div className="absolute top-4 left-4 bg-black/80 text-slate-300 px-3.5 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase border border-[#222736] flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>RAW UNEDITED FOOTAGE</span>
            </div>
          </div>

          {/* SLIDER HANDLE */}
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-amber-400 pointer-events-none"
            style={{ left: `${beforeAfterPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-xl bg-amber-400 text-slate-950 shadow-lg flex items-center justify-center font-bold text-xs">
              &harr;
            </div>
          </div>
        </div>
      </section>


      {/* ================= SERVICES & TRANSPARENT PRICING ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#161924]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 text-amber-400 text-[11px] font-mono font-bold uppercase mb-3 border border-amber-400/20">
            <Film className="w-3.5 h-3.5" />
            <span>SERVICES & TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Crafted for <span className="text-amber-400">Maximum Impact</span>
          </h2>
          <p className="text-slate-400 mt-3 text-sm font-light">
            All services operate under our transparent studio baseline rate of <strong className="text-amber-400">₹700 per finished minute</strong>.
          </p>
        </div>

        {/* Minimal Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((srv, idx) => (
            <div
              key={idx}
              className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-7 hover:border-amber-400/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                    SERVICE 0{idx + 1}
                  </span>
                  <div className="px-2.5 py-1 rounded bg-amber-400/10 text-amber-400 text-[11px] font-mono font-bold border border-amber-400/20">
                    ₹700 <span className="text-[9px] text-slate-400 font-normal">/ min</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-[11px] text-amber-400/80 font-mono mb-3">{srv.subtitle}</p>

                <p className="text-xs text-slate-300 leading-relaxed font-light mb-6">
                  {srv.desc}
                </p>

                <div className="pt-4 border-t border-[#161924] space-y-2 mb-6">
                  {srv.highlights.map((hl, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('contact')}
                className="w-full py-3 rounded-xl bg-[#121520] hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-[#222736] hover:border-amber-400 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
              >
                <span>Book Service</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>


      {/* ================= CASE STUDIES PORTFOLIO ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#161924]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 text-amber-400 text-[11px] font-mono font-bold uppercase mb-3 border border-amber-400/20">
            <Award className="w-3.5 h-3.5" />
            <span>AGENCY CASE STUDIES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Proven Editing <span className="text-amber-400">Results</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {caseStudies.map((cs) => (
            <div
              key={cs.id}
              className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl overflow-hidden hover:border-amber-400/40 transition-all shadow-xl flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={cs.thumbnail}
                    alt={cs.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-[10px] font-mono text-amber-400 font-bold border border-amber-400/30">
                    {cs.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      CLIENT: {cs.client}
                    </span>
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors mt-1">
                      {cs.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-[11px] font-mono">
                    <div className="p-3 rounded-xl bg-[#10121a] border border-[#181b26]">
                      <span className="text-amber-400 font-bold block mb-1">CHALLENGE:</span>
                      <p className="text-slate-300 font-light leading-relaxed">{cs.challenge}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#10121a] border border-[#181b26]">
                      <span className="text-slate-200 font-bold block mb-1">APPROACH:</span>
                      <p className="text-slate-300 font-light leading-relaxed">{cs.approach}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-emerald-500/10 border-t border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                <span>{cs.result}</span>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= PROCESS TIMELINE ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#161924]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 text-amber-400 text-[11px] font-mono font-bold uppercase mb-3 border border-amber-400/20">
            <Zap className="w-3.5 h-3.5" />
            <span>OUR 5-STEP WORKFLOW</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            The Vision Fold <span className="text-amber-400">Process</span>
          </h2>
        </div>

        <div className="relative border-l-2 border-[#1c202e] ml-4 sm:ml-8 space-y-10">
          {processSteps.map((step, idx) => (
            <div key={idx} className="relative pl-8 group">
              <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#08090d] border-2 border-amber-400 text-amber-400 font-mono font-black text-xs flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-950 transition-all">
                {step.step}
              </div>

              <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-6 hover:border-amber-400/40 transition-all">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                  {step.sub}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= PRICING ESTIMATOR ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-[#161924]">
        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 sm:p-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-400/10 text-amber-400 text-[11px] font-mono font-bold uppercase mb-3 border border-amber-400/20">
            <Calculator className="w-3.5 h-3.5" />
            <span>ESTIMATE PROJECT COST</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
            ₹700 <span className="text-amber-400">/ finished minute</span>
          </h2>

          <div className="mt-8 p-6 rounded-xl bg-[#10121a] border border-[#181b26] text-left space-y-6">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 uppercase font-bold">ESTIMATED FINISHED VIDEO DURATION:</span>
              <span className="text-amber-400 font-bold text-base">{estimatorMinutes} Finished Minutes</span>
            </div>

            <input
              type="range"
              min="1"
              max="20"
              value={estimatorMinutes}
              onChange={(e) => setEstimatorMinutes(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-[#1c202e] rounded-lg"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 min (Shorts/Reels)</span>
              <span>10 mins (YouTube Video)</span>
              <span>20 mins (Docu/Interview)</span>
            </div>

            <div className="pt-4 border-t border-[#181b26] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  ESTIMATED PROJECT RATE
                </span>
                <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
                  {formatINR(estimatedTotal)}
                </div>
              </div>

              <button
                onClick={() => onNavigate('contact')}
                className="px-6 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold uppercase text-xs tracking-widest hover:bg-amber-300 transition-all shadow-md"
              >
                Lock In This Rate
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* ================= CONTACT INQUIRY ROOM ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#161924]">
        <div className="bg-[#0b0d13] border border-[#1a1d28] rounded-2xl p-8 sm:p-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <VisionFoldLogo size="md" variant="full" className="mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              Project <span className="text-amber-400">Inquiry Room</span>
            </h2>
            <p className="text-slate-400 text-xs mt-2 font-light">
              Enter your project requirements to request editing availability directly from Aliasgar.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="text-center py-12 space-y-4 bg-[#10121a] rounded-2xl p-8 border border-emerald-500/30">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase">Inquiry Received</h3>
              <p className="text-slate-300 text-xs max-w-md mx-auto font-light">
                Aliasgar will review your request and respond within 12 hours.
              </p>
              <button
                onClick={() => setContactSubmitted(false)}
                className="px-5 py-2.5 rounded-xl bg-[#141722] text-slate-200 border border-[#222736] font-mono text-xs font-bold uppercase"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="max-w-2xl mx-auto space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#1a1d28] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="rahul@creator.com"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#1a1d28] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Project Format
                  </label>
                  <select
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value)}
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#1a1d28] rounded-xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Short-Form Reels / Shorts">Short-Form Reels / Shorts / TikTok</option>
                    <option value="Long-Form YouTube Video">Long-Form YouTube Video</option>
                    <option value="Brand Film & Ad">Brand Film & Commercial</option>
                    <option value="Monthly Editing Retainer">Monthly Editing Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1 tracking-widest">
                    Estimated Video Length
                  </label>
                  <input
                    type="text"
                    value={contactLength}
                    onChange={(e) => setContactLength(e.target.value)}
                    placeholder="e.g. 3 finished minutes"
                    className="w-full px-4 py-3 bg-[#10121a] border border-[#1a1d28] rounded-xl text-slate-100 placeholder-slate-600 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono font-bold uppercase text-xs tracking-widest transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>Ready to fold your vision into reality?</span>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
