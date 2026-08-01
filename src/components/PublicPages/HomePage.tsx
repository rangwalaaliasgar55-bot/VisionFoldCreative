import React, { useEffect, useState, useRef } from 'react';
import {
  Video,
  Film,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  Box,
  Layers,
  Play,
  Zap,
  Sliders,
  Scissors,
  Eye,
  TrendingUp,
  Clock,
  Send,
  Check,
  Calculator,
  RotateCcw,
  Sparkle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ThreeDStudioCanvas } from '../ThreeDStudioCanvas';
import { VisionFoldLogo } from '../VisionFoldLogo';
import { formatINR } from '../../lib/formatters';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [blocks, setBlocks] = useState<Record<string, any>>({});
  const [interactive3DMode, setInteractive3DMode] = useState(true);

  // Before/After Transformation Slider State
  const [beforeAfterPos, setBeforeAfterPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Pricing Estimator State
  const [estimatorType, setEstimatorType] = useState<'short' | 'long' | 'brand'>('short');
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

  useEffect(() => {
    api
      .getContent('home')
      .then((data) => {
        const map: Record<string, any> = {};
        data.forEach((b) => {
          if (b.visible) map[b.section_key] = b.value;
        });
        setBlocks(map);
      })
      .catch((err) => console.error('Error fetching home blocks:', err));
  }, []);

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
      challenge: 'Raw 45-minute talking head footage was dropping 60% of viewers in the first 45 seconds due to slow pacing and unedited audio.',
      approach: 'Built a 3-second animated pattern interrupt hook, cut 22 minutes of filler, applied custom sound effects, lower thirds, and cinematic color grade.',
      result: '1.4M views, average watch duration increased from 3:20 to 9:45 (+192% retention).',
      rate: '₹700 / min',
    },
    {
      id: 'cs-2',
      title: 'Aura Fitness Viral Launch Campaign',
      client: 'Aura Performance Brand',
      category: 'Short-Form Reels & TikTok',
      thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      challenge: 'Product launch video felt flat, lacked energy, and failed to stand out on Instagram Explore feed.',
      approach: 'Engineered high-tempo sound design, kinetic typography captions, motion graphics product highlights, and fast punchy transitions.',
      result: '3.8M impressions, 14,000+ saves, and ₹4.2L in direct launch sales within 72 hours.',
      rate: '₹700 / min',
    },
    {
      id: 'cs-3',
      title: 'Minimalist Architectural Showcase',
      client: 'Kube Design Studio',
      category: 'Brand Film & Commercial',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      challenge: 'Showcase luxury villa project with elegant, unhurried pacing without boring high-net-worth clients.',
      approach: 'Applied subtle speed-ramping, orchestral sound design, 3D camera tracker overlays, and pristine rec.709 color grading.',
      result: 'Featured on ArchDaily and closed 3 high-value architectural contracts.',
      rate: '₹700 / min',
    },
  ];

  // Process Timeline Steps
  const processSteps = [
    {
      step: '01',
      title: 'Understanding the Story',
      sub: 'Raw Footage & Vision Alignment',
      desc: 'We analyze your raw files, target platform algorithm, audience demographic, and core emotional message to outline the narrative arc.',
    },
    {
      step: '02',
      title: 'Planning the Edit',
      sub: 'Pacing & Hook Architecture',
      desc: 'Selecting prime takes, designing the first 3-second attention hook, and establishing sound effects and visual beats.',
    },
    {
      step: '03',
      title: 'Editing & Pacing',
      sub: 'Surgical Cut Timing',
      desc: 'Trimming dead air, applying dynamic punch-ins, pattern interrupts, and seamless camera transitions to maintain high viewer retention.',
    },
    {
      step: '04',
      title: 'Motion Design & Polish',
      sub: 'Captions, SFX & Color Grade',
      desc: 'Integrating kinetic typography, custom sound design, lower thirds, 3D element overlays, and cinematic color grading.',
    },
    {
      step: '05',
      title: 'Final Delivery',
      sub: 'Platform-Optimized Export',
      desc: 'Delivering full-res master renders formatted for YouTube 4K, 9:16 Instagram Reels, TikTok, or broadcast ads.',
    },
  ];

  // Services Cards Data
  const servicesList = [
    {
      title: 'Short-Form Editing',
      subtitle: 'Instagram Reels, YouTube Shorts, TikToks',
      desc: 'Engineered for viral retention with dynamic kinetic captions, 3-second visual hooks, pattern interrupts, and fast sound effects.',
      rate: '₹700',
      rateUnit: 'per finished minute',
      highlights: ['Attention hook design', 'Animated captions', 'SFX & music mix', 'High-tempo pacing'],
    },
    {
      title: 'Long-Form YouTube Editing',
      subtitle: 'Talking head, Vlogs, Documentaries',
      desc: 'Complete storytelling architecture designed to keep watch-time high and build deep loyal subscriber engagement.',
      rate: '₹700',
      rateUnit: 'per finished minute',
      highlights: ['Full narrative structure', 'B-roll integration', 'Audio noise cleanup', 'Cinematic color grade'],
    },
    {
      title: 'Brand Videos',
      subtitle: 'Commercials, Product Ads, Case Studies',
      desc: 'High-end visual production feel for brands looking to build trust, authority, and high sales conversion rates.',
      rate: '₹700',
      rateUnit: 'per finished minute',
      highlights: ['Luxury aesthetics', 'Soundtrack mastering', 'Graphic callouts', 'Logo stings'],
    },
    {
      title: 'Motion Graphics',
      subtitle: 'Title animations, 3D overlays, Infographics',
      desc: 'Custom motion graphics elements that explain complex topics cleanly and elevate production value.',
      rate: '₹700',
      rateUnit: 'per finished minute',
      highlights: ['Custom lower thirds', 'Animated charts & diagrams', 'Logo intros/outros', '3D tracker text'],
    },
    {
      title: 'Social Media Content Systems',
      subtitle: 'Monthly editing retainers & batches',
      desc: 'Consistent batch editing workflow for active creators and marketing teams who require regular weekly content drops.',
      rate: '₹700',
      rateUnit: 'per finished minute',
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
        message: `Inquiry Room Request: Video Length ${contactLength}. Type: ${contactType}. Deadline: ${contactDeadline}.`,
      });
      setContactSubmitted(true);
    } catch (err) {
      console.error('Failed to submit contact:', err);
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-24 bg-[#08090d] selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden font-sans">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[92vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8 pb-16">
        {/* Subtle Background Glow Spheres */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[380px] bg-amber-500/10 blur-[160px] rounded-full pointer-events-none -z-10" />

        {/* Studio Credibility Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#10131d]/90 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-wider uppercase mb-8 shadow-2xl backdrop-blur-md">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Premium Video Editing Studio &bull; Led by Aliasgar</span>
        </div>

        {/* Official Brand Emblem Logo */}
        <div className="mb-6 text-center">
          <VisionFoldLogo size="xl" variant="full" className="mx-auto" />
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-center uppercase tracking-tight text-white max-w-5xl leading-[1.08] mt-2">
          Transforming footage into <span className="text-amber-400">stories.</span>
        </h1>

        {/* Supporting Text */}
        <p className="text-lg sm:text-2xl text-slate-300 max-w-3xl mx-auto font-light text-center leading-relaxed tracking-wide mt-6">
          Premium video editing for creators and brands who want content that captures attention.
        </p>

        {/* Hero Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 z-20">
          <button
            onClick={() => {
              const el = document.getElementById('showreel');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 rounded-2xl bg-[#121520] text-slate-200 border border-[#222736] hover:border-amber-500/40 hover:bg-[#1a1e2d] font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>View Work</span>
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className="px-8 py-4 rounded-2xl bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-amber-300 transition-all shadow-xl shadow-amber-500/20 flex items-center gap-3 group"
          >
            <span>Start Project</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 3D EDITING WORKSPACE HERO CANVAS */}
        <div className="w-full max-w-5xl h-[400px] sm:h-[480px] my-10 rounded-3xl bg-[#0b0d13]/90 border border-[#1e2333] relative shadow-2xl overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(#1e2333_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

          {/* Three.js 3D Workspace Canvas */}
          <ThreeDStudioCanvas interactive={interactive3DMode} className="w-full h-full" />

          {/* Canvas Floating Overlay Controls */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#08090d]/80 backdrop-blur-md border border-[#222736] text-[11px] font-mono text-slate-300">
              <Box className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>CINEMATIC EDITING WORKSPACE</span>
            </div>
            <button
              onClick={() => setInteractive3DMode(!interactive3DMode)}
              className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-[#08090d]/80 backdrop-blur-md border border-[#222736] text-[11px] font-mono text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>{interactive3DMode ? '3D INTERACTIVE' : 'PREVIEW'}</span>
            </button>
          </div>
        </div>
      </section>


      {/* ================= SHOWREEL & BEFORE/AFTER TRANSFORMATION SECTION ================= */}
      <section id="showreel" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold uppercase mb-3 border border-amber-500/20">
            <Sliders className="w-3.5 h-3.5" />
            <span>THE EDITING TRANSFORMATION</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Raw Footage vs. <span className="text-amber-400">Cinematic Edit</span>
          </h2>
          <p className="text-slate-300 mt-4 text-base font-light">
            Slide or click to see how Vision Fold turns flat, un-cut raw footage into a high-retention video masterpiece.
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
          className="relative w-full max-w-5xl h-[380px] sm:h-[500px] mx-auto rounded-3xl overflow-hidden border border-[#1e2333] shadow-2xl select-none cursor-ew-resize bg-black"
        >
          {/* AFTER IMAGE (Full width behind - COLOR GRADED & EDITED) */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80"
              alt="After Edit Cinematic"
              className="w-full h-full object-cover filter contrast-110 saturate-125"
            />
            {/* Visual Editing Overlays for "AFTER" */}
            <div className="absolute top-6 right-6 bg-amber-400 text-slate-950 px-4 py-2 rounded-2xl font-mono text-xs font-black uppercase shadow-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>FINAL CINEMATIC RESULT</span>
            </div>

            <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 text-xs font-mono space-y-1.5 max-w-xs text-slate-200">
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                <span>RETENTION: +320% Watch Time</span>
              </div>
              <p className="text-[11px] text-slate-300 font-light">
                Rec.709 Color Grade &bull; Dynamic Subtitles &bull; Sound Effects &bull; Pacing Cuts
              </p>
            </div>
          </div>

          {/* BEFORE IMAGE (Clipped on top - RAW FOOTAGE) */}
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

            <div className="absolute top-6 left-6 bg-black/80 backdrop-blur-md text-slate-300 px-4 py-2 rounded-2xl font-mono text-xs font-bold uppercase border border-[#222736] flex items-center gap-2">
              <Scissors className="w-4 h-4 text-slate-400" />
              <span>RAW UNEDITED FOOTAGE</span>
            </div>

            <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-[#222736] text-xs font-mono space-y-1.5 max-w-xs text-slate-400">
              <div className="text-slate-400 font-bold">Uncut Audio & Flat Profile</div>
              <p className="text-[11px] text-slate-400 font-light">
                Raw camera log &bull; Long awkward pauses &bull; No captions &bull; High bounce rate
              </p>
            </div>
          </div>

          {/* SLIDER HANDLE LINE */}
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-amber-400 pointer-events-none"
            style={{ left: `${beforeAfterPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 shadow-2xl flex items-center justify-center font-bold text-xs">
              &harr;
            </div>
          </div>
        </div>
      </section>


      {/* ================= SERVICES SECTION ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold uppercase mb-3 border border-amber-500/20">
            <Film className="w-3.5 h-3.5" />
            <span>SERVICES & TRANSPARENT PRICING</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Crafted for <span className="text-amber-400">Maximum Impact</span>
          </h2>
          <p className="text-slate-300 mt-4 text-base font-light">
            All services operate under our transparent studio baseline rate of <strong className="text-amber-400">₹700 per finished minute</strong>.
          </p>
        </div>

        {/* Minimal Premium Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((srv, idx) => (
            <div
              key={idx}
              className="bg-[#0e1017] border border-[#1e2333] rounded-3xl p-8 hover:border-amber-500/50 transition-all duration-300 flex flex-col justify-between group shadow-2xl relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                    SERVICE 0{idx + 1}
                  </span>
                  <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold border border-amber-500/20">
                    {srv.rate} <span className="text-[10px] text-slate-400 font-normal">/ min</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-xs text-amber-400/80 font-mono mb-4">{srv.subtitle}</p>

                <p className="text-xs text-slate-300 leading-relaxed font-light mb-6">
                  {srv.desc}
                </p>

                <div className="pt-4 border-t border-[#1e2333] space-y-2 mb-6">
                  {srv.highlights.map((hl, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('contact')}
                className="w-full py-3.5 rounded-2xl bg-[#121520] hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-[#222736] hover:border-amber-400 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                <span>Book Service</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>


      {/* ================= PORTFOLIO / CASE STUDIES ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#0a0c12] rounded-3xl border border-[#1e2333] my-10 relative overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold uppercase mb-3 border border-amber-500/20">
            <Award className="w-3.5 h-3.5" />
            <span>AGENCY CASE STUDIES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Proven Editing <span className="text-amber-400">Results</span>
          </h2>
          <p className="text-slate-300 mt-4 text-base font-light">
            Real editing breakdown case studies showing raw footage challenges, creative approach, and retention impact.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {caseStudies.map((cs) => (
            <div
              key={cs.id}
              className="bg-[#0e1017] border border-[#1e2333] rounded-3xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 shadow-2xl flex flex-col justify-between group"
            >
              <div>
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    src={cs.thumbnail}
                    alt={cs.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-amber-400 font-bold border border-amber-500/30">
                    {cs.category}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                      CLIENT: {cs.client}
                    </span>
                    <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors mt-1">
                      {cs.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[#121520] border border-[#1e2333]">
                      <span className="text-amber-400 font-bold block mb-1">EDITING CHALLENGE:</span>
                      <p className="text-slate-300 font-light leading-relaxed">{cs.challenge}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#121520] border border-[#1e2333]">
                      <span className="text-slate-200 font-bold block mb-1">CREATIVE APPROACH:</span>
                      <p className="text-slate-300 font-light leading-relaxed">{cs.approach}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-emerald-500/10 border-t border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>{cs.result}</span>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= PROCESS TIMELINE ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold uppercase mb-3 border border-amber-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>OUR 5-STEP WORKFLOW</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            The Vision Fold <span className="text-amber-400">Process</span>
          </h2>
          <p className="text-slate-300 mt-4 text-base font-light">
            Behind every great video is a structured creative process from raw footage to final render.
          </p>
        </div>

        {/* Timeline Interaction Grid */}
        <div className="relative border-l-2 border-[#1e2333] ml-4 sm:ml-8 md:ml-12 space-y-12">
          {processSteps.map((step, idx) => (
            <div key={idx} className="relative pl-8 sm:pl-12 group">
              {/* Step Marker Badge */}
              <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-[#0e1017] border-2 border-amber-400 text-amber-400 font-mono font-black text-xs flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all shadow-lg">
                {step.step}
              </div>

              <div className="bg-[#0e1017] border border-[#1e2333] rounded-3xl p-6 sm:p-8 hover:border-amber-500/40 transition-all shadow-2xl max-w-4xl">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                    {step.sub}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ================= PRICING SECTION & ESTIMATOR ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-[#0e1017] border border-[#1e2333] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold uppercase mb-3 border border-amber-500/20">
              <Calculator className="w-3.5 h-3.5" />
              <span>PREMIUM PRICING MODEL</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              ₹700 <span className="text-amber-400">/ finished minute</span>
            </h2>

            <p className="text-slate-300 text-sm mt-3 font-light leading-relaxed">
              Pricing is strictly based on completed edited video duration. Zero hidden fees. Quality storytelling, pacing, sound design, and motion graphics included.
            </p>
          </div>

          {/* Interactive Calculator */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#121520] border border-[#222736] max-w-3xl mx-auto space-y-6">
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
              className="w-full accent-amber-400 cursor-pointer h-2 bg-[#1e2333] rounded-lg"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>1 min (Reels/Shorts)</span>
              <span>10 mins (YouTube Video)</span>
              <span>20 mins (Docu/Interview)</span>
            </div>

            <div className="pt-4 border-t border-[#222736] flex flex-col sm:flex-row items-center justify-between gap-4">
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
                className="px-6 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-black uppercase text-xs tracking-widest hover:bg-amber-300 transition-all shadow-lg"
              >
                Lock In This Rate
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* ================= CONTACT SECTION (PROJECT INQUIRY ROOM) ================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="bg-[#0b0d13] border border-[#1e2333] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <VisionFoldLogo size="md" variant="full" className="mx-auto mb-4" />
            <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              Cinematic <span className="text-amber-400">Project Inquiry Room</span>
            </h2>
            <p className="text-slate-300 text-sm mt-3 font-light">
              Enter your project details below to request editing availability directly from lead editor Aliasgar.
            </p>
          </div>

          {contactSubmitted ? (
            <div className="text-center py-12 space-y-4 bg-[#0e1017] rounded-3xl p-8 border border-emerald-500/30">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Inquiry Received!</h3>
              <p className="text-slate-300 text-sm max-w-md mx-auto font-light">
                Aliasgar will review your project requirements and respond within 12 hours.
              </p>
              <button
                onClick={() => setContactSubmitted(false)}
                className="px-6 py-3 rounded-xl bg-[#121520] text-slate-200 border border-[#222736] font-mono text-xs font-bold uppercase"
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="max-w-3xl mx-auto space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5 tracking-widest">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3.5 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5 tracking-widest">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="rahul@creator.com"
                    className="w-full px-4 py-3.5 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5 tracking-widest">
                    Project Format
                  </label>
                  <select
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Short-Form Reels / Shorts">Short-Form Reels / Shorts / TikTok</option>
                    <option value="Long-Form YouTube Video">Long-Form YouTube Video</option>
                    <option value="Brand Film & Ad">Brand Film & Commercial</option>
                    <option value="Monthly Editing Retainer">Monthly Editing Retainer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5 tracking-widest">
                    Estimated Video Length
                  </label>
                  <input
                    type="text"
                    value={contactLength}
                    onChange={(e) => setContactLength(e.target.value)}
                    placeholder="e.g. 5 finished minutes"
                    className="w-full px-4 py-3.5 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5 tracking-widest">
                    Desired Deadline
                  </label>
                  <input
                    type="text"
                    value={contactDeadline}
                    onChange={(e) => setContactDeadline(e.target.value)}
                    placeholder="e.g. Within 48 hours"
                    className="w-full px-4 py-3.5 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 mb-1.5 tracking-widest">
                    Target Budget Range
                  </label>
                  <select
                    value={contactBudget}
                    onChange={(e) => setContactBudget(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#121520] border border-[#222736] rounded-2xl text-slate-100 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  >
                    <option value="₹5,000 - ₹10,000">₹5,000 - ₹10,000</option>
                    <option value="₹10,000 - ₹25,000">₹10,000 - ₹25,000</option>
                    <option value="₹25,000 - ₹50,000">₹25,000 - ₹50,000</option>
                    <option value="₹50,000+">₹50,000+</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full py-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black uppercase text-sm tracking-widest transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
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
