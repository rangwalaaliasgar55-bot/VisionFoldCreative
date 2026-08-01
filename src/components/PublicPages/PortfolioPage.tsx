import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Play,
  Pause,
  TrendingUp,
  X,
  Sliders,
  Scissors,
  Sparkles,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Film,
  Award,
  Layers,
  Zap,
  Filter,
  Flame,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { PortfolioItem } from '../../types';
import { formatDate } from '../../lib/formatters';
import { VisionFoldLogo } from '../VisionFoldLogo';

gsap.registerPlugin(ScrollTrigger);

interface EnrichedCaseStudy extends PortfolioItem {
  beforeImg: string;
  afterImg: string;
  retentionMetric: string;
  viewsCount: string;
  challengeText: string;
  approachText: string;
  techniques: string[];
  timelineBeats: { timestamp: string; title: string; description: string }[];
}

export const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<EnrichedCaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref for GSAP animations
  const pageRef = useRef<HTMLDivElement>(null);

  // Active view tab inside case studies: 'preview' | 'before-after' | 'techniques'
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'preview' | 'before-after' | 'techniques'>>({});

  // Active slider position per item
  const [sliderPosMap, setSliderPosMap] = useState<Record<string, number>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPortfolio()
      .then((data) => {
        setPortfolio(data);
      })
      .catch((err) => console.error('Failed to load portfolio:', err))
      .finally(() => setLoading(false));
  }, []);

  // GSAP ScrollTrigger Camera Tracking / Reveal Effect
  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      // 1. Header elements entrance reveal
      gsap.fromTo(
        '.gsap-header-element',
        { opacity: 0, y: 40, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );

      // 2. Cinematic camera tracking reveal for featured spotlight
      const spotlightEl = pageRef.current?.querySelector('.gsap-spotlight');
      if (spotlightEl) {
        gsap.fromTo(
          spotlightEl,
          {
            opacity: 0,
            scale: 0.92,
            y: 70,
            filter: 'blur(8px)',
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: spotlightEl,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // 3. Cinematic camera reveal for each project case study card in grid
      const cards = gsap.utils.toArray<HTMLElement>('.gsap-case-study-card');
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            scale: 0.93,
            y: 80,
            filter: 'blur(10px)',
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, pageRef);

    return () => {
      ctx.revert();
    };
  }, [loading, selectedCategory]);

  const categories = ['All', 'Short Form', 'Long Form', 'Brand Content', 'Social Media', 'Documentary'];

  // Default enriched case studies fallback / overlay dataset
  const fallbackCaseStudies: EnrichedCaseStudy[] = [
    {
      id: 'cs-featured-1',
      title: 'Deep Tech Documentarian Series',
      clientName: 'Alex Tech Insights (1.2M Subs)',
      category: 'Long Form',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
      beforeImg: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
      afterImg: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1600&q=80',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      teaser: 'Raw 45-minute talking head footage dropped 60% of viewers in 45s. Refolded into a cinematic 18-minute masterclass.',
      fullDescription: 'We analyzed viewer drop-off analytics on Alex’s channel and discovered that slow intros and lack of pattern interrupts were destroying watch time. By restructuring the video narrative into a 3-part arc, adding kinetic lower-thirds, sound effects, and color grading, retention skyrocketed.',
      dateCreated: '2026-03-15',
      toolsUsed: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Audition', 'CapCut Pro'],
      resultsImpact: '+192% Watch Time & 1.4M Organic Views',
      retentionMetric: '68% Retention at 30 Seconds',
      viewsCount: '1,420,000+ Views',
      challengeText: 'Raw 45-minute talking head footage dropped 60% of viewers in 45 seconds due to flat audio and slow pacing.',
      approachText: 'Constructed 3-second pattern interrupt hook, trimmed 22 mins of filler, applied SFX and Rec.709 color grade.',
      techniques: [
        '3-Second Pattern Interrupt Hook',
        'Kinetic Animated Subtitles',
        'Multi-Layer SFX & Audio Isolation',
        '3D Camera Tracker Lower Thirds',
        'Cinematic Rec.709 Film LUT',
      ],
      timelineBeats: [
        { timestamp: '00:00 - 00:03', title: 'Pattern Interrupt Hook', description: 'Fast cut montage + SFX riser to capture instant viewer focus.' },
        { timestamp: '00:03 - 02:30', title: 'Context & Story Setup', description: 'Trimmed filler speech, added kinetic typography and graphic overlays.' },
        { timestamp: '02:30 - 15:00', title: 'Core Tech Deep Dive', description: 'B-roll speed ramping + frequency split sound design.' },
        { timestamp: '15:00 - 18:00', title: 'Climax & CTA', description: 'Custom end-screen motion sting with high-converting call to action.' },
      ],
      order: 1,
      featured: true,
    },
    {
      id: 'cs-featured-2',
      title: 'Aura Fitness Viral Launch Campaign',
      clientName: 'Aura Apparel Brand',
      category: 'Short Form',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
      beforeImg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=80',
      afterImg: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
      teaser: 'High-energy 9:16 vertical reels created for product launch, generating 3.8M impressions.',
      fullDescription: 'To launch Aura’s seamless sportswear collection, we edited 12 short-form Reels with pulse-matching sound design, dynamic optical flashes, and bold kinetic text. The videos went viral across Instagram Reels and TikTok.',
      dateCreated: '2026-04-02',
      toolsUsed: ['CapCut Pro', 'After Effects', 'Soundly SFX'],
      resultsImpact: '3.8M Impressions & ₹4.2L Direct Revenue',
      retentionMetric: '84% Complete Watch Through',
      viewsCount: '3,800,000+ Impressions',
      challengeText: 'Product launch raw video felt flat and lacked high-energy social engagement.',
      approachText: 'High-tempo sound design, kinetic typography captions, and punchy motion graphic callouts.',
      techniques: [
        'High-Tempo Rhythm Matching',
        'Optical Flash Transitions',
        'Sound Effect Impact Layering',
        'Custom Kinetic Typography',
      ],
      timelineBeats: [
        { timestamp: '00:00 - 00:02', title: 'Visual Shock Hook', description: 'Reverse zoom + bass drop.' },
        { timestamp: '00:02 - 00:15', title: 'Product Showcase', description: 'Speed ramp cuts synchronized with beat drops.' },
        { timestamp: '00:15 - 00:20', title: 'Offer & Link CTA', description: 'Animated swipe-up arrow with sound effect.' },
      ],
      order: 2,
      featured: true,
    },
    {
      id: 'cs-featured-3',
      title: 'Kube Design Studio Architectural Showcase',
      clientName: 'Kube Design Studio',
      category: 'Brand Content',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      beforeImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      afterImg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
      teaser: 'Luxury architectural walkthrough engineered for high-net-worth property buyers.',
      fullDescription: 'Showcasing a $4M luxury estate required pristine color grading and unhurried, sophisticated pacing. We crafted a custom orchestral soundtrack mix and clean 3D tracked callouts highlighting luxury materials.',
      dateCreated: '2026-02-10',
      toolsUsed: ['DaVinci Resolve Studio', 'Premiere Pro', 'Logic Pro X'],
      resultsImpact: 'Featured on ArchDaily & 3 High-Value Contracts',
      retentionMetric: '92% Average Completion Rate',
      viewsCount: '450,000+ Targeted Views',
      challengeText: 'Showcase luxury villa with unhurried pacing without boring high-net-worth buyers.',
      approachText: 'Subtle speed-ramping, orchestral sound design, and pristine Rec.709 color grading.',
      techniques: [
        'Anamorphic Lens Correction',
        'Orchestral Audio Spatial Mix',
        '3D Floorplan Callout Overlay',
        'Rec.709 Architectural LUT',
      ],
      timelineBeats: [
        { timestamp: '00:00 - 00:10', title: 'Aerial Exterior Drone', description: 'Golden hour color pass + subtle ambient chime.' },
        { timestamp: '00:10 - 01:20', title: 'Interior Flow', description: 'Smooth gimbal transitions + material spec overlays.' },
      ],
      order: 3,
      featured: false,
    },
    {
      id: 'cs-featured-4',
      title: 'FinTech Explained — Motion Infographic Reel',
      clientName: 'WealthSmart Media',
      category: 'Social Media',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
      beforeImg: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1600&q=80',
      afterImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80',
      teaser: 'Simplifying complex algorithmic trading into a 60-second animated infographic reel.',
      fullDescription: 'To make financial education engaging for Gen-Z and Millennials, we transformed dense audio lectures into punchy 2D/3D motion graphics with custom pop-up charts, sound design, and animated character elements.',
      dateCreated: '2026-01-22',
      toolsUsed: ['After Effects', 'Illustrator', 'CapCut Pro'],
      resultsImpact: '850K Reels Views & 24,000 Saves',
      retentionMetric: '76% Completion & High Bookmark Rate',
      viewsCount: '850,000+ Reels Views',
      challengeText: 'Complex financial concepts were boring and confusing to younger audiences.',
      approachText: 'Custom motion infographics, pop-up diagram overlays, and conversational audio pacing.',
      techniques: [
        '2D Vector Chart Animations',
        'Pop-up Sound Effects',
        'Kinetic Subtitle Highlights',
        'Color-Coded Information Architecture',
      ],
      timelineBeats: [
        { timestamp: '00:00 - 00:05', title: 'Myth-Busting Hook', description: 'Question callout + record scratch SFX.' },
        { timestamp: '00:05 - 00:45', title: 'Animated Breakdown', description: '3 step motion infographic sequence.' },
      ],
      order: 4,
      featured: false,
    },
    {
      id: 'cs-featured-5',
      title: 'Japan Travelogue — Cinematic Mini Doc',
      clientName: 'Wanderlust Films',
      category: 'Documentary',
      thumbnailUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
      beforeImg: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
      afterImg: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1600&q=80',
      teaser: '120GB raw handheld camera footage refolded into a breathtaking 12-minute travel documentary.',
      fullDescription: 'Raw footage had heavy camera shake and wind noise. We applied AI digital stabilization, dialogue noise isolation, ambient foliage soundscapes, and a Japanese film emulsion color grade.',
      dateCreated: '2025-11-18',
      toolsUsed: ['DaVinci Resolve', 'iZotope RX', 'After Effects'],
      resultsImpact: '2.1M YouTube Views & 98.4% Likes Ratio',
      retentionMetric: '71% Retention at 10 Minutes',
      viewsCount: '2,100,000+ YouTube Views',
      challengeText: 'Unstructured raw footage with severe wind noise and handheld camera shake.',
      approachText: 'Gyro stabilization, audio noise reduction, immersive ambient soundscapes, and film emulation.',
      techniques: [
        'AI Gyroscope Stabilization',
        'Spectral Audio Noise Repair',
        'Fuji Film Emulation Grain',
        'Spatial Ambient Soundscape',
      ],
      timelineBeats: [
        { timestamp: '00:00 - 00:45', title: 'Atmospheric Intro', description: 'Rain Foley SFX + slow film fade.' },
        { timestamp: '00:45 - 08:00', title: 'Kyoto Alleyways', description: 'Color-graded night walks + ambient music.' },
      ],
      order: 5,
      featured: false,
    },
  ];

  // Merge loaded API items or use enriched fallback
  const enrichedList: EnrichedCaseStudy[] = (portfolio.length > 0 ? portfolio : []).map((item, idx) => {
    const fallbackMatch = fallbackCaseStudies[idx % fallbackCaseStudies.length];
    return {
      ...fallbackMatch,
      ...item,
      beforeImg: fallbackMatch.beforeImg,
      afterImg: fallbackMatch.afterImg,
      retentionMetric: fallbackMatch.retentionMetric,
      viewsCount: fallbackMatch.viewsCount,
      challengeText: fallbackMatch.challengeText,
      approachText: fallbackMatch.approachText,
      techniques: fallbackMatch.techniques,
      timelineBeats: fallbackMatch.timelineBeats,
    };
  });

  const displayItems = enrichedList.length > 0 ? enrichedList : fallbackCaseStudies;

  const filteredItems = displayItems.filter((item) =>
    selectedCategory === 'All' ? true : item.category === selectedCategory
  );

  const featuredStudy = displayItems.find((item) => item.featured) || displayItems[0];

  // Handle Before/After Slider Dragging
  const handleSliderMove = (id: string, clientX: number, containerRef: HTMLDivElement | null) => {
    if (!containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosMap((prev) => ({ ...prev, [id]: percentage }));
  };

  return (
    <div ref={pageRef} className="min-h-screen text-slate-100 pb-28 bg-[#08090d] font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* ================= HEADER SECTION ================= */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative">
        <VisionFoldLogo size="lg" variant="full" className="mx-auto mb-6 gsap-header-element" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-6 gsap-header-element">
          <Film className="w-3.5 h-3.5" />
          <span>CINEMATIC CASE STUDIES & RETENTION METRICS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight max-w-4xl mx-auto leading-tight gsap-header-element">
          Vision, Folded Into <span className="text-amber-400">Stories.</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 mt-5 max-w-2xl mx-auto font-light leading-relaxed tracking-wide gsap-header-element">
          Every edit is crafted with audience psychology, surgical timing, custom motion graphics, and sound design to keep viewers hooked.
        </p>

        {/* Studio Stats Summary Bar */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 rounded-2xl bg-[#0d0f16] border border-[#1a1d28] text-left gsap-header-element">
          <div className="p-3 border-r border-[#181b26] last:border-r-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">AVERAGE RETENTION</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">+192% Boost</span>
          </div>
          <div className="p-3 border-r border-[#181b26] last:border-r-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">TOTAL ORGANIC VIEWS</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">15M+ Views</span>
          </div>
          <div className="p-3 border-r border-[#181b26] last:border-r-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">STUDIO RATE</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">₹700 / min</span>
          </div>
          <div className="p-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">CLIENT SATISFACTION</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">100% Guaranteed</span>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY FILTER TABS ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center justify-center gap-2 flex-wrap bg-[#0d0f16] p-2 rounded-2xl border border-[#1a1d28] max-w-3xl mx-auto">
          {categories.map((cat) => {
            const count = displayItems.filter((i) => cat === 'All' || i.category === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-[#141722]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-[#181b26] text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= FEATURED SPOTLIGHT CASE STUDY ================= */}
      {selectedCategory === 'All' && featuredStudy && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 gsap-spotlight">
          <div className="relative rounded-3xl overflow-hidden bg-[#0a0c12] border border-amber-400/30 p-6 sm:p-10 shadow-2xl">
            <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 px-5 py-1.5 rounded-bl-2xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <Flame className="w-4 h-4 fill-slate-950" />
              <span>FEATURED SPOTLIGHT CASE STUDY</span>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-center pt-4">
              {/* Left Column: Media / Interactive Preview */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-[#1a1d28] group shadow-xl">
                  <img
                    src={featuredStudy.thumbnailUrl}
                    alt={featuredStudy.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Overlaid Badges */}
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-black/80 text-amber-400 text-[11px] font-mono font-bold uppercase border border-amber-400/30">
                      {featuredStudy.category}
                    </span>
                    <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[11px] font-mono font-bold uppercase border border-emerald-500/30">
                      {featuredStudy.retentionMetric}
                    </span>
                  </div>

                  {/* Center Play Icon */}
                  <button
                    onClick={() => setSelectedItem(featuredStudy)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform font-bold">
                      <Play className="w-7 h-7 fill-slate-950 ml-1" />
                    </div>
                  </button>

                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-300">
                    <span className="font-bold text-amber-400">{featuredStudy.clientName}</span>
                    <button
                      onClick={() => setSelectedItem(featuredStudy)}
                      className="text-white hover:text-amber-400 underline flex items-center gap-1"
                    >
                      <span>Expand Studio Breakdown</span>
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Technique Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {featuredStudy.techniques.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-[#121520] border border-[#222736] text-amber-400/90 font-mono text-[11px] font-bold"
                    >
                      &bull; {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Narrative Breakdown */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    CLIENT: {featuredStudy.clientName}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                    {featuredStudy.title}
                  </h2>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>{featuredStudy.resultsImpact}</span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 rounded-xl bg-[#0f111a] border border-[#1a1d28]">
                    <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">
                      THE CHALLENGE:
                    </span>
                    <p className="text-slate-300 font-light leading-relaxed">{featuredStudy.challengeText}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0f111a] border border-[#1a1d28]">
                    <span className="text-slate-200 font-bold uppercase tracking-wider block mb-1">
                      CREATIVE APPROACH:
                    </span>
                    <p className="text-slate-300 font-light leading-relaxed">{featuredStudy.approachText}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedItem(featuredStudy)}
                  className="w-full py-4 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold uppercase text-xs tracking-widest hover:bg-amber-300 transition-all shadow-md flex items-center justify-center gap-2.5"
                >
                  <span>Launch Full Interactive Breakdown</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= IMMERSIVE CASE STUDIES GRID ================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="flex items-center justify-between border-b border-[#181b26] pb-4">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>ALL CASE STUDIES & RETENTION SHOWCASES</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            SHOWING {filteredItems.length} PROJECTS
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#0d0f16] border border-[#1a1d28] rounded-2xl text-slate-400 font-mono text-xs">
            No projects found in this category.
          </div>
        ) : (
          <div className="space-y-16">
            {filteredItems.map((item, index) => {
              const currentTab = activeTabMap[item.id] || 'preview';
              const sliderPos = sliderPosMap[item.id] ?? 50;

              return (
                <div
                  key={item.id}
                  className="gsap-case-study-card bg-[#0b0d13] border border-[#1a1d28] rounded-3xl overflow-hidden hover:border-amber-400/40 transition-all duration-300 shadow-2xl p-6 sm:p-8"
                >
                  {/* Case Study Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#181b26] pb-6 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-3 py-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30 text-[10px] font-mono font-bold uppercase">
                          {item.category}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {item.clientName || 'Confidential Client'}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* View Switcher Tabs */}
                      <div className="flex items-center bg-[#10121a] p-1 rounded-xl border border-[#181b26] text-[11px] font-mono">
                        <button
                          onClick={() => setActiveTabMap((p) => ({ ...p, [item.id]: 'preview' }))}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                            currentTab === 'preview'
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Video Preview
                        </button>
                        <button
                          onClick={() => setActiveTabMap((p) => ({ ...p, [item.id]: 'before-after' }))}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                            currentTab === 'before-after'
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Before / After
                        </button>
                        <button
                          onClick={() => setActiveTabMap((p) => ({ ...p, [item.id]: 'techniques' }))}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                            currentTab === 'techniques'
                              ? 'bg-amber-400 text-slate-950'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Techniques
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Main Display Area (Swaps between Video Preview, Before/After Slider, or Techniques Breakdown) */}
                  <div className="grid lg:grid-cols-12 gap-8 items-center">
                    
                    {/* Media Display Container (8 cols) */}
                    <div className="lg:col-span-7">
                      {currentTab === 'preview' && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-[#1a1d28] group shadow-xl">
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

                          <button
                            onClick={() => setSelectedItem(item)}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform font-bold">
                              <Play className="w-6 h-6 fill-slate-950 ml-0.5" />
                            </div>
                          </button>

                          <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1.5 rounded-lg border border-[#222736] text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{item.resultsImpact}</span>
                          </div>
                        </div>
                      )}

                      {currentTab === 'before-after' && (
                        <div
                          onMouseMove={(e) => {
                            if (draggingId === item.id) {
                              handleSliderMove(item.id, e.clientX, e.currentTarget as HTMLDivElement);
                            }
                          }}
                          onMouseDown={(e) => {
                            setDraggingId(item.id);
                            handleSliderMove(item.id, e.clientX, e.currentTarget as HTMLDivElement);
                          }}
                          onMouseUp={() => setDraggingId(null)}
                          onMouseLeave={() => setDraggingId(null)}
                          className="relative aspect-video rounded-2xl overflow-hidden border border-[#1a1d28] shadow-2xl select-none cursor-ew-resize bg-black"
                        >
                          {/* After (Final Edit) */}
                          <div className="absolute inset-0">
                            <img
                              src={item.afterImg}
                              alt="After Edit"
                              className="w-full h-full object-cover filter contrast-110 saturate-120"
                            />
                            <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase">
                              FINAL EDITED & GRADED
                            </div>
                          </div>

                          {/* Before (Raw Log) */}
                          <div
                            className="absolute top-0 bottom-0 left-0 overflow-hidden border-r-2 border-amber-400 z-10"
                            style={{ width: `${sliderPos}%` }}
                          >
                            <div className="absolute top-0 bottom-0 left-0 w-[800px] h-full">
                              <img
                                src={item.beforeImg}
                                alt="Before Raw"
                                className="w-full h-full object-cover filter grayscale opacity-60 contrast-75"
                              />
                            </div>
                            <div className="absolute top-3 left-3 bg-black/80 text-slate-300 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border border-[#222736]">
                              RAW UNEDITED
                            </div>
                          </div>

                          {/* Slider Divider Bar */}
                          <div
                            className="absolute top-0 bottom-0 z-20 w-1 bg-amber-400 pointer-events-none"
                            style={{ left: `${sliderPos}%` }}
                          >
                            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-lg bg-amber-400 text-slate-950 shadow-md flex items-center justify-center font-bold text-xs">
                              &harr;
                            </div>
                          </div>
                        </div>
                      )}

                      {currentTab === 'techniques' && (
                        <div className="aspect-video rounded-2xl bg-[#0e1017] border border-[#181b26] p-6 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-3">
                              APPLIED EDITING TECHNIQUES & STACK
                            </span>

                            <div className="grid sm:grid-cols-2 gap-3 text-xs font-mono">
                              {item.techniques.map((tech, i) => (
                                <div
                                  key={i}
                                  className="p-3 rounded-xl bg-[#121520] border border-[#1e2333] text-slate-200 flex items-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span>{tech}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[#181b26] flex items-center justify-between text-xs font-mono text-slate-400">
                            <span>TOOLS: {item.toolsUsed.join(' • ')}</span>
                            <span className="text-amber-400 font-bold">{item.retentionMetric}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Narrative Breakdown & Stats (5 cols) */}
                    <div className="lg:col-span-5 space-y-5">
                      <div className="p-4 rounded-xl bg-[#0f111a] border border-[#181b26] space-y-3 font-mono text-xs">
                        <div>
                          <span className="text-amber-400 font-bold uppercase block mb-1">CHALLENGE</span>
                          <p className="text-slate-300 font-light leading-relaxed">{item.challengeText}</p>
                        </div>

                        <div className="pt-2 border-t border-[#181b26]">
                          <span className="text-slate-200 font-bold uppercase block mb-1">OUR APPROACH</span>
                          <p className="text-slate-300 font-light leading-relaxed">{item.approachText}</p>
                        </div>
                      </div>

                      {/* Performance Metric Box */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-emerald-400/80 font-bold uppercase block">OUTCOME</span>
                          <span className="text-emerald-300 font-bold text-sm">{item.resultsImpact}</span>
                        </div>
                        <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
                      </div>

                      <button
                        onClick={() => setSelectedItem(item)}
                        className="w-full py-3.5 rounded-xl bg-[#141722] hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-[#222736] hover:border-amber-400 font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 group"
                      >
                        <span>View Full Case Study Breakdown</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>


      {/* ================= FULL EXPANDED CASE STUDY MODAL ================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0b0d13] border border-amber-400/40 rounded-3xl w-full max-w-4xl my-8 overflow-hidden relative shadow-2xl text-slate-100">
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-amber-400 hover:text-slate-950 transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video Player Display */}
            <div className="relative aspect-video bg-black">
              {selectedItem.videoUrl && selectedItem.videoUrl.includes('youtube.com') ? (
                <iframe
                  className="w-full h-full"
                  src={selectedItem.videoUrl.replace('watch?v=', 'embed/')}
                  title={selectedItem.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={selectedItem.thumbnailUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Case Study Details Body */}
            <div className="p-6 sm:p-10 space-y-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-2">
                  <span className="px-3 py-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30 font-bold uppercase">
                    {selectedItem.category}
                  </span>
                  <span className="text-slate-400">CLIENT: <strong className="text-slate-200">{selectedItem.clientName}</strong></span>
                  <span className="text-slate-400">DATE: {formatDate(selectedItem.dateCreated)}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
                  {selectedItem.title}
                </h2>
              </div>

              {/* Impact Banner */}
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-mono">
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                    MEASURABLE RESULTS & RETENTION
                  </span>
                  <p className="text-emerald-300 font-black text-lg sm:text-xl">
                    {selectedItem.resultsImpact}
                  </p>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">AUDIENCE ENGAGEMENT</span>
                  <span className="text-white font-bold text-sm">{selectedItem.retentionMetric}</span>
                </div>
              </div>

              {/* Full Description & Context */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>PROJECT NARRATIVE & OVERVIEW</span>
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed font-light">
                  {selectedItem.fullDescription}
                </p>
              </div>

              {/* Editing Timeline Breakdown */}
              {selectedItem.timelineBeats && selectedItem.timelineBeats.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-[#181b26]">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    <span>TIMELINE STRUCTURE BREAKDOWN</span>
                  </h3>

                  <div className="space-y-3">
                    {selectedItem.timelineBeats.map((beat, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#0f111a] border border-[#181b26] flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20 shrink-0">
                            {beat.timestamp}
                          </span>
                          <span className="font-bold text-white text-sm">{beat.title}</span>
                        </div>
                        <p className="text-slate-300 font-light text-xs">{beat.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools Used */}
              <div className="pt-4 border-t border-[#181b26] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    SOFTWARE & PRODUCTION TOOLS
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.toolsUsed.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-[#141722] border border-[#222736] text-amber-400 text-xs font-mono font-bold"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <a
                  href="/#contact"
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-3.5 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold uppercase text-xs tracking-widest hover:bg-amber-300 transition-all shrink-0 shadow-md"
                >
                  Request Similar Edit
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
